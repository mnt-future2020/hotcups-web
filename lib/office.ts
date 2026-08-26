/**
 * The office the visitor described on the calculator.
 *
 * Section 04 works out their number; section 05 answers with it — "At 128
 * cups a day, two of these fit your office." One store between two sections
 * is the whole trick, and it is why the page reads as if it has been paying
 * attention.
 *
 * CUPS IS CARRIED, NOT DERIVED
 * It would be one line to recompute it here as heads x CUPS_PER_HEAD, and
 * that is exactly what this used to do. The producer owns the arithmetic and
 * this only carries the answer, so that the two sections can never disagree
 * about a number the visitor can see on both screens — whatever section 04
 * decides is what section 05 repeats.
 *
 * The defaults match section 04's own starting state, so the machine row is
 * never blank or wrong on first paint even if the visitor jumps straight to
 * it from the nav.
 */

/** The default rate, and the one section 04 starts on. It offers whole cups
    only — 1, 2 or 3 — so this is 2, not the 1.5 blended average it used to be. */
export const CUPS_PER_HEAD = 2;

/** Section 04's opening state, which is now its floor: the six preset office
    sizes were removed in favour of a single typed field, and it starts at the
    smallest number it accepts. Ten heads at two cups is 20 a day — UNDER the
    40-cup line, so section 05 opens on the small-office answer too. */
let heads = 10;
let cups = heads * CUPS_PER_HEAD;

const subs = new Set<(heads: number, cups: number) => void>();

export function currentOffice() {
  return { heads, cups };
}

export function setOffice(nextHeads: number, nextCups: number) {
  if (nextHeads === heads && nextCups === cups) return;
  heads = nextHeads;
  cups = nextCups;
  subs.forEach((fn) => fn(heads, cups));
}

export function subscribeOffice(fn: (heads: number, cups: number) => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
