"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAIL_HREF, PHONE_LABEL, TEL_HREF, WA_HREF } from "@/lib/contact";

/**
 * /menu, animated. Same two-engine split as ServiceView, and the same rule:
 * motion owns time-based entrances, GSAP owns scroll-BOUND continuous motion,
 * and nothing is animated by both.
 *
 * WHAT GSAP DOES HERE, AND WHY THESE TWO
 *
 *   1. THE FOUR GLASSES DRIFT AT DIFFERENT RATES. A row of cut-outs on a flat
 *      dark ground is the one place on this site where parallax buys something
 *      real: give each glass its own rate and the row gains a depth order it
 *      cannot get from a single static frame. The rates are small and
 *      deterministic per index, never random — a random rate differs between
 *      renders and there is nothing to hydrate against.
 *
 *   2. THE DOODLE PLATE MOVES SLOWER THAN THE SECTION IT IS BEHIND. It is a
 *      background-image, so this animates backgroundPositionY rather than a
 *      transform: the plate is not an element and has nothing to translate.
 *      That is also why it is the only tween here that cannot composite — a
 *      background-position change repaints. It is one property on one element
 *      over a short range, which is affordable; doing it to a foreground image
 *      would not be.
 *
 * Both are scrubbed, so both reverse when the reader scrolls back. Neither
 * would be better expressed as a motion entrance, which is the test for
 * whether GSAP has earned its place on a page.
 *
 * REDUCED MOTION: as in ServiceView, every GSAP tween is created INSIDE a
 * `(prefers-reduced-motion: no-preference)` matchMedia block, so under `reduce`
 * none is constructed and no transform is written. motion branches separately
 * on useReducedMotion.
 *
 * The content rule and its provenance table live in page.tsx. Animating this
 * changed no copy.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const DRINKS = [
  {
    name: "Tea",
    count: "8 blends",
    img: "/img/menu-tea.webp",
    alt: "A glass of masala chai with loose tea leaves",
  },
  {
    name: "Coffee",
    count: "6 roasts",
    img: "/img/menu-coffee.webp",
    alt: "South Indian filter coffee in a brass tumbler and davara",
  },
  {
    name: "Milk",
    count: "5 options",
    img: "/img/menu-milk.webp",
    alt: "A tall milk beverage with almonds and cardamom",
  },
  {
    name: "Seasonal",
    count: "2 specials",
    img: "/img/menu-sarbath.webp",
    alt: "Rose sarbath over ice with lemon, mint and basil seeds",
  },
];

const PANTRY = [
  {
    name: "Customised Snacks",
    img: "/img/snack-biscuits.webp",
    alt: "A stack of butter biscuits",
  },
  {
    name: "Hot & Fresh",
    img: "/img/snack-vada.webp",
    alt: "Two medhu vadai, freshly fried",
  },
  {
    name: "Healthy Choices",
    img: "/img/snack-chips.webp",
    alt: "A heap of banana chips with curry leaves",
  },
  {
    name: "Team Favourites",
    img: "/img/snack-samosa.webp",
    alt: "A samosa",
  },
  {
    name: "Beverages for Every Break",
    img: "/img/pantry-beverage.webp",
    alt: "Filter coffee in a brass davara set, with beans",
  },
];

/* deterministic per index — see the note on the glasses above */
const DRIFT = [10, -6, 8, -9];

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

