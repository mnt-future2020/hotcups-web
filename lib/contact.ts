/* ===============================================================
   !!  PLACEHOLDER CONTACT DETAILS — NOT CONFIRMED BY THE CLIENT. !!
   !!  DO NOT PUBLISH UNTIL EVERY VALUE BELOW IS VERIFIED.        !!
   ===============================================================
     The number, the inbox and the street address are all standing
     in. They came into the build with section 07 and no one has
     checked them against the client.

     They are live links: tel: dials, mailto: sends, wa.me opens a
     chat and the maps link drops a pin. A wrong value here does not
     look wrong on the page — it silently sends real enquiries to a
     real stranger, which is worse than an obviously blank field.

   BEFORE THE SITE GOES LIVE, GET FROM THE CLIENT
     1. the number that should ring, and whether it is on WhatsApp
     2. the inbox that should receive quote requests
     3. the registered address, and whether it is the one to publish
     4. the legal entity name for the copyright line in the footer
   =============================================================== */

/**
 * How to reach Hotcups.
 *
 * These lived inside section 07 while it was the only place on the page that
 * asked for contact. The footer needs the same number, the same address and
 * the same inbox — and a phone number that is right in one place and stale in
 * the other is worse than not showing it twice. One definition, two readers.
 *
 * E164 for the tel: href, a spaced label for the eye. They are not the same
 * string and they must not be derived from each other: a dialler wants no
 * spaces, a reader wants them.
 */

export const PHONE_LABEL = "+91 97504 97509";
export const PHONE_E164 = "+919750497509";
export const WA_NUMBER = "919750497509";
export const EMAIL = "refresh@hotcups.co.in";

/** two lines, because it is set in a narrow column and a manual break beats
    whatever the browser would choose */
export const ADDRESS_LINES = ["No 117, Nethaji Road,", "Madurai 625001"] as const;
export const ADDRESS = ADDRESS_LINES.join(" ");

export const MAPS_HREF =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADDRESS);

export const ASK = "Hi Hotcups — we'd like a price per cup and a first delivery date.";

/** The same ask, naming the kind of workplace section 03 was asked about. The
    argument is the phrase, not the key, so this module stays unaware of what
    the choices are — lib/workplace owns that list. */
export const askFor = (place?: string | null) =>
  place
    ? `Hi Hotcups — we'd like a price per cup and a first delivery date for ${place}.`
    : ASK;

export const WA_HREF = `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(ASK);
export const waHref = (place?: string | null) =>
  `https://wa.me/${WA_NUMBER}?text=` + encodeURIComponent(askFor(place));

export const TEL_HREF = `tel:${PHONE_E164}`;

/* "Get a quote" goes to email, not to WhatsApp. A quote is a document, and
   the button beside it already covers the instant channel — pointing both at
   the same place would make one of them decoration. */
export const MAIL_HREF =
  `mailto:${EMAIL}?subject=` +
  encodeURIComponent("Pricing request") +
  "&body=" +
  encodeURIComponent(ASK);

export const mailHref = (place?: string | null) =>
  `mailto:${EMAIL}?subject=` +
  encodeURIComponent(place ? `Pricing request — ${place}` : "Pricing request") +
  "&body=" +
  encodeURIComponent(askFor(place));
