import { useGameStore } from '@/store/gameStore';
import { transitionAlpha } from '@/engine/transitions';
import styles from './FadeTransition.module.css';

export function FadeTransition() {
  const transition = useGameStore((s) => s.transition);
  const alpha = transitionAlpha(transition);
  if (alpha === 0) return null;
  return <div className={styles.fade} style={{ opacity: alpha }} />;
}
