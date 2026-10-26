// [Person 2 – requests] The current time, refreshed every minute. "Stale" (open for 6+ hours) and "5 min ago"
// depend on the clock, not only on data, so the map and cards re-check them even when nothing new arrives.
import { useEffect, useState } from 'react';

export default function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
