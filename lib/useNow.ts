"use client";

import { useEffect, useState } from "react";

// Ticks `now` every second so uptime and the cost meter advance between API polls. Only runs while
// `active` (a billing deployment); a terminal card holds still.
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}
