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
