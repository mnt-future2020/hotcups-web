"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Logo from "./Logo";
import { NAV, NAV_FOR, NAV_HREF, SECTIONS } from "@/lib/sections";
import { currentHeroTone, subscribeHeroTone, type HeroTone } from "@/lib/heroTone";
import { currentCups, subscribeCups } from "@/lib/cups";

/* THE COUNTER DOCK, at the client's direction — the badge moves out of the
   hero and up here. lib/cups.ts has described this since it was written
   ("shared by the hero badge and the header dock"), so the single source was
   already in place and the number cannot disagree with itself.

   min-[1280px] AND NOT LOWER, MEASURED.
   The bar is a 1fr / auto / 1fr grid whose outer columns floor at their
   content, so a right column that outgrows its share does not clip — it
   pushes the nav off centre, and past a point it stops fitting at all.
   Modelled across eight widths with the nav's own metrics:

     1024   content 942   nav 536   1fr 203   dock+CTA 345 -> OVERFLOWS
     1152   content 1060  nav 536   1fr 262   dock+CTA 345 -> nav slides 83px
     1280   content 1178  nav 536   1fr 321   dock+CTA 345 -> nav slides 24px
     1366   content 1257  nav 536   1fr 361   dock+CTA 345 -> centred
     1440   content 1325  nav 756   1fr 284   dock+CTA 345 -> nav slides 61px
     1728+  content 1600  nav 756   1fr 422   dock+CTA 345 -> centred

   1280 is where the shift stops being visible. Below it the badge stays in
   the hero (see SlideFlask) — exactly one of the two renders at any width, so
   nothing is duplicated and nothing is lost on a laptop or a phone.

   "cups this day", not "cups served this day". Dropping "served" is what the
   dock has always done — it is doing no work the rest of the line is not
   already doing, and the words it saves are the difference between the dock
   fitting at 1280 and not. The hero badge keeps the full line.

   THE PERIOD CHANGED FROM A MONTH TO A DAY, at the client's direction, and
   the table above is now CONSERVATIVE rather than wrong. It was modelled on
   "cups this month" at a dock+CTA of 345px; measured at 1280 the current
   string gives a dock of 178px and a dock+CTA of 320px, so every row in it
   has 25px more room than it claims. 1280 is therefore still safe as the
   threshold — it was chosen against the wider string and nothing has grown.
   Widen the label again and re-measure before trusting those numbers.

   THE HERO BADGE SAYS THE SAME PERIOD, AND HAS TO.
   Exactly one of the two renders at any width (see SlideFlask), so a visitor
   never sees both at once — which is precisely why they cannot be allowed to
   disagree. Left at "this month" below 1280, dragging a window across that
   breakpoint would have turned the same number from a month's work into a
   day's. Both strings change together or neither does. */