export default function MenuView() {
  const pour = useSectionIn();
  const pantry = useSectionIn();
  const ask = useSectionIn();

  const rPour = useReveal(pour.on, pour.reduced);
  const rPantry = useReveal(pantry.on, pantry.reduced);
  const rAsk = useReveal(ask.on, ask.reduced);

  /* GSAP's two targets. The glass refs are the INNER wrappers — motion owns
     the <li>'s own transform for the entrance, so GSAP is given a different
     node to write to rather than fighting it for one. */
  const glassRefs = useRef<(HTMLDivElement | null)[]>([]);
  const plateRef = useRef<HTMLElement>(null);
  const drinksRowRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- 1. the glasses, each at its own rate ---- */
      glassRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { y: -DRIFT[i % DRIFT.length] },
          {
            y: DRIFT[i % DRIFT.length],
            ease: "none",
            scrollTrigger: {
              trigger: drinksRowRef.current ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });

      /* ---- 2. the doodle plate lags its section ----
         The section is the trigger AND the target. 0%/100% of an over-sized
         `cover` plate is a small real movement, not a jump, because cover
         already crops it. */
      if (plateRef.current) {
        gsap.fromTo(
          plateRef.current,
          { backgroundPositionY: "45%" },
          {
            backgroundPositionY: "55%",
            ease: "none",
            scrollTrigger: {
              trigger: plateRef.current,
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
      {/* ═══════════════ what we pour ═══════════════ */}
      <section
        ref={pour.ref}
        className="relative overflow-x-clip bg-espresso-deep"
        style={{
          paddingTop: "calc(var(--header-h) + clamp(2rem, 6vh, 4.5rem))",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
        }}
      >
        <div className="shell">
          <div className="text-center">
            <motion.span
              {...rPour(0.05, 0)}
              className="eyebrow block text-cream/55"
            >
              <span className="text-orange">02</span> — On the menu
            </motion.span>

            <h1 className="mx-auto mt-5 max-w-[24ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-cream">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pour.reduced ? false : { y: "112%" }}
                  animate={{ y: pour.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                  className="block"
                >
                  Everyone drinks something different.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pour.reduced ? false : { y: "112%" }}
                  animate={{ y: pour.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.23, ease: EASE }}
                  className="block text-orange"
                >
                  We pour all of it.
                </motion.span>
              </span>
            </h1>

            <motion.p
              {...rPour(0.42)}
              className="mx-auto mt-6 max-w-[46ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-cream/70"
            >
              Tea, filter coffee, badam milk, sarbath and more.
            </motion.p>
          </div>

          <ul
            ref={drinksRowRef}
            className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7"
          >
            {DRINKS.map((d, i) => (
              <motion.li
                key={d.name}
                {...rPour(0.5 + i * 0.1, 26)}
                className="flex flex-col"
              >
                {/* GSAP writes THIS node's y; motion writes the <li>'s. Two
                    engines, two elements, one visual result. */}
                <div
                  ref={(el) => {
                    glassRefs.current[i] = el;
                  }}
                  className="relative aspect-[4/5] w-full"
                >
                  <Image
                    src={d.img}
                    alt={d.alt}
                    fill
                    sizes="(max-width: 1024px) 44vw, 22vw"
                    className="object-contain object-bottom"
                  />
                </div>
                <p className="mt-5 text-center font-display text-[1.35rem] font-extrabold tracking-[-0.02em] text-cream md:text-[1.5rem]">
                  {d.name}
                </p>
                <p className="mt-1 text-center font-sans text-[0.92rem] text-cream/60">
                  {d.count}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ the pantry ═══════════════ */}
      <section
        ref={(el) => {
          pantry.ref.current = el;
          plateRef.current = el;
        }}
        className="relative overflow-x-clip"
        style={{
          backgroundColor: "#f8e7d2",
          backgroundImage:
            "linear-gradient(to bottom, rgba(248,231,210,0.46) 0%, rgba(248,231,210,0.34) 34%, rgba(248,231,210,0.22) 100%), url(/img/pantry-doodles.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center 50%",
          backgroundRepeat: "no-repeat, no-repeat",
          paddingTop: "clamp(3rem, 8vh, 5.5rem)",
          paddingBottom: "clamp(3rem, 8vh, 5.5rem)",
        }}
      >
        <div className="shell">
          <div className="max-w-[46rem]">
            <motion.span {...rPantry(0.05, 0)} className="eyebrow block">
              <span className="text-orange-deep">03</span> — The pantry
            </motion.span>

            <h2 className="mt-5 font-display text-[clamp(1.85rem,3.6vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pantry.reduced ? false : { y: "112%" }}
                  animate={{ y: pantry.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                  className="block"
                >
                  The break doesn’t
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pantry.reduced ? false : { y: "112%" }}
                  animate={{ y: pantry.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.23, ease: EASE }}
                  className="block text-orange-dark"
                >
                  stop at the cup.
                </motion.span>
              </span>
            </h2>

            <motion.p
              {...rPantry(0.42)}
              className="mt-6 max-w-[42ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-ink-soft"
            >
              From a quick snack to a customised spread, give your team
              something more to look forward to.
            </motion.p>

            <motion.p
              {...rPantry(0.55)}
              className="mt-7 font-display text-[clamp(1.2rem,1.7vw,1.6rem)] font-extrabold tracking-[-0.025em] text-ink"
            >
              Tea break, sorted.
            </motion.p>
            <motion.p
              {...rPantry(0.62)}
              className="mt-1.5 font-sans text-[clamp(1rem,1.3vw,1.25rem)] text-orange-deep"
            >
              Drinks and bites, customised for your team.
            </motion.p>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {PANTRY.map((p, i) => (
              <motion.li
                key={p.name}
                {...rPantry(0.6 + i * 0.09, 22)}
                className="flex flex-col items-center rounded-[var(--radius-card)] border border-line/70 bg-cream/70 px-4 py-6 text-center backdrop-blur-[2px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5"
              >
                <div className="relative h-[clamp(84px,10vw,120px)] w-full">
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 1024px) 30vw, 140px"
                    className="object-contain"
                  />
                </div>
                <p className="mt-5 font-display text-[1.02rem] font-extrabold leading-[1.3] tracking-[-0.01em] text-ink md:text-[1.1rem]">
                  {p.name}
                </p>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {["We prepare", "We deliver"].map((label, i) => (
              <motion.span
                key={label}
                initial={pantry.reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: pantry.on ? 1 : 0,
                  scale: pantry.on ? 1 : 0.85,
                }}
                transition={{
                  duration: 0.5,
                  delay: 1.05 + i * 0.12,
                  ease: EASE,
                }}
                className={`inline-flex items-center gap-2 rounded-[0.7rem] border px-4 py-2.5 font-display text-[0.72rem] font-extrabold uppercase tracking-[0.1em] ${
                  i === 1
                    ? "border-orange-dark bg-orange-soft text-orange-dark"
                    : "border-orange-dark/45 bg-cream text-orange-dark"
                }`}
              >
                {label}
                <span aria-hidden="true">&rarr;</span>
              </motion.span>
            ))}
            <motion.p
              {...rPantry(1.3)}
              className="font-sans text-[0.95rem] text-ink-soft"
            >
              The snacks ride along on a delivery already happening.
            </motion.p>
          </div>
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
                Tell us what your people drink.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.19, ease: EASE }}
                className="block text-orange"
              >
                We’ll pour it.
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

          <motion.p
            {...rAsk(0.68)}
            className="mt-8 font-sans text-[0.95rem] text-cream/55"
          >
            <Link
              href="/service"
              className="font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4"
            >
              How the service works
            </Link>
            {" · "}
            <Link
              href="/machines"
              className="font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4"
            >
              The machines
            </Link>
          </motion.p>
        </div>
      </section>
    </>
  );
}
