/**
 * The hrefs, rebuilt from stored contact details.
 *
 * WHY THIS IS NOT IN lib/contact.ts ANY MORE. That file computed WA_HREF,
 * MAIL_HREF and TEL_HREF at module scope from its own constants, which is
 * correct for constants and impossible for values that arrive per request. So
 * the arithmetic moves here as pure functions of a ContactContent, and
 * lib/contact keeps its constants as the defaults they always were.
 *
 * NO IMPORTS FROM node: OR next/. Every function here runs on the server while
 * rendering the footer and in the browser when a client section builds a link,
 * so the module has to be safe in both. That is also why it is separate from
 * store.ts, which is emphatically not.
 */

import type { ContactContent } from "./schema";

/** The shipped wording, and the fallback for a stored stem that is empty. */
export const ASK =
  "Hi Hotcups — we'd like a price per cup and a first delivery date";

/**
 * The enquiry message, optionally naming the kind of workplace it came from.
 *
 * BUILT FROM THE STORED STEM, NOT FROM A CONSTANT. It was a pair of literals
 * in this file, so changing what every enquiry says meant a code change and a
 * deploy — on the one sentence that arrives in the client's own inbox. It is
 * now `contact.ask` and is edited on the Contact screen.
 *
 * THE ARGUMENT IS THE PHRASE, NOT THE KEY, so this module stays unaware of
 * what the choices are — lib/workplace owns that list.
 */
export function askFor(c: ContactContent, place?: string | null): string {
  /* Defensive on both ends: a stem that arrived with a stop still produces
     one sentence, and an emptied field falls back rather than sending a
     message that opens with " for an office." */
  const stem = (c.ask || ASK).trim().replace(/[.\s]+$/, "");
  return place ? `${stem} for ${place}.` : `${stem}.`;
}

export function telHref(c: ContactContent): string {
  return `tel:${c.phoneE164}`;
}

export function waHref(c: ContactContent, place?: string | null): string {
  return `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(askFor(c, place))}`;
}

/* "Get a quote" goes to email, not to WhatsApp. A quote is a document, and the
   button beside it already covers the instant channel — pointing both at the
   same place would make one of them decoration. */
export function mailHref(c: ContactContent, place?: string | null): string {
  const subject = place ? `Pricing request — ${place}` : "Pricing request";
  return (
    `mailto:${c.email}?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(askFor(c, place))}`
  );
}

export function addressOneLine(c: ContactContent): string {
  return c.addressLines.join(" ");
}

export function mapsHref(c: ContactContent): string {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(addressOneLine(c))
  );
}
