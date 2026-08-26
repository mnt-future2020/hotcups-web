"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A word that rolls over and lands in orange.
 *
 * Numbers get DigitRoll — they spin through the digits. Words cannot, so
 * they roll: the ink copy travels up out of the box while an orange copy
 * arrives from below. Same gesture, same landing colour, one system.
 */
export default function RollUp({
  children,
  play,
  delay = 0,
}: {
  children: string;
  play: boolean;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <span className="text-orange">{children}</span>;

  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{ verticalAlign: "-0.16em" }}
    >
      {/* holds the layout while the copies move behind it */}
      <span className="invisible block whitespace-nowrap">{children}</span>

      <motion.span
        aria-hidden="true"
        className="absolute inset-0 block"
        initial={{ y: "0%" }}
        animate={{ y: play ? "-100%" : "0%" }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="block whitespace-nowrap">{children}</span>
        <span className="block whitespace-nowrap text-orange">{children}</span>
      </motion.span>
    </span>
  );
}
