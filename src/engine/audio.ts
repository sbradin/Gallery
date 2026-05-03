/**
 * Audio system. Lazy AudioContext (browsers require a user gesture to start),
 * a tiny set of procedural sounds for footsteps + per-scene ambient pads, and
 * a load-from-URL path for users who want to swap in real audio files.
 *
 * Usage:
 *   - call `unlockAudio()` from a 'pointerdown'/'keydown' handler once.
 *   - call `playFootstep()` from the movement tick on each step.
 *   - call `playSceneMusic(sceneId)` on scene transitions.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;

let currentMusic: { stop: () => void; sceneId: string } | null = null;

export const isAudioUnlocked = (): boolean => unlocked;

export const unlockAudio = (): void => {
  if (unlocked) return;
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);
    if (ctx.state === 'suspended') void ctx.resume();
    unlocked = true;
  } catch {
    // Audio is non-critical; fail silently.
  }
};

export const setMasterVolume = (v: number): void => {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
};

const requireCtx = (): { ctx: AudioContext; master: GainNode } | null => {
  if (!unlocked || !ctx || !masterGain) return null;
  return { ctx, master: masterGain };
};

/* ------------------------------------------------------------------ */
/* Procedural footstep: short filtered noise burst.                   */
/* ------------------------------------------------------------------ */

export const playFootstep = (): void => {
  const env = requireCtx();
  if (!env) return;
  const { ctx, master } = env;

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // White noise tapered with a fast decay.
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.value = 0.18;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
  src.stop(ctx.currentTime + 0.07);
};

/* ------------------------------------------------------------------ */
/* Ambient music: slow filtered drone with two detuned saws + LFO.    */
/* Replace by passing { url } to playSceneMusic.                       */
/* ------------------------------------------------------------------ */

interface MusicSpec {
  /** Base note in Hz. e.g. 110 = A2. */
  baseHz: number;
  /** Cutoff sweep range. */
  filterMin: number;
  filterMax: number;
}

const SCENE_MUSIC: Record<string, MusicSpec | { url: string }> = {
  lobby: { baseHz: 110, filterMin: 220, filterMax: 800 }, // A2 drone
  europe: { baseHz: 98, filterMin: 200, filterMax: 700 }, // G2
  madison: { baseHz: 130.81, filterMin: 240, filterMax: 900 }, // C3
  'appalachian-trail': { baseHz: 87.31, filterMin: 200, filterMax: 700 }, // F2
};

const startProceduralMusic = (
  ctx: AudioContext,
  master: GainNode,
  spec: MusicSpec,
): { stop: () => void } => {
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(master);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 4;
  filter.frequency.value = spec.filterMin;
  filter.connect(out);

  // LFO sweeps the cutoff for a "breathing" pad.
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = (spec.filterMax - spec.filterMin) / 2;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  // Two slightly detuned saw oscillators an octave apart.
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  oscA.type = 'sawtooth';
  oscB.type = 'sawtooth';
  oscA.frequency.value = spec.baseHz;
  oscB.frequency.value = spec.baseHz * 2;
  oscA.detune.value = -7;
  oscB.detune.value = 5;
  oscA.connect(filter);
  oscB.connect(filter);

  const now = ctx.currentTime;
  // Center filter around midpoint with the LFO swing.
  filter.frequency.setValueAtTime((spec.filterMin + spec.filterMax) / 2, now);

  // Fade in.
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.08, now + 1.2);

  oscA.start();
  oscB.start();
  lfo.start();

  return {
    stop: () => {
      const t = ctx.currentTime;
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.linearRampToValueAtTime(0, t + 0.4);
      oscA.stop(t + 0.5);
      oscB.stop(t + 0.5);
      lfo.stop(t + 0.5);
    },
  };
};

const startUrlMusic = (
  ctx: AudioContext,
  master: GainNode,
  url: string,
): { stop: () => void } => {
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0.0;
  const node = ctx.createMediaElementSource(audio);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  node.connect(gain);
  gain.connect(master);
  void audio.play().catch(() => {
    // ignore — most likely autoplay policy blocked it
  });
  const t0 = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(0.6, t0 + 1.2);

  return {
    stop: () => {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.4);
      window.setTimeout(() => audio.pause(), 500);
    },
  };
};

export const playSceneMusic = (sceneId: string): void => {
  const env = requireCtx();
  if (!env) return;
  if (currentMusic?.sceneId === sceneId) return;

  currentMusic?.stop();

  const spec = SCENE_MUSIC[sceneId];
  if (!spec) {
    currentMusic = null;
    return;
  }
  const handle =
    'url' in spec
      ? startUrlMusic(env.ctx, env.master, spec.url)
      : startProceduralMusic(env.ctx, env.master, spec);
  currentMusic = { sceneId, stop: handle.stop };
};

export const stopMusic = (): void => {
  currentMusic?.stop();
  currentMusic = null;
};
