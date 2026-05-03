import { useEffect, useState } from 'react';

/**
 * Toggle a boolean state via a single key. Useful for dev overlays.
 * The handler ignores presses while focus is in inputs.
 */
export function useKeyToggle(key: string, initial = false): boolean {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      setOn((v) => !v);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [key]);
  return on;
}
