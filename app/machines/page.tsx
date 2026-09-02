import type { Metadata } from "next";
import MachinesView from "./MachinesView";

/**
 * /machines — the three sizes, and the case for having one at all.
 *
 * IT CARRIES BOTH MACHINE SECTIONS
 * Section 06 is the row of three and the custom build; section 05 is the
 * argument that gets you there — "above 50 cups a day, a machine is the
 * better fit". A page about machines that omitted the second would be a
 * catalogue rather than an answer, so both are here.
 *
 * WHAT STAYED ON THE HOME PAGE, AND WHY.
 * Section 05's calculator — heads x cups, the slider, the flasks-vs-machine
 * verdict that flies a badge between two cards — is a client component built
 * on lib/office and a good deal of motion. It is not reproduced here. This is
 * a server component like the other three pages, and rebuilding an
 * interactive calculator as static markup would be a worse version of
 * something that already exists one link away. The page states the line and
 * points at it.
 *
 * !!  NOTHING ON THIS PAGE IS A NEW CLAIM.  !!
 *
 *   "Rent or buy. Find your right machine."      section 06's headline
 *   "Three sizes, from counter-top to half a
 *    desk — each built for a different
 *    workplace."                                 section 06's sub
 *   the three capacity bands                     section 06's cards
 *   "Custom machines designed around your
 *    workspace." + the constraint list           section 06's panel
 *   "Above 50 cups a day, a machine is the
 *    better fit."                                section 05's own sentence
 *   phone / WhatsApp / email                     lib/contact.ts
 *
 * THE BANDS ARE THE CLIENT'S OWN NUMBERS — MachineRow.tsx calls them "the
 * first hard figures this section has had" and records that everything before
 * them was read off the photographs and guessed. They are among the few
 * confirmed figures on the whole site, which is why this page leans on them.
 *
 * !!  THE PHOTOGRAPHS STILL CARRY THEIR MAKERS' BRANDING.  !!
 *
 * The names came off the cards at the client's direction and are not printed
 * anywhere here. That does not make the machines anonymous: the first unit
 * has "Cothas Coffee KREA NECTA" printed in red across its front panel, and
 * the second carries a visible CHACONY® mark beside its touchscreen. Both are
 * legible at card size. A page whose entire subject is the machines shows
 * those marks larger and more often than the home row did, so if the removal
 * was meant to stop the site attributing a manufacturer, these need
 * retouching or replacing — deleting label text cannot do it.
 *
 * The filenames leak the same thing: /img/machine-cothas.png and
 * /img/machine-chaipoint.png are visible to anyone who opens a network tab.
 *
 * IT USES THE STEEL PALETTE, NOT THE CREAM ONE. Sections 05 and 06 are the
 * only two on the site that do — cream is the flask half of the argument and
 * steel is the machine half. /service, /menu and /who-we-serve are cream
 * pages; this one is deliberately not, so it reads as a continuation of the
 * sections it comes from rather than a fourth page of the same thing.
 *
 * ---------------------------------------------------------------
 * THIS FILE IS A SHELL. `metadata` cannot be exported from a "use client"
 * module — Next collects it on the server — so the route keeps this server
 * file for the metadata and the record above, and ./MachinesView carries the
 * markup and both animation engines. Same split as /service, /menu and
 * /who-we-serve, for the same reason.
 * ---------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "Machines — Hotcups",
  description:
    "Three sizes of beverage machine for workplaces, from counter-top to half a desk. Rent or buy, or have one built to your spec. Above 50 cups a day a machine is the better fit.",
};

export default function MachinesPage() {
  return <MachinesView />;
}
