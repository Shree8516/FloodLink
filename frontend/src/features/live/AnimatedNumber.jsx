// [Person 1 – live] A number that counts smoothly from its old value to its new one when it changes (e.g. "Open 9"
// becoming "Open 10" when a request arrives live), so the change catches the eye. Used by the StatsBar and the
// admin KPI cards. People who ask their system for reduced motion get the new value straight away.
import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 600;

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function AnimatedNumber({ value, decimals = 0 }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value || prefersReducedMotion()) {
      shownRef.current = value;
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    let frame;
    // Ease-out: fast at first, then settling gently on the new value
    const step = (now) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      shownRef.current = from + (value - from) * eased;
      setShown(shownRef.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{Number(shown).toFixed(decimals)}</>;
}
