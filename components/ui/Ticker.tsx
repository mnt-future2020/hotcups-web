/**
 * The menu, running.
 *
 * A ruled band of drink names travelling right to left, sitting between the
 * blog and the footer — the last thing the page says before it signs off, and
 * the one place the individual drinks are named rather than counted. Section
 * 02 sells the menu as four CATEGORIES with counts (8 blends, 6 roasts, 5
 * options, 4 seasonal); this is a handful of what is inside them, which is why
 * the two are not the same list and should not be.
 *
 * NOTE FOR WHOEVER VERIFIES THE COPY: these seven names are as unconfirmed as
 * the counts and prices in section 02. They are plausible and generic, not
 * client-supplied.
 *
 * TWO IDENTICAL HALVES, AND EACH ONE HAS TO OUTRUN THE WINDOW
 * The track is width:max-content and the keyframe translates it -50%, which
 * lands the second half exactly where the first began — so the seam is
 * invisible and there is no jump to hide.
 *
 * That only holds if ONE HALF IS AT LEAST AS WIDE AS THE VIEWPORT, and with
 * one pass of seven names it never was: 1253px at the old type size against a
 * 1920px window, so once per cycle 667px of bare cream swept in from the
 * right and the band visibly ran out. Each half is REPEATS passes now, which
 * puts a half at roughly 3400px — wider than any window this will meet.
 *
 * If the type size or the name list changes, re-check it: half width must
 * stay above the widest viewport, or the gap comes back.
 *
 * Only the first pass is announced. A screen reader should hear the menu
 * once, not four times, so everything after it is aria-hidden.
 *
 * IT PAUSES ON HOVER, AND THAT IS THE ONLY CONTROL
 * .ticker-mask:hover stops the track, and prefers-reduced-motion stops it
 * outright. Same call, and same caveat, as the hero carousel: WCAG 2.2.2 asks
 * for a mechanism to pause moving content that runs past five seconds, and
 * hover is not one a keyboard or touch user has. The OS-level reduced-motion
 * preference is what actually satisfies it. A button is the fix if an audit
 * ever asks for one.
 *
 * NO BOTTOM BORDER, ON PURPOSE
 * The footer underneath carries its own border-t. Giving this one a border-y
 * stacked two 1px lines at the seam and read as a 2px rule that was thicker
 * than every other divider on the page.
 */

const RUN = [
  "Masala Chai",
  "Filter Coffee",
  "Badam Milk",
  "Hot Chocolate",
  "Green Tea",
  "Ginger Tea",
  "Premium Coffee",
];

/** Passes of RUN inside each half — see the note above on why this is not 1.
    Three, not two: two put a half at 3396px, which covers every ordinary
    window but not a 3440 ultrawide, where the gap would come back. Three is
    ~5100px and 42 list items, which costs nothing. */
const REPEATS = 3;
const HALF = Array.from({ length: REPEATS }, () => RUN).flat();

export default function Ticker() {
  return (
    <div className="ticker-mask relative overflow-hidden border-t border-line/70 bg-cream py-[clamp(0.9rem,2vw,1.35rem)]">
      <div className="ticker-track">
        {[0, 1].map((half) => (
          <ul
            key={half}
            aria-hidden={half === 1}
            className="flex shrink-0 items-center"
          >
            {HALF.map((item, i) => (
              <li
                key={`${i}-${item}`}
                aria-hidden={half === 0 && i >= RUN.length}
                className="flex shrink-0 items-center gap-6 whitespace-nowrap px-6"
              >
                <span className="font-display text-[clamp(1.25rem,2.4vw,1.875rem)] font-semibold tracking-tight text-ink-soft">
                  {item}
                </span>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-orange"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
