/**
 * The kind of workplace the visitor picked in section 03.
 *
 * Same publish/subscribe shape as lib/office — one module owns the value, the
 * sections that care subscribe. Section 03 is the only writer.
 *
 * WHAT IT ACTUALLY FEEDS, AND WHAT IT DOES NOT
 * The brief says the selection should "pre-fill the workplace" in section 07's
 * pricing form. There is no form. It was removed on purpose — section 07's own
 * header comment records the reasoning: two asks meant the page posed the same
 * question twice and took the same no twice, so it was cut down to a date
 * promise and three ways to make contact.
 *
 * So the selection goes where a workplace type is actually useful: into the
 * TEXT of those three. Pick Manufacturing and the quote email arrives saying
 * it is for a factory, and the WhatsApp message opens the same way. The intent
 * of the brief — the ask arrives already knowing what kind of place is asking
 * — is met without rebuilding a form that was deliberately deleted.
 *
 * Null until someone chooses. Most visitors never will (section 03 is built to
 * read completely with nothing selected), and in that case section 07 asks the
 * neutral question it asked before — which is also what happens for a visitor
 * whose workplace is not one of the seven. The list was six real segments
 * rather than five and an "other"; Events & functions is the seventh, and the
 * invitation to everyone else lives in the copy under the button instead of
 * as a chip.
 */

export type WorkplaceKey =
  | "office"
  | "factory"
  | "hospital"
  | "college"
  | "retail"
  | "showroom"
  /* SEVENTH, AND THE ONLY ONE THAT IS NOT A WORKPLACE. Added with the event
     photograph the client supplied. Everything above is somewhere people go
     to work and the round runs to them twice a day; a wedding is a single
     day with a counter in it. The list is still called workplace because
     every other consumer of it is, and renaming the module to carry one
     exception would cost more than it explains. */
  | "event";

/** "Get pricing for ___" — the article travels with the noun, because "for a
    office" is the kind of thing that only shows up once it is on screen. */
export const WORKPLACE_FOR: Record<WorkplaceKey, string> = {
  office: "an office",
  factory: "a factory",
  hospital: "a hospital",
  college: "a campus",
  retail: "a shop",
  showroom: "a showroom",
  event: "an event",
};

/** how the same choice reads inside a sentence to a human at the other end */
export const WORKPLACE_ASK: Record<WorkplaceKey, string> = {
  office: "an office",
  factory: "a factory",
  hospital: "a hospital",
  college: "a college campus",
  retail: "a retail shop",
  showroom: "a showroom or bank branch",
  event: "a wedding or function",
};

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
