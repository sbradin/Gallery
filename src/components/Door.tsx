import type { CSSProperties } from 'react';
import type { Door as DoorData } from '@/types/scene';
import styles from './Door.module.css';

interface DoorProps {
  door: DoorData;
  showLabel?: boolean;
}

const RECESS_DEPTH = 28; // how far the doorway visual extends INTO the wall
const SIGN_W = 56;
const SIGN_H = 11;
const LAMP_W = 12;
const LAMP_H = 6;
const LAMP_GAP = 2;
const SIGN_GAP = 2;

/**
 * Doorway carved into a wall. `door.rect` is the trigger sitting just inside
 * the walkable edge against the wall; the recess extends INTO the wall from
 * there. Sign + lamp are anchored to the perpendicular wall (the top wall
 * for N/W/E doors, the bottom wall for S doors) so they stay visible on
 * screen even when the door cuts through the full height of the floor
 * (e.g. the hallway exit).
 */
export function Door({ door, showLabel = true }: Readonly<DoorProps>) {
  const { rect, orientation } = door;

  let recess: CSSProperties;
  let runner: CSSProperties;

  switch (orientation) {
    case 'north':
      recess = {
        left: rect.x,
        top: rect.y - RECESS_DEPTH,
        width: rect.w,
        height: RECESS_DEPTH + rect.h,
      };
      runner = {
        left: rect.x + 4,
        top: rect.y,
        width: rect.w - 8,
        height: 22,
        background:
          'linear-gradient(0deg, transparent 0%, rgba(120,90,50,0.55) 100%)',
      };
      break;
    case 'south':
      recess = {
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: RECESS_DEPTH + rect.h,
      };
      runner = {
        left: rect.x + 4,
        top: rect.y - 22,
        width: rect.w - 8,
        height: 22,
        background:
          'linear-gradient(180deg, transparent 0%, rgba(120,90,50,0.55) 100%)',
      };
      break;
    case 'west':
      recess = {
        left: rect.x - RECESS_DEPTH,
        top: rect.y,
        width: RECESS_DEPTH + rect.w,
        height: rect.h,
      };
      runner = {
        left: rect.x,
        top: rect.y + 4,
        width: 22,
        height: rect.h - 8,
        background:
          'linear-gradient(270deg, transparent 0%, rgba(120,90,50,0.55) 100%)',
      };
      break;
    case 'east':
      recess = {
        left: rect.x,
        top: rect.y,
        width: RECESS_DEPTH + rect.w,
        height: rect.h,
      };
      runner = {
        left: rect.x + rect.w - 22,
        top: rect.y + 4,
        width: 22,
        height: rect.h - 8,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(120,90,50,0.55) 100%)',
      };
      break;
  }

  // ── Sign + lamp + halo placement ───────────────────────────────
  // Goal: always visible regardless of orientation. Anchor to the top wall
  // for N/W/E doors and the bottom wall for S doors. X is centered on the
  // recess's horizontal midpoint, clamped to screen.
  const isSouth = orientation === 'south';

  const recessLeft = recess.left as number;
  const recessTop = recess.top as number;
  const recessW = recess.width as number;
  const recessH = recess.height as number;
  const recessRight = recessLeft + recessW;
  const recessBottom = recessTop + recessH;

  const cutoutMidX =
    orientation === 'north' || orientation === 'south'
      ? rect.x + rect.w / 2
      : (recessLeft + recessRight) / 2;

  // Sign + lamp anchor near the perpendicular wall edge of the recess.
  const anchorY = isSouth ? recessBottom + SIGN_GAP : recessTop - SIGN_GAP;
  const lampY = isSouth
    ? anchorY + SIGN_H + LAMP_GAP
    : anchorY - SIGN_H - LAMP_GAP - LAMP_H;
  const signTop = isSouth ? anchorY : anchorY - SIGN_H;
  const lampTop = isSouth ? lampY - LAMP_H : lampY;

  const signLeft = cutoutMidX - SIGN_W / 2;
  const lampLeft = cutoutMidX - LAMP_W / 2;

  const sign: CSSProperties = {
    left: signLeft,
    top: signTop,
    width: SIGN_W,
    height: SIGN_H,
  };
  const lamp: CSSProperties = {
    left: lampLeft,
    top: lampTop,
  };
  const halo: CSSProperties = {
    left: cutoutMidX - 40,
    top: isSouth ? recessBottom - 8 : recessTop - 12,
    transform: isSouth ? 'scaleY(-1)' : undefined,
  };

  const lampClass = isSouth ? `${styles.lamp} ${styles.lampBelow}` : styles.lamp;

  return (
    <>
      <div className={styles.runner} style={runner} />
      <div className={styles.door} style={recess}>
        <div className={styles.recess} />
        <div className={styles.frame} />
      </div>
      <div className={styles.halo} style={halo} />
      {showLabel && (
        <>
          <div className={lampClass} style={lamp} />
          <div className={styles.sign} style={sign}>
            {door.label}
          </div>
        </>
      )}
    </>
  );
}
