"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAIL_HREF, PHONE_LABEL, TEL_HREF, WA_HREF } from "@/lib/contact";

/**
 * /service, animated.
 *
 * TWO ENGINES, AND THE SPLIT IS NOT ARBITRARY.
 *
 * `motion/react` IS Framer Motion — v13 of the package it became — and it is
 * what all 24 home-page components already animate with. Every entrance here
 * is therefore motion, using the same vocabulary those sections use: the
 * [0.16, 1, 0.3, 1] ease, `useInView` at 20%, the clip-reveal built out of an
 * overflow-hidden span with pb/-mb trimming the descender clip. A visitor
 * moving from the home page to this one should not be able to feel that a
 * different library took over.
 *
 * GSAP DOES ONLY WHAT IT IS BETTER AT: scroll-SCRUBBED motion, where the
 * animation's playhead is the scroll position rather than a clock.
 * ScrollTrigger with `scrub` does that in one declaration; motion can be made
 * to via useScroll and useTransform, but the two effects here — a parallax
 * bound to a section's own travel, and a line whose progress IS the reader's
 * progress — are the shape ScrollTrigger was built for.
 *
 * So: motion owns time-based entrances, GSAP owns scroll-bound continuous
 * motion. Nothing is animated by both, which is the rule that keeps them from
 * fighting over the same transform. Where GSAP writes to an element, motion
 * does not, and vice versa.
 *
 * REDUCED MOTION IS HONOURED IN BOTH, SEPARATELY.
 * They do not share a preference check. motion has `useReducedMotion`, which
 * every section on this site already branches on. GSAP has `matchMedia`, and
 * registering the tweens INSIDE a `no-preference` block is what makes the
 * difference — a tween created and then disabled still leaves its transform
 * on the element. Under reduced motion GSAP never creates a ScrollTrigger at
 * all, and `mm.revert()` on unmount removes everything it did.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM page.tsx
 * A `"use client"` module cannot export `metadata` — Next collects that on the
 * server. The route keeps a server component for the metadata and renders this
 * for the body. That is also why the page is no longer zero-JS: it was a
 * deliberate trade recorded in page.tsx, and animating it reverses it.
 *
 * !!  THE CONTENT RULE STILL HOLDS: NOTHING HERE IS A NEW CLAIM.  !!
 * The provenance table is in page.tsx, where it stays authoritative. Adding
 * motion changed no copy.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    n: "01",
    title: "Tell us your headcount",
    body: "Share your team size and what your people prefer. We’ll take care of the rest.",
    img: "/img/step-1.webp",
  },
  {
    n: "02",
    title: "We deliver to your pantry",
    body: "Freshly prepared flasks, ready for your team to enjoy.",
    img: "/img/step-2.webp",
  },
  {
    n: "03",
    title: "We collect and refill",
    body: "Empty flasks go back with us. No washing, no storage, no pantry staff.",
    img: "/img/step-3.webp",
  },
];

const DRINKS = [
  { name: "Tea", count: "8 blends", img: "/img/menu-tea.webp", alt: "A glass of masala chai with loose tea leaves" },
  { name: "Coffee", count: "6 roasts", img: "/img/menu-coffee.webp", alt: "South Indian filter coffee in a brass tumbler and davara" },
  { name: "Milk", count: "5 options", img: "/img/menu-badam.webp", alt: "Badam milk in a glass tumbler, topped with saffron, pistachio and almond flakes" },
  { name: "Seasonal", count: "2 specials", img: "/img/menu-buttermilk.webp", alt: "Masala buttermilk with coriander, cumin and a slice of cucumber" },
];

const PANTRY = [
  "Customised Snacks",
  "Hot & Fresh",
  "Healthy Choices",
  "Team Favourites",
  "Beverages for Every Break",
];

const WORKPLACES = [
  { name: "IT & offices", src: "/img/wp-office.webp" },
  { name: "Manufacturing", src: "/img/wp-factory.webp" },
  { name: "Hospitals", src: "/img/wp-hospital.webp" },
  { name: "Colleges & schools", src: "/img/wp-college.webp" },
  { name: "Retail shops", src: "/img/wp-retail.webp" },
  { name: "Showrooms & banks", src: "/img/wp-other.webp" },
];

const BANDS = [
  { range: "Under 100", unit: "cups a day" },
  { range: "100 – 200", unit: "cups a day" },
  { range: "200 – 500", unit: "cups a day" },
];

/* ---------------------------------------------------------------
   One in-view hook per section rather than one for the page.

   A single trigger at the top would fire every section's entrance while five
   of them are still below the fold, and by the time a reader reached the
   workplace grid it would have finished animating without them. `once` is on
   because a section that re-animates every time it re-enters reads as a page
   that has lost its place.
   --------------------------------------------------------------- */
