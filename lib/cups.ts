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
 * over lunch climbed several hundred cups on its own. "15,000+" is a claim
 * the client can stand behind; "15,069+" was a claim about nothing.
 *
 * THE PLUS STAYS, and it is doing more work now than it was. It is what makes
 * this an approximation rather than a count — "more than fifteen thousand",
 * which is the shape of every other proof figure on the site (500+
 * organizations). Without it the line would be claiming an exact daily total,
 * which is a stronger and less defensible thing to say than the ticker ever
 * did.
 *
 * ONE EXPORT, NOT TWO. subscribeCups is gone rather than left as a no-op:
 * both call sites have been updated, and a subscription that can never fire
 * is a worse thing to leave in a file than a deleted function.
 */

export const CUPS = 15_000;

export function currentCups() {
  return CUPS;
}
