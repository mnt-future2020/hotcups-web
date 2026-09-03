import type { Metadata } from "next";
import MenuView from "./MenuView";

/**
 * /menu — the menu, both halves of it.
 *
 * IT IS DRINKS AND PANTRY, ON PURPOSE
 * lib/sections.ts has said since it was written that section 03 is "the
 * second half of 'The Menu' rather than a destination of its own", which is
 * why `pantry` is nav: false and NAV_FOR points it at `menu`. This page is
 * that sentence made real: the four drink categories from section 02 and the
 * five pantry categories from section 03, in one place. There is deliberately
 * no /pantry — adding one would contradict the registry.
 *
 * !!  NOTHING ON THIS PAGE IS A NEW CLAIM.  !!
 *
 * Same constraint as /service, and the same reason: this codebase already
 * carries DO-NOT-PUBLISH banners for invented content, and a menu is exactly
 * the kind of page that invites inventing one. Every line here is lifted from
 * a section that already publishes it:
 *
 *   the heading, the sub, the four categories   section 02  (Menu.tsx)
 *   the pantry heading and its five categories  section 03  (Pantry.tsx)
 *   "We prepare" / "We deliver"                 section 03's two pills
 *   phone / WhatsApp / email                    lib/contact.ts
 *
 * NO PRICES, AND THAT IS DELIBERATE RATHER THAN AN OVERSIGHT.
 * Menu.tsx's own docblock records that its closing "From ₹8 a cup" was taken
 * off at the client's direction and that "nothing on the page quotes a rate".
 * A menu page is the most tempting place on the site to put one back. It does
 * not, and it should not until there is a confirmed number with a home.
 *
 * WHAT IT INHERITS
 *   - the counts (8 blends, 6 roasts, 5 options) carry no provenance in
 *     Menu.tsx. Only "2 specials" was ever confirmed. Repeating them here
 *     does not make them truer, and correcting them at source means
 *     correcting them here too.
 *   - lib/contact.ts is placeholder. Its own banner is the authority.
 *   - four of the five pantry pairings are stand-ins — "Healthy Choices" over
 *     deep-fried banana chips most of all. See the banner on STOPS in
 *     Pantry.tsx; that mismatch travels here unchanged.
 *
 * THE SITE STILL DISAGREES WITH ITSELF ABOUT THE FOURTH DRINK, AND THE GAP
 * HAS NOW WIDENED TWICE. Section 02 poured hot chocolate, then a rose
 * sarbath, and now masala buttermilk. Three places were never updated with
 * it and still say hot chocolate:
 *
 *     components/hero/Hero.tsx      slide copy and its alt text
 *     components/sections/Industries.tsx   the MENU list
 *     components/ui/Ticker.tsx      the scrolling drink names
 *
 * This page follows section 02, because section 02 is the menu. Those three
 * are the ones to fix, and they are now two drinks behind rather than one.
 *
 * ---------------------------------------------------------------
 * THIS FILE IS A SHELL. `metadata` cannot be exported from a "use client"
 * module — Next collects it on the server — so the route keeps this server
 * file for the metadata and the provenance record above, and ./MenuView
 * carries the markup and both animation engines. Same split as /service, for
 * the same reason. The page no longer ships zero JS; that was the cost of
 * animating it, and it was asked for.
 * ---------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "The Menu — Hotcups",
  description:
    "Tea, filter coffee, badam milk and seasonal specials, plus the pantry that rides along — snacks, hot and fresh, and healthy choices for your team.",
};

export default function MenuPage() {
  return <MenuView />;
}
