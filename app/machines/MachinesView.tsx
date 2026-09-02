"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAIL_HREF, PHONE_LABEL, TEL_HREF, WA_HREF } from "@/lib/contact";

/**
 * /machines, animated. Fourth page on the same two-engine split: motion owns
 * time-based entrances, GSAP owns scroll-BOUND continuous motion, and nothing
 * is animated by both.
 *
 * WHAT GSAP DOES HERE
 *
 *   1. THE THREE UNITS DRIFT AGAINST THEIR CARDS, each on its own trigger so
 *      a card that reaches the viewport later is not driven by one that got
 *      there first. The travel is deliberately tiny — ±5px, not a percentage.
 *      These boxes have no overflow-hidden and the photographs are
 *      object-contain, so the only room to move is the letterbox space the
 *      contain leaves. A percentage-based drift would scale with the box and
 *      start clipping a machine's feet on a wide screen; five pixels cannot.
 *
 *   2. THE MACHINE IN THE STEEL BAND PARALLAXES against its section, the same
 *      treatment /service gives its flask. It is a cut-out on a dark ground
 *      with space around it, which is the one case where a larger drift is
 *      safe, so this one is yPercent.
 *
 * Both scrub, both reverse. Neither is expressible as an entrance.
 *
 * NO SCRUBBED PROGRESS LINE ON THIS PAGE, deliberately. /service has one
 * across its three steps and it works because those steps are a SEQUENCE — a
 * reader moves through them in order. These three machines are alternatives,
 * not stages: drawing a line through them would say the small unit leads to
 * the large one, which is the opposite of what the row means. The bands do the
 * telling here.
 *
 * REDUCED MOTION: every GSAP tween is created INSIDE a
 * `(prefers-reduced-motion: no-preference)` matchMedia block, so under `reduce`
 * none is constructed and no transform is written. motion branches separately
 * on useReducedMotion.
 *
 * The content rule, the brand-removal note and the warning about the makers'
 * marks still visible in the photographs all live in page.tsx. Animating this
 * changed no copy and did not retouch a photograph.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const RIGS = [
  {
    key: "small",
    from: null as number | null,
    cap: 100,
    src: "/img/machine-cothas.png",
    aspect: 900 / 754,
  },
  {
    key: "mid",
    from: 100,
    cap: 200,
    src: "/img/machine-chaipoint.png",
    aspect: 1290 / 1219,
  },
  {
    key: "large",
    from: 200,
    cap: 500,
    src: "/img/machine-brewmax-clean.png",
    aspect: 1278 / 1230,
  },
];

const CONSTRAINTS = ["Size", "Branding", "Drinks", "Payment", "Timings"];

/* deterministic per index, never random — a random rate differs between the
   server render and the client and there is nothing to hydrate against */
const DRIFT = [5, -4, 5];

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

