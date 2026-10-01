import { useEffect, useState } from "react";

/**
 * useScrollDirection
 * Returns scroll direction ('up' | 'down') plus whether the user is at/near the
 * very top of the page (so the header is always pinned at top regardless of
 * scroll direction — avoids the "can't see header when already at top" edge
 * case common in naive hide-on-scroll implementations).
 *
 * Professional characteristics:
 *  - Ignores sub-pixel iOS rubber-band and tiny 1-2px scroll jitter.
 *  - Minimum delta threshold (default 8px) so trackpad micro-scrolls do not
 *    flip-flop the state rapidly.
 *  - rAF-throttled scroll listener (not per event) so 60fps friendly.
 *  - Cleans listener on unmount.
 */
export function useScrollDirection(threshold = 8) {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    function update() {
      const y = window.scrollY || window.pageYOffset || 0;
      const diff = y - lastY;

      setAtTop(y <= 12);

      if (Math.abs(diff) >= threshold) {
        if (diff > 0) setDirection("down");
        else setDirection("up");
        lastY = y > 0 ? y : 0;
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, atTop };
}
