/**
 * The menu, running.
 *
 * A ruled band of drink names travelling right to left, sitting between the
 * blog and the footer — the last thing the page says before it signs off, and
 * the one place the individual drinks are named rather than counted. Section
 * 02 sells the menu as four CATEGORIES with counts (1 blend, 1 roast, 1
 * option, 2 specials).
 *
 * IT USED TO BE A SAMPLE OF WHAT WAS INSIDE THOSE CATEGORIES, and this note
 * used to say the two lists were deliberately different. The client cut three
 * of the four categories to a single drink, so the sample and the menu are
 * now the same five names — see the note on RUN.
 *
 * THE COPY WARNING THAT STOOD HERE IS GONE WITH THEM. It said these names
 * were plausible and generic rather than client-supplied, and it was right
 * about the ones it was written for; all of those have been removed. Every
 * name here is on /menu and predates the cuts.
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
 * IT IS SET IN THE LOGO'S MAROON, NOT THE PAGE'S INK
 * This band sits directly under the wordmark in the footer, close enough that
 * two different dark browns read as a mistake. --color-maroon is sampled off
 * the lockup itself. It is also the better number: 12.71:1 on this cream
 * against ink-soft's 9.46.
 *
 * NO BOTTOM BORDER, ON PURPOSE
 * The footer underneath carries its own border-t. Giving this one a border-y
 * stacked two 1px lines at the seam and read as a 2px rule that was thicker
 * than every other divider on the page.
 */

/* THIS IS THE WHOLE MENU NOW, NOT A SAMPLE OF IT.
   The docblock above says this band is "a handful of what is inside" the
   categories, and that the two lists are not the same and should not be.
   That stopped being true when the client cut Tea, Coffee and Milk to one
   drink each: the menu is five drinks, and here they are, all five.

   It also stopped being unconfirmed. The old run — Masala Chai, Green Tea,
   Ginger Tea, Hot Chocolate, Badam Milk — named four drinks /menu no longer
   lists, and Hot Chocolate had been wrong for two swaps of section 02's
   fourth card. Every name below is on the menu and was published by this
   site before the cuts.

   IF A CATEGORY GROWS AGAIN this goes back to being a sample and the
   docblock above is right again. Nothing here needs changing for that —
   just do not let it name a drink the menu does not pour. */
const RUN = [
  "Tea",
  "Filter Coffee",
  "Milk",
  "Buttermilk",
  "Nannari Sarbath",
];

/** Passes of RUN inside each half — see the note above on why this is not 1.
    FOUR, RAISED FROM THREE WHEN THE LIST WENT FROM SEVEN NAMES TO FIVE.
    Three passes of the old seven measured ~5100px; three passes of these
    five measure 3256px on the running page, which clears a 1920 window but
    NOT the 3440 ultrawide the previous note set as the bar — the gap this
    whole mechanism exists to prevent would have come back at that width.
    Four passes is 4341px and 20 list items.

    THAT NUMBER IS NOW CONSERVATIVE, NOT WRONG. "Masala Buttermilk" became
    "Buttermilk" when the client corrected the drink, which takes seven
    characters out of each of the four passes — the run got SHORTER, so the
    3440 case the four passes were bought for still holds with room to spare.
    Re-measure only if the list gains a name or the type grows.

    The type is clamp(1.25rem, 2.4vw, 1.875rem) and 2.4vw passes 1.875rem at
    1250px wide, so the names are already at full size in this measurement
    and do not grow further on a wider screen. The number is safe as read.

    Re-measure this if the list or the type size changes again. It is
    `document.querySelector('.ticker-track').children[0].getBoundingClientRect().width`. */
const REPEATS = 4;
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
                <span className="font-display text-[clamp(1.25rem,2.4vw,1.875rem)] font-semibold tracking-tight text-maroon">
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
