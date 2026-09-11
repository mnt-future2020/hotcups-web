/**
 * The cups figure, shared by the hero badge and the header dock.
 *
 * IT IS A CONSTANT NOW, at the client's direction. It used to hold a mutable
 * `value` and tick it +1 on a randomised 4-9s interval, with a subscriber set
 * so the badge and the dock could not disagree while one docked into the
 * other on scroll.
 *
 * WHY THE TICKER WENT. A live counter only tells the truth if something is
 * actually counting, and nothing was: the increment came from a timer in the
 * browser, so the number a visitor saw was a function of how long their tab
 * had been open rather than of how many cups were poured. Two people looking
 * at the site at the same moment saw different totals, and a tab left open
 * over lunch climbed several hundred cups on its own. A round figure is a
 * claim the client can stand behind; "15,069+" was a claim about nothing.
 *
 * THE PLUS STAYS, and it is doing more work now than it was. It is what makes
 * this an approximation rather than a count — "more than eighteen thousand",
 * which is the shape of every other proof figure on the site (500+
 * organizations). Without it the line would be claiming an exact daily total,
 * which is a stronger and less defensible thing to say than the ticker ever
 * did.
 *
 * ONE EXPORT, NOT TWO — AND NOW ONE FEWER AGAIN. subscribeCups went when the
 * ticker did, rather than being left as a no-op. currentCups() has now gone
 * the same way: both call sites read CUPS_LABEL instead, so it was a getter
 * with no getters. CUPS stays because the label is computed from it.
 */

export const CUPS = 18_000;

/**
 * THE ONE PLACE THE FIGURE BECOMES A STRING, at the client's direction:
 * "18K+", not "18,000+".
 *
 * IT IS DERIVED, NOT TYPED. Both badges used to call
 * `cups.toLocaleString("en-IN")` themselves, which meant the number and its
 * presentation could be changed in one and not the other — and the two are
 * never on screen together (exactly one renders at any width, see Header),
 * so a visitor dragging a window across 1280px is the only person who would
 * ever have caught it. Computing it from CUPS makes that impossible.
 *
 * WHAT THE ABBREVIATION COSTS. "18K+" cannot be counted up to. The hero
 * badge used to roll 0 -> 15,000 over 900ms, which was ~15,000 distinct
 * frames of a smooth-looking number; the same roll in K units has eighteen,
 * so it reads as a stutter rather than a count. The badge lands static now —
 * see the note in SlideFlask.
 */
export const CUPS_LABEL = `${CUPS / 1000}K+`;
