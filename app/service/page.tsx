import type { Metadata } from "next";
import ServiceView from "./ServiceView";

/**
 * /service — the service, at length.
 *
 * WHY IT EXISTS
 * Until this page the whole site was one document: /blog and /case-studies are
 * noindex stubs and /hero-test is a shader rig, so every nav item was a hash
 * into the landing page. "The Service" was the first of them to get a page of
 * its own, and the header link points here instead of at #service — see
 * NAV_HREF in lib/sections.ts. Section 01 stays on the home page as the
 * summary.
 *
 * !!  NOTHING ON THIS PAGE IS A NEW CLAIM.  !!
 *
 * That is the constraint it was built under and the one thing to keep hold of
 * when editing it. Every sentence, figure and category is lifted from a
 * section that already publishes it:
 *
 *   the headline, the sub, the three steps   section 01  (Service.tsx)
 *   the four drink categories and counts     section 02  (Menu.tsx)
 *   the five pantry categories               section 03  (Pantry.tsx)
 *   the six workplace types, "500+"          section 04  (Industries.tsx)
 *   the 50-cup line                          section 05  (Machines.tsx)
 *   the three capacity bands, custom build   section 06  (MachineRow.tsx)
 *   phone / WhatsApp / email                 lib/contact.ts
 *
 * A longer page was on the table — onboarding, hygiene, areas covered, SLAs,
 * an FAQ — and was turned down in favour of this. None of that is anywhere on
 * the site, so all of it would have been invented, and this codebase already
 * carries DO-NOT-PUBLISH banners for content in exactly that position.
 *
 * WHAT IT INHERITS, INCLUDING THE PROBLEMS
 * Reusing published copy means reusing whatever is wrong with it:
 *   - lib/contact.ts is placeholder. The number dials, the mail sends. Its own
 *     banner is the authority; this page is one more caller.
 *   - the drink counts (8 blends, 6 roasts, 5 options) carry no provenance in
 *     Menu.tsx. Only the "2" was ever confirmed by the client.
 * Neither is made truer by appearing twice, and correcting either at source
 * means correcting it here too.
 *
 * ---------------------------------------------------------------
 * THIS FILE IS A SHELL, AND THAT IS A NEXT.JS CONSTRAINT RATHER THAN A CHOICE.
 *
 * The page was a server component and shipped no JS, which was a deliberate
 * trade recorded here: it arrived fully formed instead of assembling itself,
 * matching /blog and /case-studies rather than the landing page. That is now
 * reversed at the client's direction — the body animates, so the body is a
 * client component.
 *
 * `metadata` cannot be exported from a "use client" module; Next collects it
 * on the server. So the route keeps this server file for the metadata and the
 * provenance record above, and ./ServiceView carries the markup and both
 * animation engines. The split is the only way to have route metadata AND an
 * animated body in the App Router.
 * ---------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "The Service — Hotcups",
  description:
    "Freshly filled flasks delivered to your pantry, and the empties collected. Tea, filter coffee, badam milk and more for workplaces across Tamil Nadu.",
};

export default function ServicePage() {
  return <ServiceView />;
}
