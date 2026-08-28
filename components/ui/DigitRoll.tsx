"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A number that rolls into place and lands in orange.
 *
 * Each digit is a column holding 0–9 twice. Rolling to the copy in the
 * second pass guarantees a full rotation for every digit — including 0,
 * which would otherwise not move at all.
 *
 * Non-digits (":", an en dash) are rendered static so "9:30" and
 * "2019 - 2026" keep their shape. They take the digit cell's own box —
 * see the note at the branch — or they sit low against the columns.
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
    /* THE verticalAlign THAT USED TO BE HERE WAS DEAD.
       -0.12em was tuned back when these columns sat in an inline context. The
       wrapper below is `inline-flex`, and vertical-align does nothing to a
       flex item — so the nudge had not applied for as long as the wrapper has
       been a flex container. Alignment is done by matching boxes instead: this
       column and the non-digit spans are both 1em tall with 1em leading, so a
       glyph lands on the same baseline either way. */
    <span className="inline-block h-[1em] overflow-hidden">
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
          /* THE SAME BOX A DIGIT CELL GETS, and that is the whole fix.
             This span used to carry no height and no leading. As a flex item
             under `align-items: stretch` it stretched to the line's 1em while
             its own line box stayed at the inherited `normal` — about 1.2em —
             so the glyph rendered lower than the digits beside it. On the
             story dateline that put an em dash low enough to read as an
             UNDERSCORE: "2019 _ 2026". The colon in Service's "9:30" was
             sitting low for the same reason.

             h-[1em] leading-[1em] is exactly what each digit cell inside the
             column wears, so both resolve to a glyph centred in a 1em line
             box and the baselines agree by construction rather than by a
             tuned offset. */
          return (
            <span key={i} className="inline-block h-[1em] leading-[1em]">
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
