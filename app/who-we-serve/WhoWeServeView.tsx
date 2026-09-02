"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mailHref, PHONE_LABEL, TEL_HREF, waHref, WA_HREF } from "@/lib/contact";
import { WORKPLACE_ASK, WORKPLACE_FOR, type WorkplaceKey } from "@/lib/workplace";

/**
 * /who-we-serve, animated. Same two-engine split as ServiceView and MenuView:
 * motion owns time-based entrances, GSAP owns scroll-BOUND continuous motion,
 * nothing is animated by both.
 *
 * WHAT GSAP DOES HERE
 *
 *   1. THE SIX PHOTOGRAPHS DRIFT INSIDE THEIR OWN FRAMES. Each card clips an
 *      image that is taller than the frame, and the image travels against the
 *      card as the card travels up the screen. This is the one effect a grid
 *      of photographs actually wants: it gives six flat rectangles a sense of
 *      depth without moving the layout by a pixel — the frames never move, so
 *      nothing reflows and no text shifts under the reader.
 *
 *      The overflow-hidden frame is what makes it safe. The inner wrapper is
 *      inset -9% top and bottom, so it has 9% of headroom in each direction
 *      and a ±4% travel can never expose an edge.
 *
 *   2. THE PROOF CARD LAGS THE HEADLINE. The Coimbatore figure is the one
 *      confirmed number on the page, and letting it trail the copy above it by
 *      a few percent separates it from the paragraph rather than leaving it
 *      reading as a fourth line of the same block.
 *
 * Both are scrubbed and both reverse. Neither is expressible as an entrance,
 * which is the test for whether GSAP has earned its place on a page.
 *
 * THE COUNT-UP IS NOT GSAP AND NOT A SCRUB.
 * It is a clock-driven entrance, so it belongs to the entrance half — and it
 * follows the pattern Industries.tsx already documents: the figure is 500 in
 * the SERVER HTML, not 0. Driving it from zero would mean the markup shipped
 * with a claim of "0+ organizations" for anyone without JS, and would hand a
 * crawler the wrong number. It renders 500, drops to 0 for one frame once the
 * section is in view, and climbs back. Under reduced motion it never moves.
 *
 * REDUCED MOTION: every GSAP tween is created INSIDE a
 * `(prefers-reduced-motion: no-preference)` matchMedia block, so under `reduce`
 * none is constructed and no transform is written. motion branches separately
 * on useReducedMotion, and the counter simply stays at 500.
 *
 * The content rule and its provenance — including why five of section 04's six
 * fact lines are NOT here — live in page.tsx. Animating this changed no copy.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const PLACES: { key: WorkplaceKey; name: string; src: string }[] = [
  { key: "office", name: "IT & offices", src: "/img/wp-office.webp" },
  { key: "factory", name: "Manufacturing", src: "/img/wp-factory.webp" },
  { key: "hospital", name: "Hospitals", src: "/img/wp-hospital.webp" },
  { key: "college", name: "Colleges & schools", src: "/img/wp-college.webp" },
  { key: "retail", name: "Retail shops", src: "/img/wp-retail.webp" },
  /* the stand-in photograph — see page.tsx */
  { key: "showroom", name: "Showrooms & banks", src: "/img/wp-other.webp" },
];

const BANDS = ["Under 100", "100 – 200", "200 – 500"];

const COLUMNS = [
  {
    head: "Freshly filled flasks",
    body: "Delivered to your pantry. We collect the empties and refill — nothing to install, nothing to clean.",
    href: "/service",
    cta: "How the service works",
  },
  {
    head: "Tea, coffee, milk, seasonal",
    body: "Everyone drinks something different. The pantry rides along on the same delivery.",
    href: "/menu",
    cta: "See the menu",
  },
  {
    head: "Or a machine on site",
    body: "Above 50 cups a day, a machine is the better fit. Three sizes, rent or buy.",
    href: "/machines",
    cta: "See the machines",
  },
];

