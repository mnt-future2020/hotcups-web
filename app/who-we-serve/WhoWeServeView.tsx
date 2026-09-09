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
 *   3. THE FLASK DRIFTS AGAINST THE HERO. The opening section now follows the
 *      same dark-ground two-column treatment as /service and /machines: text
 *      on the left, delivery photograph on the right, both on an espresso
 *      ground with an orange-accented proof card. The image gets its own
 *      ScrollTrigger scrub so it drifts at a different rate from the proof
 *      card, giving the section the same layered depth those pages have.
 *
 * All three are scrubbed and all three reverse. None is expressible as an
 * entrance, which is the test for whether GSAP has earned its place on a page.
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

/* EACH ONE GAINED A PICTURE, which is the half of the home page's card
   that was still missing. Swapping the box for Blog.tsx's card made these
   the right SHAPE, but Blog's card is a photograph over text and these were
   text alone, so three white rectangles of prose still did not look like
   anything on the home page.

   NOTHING NEW WAS SHOT AND NOTHING WAS CROPPED. All three already exist in
   public/img and all three are cut-outs with a real alpha channel, which is
   why they are drawn CONTAINED on a tinted panel rather than cover like
   Blog's scenes — a cut-out under object-cover crops the subject and fills
   the frame with its own transparent margin.

   They are also each already the subject of the page they point at:
   rig-flasks is the flask row, hero-slide-drinks is the drinks the hero
   names, section4-machine is the unit section 06 sells. */
