/**
 * The kind of workplace the visitor picked in section 04.
 *
 * Same publish/subscribe shape as lib/office — one module owns the value, the
 * sections that care subscribe. Section 04 and /who-we-serve are the writers.
 *
 * WHAT IT ACTUALLY FEEDS, AND WHAT IT DOES NOT
 * The brief says the selection should "pre-fill the workplace" in section 07's
 * pricing form. There is no form. It was removed on purpose — section 07's own
 * header comment records the reasoning: two asks meant the page posed the same
 * question twice and took the same no twice, so it was cut down to a date
 * promise and three ways to make contact.
 *
 * So the selection goes where a workplace type is actually useful: into the
 * TEXT of those three. Pick Manufacturing and the quote email arrives saying it
 * is for a factory, and the WhatsApp message opens the same way. The intent of
 * the brief — the ask arrives already knowing what kind of place is asking — is
 * met without rebuilding a form that was deliberately deleted.
 *
 * Null until someone chooses. Most visitors never will (section 04 is built to
 * read completely with nothing selected), and in that case section 07 asks the
 * neutral question it asked before.
 *
 * ── WHAT THIS MODULE USED TO HOLD, AND WHY IT NO LONGER DOES ──────────────
 *
 * It carried a seven-member `WorkplaceKey` union and two Records keyed by it:
 * WORKPLACE_FOR ("an office") and WORKPLACE_ASK ("a college campus"). The union
 * made those Records exhaustive, which was the point — and it also meant the
 * workplaces existed in FOUR places at once: here, in section 04's own PLACES
 * array, in /who-we-serve's, and as a hardcoded "Six" in a headline that was
 * already wrong by one because Events & functions had been added to the list
 * and the number counting it had not.
 *
 * The list lives in lib/content/schema now, as WorkplaceContent, and each entry
 * carries its own two phrases. A selection is therefore just a KEY — a plain
 * string — and whoever needs the phrase looks up the place that owns it rather
 * than indexing a parallel Record.
 *
 * WHAT THAT COSTS, stated rather than glossed: a mistyped key no longer fails
 * to compile. What makes it safe enough is that keys are generated from names
 * rather than typed, that parseContent de-duplicates them, and that a key which
 * matches nothing produces the same neutral ask as no selection at all — which
 * is the behaviour this module already had for a visitor who never chose.
 */

/** A workplace's key. Was a union of seven; see the note above. */
export type WorkplaceKey = string;

let selected: WorkplaceKey | null = null;

const subs = new Set<(k: WorkplaceKey | null) => void>();

export function currentWorkplace() {
  return selected;
}

export function setWorkplace(next: WorkplaceKey | null) {
  if (next === selected) return;
  selected = next;
  subs.forEach((fn) => fn(selected));
}

export function subscribeWorkplace(fn: (k: WorkplaceKey | null) => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
