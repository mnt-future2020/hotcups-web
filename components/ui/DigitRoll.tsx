"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A number that rolls into place and lands in orange.
 *
 * Each digit is a column holding 0–9 twice. Rolling to the copy in the
 * second pass guarantees a full rotation for every digit — including 0,
 * which would otherwise not move at all.
 *
 * Non-digits (":") are rendered static so "9:30" keeps its shape.
 */

const COLUMN = [...Array(10).keys(), ...Array(10).keys()];

function Digit({
  value,
  play,
  delay,
}: {
  value: number;
  play: boolean;
  delay: number;
}) {
  /* 20 cells, so showing cell i means translating -(i * 5)%.
     Rest on the digit in the first pass and roll to its copy in the
     second: one full revolution that lands back on the same number. The
     sentence therefore reads correctly before, during and after. */
  const rest = -value * 5;
  const target = -(10 + value) * 5;

  return (
    <span
      className="inline-block h-[1em] overflow-hidden align-baseline"
      style={{ verticalAlign: "-0.12em" }}
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: `${rest}%` }}
        animate={{ y: play ? `${target}%` : `${rest}%` }}
        transition={{ duration: 1.05, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {COLUMN.map((n, i) => (
          <span key={i} className="block h-[1em] leading-[1em]">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export default function DigitRoll({
  value,
  play,
  delay = 0,
  from = "var(--color-espresso)",
  to = "var(--color-orange)",
}: {
  value: string;
  play: boolean;
  delay?: number;
  /** resting colour before the roll — override on dark backgrounds */
  from?: string;
  /** landing colour. Orange is 4.28:1 on steel but only 2.97:1 on cream, so a
      figure landing on a light ground has to take orange-dark (3.88:1). */
  to?: string;
}) {
  const reduced = useReducedMotion();

  /* reduced motion: the number simply is orange, no roll */
  if (reduced) {
    return <span style={{ color: to }}>{value}</span>;
  }

  let digitIndex = -1;

  return (
    <>
      {/* each column holds twenty digits — hide them and give assistive
          tech the real value, or the heading reads "before 0 1 2 3 4…" */}
      <span className="sr-only">{value}</span>

      <motion.span
        aria-hidden="true"
        className="inline-flex"
        initial={{ color: from }}
        animate={{ color: play ? to : from }}
        transition={{ duration: 0.5, delay: delay + 0.15 }}
      >
      {value.split("").map((char, i) => {
        if (char < "0" || char > "9") {
          return (
            <span key={i} className="inline-block">
              {char}
            </span>
          );
        }
        digitIndex += 1;
        return (
          <Digit
            key={i}
            value={Number(char)}
            play={play}
            /* each digit trails the one before it */
            delay={delay + digitIndex * 0.07}
          />
        );
      })}
      </motion.span>
    </>
  );
}