const COLUMNS = [
  {
    head: "Freshly filled flasks",
    body: "Delivered to your pantry. We collect the empties and refill — nothing to install, nothing to clean.",
    href: "/service",
    cta: "How the service works",
    img: "/img/rig-flasks.webp",
  },
  {
    head: "Tea, coffee, milk, seasonal",
    body: "Everyone drinks something different. The pantry rides along on the same delivery.",
    href: "/menu",
    cta: "See the menu",
    img: "/img/hero-slide-drinks.webp",
  },
  {
    head: "Or a machine on site",
    body: "Above 50 cups a day, a machine is the better fit. Three sizes, rent or buy.",
    href: "/machines",
    cta: "See the machines",
    img: "/img/section4-machine.webp",
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
  const flaskRef = useRef<HTMLDivElement>(null);

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

      /* ---- 3. the flask drifts against the hero ---- */
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
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* ═══════════════ the claim ═══════════════ */}
      <section
        ref={hero.ref}
        className="relative overflow-x-clip bg-espresso-deep"
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
                <span className="eyebrow whitespace-nowrap text-cream/55">
                  <span className="text-orange">04</span> — Where the flasks go
                </span>
                <motion.span
                  aria-hidden="true"
                  initial={hero.reduced ? false : { scaleX: 0 }}
                  animate={{ scaleX: hero.on ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
                  className="h-px w-16 origin-left bg-cream/15 md:w-24"
                />
              </motion.div>

              <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-cream">
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
                    className="block text-orange"
                  >
                    Experiences to Your Team.
                  </motion.span>
                </span>
              </h1>

              <motion.p
                {...rHero(0.45)}
                className="mt-6 max-w-[52ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-cream/70"
              >
                <strong className="font-semibold tabular-nums text-cream">
                  {orgs}+
                </strong>{" "}
                organizations already on it. Offices, factories, hospitals, colleges
                and shops across Tamil Nadu.
              </motion.p>

              <figure
                ref={proofRef}
                className="mt-10 max-w-[46rem] rounded-[var(--radius-card)] border border-orange/25 bg-orange/[0.08] px-7 py-7"
              >
                <motion.blockquote
                  {...rHero(0.62, 10)}
                  className="font-display text-[clamp(1.15rem,2vw,1.6rem)] font-extrabold leading-[1.3] tracking-[-0.02em] text-cream"
                >
                  Three-shift factories, including 2,000 cups a day in Coimbatore.
                </motion.blockquote>
              </figure>
            </div>

            <div className="lg:col-span-5">
              <div
                ref={flaskRef}
                /* BOTH CAPS HAD TO RISE TOGETHER. The picture is bound by
                   whichever of the two binds first — the width cap here and
                   the height cap below — and at 300px/42vh it was the HEIGHT
                   that bound: 300 wide implies 406 tall, 42vh on a 900px
                   viewport is 378, so the box was cut to 378 and the picture
                   drawn to fit inside it. Raising only max-w would have moved
                   nothing at all. */
                className="relative mx-auto w-[80%] max-w-[340px] lg:mr-0 lg:w-full lg:max-w-[430px]"
                style={{ maxHeight: "64vh" }}
              >
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
                  className="absolute left-1/2 top-6 aspect-square w-[74%] -translate-x-1/2 rounded-full bg-cream/[0.08]"
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
                    /* THE DECLARED SIZE IS THE FILE'S OWN, AND IT WAS NOT.
                       760x1261 is 0.603; the file is 1078x1460, which is
                       0.738. Next writes the declared pair as the box's
                       aspect-ratio, so the box was a good deal narrower than
                       the picture and object-contain letterboxed it inside:
                       measured 279px of woman in a 300px box, ~7% of the
                       width thrown away as empty margin on a photograph that
                       was already the smallest thing in this hero. Correcting
                       the pair removes the letterbox; contain is now a no-op
                       and stays only as a guard.

                       SHIPPED AS WEBP, NOT AS THE PNG IT WAS CUT FROM.
                       The source is 1078x1460 and 1494KB; this is the same
                       1078x1460 at 71KB, q86 — 95% smaller, and now drawn
                       at up to 430 CSS px, so still comfortably above what
                       the layout asks of it even at 2x.

                       IT ALSO MOVED INTO public/img, WHERE EVERY OTHER
                       SHIPPED IMAGE ON THIS SITE LIVES. It sat at the root
                       of public/ as the only served asset outside that
                       folder, and .gitignore's own note says everything
                       under public/ is served — so the PNG now sits with
                       the other superseded originals it lists, on disk and
                       out of git. */
                    src="/img/who-hero-woman.webp"
                    alt="Woman"
                    width={1078}
                    height={1460}
                    sizes="(max-width: 1024px) 80vw, 430px"
                    priority
                    className="h-auto w-full"
                    style={{ maxHeight: "64vh", objectFit: "contain" }}
                  />
                </motion.div>
              </div>
            </div>
          </div>
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
                className="group relative flex flex-col overflow-hidden rounded-[var(--radius-media)] border border-line bg-cream transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-[0_24px_56px_-12px_rgba(58,20,14,0.35)] focus-within:-translate-y-2 focus-within:shadow-[0_24px_56px_-12px_rgba(58,20,14,0.35)]"
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange/0 via-orange to-orange/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream-deep/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
                {/* THE FRAME NEVER MOVES. It clips, and the wrapper inside it
                    is the thing GSAP travels — so the card's height, and every
                    line of text under it, stays exactly where it was. */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <div
                    ref={(el) => {
                      photoRefs.current[i] = el;
                    }}
                    /* 9% of headroom top and bottom against a ±4% travel */
                    className="absolute inset-x-0 -top-[9%] -bottom-[9%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-focus-within:scale-105"
                  >
                    <Image
                      src={p.src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso-deep/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
                </div>

                <div className="relative flex flex-1 flex-col px-6 py-5">
                  <h3 className="font-display text-[1.2rem] font-bold tracking-[-0.015em] text-ink md:text-[1.35rem]">
                    {p.name}
                  </h3>

                  {/* NO CAPTION AND NO FACT — five of section 04's six are
                      invented. See page.tsx. */}

                  {/* THESE TWO LINKS USED TO BE opacity-0 UNTIL group-hover,
                      WHICH WAS THREE PROBLEMS RATHER THAN ONE EFFECT.

                        1. ON A TOUCH SCREEN THERE IS NO HOVER, so twelve links
                           — two on each of the six cards — were invisible on
                           every phone while still holding their space and
                           still sitting in the tab order. The only actions on
                           this section were unreachable on the device most of
                           its readers use.
                        2. TABBING LANDED ON SOMETHING NOBODY COULD SEE. A
                           focused link at opacity 0 is a focus ring on blank
                           cream; the fix is focus-visibility, not a hover.
                        3. AT REST EVERY CARD HELD A BLOCK OF EMPTY SPACE where
                           the invisible row was, so a name sat at the top of a
                           tall blank panel and the card read as unfinished.
                           That space is exactly what the fact line would have
                           filled if five of the six were not invented.

                      They are visible at rest now and hover EMPHASISES rather
                      than reveals: the mail link is already the card's one
                      orange thing, and the arrow slides on hover or keyboard
                      focus. The row always occupied this space, so the card
                      is 4px shorter only because its top margin tightened
                      from mt-5 to mt-4 now that it has something to sit
                      against — 385px to 381px, measured. */}
                  {/* TWO UNDERLINED LINKS SIDE BY SIDE WAS THE PROBLEM WITH
                      THE FIRST PASS. Both were text, both were underlined and
                      both sat at the same weight, so the row read as one
                      cluttered strip with no hierarchy and no rhythm — and the
                      underlines fought the name above them.

                      They are now a PRIMARY and a SECONDARY of different
                      kinds. The mail link keeps the words and loses its
                      resting underline, so at rest the card carries exactly
                      one orange line of text; the underline comes back on
                      hover and focus, where it means something. WhatsApp
                      becomes the ring-and-glyph button the FOOTER already
                      uses for its social links, pushed to the right edge by
                      ml-auto so the row has two ends instead of a huddle.

                      The hairline above them is what makes the panel read as
                      a card rather than a caption: name, rule, actions. */}
                  <div className="mt-4 flex items-center gap-3 border-t border-line/70 pt-4">
                    <a
                      href={mailHref(WORKPLACE_ASK[p.key])}
                      className="group/ask inline-flex items-center gap-1.5 font-sans text-[0.9rem] font-semibold text-orange-deep decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark hover:underline focus-visible:text-orange-dark focus-visible:underline"
                    >
                      Get pricing for {WORKPLACE_FOR[p.key]}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/ask:translate-x-1"
                      >
                        &rarr;
                      </span>
                    </a>

                    {/* 40px rather than the footer's 44: this sits inside a
                        card next to a line of 0.9rem text, and 44 made the
                        ring the loudest thing in the panel. Still a comfortable
                        target, and the only one on the card that is not text.

                        THE GLYPH IS A PLAIN MESSAGE BUBBLE, NOT THE WHATSAPP
                        LOGO. Every mark in Footer.tsx is simplified geometry
                        rather than a brand's own artwork, and this file's
                        siblings carry a NO BRAND NAMES note for the same
                        reason. The destination is named in aria-label, so
                        nothing is lost to a screen reader. */}
                    <a
                      href={waHref(WORKPLACE_ASK[p.key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp us about ${WORKPLACE_ASK[p.key]}`}
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
                        <path d="M21 11.6a8.4 8.4 0 0 1-12.3 7.5L3.4 20.6l1.5-5.2A8.4 8.4 0 1 1 21 11.6Z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══════════════ what every one of them gets ═══════════════ */}
      {/* THE DOODLE PLATE, from app/bgimg.png — 1224KB of PNG encoded to
          49KB of WebP at the same 1888x833. Same construction Pantry.tsx
          uses for its plate: one backgroundImage holding a flat scrim over
          the art, with backgroundColor underneath so the section is never
          bare while the image is still loading.

          THE SCRIM IS 0.70, MEASURED RATHER THAN PICKED. This artwork is
          darker than the pantry plate it resembles — darkest pixel at
          luminance 132 against 149, darkest 1% at 174 against 200 — so a
          lighter scrim would put MORE ink on screen here than that section
          has. Against the darkest pixel in the image, rgb(186,117,64):

            text-ink       11.46:1
            text-ink-soft   6.14:1
            mute            2.52:1   <- see the eyebrow

          The three cards over it are white, so nothing inside them is
          affected; only the eyebrow and the headline sit on the plate
          directly, and the headline is text-ink. */}
      <section
        ref={round.ref}
        className="section-y"
        style={{
          backgroundColor: "#f8e7d2",
          backgroundImage:
            "linear-gradient(rgba(248,231,210,0.70), rgba(248,231,210,0.70)), url(/img/round-doodles.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        <div className="shell">
          {/* THE COLOUR IS SET INLINE, AND IT HAS TO BE. .eyebrow in
              globals.css sets color: var(--color-mute) and is UNLAYERED,
              while Tailwind's utilities live in @layer utilities — unlayered
              CSS beats any layer regardless of specificity, so `text-ink-soft`
              on this element would be ignored. The note on
              .stepper-field:focus-visible in globals.css describes the same
              mechanism.

              That is a real bug and it is not mine to fix here: five
              eyebrows across the site already ask for a colour and silently
              get mute, two of them on DARK grounds. Fixing it properly means
              moving that one rule into @layer components, which changes
              every eyebrow on the site and was explicitly rewound once. So
              this section solves its own problem locally and leaves that
              decision alone.

              mute measures 2.52:1 over the darkest pixel of the plate behind
              it — under the 4.5 body floor and under the 3.0 large-text one.
              ink-soft is 6.14:1 on the same pixel. */}
          <motion.span
            {...rRound(0.05, 0)}
            className="eyebrow block"
            style={{ color: "var(--color-ink-soft)" }}
          >
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

          {/* MATCHED TO THE HOME PAGE'S CARD, WHICH THIS WAS NOT.
              These three used to be one slab: a bordered box subdivided by
              gap-px hairlines over a bg-line ground, so the columns read as
              cells of a table rather than three things you could choose
              between. That treatment appears exactly twice in the codebase —
              here and on /service — and NOWHERE on the home page, which was
              the whole complaint.

              The home page's card is Blog.tsx's: white on the section's
              cream, a line border, shadow-1 lifting to shadow-2, and a 1.5px
              rise on hover AND focus. The class string is copied from it
              rather than approximated, so the two cannot drift into being
              nearly-the-same.

              THE WHOLE CARD IS THE LINK NOW, also as Blog does it. Each
              column already pointed at exactly one page, so the card had a
              small text target inside a large dead rectangle. The old CTA
              stays as a SPAN — an <a> inside an <a> is invalid, and the
              affordance is what was wanted, not a second link.

              motion drives the entrance on the outer div and Tailwind's
              -translate-y drives the lift on the inner Link: different
              elements, and different properties even if they were not. */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {COLUMNS.map((c, i) => (
              <motion.div key={c.head} {...rRound(0.3 + i * 0.12, 20)}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-1.5 focus-visible:shadow-[var(--shadow-2)]"
                >
                  {/* alt="" ON PURPOSE. The whole card is one link and its
                      accessible name already comes from the heading and the
                      CTA under it; describing the picture as well would make
                      a screen reader read the same card twice. The image is
                      decoration of a labelled thing, which is the case the
                      empty alt exists for. */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-deep">
                    <Image
                      src={c.img}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 92vw, 30vw"
                      className="object-contain p-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="font-display text-[1.35rem] font-bold leading-[1.3] tracking-[-0.01em] text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-300 group-hover:decoration-orange">
                      {c.head}
                    </h3>
                    <p className="mt-3 flex-1 font-sans text-[1.02rem] leading-[1.6] text-ink-soft">
                      {c.body}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 font-sans text-[0.92rem] font-semibold text-orange-deep">
                      {c.cta}
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                      >
                        &rarr;
                      </span>
                    </span>
                  </div>
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
      <section
        ref={ask.ref}
        className="section-y relative overflow-x-clip bg-espresso"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 120%, #4a1c10 0%, #3a140e 40%, #240a06 70%, #1a0503 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'1\' fill=\'%23fff\'/%3E%3C/svg%3E")' }} />
        <div className="shell relative text-center">
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