function CupsDock({ onDark }: { onDark: boolean }) {
  const [cups, setCups] = useState(currentCups);
  useEffect(() => subscribeCups(setCups), []);

  return (
    <p
      /* LIGHT CHROME IS NOT THE DARK ONE WITH THE COLOURS SWAPPED, and the
         first pass proved it. It ran border-line over bg-ink/[0.03], which
         MEASURES at 1.20:1 for the border and a 3% wash for the plate — so on
         a cream slide the pill simply was not there. The label was never the
         problem (ink-soft on that plate is 8.9:1); the badge around it was.

         The dark chip works because it is glass: a wash and a hairline
         LIGHTER than their ground. The light one has to be the mirror —
         darker than its ground — and the alphas that reads at are not the
         same numbers. Solved against both grounds the bar floats over:

                              hero cream slide      stuck cream bar
           border ink/50         3.31:1 PASS          3.36:1 PASS
           plate  ink/[0.05]     1.11:1 lift          1.11:1 lift
           label  ink-soft       8.04:1               8.55:1
           number ink           15.00:1              15.93:1
           dot    orange-deep    4.41:1 PASS          4.68:1 PASS

         ink/50 and not /45: 45% lands on 2.95 and 2.99, which is under the
         3.0 a non-text boundary owes and is not worth arguing about for 5%.

         THE DOT CHANGES COLOUR TOO. Brand orange on a light plate is 2.80:1
         and fails, and it is the one part of this that is not text — the live
         indicator carries "this is ticking right now" on its own. orange-deep
         is the same dot at 4.41:1. On dark, plain orange is already clear. */
      className={`hidden shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-sans text-[0.82rem] backdrop-blur-sm transition-colors duration-300 min-[1280px]:inline-flex ${
        onDark
          ? "border-cream/15 bg-cream/[0.06] text-cream/70"
          : "border-ink/50 bg-ink/[0.05] text-ink-soft"
      }`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${
            onDark ? "bg-orange" : "bg-orange-deep"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            onDark ? "bg-orange" : "bg-orange-deep"
          }`}
        />
      </span>
      <span className="tabular-nums">
        <strong className={`font-semibold ${onDark ? "text-cream" : "text-ink"}`}>
          {cups.toLocaleString("en-IN")}+
        </strong>{" "}
        cups this day
      </span>
    </p>
  );
}

export default function Header() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("hero");

  /* The hero is a carousel: slide one is near-black, the other two are cream.
     While the bar is transparent it is floating over whichever of those is
     showing, so "not stuck" is no longer enough to know that light chrome is
     safe — cream links on a cream slide are invisible. `onDark` is the real
     condition, and every light-chrome decision below hangs off it. */
  const [tone, setTone] = useState<HeroTone>(currentHeroTone);
  useEffect(() => subscribeHeroTone(setTone), []);
  /* THE HEADER IS NOT ALWAYS ON THE HOME PAGE, AND IT WAS ASSUMING IT WAS.
     Every light-chrome decision hung off `!stuck && tone === "dark"`, and both
     halves of that quietly break on /blog and /case-studies.

     `stuck` is measured against #hero's height, and those pages have no
     #hero — so `edge` fell back to 24 and at the top of the page `stuck` was
     false. `tone` is module state in lib/heroTone that survives a client-side
     navigation, so arriving from slide one it was still "dark". Both true at
     once means the bar painted its dark scrim and its white lockup over a
     cream page: a grey band across the top with white links in it.

     `hasHero` is the missing term. It is re-measured on every pathname change
     because the Header lives in the layout and does NOT unmount when the
     route changes — an effect with [] deps would have kept the home page's
     answer forever. */
  const pathname = usePathname();
  const onHome = pathname === "/";
  /* SEEDED FROM THE ROUTE, NOT FROM `true`. usePathname resolves during the
     server render too, so the first paint of /blog is already the solid bar
     — seeding it optimistically would have server-rendered the transparent
     header and the dark scrim, then corrected both on mount, which is a flash
     on exactly the page this was meant to fix. The effect below still checks
     the DOM: the route is the guess, #hero is the answer. */
  const [hasHero, setHasHero] = useState(onHome);

  const onDark = hasHero && !stuck && tone === "dark";
  /* with no hero to float over there is nothing to be transparent FOR, so the
     bar takes its solid ground immediately rather than at 24px of scroll */
  const solid = stuck || !hasHero;

  /* The header stays transparent for the whole of the hero, not the first
     24px of it — a cream bar sliding over a full-bleed photograph after one
     scroll notch reads as a glitch. Past the hero it goes solid.

     The threshold is cached and recomputed on resize; reading offsetHeight
     inside the scroll handler would force a reflow on every frame. */
  useEffect(() => {
    let edge = 24;
    const measure = () => {
      const hero = document.getElementById("hero");
      setHasHero(Boolean(hero));
      edge = hero ? Math.max(24, hero.offsetHeight - 96) : 24;
    };
    const onScroll = () => setStuck(window.scrollY > edge);
    /* NAMED, so it can actually be removed. It was an inline arrow and the
       cleanup only ever detached the scroll listener — survivable while this
       effect ran once, a leak of one listener per navigation now that it
       re-runs on every route change. */
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname]);

  /* scroll spy — the nav tells you where you are, so the page never
     feels like an undifferentiated column */
  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* THE HASH IS CLEARED WHEN YOU GET BACK TO THE TOP.
     A nav link is a plain href="#menu", so the browser writes the hash and
     then leaves it there for good — scroll all the way back to the hero and
     the address bar still reads /#menu. It is stale the moment you leave the
     section, and on a reload it silently throws the visitor back down the
     page they had just scrolled up from.

     replaceState, NOT pushState: the click that set the hash already made a
     history entry, and adding a second one would mean Back took two presses
     to leave the page. This rewrites the entry that is already there.

     ONLY AT THE HERO, and that is a decision rather than laziness. The
     obvious alternative is to keep the hash on the section you are looking
     at, but scroll-behavior is smooth (globals.css) — one click on Contact
     scrolls THROUGH every section between, and the spy fires for each, so the
     URL would rewrite eight times per click and land somewhere different if
     you interrupted it. Clearing at one known point cannot do that.

     pathname and search survive, so a ?utm_source= is not thrown away. */
  useEffect(() => {
    if (!onHome || active !== "hero" || !window.location.hash) return;
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, [active, onHome]);

  /* lock the page behind the mobile drawer */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        solid
          ? "bg-cream/85 shadow-[0_1px_0_rgba(240,226,214,1)] backdrop-blur-md"
          : "bg-transparent"
      }`}
      style={{ height: "var(--header-h)" }}
    >
      {/* A floor under the nav for as long as it is over the hero. The bar was
          fully transparent there, so every label sat directly on whatever the
          photograph happened to be doing behind it — legible on most frames,
          which is another way of saying unreliable. It fades out as the solid
          cream bar arrives, so the two never stack. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[140%] transition-opacity duration-500"
        style={{
          opacity: onDark ? 1 : 0,
          background:
            "linear-gradient(to bottom, rgba(18,5,2,0.62) 0%, rgba(18,5,2,0.34) 55%, rgba(18,5,2,0) 100%)",
        }}
      />

      {/* A GRID AT lg, FLEX BELOW IT.
          With three flex children, justify-between only centres the middle
          one when the outer two are the same width — and they never are: the
          logo is 155px, the CTA group 117px, so the nav sat 19px left of the
          bar's centre. 1fr / auto / 1fr gives the nav a column of its own
          width with equal columns either side, so it is centred on the
          container whatever the sides do. The 1fr columns floor at their
          content width, so at a squeeze the nav slides rather than the logo
          getting crushed.

          THE GRID CANNOT APPLY BELOW lg, AND THAT IS NOT A PREFERENCE.
          The nav is `hidden lg:flex`, and a grid item with display:none is
          not laid out at all — it does not hold its cell, it leaves the item
          list. So on a phone the grid had two items, not three: the logo took
          column 1 and the ACTIONS took column 2 (auto), leaving column 2's
          1fr sibling empty on the right. At 375px that put the burger at
          x=156 of 335 — a third of the way across, which is exactly where it
          was showing up. justify-self-end could not save it, because it only
          aligns within a column and the column itself was in the wrong place.
          Two children want flex; three want the grid. */}
      <div className="shell-wide relative flex h-full items-center justify-between gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Logo light={onDark} />

        {/* desktop nav */}
        <nav
          className="hidden shrink-0 items-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Sections"
        >
          {NAV.map((item) => {
            /* NAV_FOR, not a bare id compare. The spy reports whichever
               section is under the middle of the window, and four of them are
               not in the nav — so a bare compare left the bar with nothing
               underlined for the whole of the pantry, the calculator, the case
               studies and the contact block. NAV_FOR maps each of those to the
               nav item above it. */
            /* AN ITEM WITH A PAGE IS LIT TWO WAYS, AND IT NEEDS BOTH.
               "The Service" points at /service now, so it has to underline
               while a reader is ON that page — the spy cannot help there,
               because the page has no #service in it and hasHero is false.

               But the section is also still on the home page, and dropping
               the spy test would leave the bar dark for the whole of it while
               scrolling past. Either condition lights the item: the route when
               you are on it, the spy when you are looking at the section it
               summarises. */
            const routeHref = NAV_HREF[item.id];
            const on =
              (hasHero && NAV_FOR[active] === item.id) ||
              (routeHref !== undefined && pathname === routeHref);
            return (
              <a
                key={item.id}
                /* A bare #hash only resolves on the page that owns the
                   section. From /blog every one of these pointed at an id
                   that is not in the document, so the whole nav was inert.
                   Off home they become real navigations back to it. A route
                   href overrides both — it is not a place in a document. */
                href={routeHref ?? (onHome ? `#${item.id}` : `/#${item.id}`)}
                aria-current={on ? "true" : undefined}
                className={`relative whitespace-nowrap rounded-full px-2 py-2 font-sans text-[0.85rem] font-medium transition-colors duration-300 min-[1440px]:px-4 min-[1440px]:text-[1.05rem] ${
                  onDark
                    ? "text-cream/75 hover:bg-cream/12 hover:text-cream"
                    : "text-ink-soft hover:bg-ink/[0.055] hover:text-ink"
                }`}
              >
                <span
                  className={
                    on
                      ? onDark
                        ? "font-semibold text-cream"
                        : "font-semibold text-espresso"
                      : undefined
                  }
                >
                  {item.label}
                </span>
                {on && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 bottom-[3px] h-[2px] rounded-full bg-orange min-[1440px]:inset-x-4"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-self-end gap-3">
          <CupsDock onDark={onDark} />

          <a
            href={onHome ? "#pricing" : "/#pricing"}
            /* Solid amber in both states. It used to be a ghost outline over
               the hero and espresso once stuck, so the site's single most
               important button was the quietest thing in the bar on the one
               screen everybody sees, and then changed identity on scroll.
               This is the hero button and section 05's button. */
            className="hero-btn-dark group relative hidden shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-orange px-5 py-2.5 font-sans text-[0.82rem] font-semibold text-white shadow-[0_10px_26px_-12px_rgba(242,101,34,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 sm:inline-flex"
          >
            <span className="relative z-10">Get pricing</span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`grid h-11 w-11 place-items-center rounded-full border transition-colors duration-300 lg:hidden ${
              onDark
                ? "border-cream/40 text-cream hover:bg-cream/12"
                : "border-line text-ink hover:bg-ink/5"
            }`}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 block h-[2px] w-full rounded bg-current transition-transform duration-300 ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 block h-[2px] w-full rounded bg-current transition-transform duration-300 ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="Sections"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full border-t border-line bg-cream lg:hidden"
          >
            <ul className="shell flex flex-col py-3">
              {NAV.map((item) => {
                /* the same two-way test as the desktop bar above */
                const routeHref = NAV_HREF[item.id];
                const on =
                  NAV_FOR[active] === item.id ||
                  (routeHref !== undefined && pathname === routeHref);
                return (
                  <li key={item.id}>
                    <a
                      href={routeHref ?? (onHome ? `#${item.id}` : `/#${item.id}`)}
                      onClick={() => setOpen(false)}
                      className={`block border-b border-line/70 py-3.5 font-display text-lg font-semibold ${
                        on ? "text-orange" : "text-ink"
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
              <li>
                <a
                  href={onHome ? "#pricing" : "/#pricing"}
                  onClick={() => setOpen(false)}
                  className="hero-btn-dark relative mt-4 block overflow-hidden rounded-full bg-orange py-3.5 text-center font-sans text-sm font-semibold text-white"
                >
                  Get pricing
                </a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
