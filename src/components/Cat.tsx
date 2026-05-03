import { useGameStore } from '@/store/gameStore';
import { CAT_SIZE } from '@/engine/constants';
import catSide from '@/assets/sprites/cat.webp';
// import catBack from '@/assets/sprites/cat-back.png';
// import catFront from '@/assets/sprites/cat-front.png';
import type { Facing } from '@/types/math';
import styles from './Cat.module.css';

const SPRITE: Record<Facing, { src: string; flipX: boolean }> = {
  right: { src: catSide, flipX: false },
  left: { src: catSide, flipX: true },
  up: { src: catSide, flipX: false },
  down: { src: catSide, flipX: false },
};

// Bobbing parameters (in design pixels & seconds).
const IDLE_FREQ = 1.0;        // Hz, gentle breathing
const IDLE_AMP = 0.6;         // px
const WALK_FREQ = 2.5;        // Hz, lively step bounce
const WALK_AMP = 1.5;         // px

export function Cat() {
  const position = useGameStore((s) => s.cat.position);
  const facing = useGameStore((s) => s.cat.facing);
  const moving = useGameStore((s) => s.cat.moving);
  const tElapsed = useGameStore((s) => s.tElapsed);

  const freq = moving ? WALK_FREQ : IDLE_FREQ;
  const amp = moving ? WALK_AMP : IDLE_AMP;
  // sin(2π·f·t); when moving we want a non-negative bounce that feels like
  // each footfall lifts the body — use |sin| so the cat never sinks below baseline.
  const phase = Math.sin(2 * Math.PI * freq * tElapsed);
  const bob = moving ? -Math.abs(phase) * amp : phase * amp;

  const { src, flipX } = SPRITE[facing];

  // Outer = world position (translate to feet center). Inner = bob.
  return (
    <div
      className={styles.outer}
      style={{
        transform: `translate3d(${position.x - CAT_SIZE.w / 2}px, ${
          position.y - CAT_SIZE.h
        }px, 0)`,
      }}
    >
      <div className={styles.shadow} />
      <div
        className={styles.inner}
        style={{ transform: `translateY(${bob}px)` }}
      >
        <img
          className={styles.sprite}
          src={src}
          alt=""
          draggable={false}
          style={flipX ? { transform: 'scaleX(-1)' } : undefined}
        />
      </div>
    </div>
  );
}
