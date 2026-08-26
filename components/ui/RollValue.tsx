"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * A figure that rolls to its new value whenever it changes.
 *
 * DigitRoll spins columns of digits off a `play` flag, which is right for an
 * entrance and wrong for a calculator: these numbers change on every frame the
 * slider moves, and a full column spin per digit reads as thrashing.
 *
 * THE ORIGIN IS THE DRAWN VALUE, NOT THE START OF THE TWEEN
 * While a slider is being dragged the target moves every frame. If each new
 * tween restarted from the value the last one began at, it would be cancelled
 * ~16ms later having barely moved, the figure would crawl, and it would snap
 * to the truth only once the drag stopped. Parking the origin on whatever is
 * currently on screen makes a moving target something to chase rather than
 * something to restart against.
 */
export default function RollValue({
  value,
  /** how the settled number is written — rupees, commas, whatever */
  format = (n: number) => String(Math.round(n)),
  /** a fast chase for dragging, a slower one for a figure that lands once */
  duration = 320,
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced) {
      setN(value);
      from.current = value;
      return;
    }
    const a = from.current;
    if (a === value) return;

    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const v = a + (value - a) * (1 - Math.pow(1 - t, 3));
      setN(v);
      from.current = v;
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        from.current = value;
        setN(value);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);

  return <span className={`tabular-nums ${className}`}>{format(n)}</span>;
}
