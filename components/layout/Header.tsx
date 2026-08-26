"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Logo from "./Logo";
import { NAV, SECTIONS } from "@/lib/sections";
import { currentCups, subscribeCups } from "@/lib/cups";
import { currentHeroTone, subscribeHeroTone, type HeroTone } from "@/lib/heroTone";

export default function Header() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("hero");
  /* the hero badge docks here and stays for the rest of the page */
  const [cups, setCups] = useState(currentCups);
  useEffect(() => subscribeCups(setCups), []);

  /* The hero is a carousel: slide one is near-black, the other two are cream.
     While the bar is transparent it is floating over whichever of those is
     showing, so "not stuck" is no longer enough to know that light chrome is
     safe — cream links on a cream slide are invisible. `onDark` is the real
     condition, and every light-chrome decision below hangs off it. */
  const [tone, setTone] = useState<HeroTone>(currentHeroTone);
  useEffect(() => subscribeHeroTone(setTone), []);
  const onDark = !stuck && tone === "dark";

  /* The header stays transparent for the whole of the hero, not the first
     24px of it — a cream bar sliding over a full-bleed photograph after one
     scroll notch reads as a glitch. Past the hero it goes solid.

     The threshold is cached and recomputed on resize; reading offsetHeight
     inside the scroll handler would force a reflow on every frame. */
  useEffect(() => {
    let edge = 24;
    const measure = () => {
      const hero = document.getElementById("hero");
      edge = hero ? Math.max(24, hero.offsetHeight - 96) : 24;
    };
    const onScroll = () => setStuck(window.scrollY > edge);
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      onScroll();
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

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
        stuck
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

      {/* A GRID, NOT justify-between.
          With three flex children, justify-between only centres the middle
          one when the outer two are the same width — and they never are: the
          logo is 155px, the CTA group 117px, so the nav sat 19px left of the
          bar's centre, and further off once the docked cup counter appeared
          beside the CTA. 1fr / auto / 1fr gives the nav a column of its own
          width with equal columns either side, so it is centred on the
          container whatever the sides do. The 1fr columns floor at their
          content width, so at a squeeze the nav slides rather than the logo
          getting crushed. */}
      <div className="shell-wide relative grid h-full grid-cols-[1fr_auto_1fr] items-center gap-6">
        <Logo light={onDark} />

        {/* desktop nav */}
        <nav
          className="hidden shrink-0 items-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Sections"
        >
          {NAV.map((item) => {
            const on = active === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={on ? "true" : undefined}
                className={`relative whitespace-nowrap rounded-full px-3 py-2 font-sans text-[0.9rem] font-medium transition-colors duration-300 min-[1440px]:px-4 min-[1440px]:text-[1.05rem] ${
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
          {/* docked counter — same source as the hero badge, so the number
              cannot disagree with itself across the handover */}
          {/* 1600, not 1280. It is 192px wide and it holds that width even
              while faded out, which pushed the centred nav 41px off centre at
              1280 and 27px at 1440 — the whole point of the grid above. Above
              1600 the bar has room for it and the nav is still exact. */}
          <span
            aria-hidden={!stuck}
            className={`hidden items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 font-sans text-[0.72rem] tabular-nums text-ink-soft transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] min-[1600px]:inline-flex ${
              stuck
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-1 opacity-0"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange" />
            </span>
            <strong className="font-semibold text-ink">
              {cups.toLocaleString("en-IN")}+
            </strong>{" "}
            cups this month
          </span>

          <a
            href="#pricing"
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
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-line/70 py-3.5 font-display text-lg font-semibold ${
                      active === item.id ? "text-orange" : "text-ink"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#pricing"
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
