"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MAIL_HREF,
  mailHref,
  PHONE_LABEL,
  TEL_HREF,
  WA_HREF,
  waHref,
} from "@/lib/contact";

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

/* THE ASK, DERIVED FROM THE TWO NUMBERS THE CARD ALREADY PRINTS. Nothing is
   typed twice, so the subject line of the mail and the capacity above the
   button cannot disagree — the same reason countOf exists on /menu. It reads
   "a machine for under 100 cups a day" or "a machine for 100 to 200 cups a
   day", which is a sentence rather than a band, because it is going into
   somebody's inbox. */
const askOf = (r: { from: number | null; cap: number }) =>
  r.from == null
    ? `a machine for under ${r.cap} cups a day`
    : `a machine for ${r.from} to ${r.cap} cups a day`;

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
        className="relative overflow-x-clip"
        /* THE PLATE, from app/234image.png — 1420KB of PNG encoded to 48KB of
           WebP at the same 1886x834.

           A PHOTOGRAPH, NOT LINE ART, which makes it the odd one out among
           the plates on this site: a cream studio backdrop above, a bowl of
           beans at the left, and a wooden counter running across the bottom.
           The other four are doodles and could sit under anything.

           THAT SPLIT IS WHY IT WORKS HERE RATHER THAN ANYWHERE. The copy
           lands on the plain backdrop at the top, which is the lightest and
           flattest part of the image, and the three cards land on the counter
           — so the machines read as standing on a worktop, which is the thing
           the sentence directly above them says they are ("from counter-top
           to half a desk"). Move this image to a section with a different
           layout and both halves of that stop being true.

           THE RADIAL IS NOW THE SCRIM RATHER THAN THE GROUND, exactly as on
           the `which` section below. The same three stops carry alpha instead
           of being opaque, so the section keeps the depth ramp it had — light
           at 20% 10% where the copy sits, denser toward the far corner — and
           the artwork reads through it. backgroundColor sits underneath so
           the section is never bare while the image loads.

           THE ALPHAS ARE LOW BECAUSE THEY CAN BE. Inside the copy column —
           x 8-66%, y 0-40%, where the eyebrow, the heading and the paragraph
           run — the darkest pixel in this artwork is rgb(229,197,169), which
           is lighter than most of the plate. Against it:

             scrim 0.30   ink 12.39   ink-soft 6.65   orange-deep 3.64
             scrim 0.45   ink 12.94   ink-soft 6.94   orange-deep 3.80

           ink and ink-soft clear 4.5 with room to spare at every alpha, so
           nothing here needed a heavy overlay. See the headline note for the
           one colour that did move. */
        style={{
          backgroundColor: "#ede4da",
          backgroundImage:
            "radial-gradient(120% 80% at 20% 10%, rgba(245,240,234,0.42) 0%, rgba(237,228,218,0.34) 45%, rgba(228,216,204,0.30) 100%), url(/img/offer-counter.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
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
            {/* ink-soft INLINE, because .eyebrow is unlayered in globals.css
                and beats any Tailwind text utility regardless of specificity.
                Its default is mute, which measures 2.39:1 on this artwork —
                and already measured only 2.78-3.44 on the flat radial before
                the plate arrived. ink-soft is 6.65. */}
            <span
              className="eyebrow whitespace-nowrap"
              style={{ color: "var(--color-ink-soft)" }}
            >
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
                {/* orange-DEEP, not orange-dark. This is the one colour the
                    plate could not carry: orange-dark measures 2.53:1 on the
                    darkest pixel under this copy and only reaches 2.97 even
                    at a scrim of 0.62 — still under the 3.0 that display
                    text needs, and a scrim heavy enough to fix it would have
                    erased the artwork it was protecting. orange-deep is 3.64
                    at 0.30, which also beats the 3.63 this headline scored on
                    the flat radial before there was a plate at all. */}
                <span className="text-orange-deep">Rent or buy.</span> Find your
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
            {/* RESTORED TO motion.li BELOW. It had been changed to a plain
                <li> while still being spread with rOffer(), which returns
                motion props — so `initial`, `animate` and `transition` were
                handed to React as DOM attributes and shipped in the HTML on
                all three cards, inert. The staggered entrance was dead.
                Verified in the DOM before changing it back. */}
            {RIGS.map((r, i) => (
              <motion.li
                key={r.key}
                {...rOffer(0.55 + i * 0.13, 26)}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[0_18px_48px_-12px_rgba(43,47,51,0.35)] focus-within:-translate-y-1.5 focus-within:shadow-[0_18px_48px_-12px_rgba(43,47,51,0.35)]"
              >
                <div className="px-5 pt-7">
                  {/* GSAP writes THIS node's y; motion writes the <li>'s for the
                      entrance and CSS the hover lift. Three effects, three
                      elements, none of them contending for one transform —
                      and Tailwind's -translate-y writes the standalone
                      `translate` property, which motion never touches.

                      THE REF WAS DELETED AT THE SAME TIME AS motion.li ABOVE,
                      which left rigRefs.current empty and the per-unit drift
                      in the effect above iterating nothing. Both dead
                      animations came from the same edit. */}
                  <div
                    ref={(el) => {
                      rigRefs.current[i] = el;
                    }}
                    className="relative mx-auto h-[clamp(150px,20vw,230px)] w-full"
                  >
                    <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-orange/[0.06] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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

                {/* THE CAPACITY IS THE ONLY THING ON THIS CARD BESIDES THE
                    PHOTOGRAPH, so it gets a foot of its own rather than
                    floating under a rule on the same white as the picture.
                    The card is overflow-hidden and this block runs edge to
                    edge, so the tint stops at the rounded corner and the
                    three cards read as built rather than captioned. */}
                <motion.p
                  {...rOffer(0.9 + i * 0.13, 10)}
                  className="mt-0 bg-steel-pale/60 px-5 py-5 text-center font-display text-[1.6rem] font-extrabold tracking-[-0.02em] text-orange-dark transition-colors duration-500 group-hover:bg-steel-pale md:text-[1.8rem]"
                >
                  {r.from == null ? (
                    <>
                      {/* THE "<" WAS aria-hidden WITH NOTHING REPLACING IT,
                          so a screen reader read this card as "100 cups /
                          day" — the opposite end of the band it means. The
                          glyph stays hidden because "less than" is not how
                          it should be read either; the word goes in beside
                          it instead. */}
                      <span className="sr-only">Under </span>
                      <span aria-hidden="true">&lt;</span> {r.cap}
                    </>
                  ) : (
                    `${r.from} – ${r.cap}`
                  )}{" "}
                  <span className="font-sans text-[0.85rem] font-medium text-ink-soft">
                    cups / day
                  </span>
                </motion.p>

                {/* ═══ SOMETHING TO DO ABOUT THE ONE YOU PICKED ═══

                    Until now a reader who decided "the 200-500 is ours" had
                    nothing to click. Three product cards on the page that
                    sells the product, and the nearest action was the general
                    CTA at the very bottom of the page, which arrives with no
                    idea which size was wanted. The ask now carries the band.

                    THE PHRASE IS DERIVED FROM THE SAME TWO NUMBERS THE CARD
                    PRINTS — see askOf — so the subject line of the mail and
                    the figure above it cannot drift apart. The same principle
                    as countOf on /menu.

                    IT SITS ON THE WHITE, NOT IN THE TINT, AND THAT IS
                    MEASURED. orange-deep is 4.85:1 on the foot at rest but
                    4.43:1 once group-hover deepens it to full steel-pale —
                    under 4.5 exactly when a pointer is on the card. On the
                    card's own white it is 5.49 and nothing moves it.

                    focus-within IS ON THE <li> WITH THE HOVER, because these
                    are the first focusable things this card has ever held.
                    Without it a keyboard user tabbing in would move the ring
                    into a card that never lifts or tints, while a mouse user
                    grazing it gets both. */}
                <div className="mt-auto flex items-center gap-3 border-t border-line px-5 py-4">
                  <a
                    href={mailHref(askOf(r))}
                    className="group/ask inline-flex items-center gap-1.5 font-sans text-[0.9rem] font-semibold text-orange-deep decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark hover:underline focus-visible:text-orange-dark focus-visible:underline"
                  >
                    Get pricing
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ask:translate-x-1"
                    >
                      &rarr;
                    </span>
                  </a>

                  {/* 40px and a plain message bubble rather than the WhatsApp
                      logo — the same call, for the same reasons, as the ring
                      on /who-we-serve's cards. The destination is named in
                      aria-label, so nothing is lost to a screen reader. */}
                  <a
                    href={waHref(askOf(r))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp us about ${askOf(r)}`}
                    className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-[color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-orange-dark hover:text-orange-dark focus-visible:-translate-y-0.5 focus-visible:border-orange-dark focus-visible:text-orange-dark"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-[19px] w-[19px] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </a>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ when a machine is the answer ═══════════════ */}
      {/* THE DOODLE PLATE, from app/imgg.png — 1283KB of PNG encoded to 37KB
          of WebP at the same 2172x724. It is the dark sibling of the cream
          plate on /who-we-serve: light line art on espresso, clustered at
          the edges with the middle left clear.

          THE RADIAL IS NOW THE SCRIM RATHER THAN THE GROUND. It used to be
          an opaque `background`; the same three stops are here with alpha,
          sitting over the artwork, so the section keeps the exact depth ramp
          it had and the doodles read through it. Weakest at 70% 30% — the
          right side, where the machine photograph sits and no text does —
          and strongest at the edges, which is where the copy is.

          THE ALPHAS ARE MEASURED, and light text on a dark ground inverts
          the usual problem: the danger is a BRIGHT doodle behind bright
          type. The brightest pixel in this artwork is rgb(226,177,137), and
          against it:

            scrim 0.30   cream 3.20   cream/70 2.36
            scrim 0.60   cream 6.27   cream/70 4.03
            scrim 0.72   cream 8.42   cream/70 5.10

          The body copy is text-cream/70, so 0.72 is the floor for it — that
          is where the outer stops start rather than a round number. */}
      <section
        ref={which.ref}
        className="section-y overflow-x-clip"
        style={{
          backgroundColor: "#241c18",
          backgroundImage:
            "radial-gradient(140% 100% at 70% 30%, rgba(74,61,56,0.72) 0%, rgba(58,46,40,0.80) 55%, rgba(36,28,24,0.88) 100%), url(/img/which-doodles.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        <div className="shell">
          {/* === THE SECTION IS A DECISION, SO IT IS DRAWN AS ONE ===

              It was copy-left / photograph-right, which is the layout of the
              hero on /service, the hero on /who-we-serve and the section
              directly above this one. Four in a row of the same shape, and
              this is the only one whose content is not a description but a
              THRESHOLD: everything it says turns on a number and which side
              of it you are.

              So the number is the layout. One rail across the shell, a pivot
              on it at 50 cups a day, and the two answers hung either side —
              flasks under the line, a machine above it. The rail is lit only
              on the machine side, because that is the half the sentence
              points at.

              NOTHING HERE IS NEW COPY. "The cheaper answer, and nothing to
              install" and "the better fit" are the two halves of the
              paragraph this replaces, split at the comma they already had.
              The calculator sentence and its link survive underneath.

              THE PHOTOGRAPH MOVED TO THE MACHINE SIDE. It used to sit in a
              column of its own with nothing to do with the argument; it is a
              machine, so it belongs above the line. Its GSAP ref and its
              motion clip come with it unchanged — the two engines still
              write different nodes. */}
          <div className="max-w-[46rem]">
            {/* text-cream/50 NEVER APPLIED. .eyebrow in globals.css sets
                color: var(--color-mute) and is UNLAYERED, so it beats any
                Tailwind text utility regardless of specificity. This eyebrow
                had been rendering mute, #8b7a6f, at 2.8:1. Set inline so it
                takes, and at 70% rather than the 50% the class asks for,
                because 50% measures 3.9:1 over this ground and small text
                needs 4.5. cream at 70% is 6.0:1. */}
            <motion.span
              {...rWhich(0.05, 0)}
              className="eyebrow block text-cream/50"
              style={{ color: "rgb(255 247 240 / 0.7)" }}
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
          </div>

          {/* --- the rail --- */}
          <div className="mt-11 lg:mt-14">
            <div className="relative h-[3px] w-full rounded-full bg-cream/15">
              {/* lit from the pivot rightward, because "above the line" is
                  the half the sentence recommends. Decoration: aria-hidden,
                  and no text sits on it. */}
              <motion.span
                aria-hidden="true"
                initial={which.reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: which.on ? 1 : 0 }}
                transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
                className="absolute inset-y-0 left-[38%] right-0 origin-left rounded-full bg-gradient-to-r from-orange/40 to-orange"
              />
              <motion.span
                aria-hidden="true"
                initial={which.reduced ? false : { scale: 0 }}
                animate={{ scale: which.on ? 1 : 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.75,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="absolute left-[38%] top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-orange bg-[#241c18]"
              />
            </div>

            {/* the number hangs off the pivot, so the two read as one object */}
            <div className="relative mt-4 h-[1.4rem]">
              <motion.span
                {...rWhich(0.85, 8)}
                className="absolute left-[38%] -translate-x-1/2 whitespace-nowrap font-display text-[0.82rem] font-extrabold uppercase tracking-[0.16em] text-cream"
              >
                50 cups a day
              </motion.span>
            </div>

            {/* --- the two answers, one each side of it ---

                EVERY SMALL SIZE HERE IS cream/85 OR ABOVE, AND THAT IS
                MEASURED. The scrim is a radial weakest at 70% 30% — which is
                exactly where the right-hand answer now sits — so the worst
                ground in this section is rgb(117,93,79), and against it:

                  cream/70   3.78   fails
                  cream/80   4.37   fails
                  cream/85   4.70   passes
                  cream      5.77

                The paragraph this replaces was cream/70, safe only because it
                sat on the left where the scrim is heaviest. Moving copy to
                the right half made 70% unusable. */}
            <div className="mt-9 grid gap-y-10 lg:grid-cols-[38%_1fr] lg:gap-x-14">
              <motion.div
                {...rWhich(0.95, 18)}
                className="lg:pr-14 lg:text-right"
              >
                <p className="font-display text-[0.75rem] font-extrabold uppercase tracking-[0.16em] text-cream/85">
                  Under the line
                </p>
                <h3 className="mt-3 font-display text-[clamp(1.3rem,2.2vw,1.75rem)] font-extrabold tracking-[-0.02em] text-cream">
                  Flasks
                </h3>
                <p className="mt-2.5 font-sans text-[1rem] leading-[1.6] text-cream/85 lg:ml-auto lg:max-w-[26ch]">
                  The cheaper answer, and nothing to install.
                </p>
              </motion.div>

              <motion.div
                {...rWhich(1.05, 18)}
                /* items-START, not items-center. Centred, the right-hand
                   answer floated down against a photograph twice the height
                   of its text, so "Above the line" sat 45px below "Under the
                   line" and the two stopped reading as a pair either side of
                   the pivot. They are one comparison; they start on one
                   line. */
                className="lg:flex lg:items-start lg:gap-10"
              >
                <div className="lg:flex-1">
                  <p className="font-display text-[0.75rem] font-extrabold uppercase tracking-[0.16em] text-orange">
                    Above the line
                  </p>
                  <h3 className="mt-3 font-display text-[clamp(1.3rem,2.2vw,1.75rem)] font-extrabold tracking-[-0.02em] text-cream">
                    A machine
                  </h3>
                  <p className="mt-2.5 max-w-[26ch] font-sans text-[1rem] leading-[1.6] text-cream/85">
                    The better fit.
                  </p>
                </div>

                {/* GSAP owns this wrapper; motion animates the inner
                    clip-path, so the two never write the same property on one
                    node. Both unchanged — only where the wrapper sits did. */}
                <div
                  ref={bandMachineRef}
                  className="relative mt-8 aspect-[3/2] w-full max-w-[380px] lg:-mt-6 lg:w-[42%] lg:max-w-none lg:shrink-0"
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
                    transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
                    className="absolute inset-0"
                  >
                    <Image
                      src="/img/section4-machine.webp"
                      alt="A beverage machine on a workplace counter"
                      fill
                      sizes="(max-width: 1024px) 80vw, 300px"
                      className="object-contain"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* --- what works it out --- */}
            <motion.p
              {...rWhich(1.2)}
              className="mt-10 max-w-[46ch] font-sans text-[1.05rem] leading-[1.6] text-cream/85"
            >
              The calculator on the home page works it out from your
              headcount.
            </motion.p>

            {/* THE LINK IS CREAM NOW, NOT ORANGE. orange measures 1.94:1 at
                the weakest point of this scrim and only 4.15 at the
                strongest — under 4.5 everywhere in the section, at 0.95rem.
                It was failing before this change and would have failed worse
                here, since the rail block reaches further right than the old
                copy column did. Cream is 5.77 at worst; the orange survives
                as the underline and as the hover colour, neither of which is
                text a ratio applies to. */}
            <motion.div {...rWhich(1.3)}>
              <Link
                href="/#savings"
                className="group/calc mt-7 inline-flex items-center gap-2 font-sans text-[0.95rem] font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange"
              >
                Work out your number
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/calc:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ built to spec ═══════════════ */}
      <section
        ref={spec.ref}
        className="section-y overflow-x-clip"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 20%, #fdfaf6 0%, #f5efe6 50%, #ede4d6 100%)",
        }}
      >
        <div className="shell">
          <motion.div
            {...rSpec(0.05, 24)}
            className="group relative grid items-center gap-y-10 overflow-hidden rounded-[var(--radius-panel)] bg-white px-7 py-10 shadow-[0_24px_64px_-16px_rgba(58,20,14,0.22)] lg:grid-cols-12 lg:gap-x-12 lg:px-12 lg:py-12"
          >
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange/0 via-orange to-orange/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange/[0.04] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
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
                    className="group rounded-full border border-orange/30 bg-white px-4 py-2 font-sans text-[0.9rem] font-semibold text-ink-soft transition-all duration-300 hover:border-orange hover:bg-orange-soft hover:text-orange-dark hover:shadow-[0_4px_16px_-4px_rgba(242,101,34,0.25)]"
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
      {/* THE DOODLE PLATE, from app/img2.png — 1107KB of PNG encoded to 33KB
          of WebP at the same 2172x724. Warm rust line art with its own glow
          low and centred, which is why it suits this section: the radial
          already burns from 30% 100%, so the two warm sources sit near each
          other rather than fighting.

          THE RADIAL IS THE SCRIM, NOT THE GROUND, same as the section above:
          the original three stops with alpha, over the artwork.

          THE ALPHAS WERE 0.85/0.89/0.93 AND CAME DOWN TO 0.68/0.74/0.82 SO
          THE ARTWORK READS. The first set was measured against a single
          worst case — the brightest pixel anywhere in the image, assumed to
          be behind the tightest text — and that turned out to be too blunt.
          Measured per BAND instead, against where each thing actually sits:

            headline  top 30%    brightest rgb(192,109,59)
            buttons   30-62%     brightest rgb(164,92,54)
            links     62-100%    brightest rgb(211,106,44)

          The glow is at the BOTTOM and the radial is centred at 30% 100%,
          so the headline sits under the OUTER stop — the strongest scrim —
          while the brightest artwork sits under the weakest. Pairing each
          band with the alpha it actually gets:

            orange headline, 0.82 over rgb(192,109,59)   5.03:1  (needs 3.0)
            cream/70 links,  0.68 over rgb(211,106,44)   4.63:1  (needs 4.5)

          0.68 is the floor for the link row and the reason it is not lower.
          The two faint greys below moved from /60 and /55 to /70 for the
          same measurement — /55 was already only 4.61:1 on the BARE radial,
          before any picture went behind it. */}
      <section
        ref={ask.ref}
        className="section-y overflow-x-clip"
        style={{
          backgroundColor: "#240a06",
          backgroundImage:
            "radial-gradient(120% 80% at 30% 100%, rgba(92,35,21,0.68) 0%, rgba(58,20,14,0.74) 45%, rgba(36,10,6,0.82) 100%), url(/img/ask-doodles.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        {/* === A BAND, NOT A CENTRED STACK ===

            This was four blocks centred one under another: a headline, two
            buttons, "Or call", and two page links. Two problems with that.

            IT WAS THE ONLY CENTRED THING ON THE PAGE. Every other section
            here sets its copy from the left margin, so the closing block
            broke the page's own rhythm at the one moment it is asking for
            something.

            AND IT MIXED CONTACT WITH NAVIGATION. "Or call" and "How the
            service works" were the same size, the same cream, the same
            orange underline, sitting eight pixels apart — so a phone number
            and a link to another page read as two items on one list. They
            are not the same kind of thing: one is how you reach a human, the
            other is where to go if you are not ready to. The rule between
            them says so.

            The three ways to reach us now group on the right, in the order
            they commit you to: a form, a message, a phone call. */}
        <div className="shell">
          <div className="grid gap-y-9 lg:grid-cols-12 lg:items-end lg:gap-x-12">
            <div className="lg:col-span-7">
              <h2 className="max-w-[22ch] font-display text-[clamp(1.75rem,3.2vw,2.6rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-cream">
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
                    We&rsquo;ll size it.
                  </motion.span>
                </span>
              </h2>
            </div>

            <div className="lg:col-span-5">
              <motion.div
                {...rAsk(0.4)}
                className="flex flex-wrap items-center gap-4 lg:justify-end"
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
                /* /60 -> /70: 4.37:1 against the plate's brightest pixel,
                   under the 4.5 floor for text this size. /70 is 5.57:1. */
                className="mt-5 font-sans text-[0.95rem] text-cream/70 lg:text-right"
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
          </div>

          {/* the rule is what separates "reach us" from "read on" — see the
              note above. Decoration, so cream/15 is a border and not text. */}
          <motion.div
            {...rAsk(0.68)}
            className="mt-12 flex flex-wrap items-baseline gap-x-7 gap-y-3 border-t border-cream/15 pt-7"
          >
            <span className="font-display text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-cream/70">
              Keep reading
            </span>
            {/* /55 -> /70. This row was the tightest thing on the section and
                was already only 4.61:1 on the bare radial, before the plate
                went behind it. */}
            <p className="font-sans text-[0.95rem] text-cream/70">
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
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
