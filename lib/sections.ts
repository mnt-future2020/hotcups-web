/** The landing page, in scroll order. Drives the nav and the scroll spy. */
export const SECTIONS = [
  { id: "hero", label: "Home", nav: false },
  { id: "service", label: "The Service", nav: true },
  { id: "menu", label: "The Menu", nav: true },
  /* nav: false. The header already carries five links and a button, and this
     is the second half of "The Menu" rather than a destination of its own —
     a visitor who wants it is already scrolling through the drinks to reach
     it. It is in this list so the scroll spy knows the section exists, and
     NAV_FOR below is what keeps the drinks link lit while the pantry is on
     screen. That claim used to be made here and was simply untrue: the spy
     set the raw section id and the nav matched on it, so the bar went dark
     over every section that was not in it. */
  { id: "pantry", label: "In the Pantry", nav: false },
  { id: "industries", label: "Who We Serve", nav: true },
  /* The id stays "savings" even though the section no longer shows any: the
     hero links to #savings and so does the footer's note, and an anchor is a
     URL people may already have. The LABEL is what a human reads, so that
     follows the section. */
  { id: "savings", label: "Flasks or a machine", nav: false },
  { id: "machines", label: "Machines", nav: true },
  /* OUT OF THE NAV at the client's direction. The footer still links to it
     under Company, and NAV_FOR keeps Machines lit while it is on screen, so
     the section is neither unreachable nor unmarked. */
  { id: "cases", label: "Case Studies", nav: false },
  /* IN THE NAV, AND IT COST THE OTHERS SOME PADDING WHEN IT ARRIVED.
     Seven links did not fit at lg on the sizes they were wearing: measured at
     1024px the bar has 942px of content, the logo and the pricing button claim
     a matched 1fr each, and the two 24px gaps leave the nav about 613px. Seven
     labels came to ~641 at the old size, so the nav's type and padding step
     down between lg and 1440 — see Header.tsx — which brought it to ~559.

     Swapping Case Studies (12 characters) for Pricing (7) since then has
     taken it to about 524, so the headroom at 1024 is now ~89px rather than
     ~39px. The step-down is no longer load-bearing, but it is also not worth
     undoing: restoring px-3 and 0.9rem measures 604px, which is 9px of margin
     and inside my own estimating error.

     Order is the page's scroll order, and the nav reads down it. */
  { id: "story", label: "Our Story", nav: true },
  /* "Pricing", not the registry's old "Get Pricing", because the CTA button
     three inches to the right of it already says Get pricing and two of those
     side by side reads as a mistake. */
  { id: "pricing", label: "Pricing", nav: true },
  { id: "blog", label: "Blog", nav: true },
  { id: "contact", label: "Contact", nav: false },
] as const;

export const NAV = SECTIONS.filter((s) => s.nav);

/**
 * Nav items that are a PAGE rather than a place on the home page.
 *
 * The registry above describes the landing page, and for six of the seven nav
 * items that is still the whole story: the link is a hash, the spy watches for
 * the section, the underline follows. "The Service" now has a page of its own,
 * so its link has to leave the document instead of scrolling inside it.
 *
 * A SEPARATE MAP RATHER THAN A FIELD ON SECTIONS, and the reason is the
 * `as const` up there. Adding `href` to one entry and not the others gives the
 * union a member the rest lack, so `item.href` stops type-checking at every
 * call site — the fix would be `href: null` typed onto all thirteen, which is
 * twelve lines of noise to describe one exception. This says the same thing in
 * one line and takes one more when the next section earns a page.
 *
 * The section KEEPS its entry above. #service is still on the home page, still
 * watched by the spy, and still the thing the underline lights while a reader
 * scrolls past it — see the `on` test in Header. The page is an addition, not
 * a replacement, and an old /#service link still lands somewhere real.
 */
export const NAV_HREF: Record<string, string> = {
  service: "/service",
  /* THE PANTRY GOES WITH IT, and that is why this entry is worth a note.
     `pantry` is nav: false and NAV_FOR sends it here — the comment on it above
     already calls it "the second half of The Menu rather than a destination of
     its own". So /menu is both halves: the drinks from section 02 and the
     pantry from section 03, on one page. There is no /pantry and there should
     not be one, or that comment stops being true. */
  menu: "/menu",
  /* THE KEY AND THE PATH DIVERGE HERE, and it is the first entry where they
     do. `service` and `menu` happen to be both the section id and the URL, so
     this map looked like an identity function with extra steps. This one is
     `industries` in the code and /who-we-serve on the wire.

     The path follows the LABEL rather than the id because a URL is read by
     people: "Who We Serve" is what the nav says, what the client calls it and
     what a visitor is clicking. "Industries" is a word that appears nowhere in
     the interface — it is an internal id, and the anchor #industries still is
     one. Naming the route after it would have been consistent with the code
     and opaque to everyone else. */
  industries: "/who-we-serve",
  /* `machines` is the id of section 06 and the path of the page, so this is
     back to the identity the first two entries had. The page carries BOTH
     machine sections: 06's three sizes and the custom build, and 05's
     50-cup line. /#savings — section 05's own anchor, and still the id in
     SECTIONS because the hero and the footer link to it — stays where it is,
     because the calculator itself is a client component that belongs on the
     home page rather than on a static route. The page links back to it. */
  machines: "/machines",
};
export type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Which nav item a section lights up — itself when it is in the nav, and
 * otherwise the nearest nav section ABOVE it in scroll order.
 *
 * THE SPY HAD NO SUCH FALLBACK AND TWO COMMENTS IN THIS FILE SAID IT DID.
 * The observer sets the raw id of whatever section is under the middle of the
 * viewport and the header matched `active === item.id`, so scrolling into the
 * pantry, the flasks-or-a-machine calculator, the case studies or the contact
 * block put the bar in a state where nothing at all was underlined. On a page
 * this long that reads as the nav having lost track of you.
 *
 * Derived rather than declared: no per-section field to keep in step, and a
 * section moved in this list picks up the right parent by itself. `hero` is
 * first and nav: false, so it maps to "" and lights nothing — which is right,
 * because there is no Home link to light.
 */
export const NAV_FOR: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  let last = "";
  for (const s of SECTIONS) {
    if (s.nav) last = s.id;
    map[s.id] = s.nav ? s.id : last;
  }
  return map;
})();
