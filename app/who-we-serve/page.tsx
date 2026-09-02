import type { Metadata } from "next";
import WhoWeServeView from "./WhoWeServeView";

/**
 * /who-we-serve — the six kinds of workplace, and what each can ask for.
 *
 * THE ROUTE IS NAMED AFTER THE LABEL, NOT THE ID — see NAV_HREF in
 * lib/sections.ts. The section id is `industries` and the anchor #industries
 * still is; the URL follows what the nav actually says.
 *
 * !!  NOTHING ON THIS PAGE IS A NEW CLAIM.  !!
 *
 * This is the page where that constraint bit hardest. Section 04 carries the
 * biggest warning in this codebase:
 *
 *     !!  FIVE OF THE SIX FACT LINES ARE INVENTED.
 *     !!  DO NOT PUBLISH UNTIL EACH ONE IS CONFIRMED.
 *
 * So the six cards carry A NAME AND A PHOTOGRAPH AND NOTHING ELSE. Every
 * caption and fact from that section — desk-side delivery, hospitals through
 * night shifts, campuses between classes, shops at peak, showrooms serving
 * customers who wait — is marked `placeholder: true` and stayed behind. They
 * read as operational facts about a real company, and repeating them on a page
 * whose entire subject is "who we serve" would have made the page's central
 * claim the invented part.
 *
 * WHAT DID COME ACROSS
 *   the heading and the 500+ line          section 04 (Industries.tsx)
 *   the six workplace NAMES                section 04's chips
 *   the Coimbatore figure                  section 04, `placeholder: false`
 *   the 50-cup line                        section 05 (Machines.tsx)
 *   the three capacity bands               section 06 (MachineRow.tsx)
 *   the per-workplace enquiry prefill      lib/workplace + lib/contact
 *
 * THE ONE NUMBER ON THE PAGE IS THE ONE THE CLIENT GAVE.
 * "Three-shift factories, including 2,000 cups a day in Coimbatore" is the
 * single entry in PLACES marked `placeholder: false`, and its own comment says
 * "the one line on this list that came from the client". It is set apart as a
 * standalone proof point rather than sat on the Manufacturing card, because
 * one card carrying a fact while five sit empty reads as five omissions.
 *
 * THE CARDS DO SOMETHING, WHICH IS THE POINT OF THE PAGE EXISTING.
 * Section 04's mechanism is that picking a workplace pre-fills the enquiry —
 * lib/workplace holds the choice, lib/contact's mailHref/waHref bend the
 * message around it. On the home page that takes a click and a scroll to
 * section 07. Here each card IS that workplace, so its two links carry the
 * prefill directly. Same two functions Pricing.tsx calls; no new machinery.
 *
 * WHAT IT INHERITS
 *   - lib/contact.ts is placeholder. Six cards x two links makes this page the
 *     site's largest single caller of unconfirmed contact details.
 *   - wp-other.webp under "Showrooms & banks" is a STAND-IN — a generic stock
 *     office, per the note in Industries.tsx. The real photograph is being
 *     shot. It is the only one of the six whose picture is not its subject.
 *   - "500+" carries no provenance anywhere; it is published on the home page
 *     and inherited here.
 *
 * ---------------------------------------------------------------
 * THIS FILE IS A SHELL. `metadata` cannot be exported from a "use client"
 * module — Next collects it on the server — so the route keeps this server
 * file for the metadata and the provenance record above, and ./WhoWeServeView
 * carries the markup and both animation engines. Same split as /service and
 * /menu, for the same reason.
 * ---------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "Who We Serve — Hotcups",
  description:
    "Offices, factories, hospitals, colleges, shops, showrooms and bank branches across Tamil Nadu — hot tea and filter coffee delivered in flasks, or a machine on site.",
};

export default function WhoWeServePage() {
  return <WhoWeServeView />;
}