export default function MachinesView() {
  const offer = useSectionIn();
  const which = useSectionIn();
  const spec = useSectionIn();
  const ask = useSectionIn();

  const rOffer = useReveal(offer.on, offer.reduced);
  const rWhich = useReveal(which.on, which.reduced);
  const rSpec = useReveal(spec.on, spec.reduced);
  const rAsk = useReveal(ask.on, ask.reduced);

  const rigRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bandMachineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- 1. the three units, five pixels each ---- */
      rigRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = DRIFT[i % DRIFT.length];
        gsap.fromTo(
          el,
          { y: -d },
          {
            y: d,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });

      /* ---- 2. the machine in the steel band ---- */
      if (bandMachineRef.current) {
        gsap.fromTo(
          bandMachineRef.current,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: bandMachineRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* ═══════════════ the offer ═══════════════ */}
      <section
        ref={offer.ref}
        className="relative overflow-x-clip bg-steel-pale"
        style={{
          paddingTop: "calc(var(--header-h) + clamp(2rem, 6vh, 4.5rem))",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
        }}
      >
        <div className="shell">
          <motion.div
            initial={offer.reduced ? undefined : { opacity: 0, x: -14 }}
            animate={
              offer.reduced
                ? undefined
                : offer.on
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: -14 }
            }
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            className="flex items-center gap-4"
          >
            <span className="eyebrow whitespace-nowrap">
              <span className="text-orange-deep">06</span> — The machines
            </span>
            <motion.span
              aria-hidden="true"
              initial={offer.reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: offer.on ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
              className="h-px w-16 origin-left bg-steel-mid md:w-24"
            />
          </motion.div>

          <h1 className="mt-5 max-w-[18ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={offer.reduced ? false : { y: "112%" }}
                animate={{ y: offer.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
                className="block"
              >
                <span className="text-orange-dark">Rent or buy.</span> Find your
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={offer.reduced ? false : { y: "112%" }}
                animate={{ y: offer.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.24, ease: EASE }}
                className="block"
              >
                right machine.
              </motion.span>
            </span>
          </h1>

          <motion.p
            {...rOffer(0.45)}
            className="mt-6 max-w-[34ch] font-sans text-[clamp(1.05rem,1.6vw,1.375rem)] leading-[1.55] text-ink-soft"
          >
            Three sizes, from counter-top to half a desk — each built for a
            different workplace.
          </motion.p>

          <ul className="mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
            {RIGS.map((r, i) => (
              <motion.li
                key={r.key}
                {...rOffer(0.55 + i * 0.13, 26)}
                className="flex flex-col rounded-[var(--radius-card)] bg-white px-5 pb-6 pt-7 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5"
                style={{ boxShadow: "var(--shadow-1)" }}
              >
                {/* GSAP writes THIS node's y; motion writes the <li>'s for the
                    entrance and CSS the hover lift. Three effects, three
                    elements, none of them contending for one transform. */}
                <div
                  ref={(el) => {
                    rigRefs.current[i] = el;
                  }}
                  className="relative mx-auto h-[clamp(150px,20vw,230px)] w-full"
                >
                  <Image
                    src={r.src}
                    alt={`A beverage machine for ${
                      r.from == null ? "under" : `${r.from} to`
                    } ${r.cap} cups a day`}
                    fill
                    sizes="(max-width: 768px) 80vw, 28vw"
                    className="object-contain"
                    style={{ aspectRatio: String(r.aspect) }}
                  />
                </div>

                <motion.span
                  aria-hidden="true"
                  initial={offer.reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: offer.on ? 1 : 0 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.8 + i * 0.13,
                    ease: EASE,
                  }}
                  className="mt-6 block h-px w-full origin-left bg-line"
                />

                <motion.p
                  {...rOffer(0.9 + i * 0.13, 10)}
                  className="mt-5 text-center font-display text-[1.6rem] font-extrabold tracking-[-0.02em] text-orange-dark md:text-[1.8rem]"
                >
                  {r.from == null ? (
                    <>
                      <span aria-hidden="true">&lt;</span> {r.cap}
                    </>
                  ) : (
                    `${r.from} – ${r.cap}`
                  )}{" "}
                  <span className="font-sans text-[0.85rem] font-medium text-ink-soft">
                    cups / day
                  </span>
                </motion.p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ when a machine is the answer ═══════════════ */}
      <section ref={which.ref} className="section-y overflow-x-clip bg-steel">
        <div className="shell">
          <div className="grid items-center gap-y-8 lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-7">
              <motion.span
                {...rWhich(0.05, 0)}
                className="eyebrow block text-cream/50"
              >
                <span className="text-orange">05</span> — Which one you need
              </motion.span>

              <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(1.85rem,3.6vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-cream">
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span
                    initial={which.reduced ? false : { y: "112%" }}
                    animate={{ y: which.on ? "0%" : "112%" }}
                    transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                    className="block"
                  >
                    Flasks or a <span className="text-orange">machine?</span>
                  </motion.span>
                </span>
              </h2>

              <motion.p
                {...rWhich(0.32)}
                className="mt-4 max-w-[34ch] font-display text-[clamp(1.15rem,1.9vw,1.55rem)] font-bold leading-[1.28] text-cream/80"
              >
                Above 50 cups a day, a machine is the better fit.
              </motion.p>

              <motion.p
                {...rWhich(0.45)}
                className="mt-6 max-w-[46ch] font-sans text-[1.05rem] leading-[1.6] text-cream/65"
              >
                Under that line, flasks are the cheaper answer and there is
                nothing to install. The calculator on the home page works it
                out from your headcount.
              </motion.p>

              <motion.div {...rWhich(0.58)}>
                <Link
                  href="/#savings"
                  className="mt-7 inline-flex items-center gap-2 font-sans text-[0.95rem] font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange"
                >
                  Work out your number
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>
            </div>

            <div className="lg:col-span-5">
              {/* GSAP owns this wrapper; motion animates the inner clip-path,
                  so the two never write the same property on one node. */}
              <div
                ref={bandMachineRef}
                className="relative mx-auto aspect-[3/2] w-full max-w-[440px]"
              >
                <motion.div
                  initial={
                    which.reduced ? undefined : { opacity: 0, scale: 0.94 }
                  }
                  animate={
                    which.reduced
                      ? undefined
                      : which.on
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.94 }
                  }
                  transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                  className="absolute inset-0"
                >
                  <Image
                    src="/img/section4-machine.webp"
                    alt="A beverage machine on a workplace counter"
                    fill
                    sizes="(max-width: 1024px) 80vw, 440px"
                    className="object-contain"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ built to spec ═══════════════ */}
      <section ref={spec.ref} className="section-y bg-steel-pale">
        <div className="shell">
          <motion.div
            {...rSpec(0.05, 24)}
            className="grid items-center gap-y-10 rounded-[var(--radius-panel)] bg-white px-7 py-10 lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:py-12"
          >
            <div className="lg:col-span-4">
              <motion.div
                initial={spec.reduced ? undefined : { opacity: 0, y: 18 }}
                animate={
                  spec.reduced
                    ? undefined
                    : spec.on
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 18 }
                }
                transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                className="relative mx-auto aspect-square w-[68%] max-w-[280px] lg:w-full"
              >
                <Image
                  src="/img/machine-brewmax-clean.png"
                  alt="A Hotcups machine built to a customer's specification"
                  fill
                  sizes="(max-width: 1024px) 60vw, 280px"
                  className="object-contain object-bottom"
                />
              </motion.div>
            </div>

            <div className="lg:col-span-8">
              <h2 className="max-w-[20ch] font-display text-[clamp(1.6rem,2.9vw,2.4rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-ink">
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span
                    initial={spec.reduced ? false : { y: "112%" }}
                    animate={{ y: spec.on ? "0%" : "112%" }}
                    transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
                    className="block"
                  >
                    Custom machines designed
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span
                    initial={spec.reduced ? false : { y: "112%" }}
                    animate={{ y: spec.on ? "0%" : "112%" }}
                    transition={{ duration: 0.9, delay: 0.29, ease: EASE }}
                    className="block"
                  >
                    around your workspace.
                  </motion.span>
                </span>
              </h2>

              <motion.p
                {...rSpec(0.45)}
                className="mt-5 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft"
              >
                Tell us the constraint and we design around it.
              </motion.p>

              <ul className="mt-6 flex flex-wrap gap-2.5">
                {CONSTRAINTS.map((c, i) => (
                  <motion.li
                    key={c}
                    initial={spec.reduced ? false : { opacity: 0, scale: 0.88 }}
                    animate={{
                      opacity: spec.on ? 1 : 0,
                      scale: spec.on ? 1 : 0.88,
                    }}
                    transition={{
                      duration: 0.45,
                      delay: 0.6 + i * 0.08,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className="rounded-full border border-line bg-cream px-4 py-2 font-sans text-[0.9rem] font-semibold text-ink"
                  >
                    {c}
                  </motion.li>
                ))}
              </ul>

              <motion.div {...rSpec(1.05)}>
                <a
                  href={MAIL_HREF}
                  className="hero-btn-dark group relative mt-8 inline-flex h-[3.25rem] items-center gap-2 overflow-hidden rounded-full bg-orange px-7 font-sans text-[0.95rem] font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Talk to us</span>
                  <span
                    aria-hidden="true"
                    className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </a>
              </motion.div>
            </div>
          </motion.div>
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
                Tell us your headcount.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.19, ease: EASE }}
                className="block text-orange"
              >
                We’ll size it.
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
              href="/menu"
              className="font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4"
            >
              The menu
            </Link>
          </motion.p>
        </div>
      </section>
    </>
  );
}