const ORGS = 500;

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

export default function WhoWeServeView() {
  const hero = useSectionIn();
  const six = useSectionIn();
  const round = useSectionIn();
  const ask = useSectionIn();

  const rHero = useReveal(hero.on, hero.reduced);
  const rSix = useReveal(six.on, six.reduced);
  const rRound = useReveal(round.on, round.reduced);
  const rAsk = useReveal(ask.on, ask.reduced);

  /* 500 on the server and on first paint — see the docblock */
  const [orgs, setOrgs] = useState(ORGS);

  useEffect(() => {
    if (!hero.on || hero.reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const DUR = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / DUR);
      /* the same ease-out cubic Industries.tsx counts on, so the two figures
         on the site climb at the same rate */
      setOrgs(Math.round(ORGS * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hero.on, hero.reduced]);

  /* GSAP's targets */
  const photoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const gridRef = useRef<HTMLUListElement>(null);
  const proofRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- 1. each photograph against its own frame ---- */
      photoRefs.current.forEach((el) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              /* the CARD is the trigger, not the grid: six cards on three rows
                 reach the viewport at different times, and triggering them all
                 off the grid would drive the bottom row from the top row's
                 progress */
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });

      /* ---- 2. the one confirmed figure trails the copy above it ---- */
      if (proofRef.current) {
        gsap.fromTo(
          proofRef.current,
          { yPercent: -2.5 },
          {
            yPercent: 3.5,
            ease: "none",
            scrollTrigger: {
              trigger: proofRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* ═══════════════ the claim ═══════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-x-clip bg-cream"
        style={{
          paddingTop: "calc(var(--header-h) + clamp(2rem, 6vh, 4.5rem))",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
        }}
      >
        <div className="shell">
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
              <span className="text-orange-deep">04</span> — Where the flasks go
            </span>
            <motion.span
              aria-hidden="true"
              initial={hero.reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: hero.on ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
              className="h-px w-16 origin-left bg-line md:w-24"
            />
          </motion.div>

          <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={hero.reduced ? false : { y: "112%" }}
                animate={{ y: hero.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
                className="block"
              >
                Bringing Better Food
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={hero.reduced ? false : { y: "112%" }}
                animate={{ y: hero.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.24, ease: EASE }}
                className="block text-orange-dark"
              >
                Experiences to Your Team.
              </motion.span>
            </span>
          </h1>

          <motion.p
            {...rHero(0.45)}
            className="mt-6 max-w-[52ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-ink-soft"
          >
            <strong className="font-semibold tabular-nums text-ink">
              {orgs}+
            </strong>{" "}
            organizations already on it. Offices, factories, hospitals, colleges
            and shops across Tamil Nadu.
          </motion.p>

          {/* GSAP owns this element's transform; motion animates its opacity
              on a CHILD so the two never write the same property here. */}
          <figure
            ref={proofRef}
            className="mt-10 max-w-[46rem] rounded-[var(--radius-card)] border border-line bg-white px-7 py-7"
          >
            <motion.blockquote
              {...rHero(0.62, 10)}
              className="font-display text-[clamp(1.15rem,2vw,1.6rem)] font-extrabold leading-[1.3] tracking-[-0.02em] text-ink"
            >
              Three-shift factories, including 2,000 cups a day in Coimbatore.
            </motion.blockquote>
          </figure>
        </div>
      </section>

      {/* ═══════════════ the six ═══════════════ */}
      <section ref={six.ref} className="section-y bg-white">
        <div className="shell">
          <motion.span {...rSix(0.05, 0)} className="eyebrow block">
            The six
          </motion.span>
          <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={six.reduced ? false : { y: "112%" }}
                animate={{ y: six.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Six kinds of workplace, one round.
              </motion.span>
            </span>
          </h2>
          <motion.p
            {...rSix(0.35)}
            className="mt-5 max-w-[52ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
          >
            Not on the list? The round goes wherever there are people waiting
            on a hot drink — tell us where you are.
          </motion.p>

          <ul
            ref={gridRef}
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PLACES.map((p, i) => (
              <motion.li
                key={p.key}
                {...rSix(0.45 + i * 0.08, 24)}
                className="flex flex-col overflow-hidden rounded-[var(--radius-media)] border border-line bg-cream"
              >
                {/* THE FRAME NEVER MOVES. It clips, and the wrapper inside it
                    is the thing GSAP travels — so the card's height, and every
                    line of text under it, stays exactly where it was. */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <div
                    ref={(el) => {
                      photoRefs.current[i] = el;
                    }}
                    /* 9% of headroom top and bottom against a ±4% travel */
                    className="absolute inset-x-0 -top-[9%] -bottom-[9%]"
                  >
                    <Image
                      src={p.src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 py-5">
                  <h3 className="font-display text-[1.2rem] font-bold tracking-[-0.015em] text-ink md:text-[1.35rem]">
                    {p.name}
                  </h3>

                  {/* NO CAPTION AND NO FACT — five of section 04's six are
                      invented. See page.tsx. */}

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <a
                      href={mailHref(WORKPLACE_ASK[p.key])}
                      className="font-sans text-[0.9rem] font-semibold text-orange-deep underline decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark"
                    >
                      Get pricing for {WORKPLACE_FOR[p.key]}
                    </a>
                    <a
                      href={waHref(WORKPLACE_ASK[p.key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-[0.9rem] font-semibold text-ink-soft underline decoration-line decoration-2 underline-offset-4 transition-colors duration-300 hover:text-ink"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ what every one of them gets ═══════════════ */}
      <section ref={round.ref} className="section-y bg-cream-deep">
        <div className="shell">
          <motion.span {...rRound(0.05, 0)} className="eyebrow block">
            The same round
          </motion.span>
          <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={round.reduced ? false : { y: "112%" }}
                animate={{ y: round.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
                className="block"
              >
                Whoever you are, it arrives the same way.
              </motion.span>
            </span>
          </h2>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
            {COLUMNS.map((c, i) => (
              <motion.div
                key={c.head}
                {...rRound(0.3 + i * 0.12, 20)}
                className="flex flex-col bg-cream px-7 py-8"
              >
                <h3 className="font-display text-[1.25rem] font-extrabold tracking-[-0.02em] text-ink">
                  {c.head}
                </h3>
                <p className="mt-3 flex-1 font-sans text-[1.02rem] leading-[1.6] text-ink-soft">
                  {c.body}
                </p>
                <Link
                  href={c.href}
                  className="mt-5 inline-flex items-center gap-2 font-sans text-[0.92rem] font-semibold text-orange-deep underline decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark"
                >
                  {c.cta}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <ul className="mt-8 flex flex-wrap gap-3">
            {BANDS.map((b, i) => (
              <motion.li
                key={b}
                initial={round.reduced ? false : { opacity: 0, scale: 0.88 }}
                animate={{
                  opacity: round.on ? 1 : 0,
                  scale: round.on ? 1 : 0.88,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.7 + i * 0.1,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="rounded-full border border-line bg-white px-5 py-2.5 font-display text-[0.95rem] font-extrabold text-orange-dark"
              >
                {b}{" "}
                <span className="font-sans text-[0.85rem] font-medium text-mute">
                  cups a day
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ the ask ═══════════════ */}
      <section ref={ask.ref} className="section-y bg-espresso">
        <div className="shell text-center">
          <h2 className="mx-auto max-w-[22ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-cream">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
                className="block"
              >
                Tell us what kind of place you run.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.19, ease: EASE }}
                className="block text-orange"
              >
                We’ll take it from there.
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
          </motion.div>

          <motion.p
            {...rAsk(0.55)}
            className="mt-7 font-sans text-[0.95rem] text-cream/60"
          >
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