function useSectionIn() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.2, once: true });
  const reduced = useReducedMotion();
  return { ref, on: inView || Boolean(reduced), reduced: Boolean(reduced) };
}

function useReveal(on: boolean, reduced: boolean) {
  return (delay: number, y = 16) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.7, delay, ease: EASE },
        };
}

export default function ServiceView() {
  const hero = useSectionIn();
  const how = useSectionIn();
  const pour = useSectionIn();
  const pantry = useSectionIn();
  const who = useSectionIn();
  const scale = useSectionIn();
  const ask = useSectionIn();

  const rHero = useReveal(hero.on, hero.reduced);
  const rHow = useReveal(how.on, how.reduced);
  const rPour = useReveal(pour.on, pour.reduced);
  const rPantry = useReveal(pantry.on, pantry.reduced);
  const rWho = useReveal(who.on, who.reduced);
  const rScale = useReveal(scale.on, scale.reduced);
  const rAsk = useReveal(ask.on, ask.reduced);

  /* the two elements GSAP owns, and nothing else writes to */
  const flaskRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    /* Registered here rather than at module scope. A "use client" module is
       still evaluated on the server for the first HTML, and ScrollTrigger
       reaches for window when it installs. Inside an effect it only ever runs
       in a browser. Re-registering is a no-op, so the effect is safe. */
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();

    /* EVERYTHING GSAP DOES LIVES INSIDE THIS BLOCK.
       Under `prefers-reduced-motion: reduce` the callback never runs, so no
       tween is created and no transform is ever written — which is the point.
       Creating a tween and then pausing it still leaves the element at frame
       zero, and frame zero of a parallax is "shifted". */
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- 1. the flask drifts against the hero ----
         yPercent, not y: the shift then scales with the image instead of
         being a fixed 40px that reads as a lot on a phone and nothing on a
         desktop. Small on purpose — parallax that announces itself turns a
         product shot into a carousel. */
      if (flaskRef.current) {
        gsap.fromTo(
          flaskRef.current,
          { yPercent: -4 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: flaskRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      }

      /* ---- 2. the step track draws with the reader ----
         This is the one thing on the page that is genuinely SCRUBBED: the
         line's progress is the reader's progress through the three steps, so
         scrolling back up un-draws it. Section 01 does the same drawing on a
         clock and with a rider; here the reader is the rider.

         transform-origin left and scaleX rather than width, so it composites
         instead of triggering layout on every scroll frame. */
      if (trackRef.current && stepsRef.current) {
        gsap.fromTo(
          trackRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            /* THE RANGE IS WIDE BECAUSE THE TRIGGER IS SHORT.
               Measured, this container is 208px tall against an 889px
               viewport — it is three cards, not a section. The first pass ran
               `top 78%` to `bottom 65%`, which is 323px of scroll: the line
               went 0 to 1 inside a third of a screen and then sat finished
               for the rest of the section. That is a transition dressed as a
               scrub, and it defeats the only reason to reach for ScrollTrigger
               here — the line's progress is supposed to BE the reader's.

               85% to 40% stretches the same 208px element over about 610px of
               scroll, roughly two-thirds of a viewport, so the line is still
               drawing while all three cards are being read. */
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 85%",
              end: "bottom 40%",
              scrub: 0.6,
            },
          },
        );
      }
    });

    /* kills every ScrollTrigger and reverts every transform this component
       created — without it, a client-side navigation away leaves triggers
       measuring an element that has left the document */
    return () => mm.revert();
  }, []);

  return (
    <>
      {/* ═══════════════ the argument ═══════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-x-clip bg-cream"
        style={{
          paddingTop: "calc(var(--header-h) + clamp(2rem, 6vh, 4.5rem))",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
        }}
      >
        <div className="shell">
          <div className="grid items-center gap-y-10 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-7">
              <motion.div
                initial={hero.reduced ? undefined : { opacity: 0, x: -14 }}
                animate={
                  hero.reduced
                    ? undefined
                    : hero.on
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -14 }
                }
                transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
                className="flex items-center gap-4"
              >
                <span className="eyebrow whitespace-nowrap">
                  <span className="text-orange-deep">01</span> — The service
                </span>
                <motion.span
                  aria-hidden="true"
                  initial={hero.reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: hero.on ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
                  className="h-px w-16 origin-left bg-line md:w-24"
                />
              </motion.div>

              {/* THE CLIP-REVEAL, BUILT THE WAY THE HOME SECTIONS BUILD IT.
                  Each line is its own overflow-hidden block with pb-[0.14em]
                  and a matching -mb, because without that pair the mask cuts
                  the descenders of the line it is revealing. */}
              <h1 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
                {[
                  { text: "Freshly filled flasks,", accent: false },
                  { text: "delivered to your pantry.", accent: false },
                  { text: "We collect the empties and refill.", accent: true },
                ].map((line, i) => (
                  <span
                    key={line.text}
                    className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
                  >
                    <motion.span
                      initial={hero.reduced ? false : { y: "112%" }}
                      animate={{ y: hero.on ? "0%" : "112%" }}
                      transition={{
                        duration: 0.9,
                        delay: 0.15 + i * 0.09,
                        ease: EASE,
                      }}
                      className={`block ${line.accent ? "text-orange-dark" : ""}`}
                    >
                      {line.text}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                {...rHero(0.45)}
                className="mt-6 max-w-[46ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-ink-soft"
              >
                {/* the same sentence section 01 carries — see the note there.
                    If one changes, both do, or the home page and this page
                    describe the service differently. */}
                We bring the filled flasks and take the empties away. No
                machine to install, nothing to wash, and no pantry staff to
                manage.
              </motion.p>

              <motion.div
                {...rHero(0.6)}
                className="mt-9 flex flex-wrap items-center gap-4"
              >
                <Link
                  href="/#pricing"
                  className="hero-btn-dark group relative inline-flex h-[3.25rem] items-center gap-2 overflow-hidden rounded-full bg-orange px-7 font-sans text-[0.95rem] font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Get pricing</span>
                  <span
                    aria-hidden="true"
                    className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </Link>

                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[0.95rem] font-semibold text-espresso underline decoration-orange decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-deep"
                >
                  Or message us on WhatsApp
                </a>
              </motion.div>
            </div>

            <div className="lg:col-span-5">
              {/* GSAP OWNS THIS WRAPPER'S TRANSFORM — see the effect. motion
                  animates the INNER element's clip-path instead, so the two
                  never write the same property on the same node. */}
              <div ref={flaskRef} className="relative mx-auto w-[70%] max-w-[320px] lg:mr-0 lg:w-full">
                <motion.span
                  aria-hidden="true"
                  initial={hero.reduced ? undefined : { scale: 0.82, opacity: 0 }}
                  animate={
                    hero.reduced
                      ? undefined
                      : hero.on
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.82, opacity: 0 }
                  }
                  transition={{ duration: 1, delay: 0.3, ease: EASE }}
                  className="absolute left-1/2 top-[6%] aspect-square w-[74%] -translate-x-1/2 rounded-full bg-cream-deep"
                />
                <motion.div
                  initial={
                    hero.reduced ? undefined : { clipPath: "inset(100% 0% 0% 0%)" }
                  }
                  animate={
                    hero.reduced
                      ? undefined
                      : hero.on
                        ? { clipPath: "inset(0% 0% 0% 0%)" }
                        : { clipPath: "inset(100% 0% 0% 0%)" }
                  }
                  transition={{ duration: 1.1, delay: 0.4, ease: EASE }}
                  className="relative"
                >
                  <Image
                    src="/img/flask-person.webp"
                    alt="A Hotcups delivery partner in uniform holding a sealed steel flask"
                    width={760}
                    height={1261}
                    sizes="(max-width: 1024px) 66vw, 320px"
                    priority
                    className="h-auto w-full"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ how it runs ═══════════════ */}
      <section ref={how.ref} className="section-y bg-white">
        <div className="shell">
          <motion.span {...rHow(0.05, 0)} className="eyebrow block">
            How it runs
          </motion.span>
          <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={how.reduced ? false : { y: "112%" }}
                animate={{ y: how.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Three steps, and one of them is yours.
              </motion.span>
            </span>
          </h2>

          <div ref={stepsRef} className="relative mt-12">
            {/* THE TRACK. Desktop only — on a phone the three cards stack, so
                a horizontal line would run behind nothing. GSAP scrubs its
                scaleX; see the effect. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-[38px] hidden md:block"
            >
              <span className="block h-[2px] w-full bg-orange/15" />
              {/* IT DEFAULTS TO DRAWN, NOT TO EMPTY, AND THAT IS THE
                  REDUCED-MOTION CASE.
                  This carried an inline scaleX(0) so the line started empty.
                  Correct with motion on — and wrong with it off: GSAP never
                  creates the tween under `reduce`, so nothing ever set it back
                  to 1 and those readers got a rail that stayed permanently
                  empty. An unfilled progress bar does not read as "no
                  animation", it reads as broken.

                  Undrawn is now the ANIMATED state rather than the default:
                  with motion on, ScrollTrigger's fromTo sets scaleX to the
                  scroll position's progress the instant it is created, which
                  is 0 while the steps are still below the fold — so nothing
                  flashes. With motion off the line is simply already there,
                  which is what a static version of this should be. */}
              <span
                ref={trackRef}
                className="absolute inset-0 block h-[2px] w-full origin-left bg-orange"
              />
            </div>

            <ol className="relative grid gap-10 md:grid-cols-3 md:gap-x-10">
              {STEPS.map((s, i) => (
                <motion.li key={s.n} {...rHow(0.25 + i * 0.14, 20)}>
                  <div className="flex items-center gap-4 md:gap-5">
                    {/* bg-white IS THE MASK, NOT DECORATION.
                        The track runs behind this row at the numerals' own
                        height, and these are outlined glyphs with a
                        transparent fill — so the line showed straight through
                        the counter of every 0 and read as a strike-through.
                        The icon beside it already punches a hole in the line
                        the same way. On a white section the box is invisible;
                        all it does is break the rail at each station, which
                        is what section 01's route does with dots. */}
                    <span
                      className="block bg-white px-1 font-display text-[2.6rem] font-extrabold leading-none md:text-[3.25rem]"
                      style={{
                        color: "transparent",
                        WebkitTextStroke: "1.5px var(--color-orange)",
                      }}
                    >
                      {s.n}
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative block h-[clamp(58px,6.5vw,86px)] w-[clamp(58px,6.5vw,86px)] shrink-0 bg-white"
                      style={{
                        filter: "drop-shadow(0 5px 14px rgba(58,20,14,0.09))",
                      }}
                    >
                      <Image src={s.img} alt="" fill sizes="90px" className="object-contain" />
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-[1.4rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-[1.55rem]">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-[32ch] font-sans text-[1.0625rem] leading-[1.65] text-ink-soft">
                    {s.body}
                  </p>
                </motion.li>
              ))}
            </ol>
          </div>

          <motion.dl
            {...rHow(0.75)}
            /* sm:grid-cols-2 IS GONE WITH THE SECOND ROW. One cell in a
               two-column grid is a half-width card with a hole beside it;
               a single column makes it the full width of the stack, which is
               what the row stacks elsewhere on this page already do. */
            className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line"
          >
            {/* PANTRY STAFF / None has gone — the hero paragraph on this page
                ends "and no pantry staff to manage", so it was the same claim
                twice. See the fuller note in Service.tsx. */}
            {[["Delivered", "To your pantry"]].map(([k, v]) => (
              <div key={k} className="bg-white px-6 py-5">
                <dt className="font-sans text-[0.8rem] font-medium uppercase tracking-[0.1em] text-mute">
                  {k}
                </dt>
                <dd className="mt-1.5 font-display text-[1.35rem] font-extrabold text-espresso">
                  {v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </section>

      {/* ═══════════════ what goes in the flasks ═══════════════ */}
      <section ref={pour.ref} className="section-y bg-espresso-deep">
        <div className="shell">
          <motion.span {...rPour(0.05, 0)} className="eyebrow block text-cream/55">
            What we pour
          </motion.span>
          <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-cream">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={pour.reduced ? false : { y: "112%" }}
                animate={{ y: pour.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Everyone drinks something different.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={pour.reduced ? false : { y: "112%" }}
                animate={{ y: pour.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.21, ease: EASE }}
                className="block text-orange"
              >
                We pour all of it.
              </motion.span>
            </span>
          </h2>
          <motion.p
            {...rPour(0.4)}
            className="mt-5 max-w-[46ch] font-sans text-[1.05rem] leading-[1.6] text-cream/70"
          >
            Tea, filter coffee, badam milk, buttermilk and more.
          </motion.p>

          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
            {DRINKS.map((d, i) => (
              <motion.li
                key={d.name}
                {...rPour(0.5 + i * 0.1, 24)}
                className="flex flex-col"
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={d.img}
                    alt={d.alt}
                    fill
                    sizes="(max-width: 1024px) 44vw, 22vw"
                    className="object-contain object-bottom"
                  />
                </div>
                <p className="mt-5 text-center font-display text-[1.3rem] font-extrabold tracking-[-0.02em] text-cream">
                  {d.name}
                </p>
                <p className="mt-1 text-center font-sans text-[0.9rem] text-cream/60">
                  {d.count}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ the pantry ═══════════════ */}
      <section ref={pantry.ref} className="section-y bg-cream-deep">
        <div className="shell">
          <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-5">
              <motion.span {...rPantry(0.05, 0)} className="eyebrow block">
                In the pantry
              </motion.span>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span
                    initial={pantry.reduced ? false : { y: "112%" }}
                    animate={{ y: pantry.on ? "0%" : "112%" }}
                    transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                    className="block"
                  >
                    The break doesn’t
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span
                    initial={pantry.reduced ? false : { y: "112%" }}
                    animate={{ y: pantry.on ? "0%" : "112%" }}
                    transition={{ duration: 0.9, delay: 0.21, ease: EASE }}
                    className="block text-orange-dark"
                  >
                    stop at the cup.
                  </motion.span>
                </span>
              </h2>
              <motion.p
                {...rPantry(0.4)}
                className="mt-6 max-w-[36ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
              >
                From a quick snack to a customised spread, give your team
                something more to look forward to. Drinks and bites, customised
                for your team.
              </motion.p>
            </div>

            <div className="lg:col-span-7">
              <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
                {PANTRY.map((p, i) => (
                  <motion.li
                    key={p}
                    {...rPantry(0.35 + i * 0.08, 12)}
                    className="flex items-center gap-4 bg-cream px-6 py-5 font-display text-[1.15rem] font-bold tracking-[-0.015em] text-ink md:text-[1.3rem]"
                  >
                    <motion.span
                      aria-hidden="true"
                      initial={pantry.reduced ? false : { scale: 0 }}
                      animate={{ scale: pantry.on ? 1 : 0 }}
                      transition={{
                        duration: 0.45,
                        delay: 0.45 + i * 0.08,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      className="h-2 w-2 shrink-0 rounded-full bg-orange-dark"
                    />
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ who it is for ═══════════════ */}
      <section ref={who.ref} className="section-y bg-white">
        <div className="shell">
          <motion.span {...rWho(0.05, 0)} className="eyebrow block">
            Who we serve
          </motion.span>
          <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={who.reduced ? false : { y: "112%" }}
                animate={{ y: who.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Bringing Better Food
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={who.reduced ? false : { y: "112%" }}
                animate={{ y: who.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.21, ease: EASE }}
                className="block text-orange-dark"
              >
                Experiences to Your Team.
              </motion.span>
            </span>
          </h2>
          <motion.p
            {...rWho(0.4)}
            className="mt-5 max-w-[50ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
          >
            <strong className="font-semibold tabular-nums text-ink">500+</strong>{" "}
            organizations already on it. Offices, factories, hospitals, colleges
            and shops across Tamil Nadu.
          </motion.p>

          <ul className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 lg:gap-6">
            {WORKPLACES.map((w, i) => (
              <motion.li
                key={w.name}
                {...rWho(0.45 + i * 0.07, 22)}
                className="overflow-hidden rounded-[var(--radius-media)] border border-line bg-cream"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {/* the image itself leans in on hover. A transform on the
                      picture inside a clipped box, so nothing outside moves. */}
                  <Image
                    src={w.src}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 45vw, 30vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.05]"
                  />
                </div>
                <p className="px-5 py-4 font-display text-[1.05rem] font-bold tracking-[-0.015em] text-ink md:text-[1.2rem]">
                  {w.name}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ when a machine is the answer ═══════════════ */}
      <section ref={scale.ref} className="section-y bg-cream">
        <div className="shell">
          <motion.span {...rScale(0.05, 0)} className="eyebrow block">
            Flasks or a machine
          </motion.span>
          <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={scale.reduced ? false : { y: "112%" }}
                animate={{ y: scale.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Above 50 cups a day,
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={scale.reduced ? false : { y: "112%" }}
                animate={{ y: scale.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.21, ease: EASE }}
                className="block text-orange-dark"
              >
                a machine is the better fit.
              </motion.span>
            </span>
          </h2>
          <motion.p
            {...rScale(0.4)}
            className="mt-5 max-w-[46ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
          >
            Three sizes, from counter-top to half a desk — each built for a
            different workplace. Rent or buy.
          </motion.p>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {BANDS.map((b, i) => (
              <motion.li
                key={b.range}
                {...rScale(0.5 + i * 0.11, 20)}
                className="rounded-[var(--radius-card)] border border-line bg-white px-6 py-7 text-center"
                style={{ boxShadow: "var(--shadow-1)" }}
              >
                <p className="font-display text-[1.7rem] font-extrabold tracking-[-0.02em] text-orange-dark md:text-[2rem]">
                  {b.range}
                </p>
                <p className="mt-1 font-sans text-[0.9rem] text-mute">{b.unit}</p>
              </motion.li>
            ))}
          </ul>

          <motion.p
            {...rScale(0.85)}
            className="mt-8 max-w-[52ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
          >
            Custom machines are designed around your workspace — size,
            branding, drinks, payment, timings. Tell us the constraint and we
            design around it.
          </motion.p>

          <motion.div {...rScale(0.95)}>
            <Link
              href="/machines"
              className="mt-7 inline-flex items-center gap-2 font-sans text-[0.95rem] font-semibold text-orange-deep underline decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark"
            >
              See the machines
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ the ask ═══════════════ */}
      <section ref={ask.ref} className="section-y bg-espresso">
        <div className="shell text-center">
          <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-cream">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
                className="block"
              >
                Tell us your team size.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.19, ease: EASE }}
                className="block text-orange"
              >
                We’ll do the rest.
              </motion.span>
            </span>
          </h2>

          <motion.div
            {...rAsk(0.4)}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/#pricing"
              className="hero-btn-dark group relative inline-flex h-[3.25rem] items-center gap-2 overflow-hidden rounded-full bg-orange px-7 font-sans text-[0.95rem] font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
            >
              <span className="relative z-10">Get pricing</span>
              <span
                aria-hidden="true"
                className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
              >
                &rarr;
              </span>
            </Link>

            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[3.25rem] items-center rounded-full border border-cream/25 px-7 font-sans text-[0.95rem] font-semibold text-cream transition-colors duration-300 hover:border-cream/60"
            >
              WhatsApp
            </a>

            <a
              href={MAIL_HREF}
              className="inline-flex h-[3.25rem] items-center rounded-full border border-cream/25 px-7 font-sans text-[0.95rem] font-semibold text-cream transition-colors duration-300 hover:border-cream/60"
            >
              Email us
            </a>
          </motion.div>

          <motion.p {...rAsk(0.55)} className="mt-7 font-sans text-[0.95rem] text-cream/60">
            Or call{" "}
            <a
              href={TEL_HREF}
              className="font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4"
            >
              {PHONE_LABEL}
            </a>
          </motion.p>
        </div>
      </section>
    </>
  );
}
