"use client";

import { motion, useInView, useReducedMotion, type TargetAndTransition } from "motion/react";
import { useRef, type CSSProperties } from "react";

/**
 * A word that fills with chai.
 *
 * Three stacked copies of the same text:
 *   1. the resting word, in flow, milky chai — legible from frame one
 *   2. the fill, strong brew, revealed by a rising wave mask
 *   3. the meniscus, a bright band riding the surface, fading as it settles
 *
 * Layers 2 and 3 share the wave geometry and the --wy value, so the
 * highlight always sits exactly on the liquid line.
 */

/* motion drives CSS custom properties at runtime, but neither
   CSSProperties nor TargetAndTransition types them — hence the casts. */
type PourStyle = CSSProperties & { "--wy"?: string };
const target = (v: Record<string, unknown>) => v as unknown as TargetAndTransition;

const DURATION = 1.8;

/* The mask spans the whole line box, but the glyphs only occupy the
   middle of it — roughly baseline (~15%) to ascender (~92%). Travelling
   0→100% would spend a third of the animation in empty space, so the
   range is clipped to where the letterforms actually are.
   Tune these two if the fill looks like it starts late or stops short. */
const BASELINE = "15%";
const ASCENDER = "92%";

/* rise, overshoot, settle back — liquid does not stop dead */
const LEVELS = [BASELINE, "60%", "96%", ASCENDER];
const TIMES = [0, 0.35, 0.72, 1];

const FROM_EMPTY = target({ "--wy": BASELINE });
const FILL = target({ "--wy": LEVELS });
const EDGE_FROM = target({ "--wy": "0%", opacity: 0 });
const EDGE = target({ "--wy": LEVELS, opacity: [0, 1, 1, 0] });

export default function PourWord({
  children,
  delay = 0,
  duration = DURATION,
  outline = false,
  block = false,
  style,
}: {
  children: string;
  delay?: number;
  /** the hero's line-by-line entrance wants a faster settle */
  duration?: number;
  /** render the resting layer as a stroke, so the word arrives empty and the
      amber genuinely fills it — rather than starting as milky chai */
  outline?: boolean;
  /** a whole headline line rather than a word: lays out as a block and is
      allowed to wrap. The mask then rises through the wrapped box as one
      level, which is what a filling vessel does anyway. */
  block?: boolean;
  /** per-line colour overrides — the pour tokens are read off this element,
      so each headline line can settle on its own colour */
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  /* once:false so the pour replays whenever the hero returns to view.
     Also makes the animation reviewable without a hard reload — Fast
     Refresh re-renders but never remounts, so a mount-only animation
     is invisible while you are iterating. */
  const inView = useInView(ref, { amount: 0.9 });

  const cls = `pour${outline ? " pour-outline" : ""}${block ? " pour-block" : ""}`;

  if (reduced) {
    return (
      <span className={cls} ref={ref} style={style}>
        {children}
        <span
          className="pour-layer pour-fill"
          style={{ "--wy": ASCENDER } as PourStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  }

  return (
    <span className={cls} ref={ref} style={style}>
      {children}

      <motion.span
        className="pour-layer pour-fill"
        aria-hidden="true"
        initial={FROM_EMPTY}
        animate={inView ? FILL : FROM_EMPTY}
        transition={{ duration, delay, times: TIMES, ease: "easeOut" }}
      >
        {children}
      </motion.span>

      <motion.span
        className="pour-layer pour-edge"
        aria-hidden="true"
        initial={EDGE_FROM}
        animate={inView ? EDGE : EDGE_FROM}
        transition={{ duration, delay, times: TIMES, ease: "easeOut" }}
      >
        {children}
      </motion.span>
    </span>
  );
}
