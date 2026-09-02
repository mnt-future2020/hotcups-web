"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import {
  setWorkplace,
  WORKPLACE_FOR,
  type WorkplaceKey,
} from "@/lib/workplace";

/**
 * Section 04 — Which one are you?
 *
 * Six workplaces as chips down the left, ONE large photograph on the right.
 * Never a grid of thumbnails: six small pictures at once is a mood board, and
 * a visitor scanning it learns that Hotcups photographs offices. One picture
 * at a time, changing, is a claim about breadth that you watch being made.
 *
 * WHAT THIS REPLACED
 * A delivery timeline: an hour axis, six rows of bars, per-round times, a NOW
 * marker, an overnight panel and a live "2 rounds in progress" readout. All of
 * it gone. It was an infographic about scheduling standing in the place where
 * the page asks the reader to recognise themselves, and every time on it was a
 * commitment the client has not made. Timings come back when they are real.
 *
 * THE RESTING STATE IS THE DESIGN
 * Most visitors will never click a chip. So nothing that matters is behind
 * one: the heading, the sub, all six chips, the cycling photograph and its
 * caption are the section. The fact line and the relabelled button are what a
 * click ADDS. If the interaction never happens the section still says what it
 * is for.
 *
 * THE CYCLE IS THE AFFORDANCE ON TOUCH
 * There is no hover on a phone, so the ambient cycle is the only thing telling
 * a visitor these six are a set that can change. It therefore keeps running on
 * mobile rather than being switched off as decoration.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const BACK = [0.34, 1.56, 0.64, 1] as const;

/* ---------------------------------------------------------------
   THE TWO FIGURES IN THE MARGINS.

   Not a background. They stand OUTSIDE .shell, in the dead space either
   side of the 1240px container, which is the only reason they cost this
   section nothing: the headline's second line is orange-dark at 3.88:1 on
   cream-deep against a 3.0 floor, and anything laid BEHIND that text has to
   sit near 0.09 opacity to keep it — which is where the footer doodle sits,
   and you can barely see it. Beside the text there is no such ceiling, so
   these run at full strength.

   They also stay out of the way of the argument. This section already has a
   large photograph doing the work, the one that changes; a second
   photographic layer behind it would have competed with the first.

   HOW WIDE THEY GET, AND WHEN THEY GIVE UP
   The free margin per side is (100vw - 1240) / 2, plus the 56px the shell
   keeps as padding, which text never enters:

     1920 -> 396px      1600 -> 236px      1440 -> 156px
     1728 -> 300px      1536 -> 204px      1366 -> 119px

   min(360px, ...) caps the top so a 2560 window does not stand a 716px
   person in the corner.

   THE BOX RUNS 8rem PAST THE CONTAINER, AND THAT IS A CLIENT DECISION.
   Held to the free margin the figures were 156px wide at 1440 — the width
   the demo laptop will run at — and read as stickers. Three ways out were
   built and shown:

     mask the overlap    the fade reads as a broken image, and above 1848px
                         it erased a quarter of each figure for nothing
     tighter crop        a bust cut at the chest, floating; worse than small
     narrow the section  worked, but cost 15% of the photograph and left this
                         section's measure 70px inside every other one

   The client chose the fourth: overlap the copy, full strength, and accept
   the clash. That is recorded here because it is not the default a designer
   would pick and the next person to read this file deserves to know it was
   asked for rather than missed.

   WHAT IT COSTS, MEASURED. The unlit ledger names are `mute`, 3.65:1 on
   clean cream-deep against a 3.0 floor for text this size. Where a name
   crosses the woman's brown polo the ratio falls to roughly 1.6:1. The first
   ~128px of every name is in that zone at 1440. It is a real legibility
   cost on the six names, and it buys this:

     1366 -> 247x443    1600 -> 360x645    1920 -> 360x645
     1440 -> 284x509    1728 -> 360x645    2560 -> 360x645

   The overlap is a constant 128px until the 360px cap takes over at 1600,
   and by 1848 the cap has pulled the box clear of the copy entirely — so
   wide screens keep exactly the layout they had, untouched.

   object-contain, so a narrow margin SCALES the figure rather than slicing
   it down the middle. Anchored bottom-outer: they stand on the section's
   floor, against the window edge.

   THE 650px HEIGHT IS TIED TO THE PLATE'S ASPECT, NOT PICKED.
   The delivered figures are 0.558 and 0.568 wide to tall, measured off their
   alpha bounding boxes after the transparent margin was trimmed (the raw
   files were 0.667, six to eleven per cent of which was empty air at the
   sides). object-contain fits BOTH axes, so to let the wider of the two
   actually reach the 360px width cap the box must be at least 360 / 0.558 =
   645px tall. 650 clears it. Drop this number and the figures silently stop
   growing at the wrong width — at 540 they capped at 301px, not 360. If the
   crop ever changes, re-measure and move this with it.

   NO EDGE MASK. Three drafts had one — dissolving the inner 48%, then
   feathering 20%, then a rem-based ramp to protect a deliberate overlap —
   and all three were removed for the same reason each time: these are
   cut-outs on transparent ground, so the only edge is the person's own
   silhouette and object-contain never clips it. A gradient has nothing to
   soften and everything to spoil. If they ever read too loud beside the
   copy, the knob is opacity on this whole element, not a fade through
   somebody's arm.

   NULL UNTIL THE ART LANDS — same guard the footer's doodle uses. One line
   each to switch on, and nothing renders in the meantime rather than two
   broken images. */
const FIGURE_L: string | null = "/img/fig-left.webp";
const FIGURE_R: string | null = "/img/fig-right.webp";

function Figure({
  src,
  side,
  on,
  reduced,
}: {
  src: string;
  side: "left" | "right";
  on: boolean;
  reduced: boolean | null;
}) {
  const left = side === "left";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: left ? -26 : 26 }}
      animate={
        on
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: left ? -26 : 26 }
      }
      transition={{ duration: 1.1, delay: 0.5, ease: EASE }}
      className={`absolute bottom-0 h-[min(62svh,650px)] ${left ? "left-0" : "right-0"}`}
      style={{ width: "min(360px, calc((100vw - 1240px) / 2 + 3.5rem + 8rem))" }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="360px"
        className="object-contain"
        style={{ objectPosition: left ? "left bottom" : "right bottom" }}
      />
    </motion.div>
  );
}

/** every 3.5s, per the brief */
const DWELL = 3500;

/** The menu, in the order the hero and section 02 say it. Named here rather
    than written inline so the two places cannot drift apart. */
const MENU = ["Tea", "Filter coffee", "Badam milk", "Hot chocolate"];

/* ===============================================================
   !!  FIVE OF THE SIX FACT LINES ARE INVENTED.               !!
   !!  DO NOT PUBLISH UNTIL EACH ONE IS CONFIRMED.            !!
   ===============================================================
     Only the Coimbatore figure — three-shift factories at 2,000
     cups a day — came from the client. The other five were
     written to fill the shape and are marked `placeholder: true`
     below.

     They read as operational facts about a real company: that
     hospitals are served through night shifts, that campuses are
     served between classes, that shops are covered at peak. If
     any one of those is not something Hotcups actually does, it
     is a promise the page is making on their behalf.

     The captions under the photograph carry the same warning for
     the same five.
   =============================================================== */

type Place = {
  key: WorkplaceKey;
  /** the chip */
  name: string;
  src: string;
  /** under the photograph, with the name */
  caption: string;
  /** revealed on click */
  fact: string;
  /** false only where the client supplied the number */
  placeholder: boolean;
};

const PLACES: Place[] = [
  {
    key: "office",
    name: "IT & offices",
    src: "/img/wp-office.webp",
    caption: "desk-side, twice a day",
    fact: "Desk-side delivery, morning and evening.",
    placeholder: true,
  },
  {
    key: "factory",
    name: "Manufacturing",
    src: "/img/wp-factory.webp",
    caption: "three shifts, 2,000 cups a day",
    /* the one line on this list that came from the client */
    fact: "Three-shift factories, including 2,000 cups a day in Coimbatore.",
    placeholder: false,
  },
  {
    key: "hospital",
    name: "Hospitals",
    src: "/img/wp-hospital.webp",
    caption: "round the clock",
    fact: "Round the clock, including night shifts.",
    placeholder: true,
  },
  {
    key: "college",
    name: "Colleges & schools",
    src: "/img/wp-college.webp",
    caption: "between classes",
    fact: "Campuses served between classes.",
    placeholder: true,
  },
  {
    key: "retail",
    name: "Retail shops",
    src: "/img/wp-retail.webp",
    caption: "through peak hours",
    fact: "Peak hours covered, without leaving the counter.",
    placeholder: true,
  },
  {
    key: "showroom",
    name: "Showrooms & banks",
    /* STAND-IN. wp-other is the generic stock office that used to sit under
       "Something else" — no branded cups, cooler grade than the other five.
       It is here only so the slot points at a file that exists; the showroom
       photograph is being shot. */
    src: "/img/wp-other.webp",
    /* deliberately NOT "through peak hours" — that is Retail's line, and the
       two segments would read as the same thing. A shop serves its own staff
       across a busy day; a showroom or a branch serves the customer sitting
       in front of a desk waiting. That difference is the reason both are on
       the list. */
    caption: "for the customers waiting",
    fact: "Showroom floors and bank branches, where customers are served while they wait.",
    placeholder: true,
  },
];

const COUNT = PLACES.length;

export default function Industries() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.25, once: true });
  const on = inView || Boolean(reduced);

  /** the ambient position. Keeps its place while paused, so a mouse-out
      resumes rather than restarting. */
  const [cycle, setCycle] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  /* A click stops the cycle — the visitor has told us what they are and the
     photograph changing under them after that would read as the page
     ignoring it. Hover only pauses.

     IT USED TO STOP FOR GOOD, AND ON TOUCH THAT WAS A DEAD END.
     `choose` set picked and nothing ever cleared it, so the first tap on a
     phone ended the cycle permanently — and the cycle is the ONLY thing on a
     phone that says these six are a set that changes, because there is no
     hover to discover it with. A visitor who tapped once to look at offices
     had no way back to the thing that showed them the other five. It is a
     toggle now: tapping the lit name releases it. The markup already said so
     — every one of these buttons carries aria-pressed, which promises exactly
     this behaviour to a screen reader and was not delivering it. */
  const stopped = picked !== null;
  const shown = picked ?? hover ?? cycle;

  useEffect(() => {
    if (reduced || stopped || hover !== null || !on) return;
    const t = window.setTimeout(() => setCycle((v) => (v + 1) % COUNT), DWELL);
    return () => window.clearTimeout(t);
  }, [cycle, reduced, stopped, hover, on]);

  /* THE FIGURE IS 500 IN THE HTML, NOT 0.
     Driving this through RollValue meant the value was `on ? 500 : 0`, and
     `on` is false on the server and at first paint — so the shipped markup
     read "0+ organizations already on it". A count-up is a flourish; a page
     whose source claims zero customers is a defect, and no crawler or
     reader with JS off would ever have seen the real number.

     So it renders 500 from the start and drops to 0 for the length of one
     frame at the moment the section scrolls into view, which is the only
     moment anybody is looking at it. Under reduced motion it never moves. */
  const [orgs, setOrgs] = useState(500);
  useEffect(() => {
    if (reduced || !on) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setOrgs(Math.round(500 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    setOrgs(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on, reduced]);

  /* ---------------------------------------------------------------
     THE ROUND.

     The ambient state is a delivery round being run down the list, not a
     carousel. The rule under the name the round has reached fills amber left
     to right across the dwell, with a flask riding its leading edge, and the
     photograph changes when it gets to the end. The picture changes because
     the round arrived somewhere — not because a timer fired.

     It is the same idea the deleted timeline was reaching for, said as motion
     instead of as a chart, and without committing the client to a delivery
     time it has not agreed to.

     There is no measuring here any more. The first version ran a rail down
     the side and had to read every chip's offsetTop to park a token beside it
     — correct, and 11px of cup against a 1px line, which is a speck at
     reading distance. Riding the rule instead means the geometry IS the
     layout: the sweep is a width and the flask is pinned to its end, so
     nothing can drift out of register no matter how the names wrap. */
  const choose = useCallback((i: number) => {
    setPicked((cur) => (cur === i ? null : i));
  }, []);

  /* the publish FOLLOWS the state rather than riding inside the click, so
     releasing a pick clears section 07's workplace too — otherwise the quote
     email would still say "for an office" after the visitor had un-chosen it */
  useEffect(() => {
    setWorkplace(picked === null ? null : PLACES[picked].key);
  }, [picked]);

  const place = PLACES[shown];
  /** the crossfade is quick when a pointer is driving it and slow when the
      section is driving itself — the brief's 0.3s and 0.6s */
  const fadeMs = hover !== null || stopped ? 0.3 : 0.6;

  const rise = (delay: number, y = 14) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section
      id="industries"
      ref={ref}
      className="relative flex min-h-svh flex-col [justify-content:safe_center] overflow-x-clip bg-cream-deep"
      style={{
        paddingTop: "calc(var(--header-h) + clamp(0.875rem, 2.5svh, 2.25rem))",
        paddingBottom: "clamp(1.5rem, 4svh, 3.5rem)",
      }}
    >
      {/* THE TWO FIGURES SIT ON OPPOSITE SIDES OF THE COPY, AND THAT IS NOT
          A TYPO. Once the boxes overlap the container they each run into
          something different, and the right answer for one is wrong for the
          other.

          The LEFT figure meets TEXT. Behind it: the names stay on top and
          stay readable-ish, which is the whole point of letting her overlap
          at all.

          The RIGHT figure meets the PHOTOGRAPH, which is opaque and
          rectangular. Behind it he was sliced clean down its edge — 128px at
          1440, taking his left arm and the cup with it, and reading as a
          broken image rather than a layered one. In front, he stands at the
          picture's corner and the overlap reads as depth. There is no
          contrast cost either way, because what he covers is a photograph
          and not type.

          z-0 and z-20 straddle the copy's z-10. Both wrappers keep
          pointer-events-none, so the one on top cannot swallow a click. */}
      {FIGURE_L && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden min-[1366px]:block"
        >
          <Figure src={FIGURE_L} side="left" on={on} reduced={reduced} />
        </div>
      )}
      {FIGURE_R && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 hidden overflow-hidden min-[1366px]:block"
        >
          <Figure src={FIGURE_R} side="right" on={on} reduced={reduced} />
        </div>
      )}

      <div className="shell relative z-10">
        {/* ---------------- the question ---------------- */}
        <motion.div {...rise(0.05, 0)} className="flex items-center gap-4">
          <span className="eyebrow whitespace-nowrap">04 — Where the flasks go</span>
          <motion.span
            initial={reduced ? undefined : { scaleX: 0 }}
            animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
            className="h-px w-16 origin-left bg-line md:w-24"
          />
        </motion.div>

        {/* THE SUB SITS UNDER THE HEADING, NOT BESIDE IT.
            They shared a row while the headline was "Which one are you?" —
            9.07 em, which fits in what is left over. Nothing since has: "Tell
            us your organization." measured 11.68 em and the current line is
            12.10 em, or 726px at the 60px cap, against the 588px the row
            leaves once the sub has taken its measure. It does not fit beside
            anything from 1366 up. Stacked, it has the whole 1128.

            THE SPLIT IS FORCED, NOT CHOSEN. The h2 is capped at 19ch, which
            is 12.80 em whatever the clamp resolves to — `ch` scales with the
            font-size and so does the text, so the fit is the same ratio at
            every width, and both lines were measured at one rect each rather
            than assumed. 12.10 of 12.80 leaves 0.70 em spare on the long
            line. Set as "Bringing Better Food Experiences" the first line
            comes to about 15 em and wraps INSIDE its own overflow-hidden
            mask, which is what the roll-up animation cannot survive — each
            of those spans has to be exactly one line. Breaking after "Food"
            is the only two-line split that fits. */}
        <h2 className="mt-4 max-w-[19ch] font-display text-[clamp(1.9rem,min(4.4vw,5.7svh),3.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
          <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span
              initial={reduced ? false : { y: "112%" }}
              animate={on ? { y: "0%" } : { y: "112%" }}
              transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
              className="block"
            >
              Bringing Better Food
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span
              initial={reduced ? false : { y: "112%" }}
              animate={on ? { y: "0%" } : { y: "112%" }}
              transition={{ duration: 0.55, delay: 0.24, ease: EASE }}
              /* orange-dark, not orange: 3.88 against 2.97 on this ground,
                 and at 60px extrabold the 3.0 large-text bar applies. */
              className="block text-orange-dark"
            >
              Experiences to Your Team.
            </motion.span>
          </span>
        </h2>

        <motion.p
          {...rise(0.35)}
          className="mt-[clamp(0.75rem,2svh,1.25rem)] max-w-[54ch] font-sans text-[clamp(1.02rem,1.3vw,1.22rem)] leading-[1.55] text-ink-soft"
        >
          <strong className="font-semibold tabular-nums text-ink">{orgs}+</strong>{" "}
          organizations already on it. Offices, factories, hospitals, colleges
          and shops across Tamil Nadu.
        </motion.p>

        <div className="mt-[clamp(1.125rem,2.6svh,2.5rem)] h-px w-full bg-line" />

        {/* ---------------- chips, and the one photograph ----------------
            Photograph FIRST in the DOM. Below lg it belongs at the top, and
            source order is the honest way to say so — `order` alone would
            leave a keyboard tabbing into the chips before reaching the thing
            they change on a phone. At lg the two swap. */}
        <div className="mt-[clamp(1.125rem,2.6svh,2.25rem)] grid items-start gap-x-[clamp(1.75rem,3.5vw,3.5rem)] gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.22fr)]">
          {/* ── the photograph ─────────────────────────────────── */}
          <motion.div
            className="order-1 lg:order-2"
            initial={reduced ? false : { opacity: 0 }}
            animate={on ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
          >
            {/* ABOVE THE PHOTOGRAPH, NOT UNDER IT.
                Under a 444px-tall picture the label was the last thing in the
                column and read as a credit line. It is what the picture IS, so
                it goes where a label goes — and it now sits on the same eye
                line as the chips it answers, instead of a screen away from
                them. Sized up with the move: the caption is the human half of
                the pair, so it takes the larger size and the name becomes the
                small tracked overline above it. */}
            <div className="mb-[clamp(0.5rem,1.4svh,1rem)] min-h-[clamp(2.6rem,6.2svh,3.6rem)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={place.key}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: reduced ? 0 : 0.28, ease: EASE }}
                >
                  <p className="font-sans text-[0.9rem] font-bold uppercase tracking-[0.16em] text-orange-dark">
                    {place.name}
                  </p>
                  <p className="mt-1.5 font-display text-[clamp(1.15rem,1.6vw,1.45rem)] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
                    {place.caption}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* the bottom-up develop the rest of the page uses. It lives on a
                wrapper, not the frame, so the clip-path can never slice the
                caption or a focus ring.

                ASPECT BELOW lg, EXPLICIT HEIGHT AT IT — AND THE SWAP MATTERS.
                It was aspect-[4/3] with a max-height at both. That pairing
                does not do what it looks like it does: when the max-height
                bites, the box keeps its ratio and gives back WIDTH to do it,
                so a 33svh cap on a 592px column produced a ~400px picture
                with ~190px of bare cream beside it. The cap was quietly
                deciding the width.

                At lg the width is the thing that must not move — it is a grid
                column — so the height is stated outright and the ratio is let
                go. w-full pins the picture to its column at every desktop
                size and min(34svh, 26rem) keeps the height on the same
                viewport budget the rest of this section runs on: measured at
                1366x768, 1440x900 and 1920x1080, the section still fits with
                28, 59 and 121px to spare, exactly as before. The picture is
                simply ~48% wider for none of it.

                Below lg the column width swings from 335px to 900px, so a
                ratio is the right tool there and it keeps what it had. The
                plate is object-cover, so the wider frame crops rather than
                letterboxes. */}
            <motion.div
              className="relative aspect-[4/3] max-h-[38svh] w-full overflow-hidden lg:aspect-auto lg:h-[min(34svh,26rem)] lg:max-h-none rounded-[var(--radius-media)] bg-cream shadow-[var(--shadow-1)]"
              initial={
                reduced ? false : { clipPath: "inset(100% 0 0 0)", scale: 1.06 }
              }
              animate={
                on
                  ? { clipPath: "inset(0% 0 0 0)", scale: 1 }
                  : { clipPath: "inset(100% 0 0 0)", scale: 1.06 }
              }
              transition={{ duration: 1, delay: 0.9, ease: EASE }}
            >
              {PLACES.map((pl, i) => (
                <motion.div
                  key={pl.key}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: i === shown ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : fadeMs, ease: "linear" }}
                >
                  <Image
                    src={pl.src}
                    alt={pl.name}
                    fill
                    sizes="(max-width: 1023px) 92vw, 55vw"
                    className="object-cover"
                    /* NO priority. This is section 04 — a full-bleed
                       photograph a long way below the fold — and marking it
                       priority put a preload link in the head that raced the
                       hero for bandwidth on first paint, to fetch something
                       nobody had scrolled to. Lazy is correct here: the
                       loader starts it well before the section arrives. */
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* ── the fact line, UNDER THE PHOTOGRAPH ────────────
                It sat at the foot of the ledger, and that is most of why this
                section overflowed the window. The two columns were badly out
                of balance: the ledger carried six names, the fact line AND the
                button, while this one carried a caption and a picture — so the
                grid took the ledger's height and left 130px of dead air beside
                the photograph. Moving one block across balances them to within
                ten pixels and costs the reader nothing, because their eye is
                already on this side: the picture and the caption both changed
                when they clicked.

                Height is reserved at lg and DELIBERATELY NOT ON MOBILE.
                One line is enough here at lg — this column is 592px, not the
                ledger's 486, and the longest fact is 77 characters. Reserving
                it costs 33px of a desktop column that has the room.

                On a phone the same reservation cost 3.4em, and the phone is
                where it was least affordable: the column is 335px so the fact
                needs two lines, and the block sits BETWEEN the photograph and
                the six names. That put ~72px of permanent white space in the
                middle of the section for every visitor who never taps a name
                — which is most of them, since the section is built to read
                completely without one. Reserving height for something that is
                usually absent is a bad trade at that price.

                So mobile collapses to nothing and the fact pushes the list
                down when it appears. That shift is acceptable HERE and would
                not be everywhere: it only ever happens right after a tap, so
                it is a response the reader asked for rather than the page
                moving under them. */}
            <div className="mt-[clamp(0.75rem,2.2svh,1.25rem)] lg:min-h-[2.1em]">
              <AnimatePresence mode="wait">
                {picked === null ? (
                  /* THE MENU, WHERE THE RESERVED SPACE ALREADY WAS.
                     This slot is held open for the fact line, which only
                     exists once someone picks — so for most visitors it was
                     reserved emptiness. The four drinks fill it at no cost in
                     height: one line inside a 2.1em reserve.

                     It is the SAME four for every workplace on purpose. A
                     per-segment drink would assert what offices drink and
                     what factories drink, which is the same invented claim
                     the banner at the top of this file is about. The menu is
                     the menu; it is true for all six. */
                  <motion.p
                    key="menu"
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="font-sans text-[1.02rem] leading-[1.55] text-ink-soft"
                  >
                    {MENU.map((d, i) => (
                      <span key={d}>
                        {i > 0 && (
                          <span aria-hidden="true" className="px-[0.45em] text-orange-dark">
                            &middot;
                          </span>
                        )}
                        {d}
                      </span>
                    ))}
                  </motion.p>
                ) : (
                  <motion.p
                    key={PLACES[picked].key}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap items-baseline gap-x-[0.32em] font-sans text-[1.02rem] leading-[1.55] text-ink-soft"
                  >
                    <span aria-hidden="true" className="text-orange-dark">
                      &#10003;
                    </span>
                    {/* word by word, 40ms apart. One span per word rather than
                        a typewriter on a single string: a screen reader gets
                        the whole sentence, and no character is ever mid-glyph. */}
                    {PLACES[picked].fact.split(" ").map((word, w) => (
                      <motion.span
                        key={`${w}-${word}`}
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduced ? 0 : 0.3,
                          delay: reduced ? 0 : w * 0.04,
                          ease: EASE,
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

          </motion.div>

          {/* ── the ledger ─────────────────────────────────────
              Six names, set large. Five ghosted, one solid — the one the
              round has reached. No pills: they were six identical rounded
              rectangles in a stack, which is a radio group, and a radio group
              is what you look at when a page wants something FROM you. This
              section is trying to be recognised.

              THE ROUND RUNS ALONG THE RULE, NOT DOWN A RAIL.
              The rail beside the old chips was a 1px line carrying 11px cups
              — specks at reading distance. Here the rule under the active
              name fills amber left to right across the dwell, with the flask
              riding its leading edge. It is the same idea at twenty times the
              size, and it does something the rail could not: you can see how
              long is left before the round moves on. */}
          <div className="ledger-inset order-2 lg:order-1">
            <ul>
              {PLACES.map((pl, i) => {
                const isPicked = picked === i;
                const lit = i === shown;
                const solid = lit || isPicked;
                const dim = stopped && !isPicked;
                /* ONE DURATION, TWO USERS. The sweep animates a width with it
                   and the flask/cup handoff below delays on it. They were
                   about to be two copies of the same conditional, which is
                   the kind of pair that drifts the first time the dwell is
                   tuned — and a handoff that fires before the flask lands
                   reads as a glitch rather than as an arrival. */
                const fast = isPicked || hover !== null;
                const sweepDur = reduced ? 0 : fast ? 0.35 : DWELL / 1000;
                return (
                  <motion.li
                    key={pl.key}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={
                      on
                        ? { opacity: dim ? 0.45 : 1, y: 0 }
                        : { opacity: 0, y: 12 }
                    }
                    transition={{
                      duration: 0.5,
                      delay: on && !stopped ? 0.55 + i * 0.07 : 0,
                      ease: BACK,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => choose(i)}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      /* KEYBOARD FOCUS PAUSES; A TAP MUST NOT.
                         Pausing on focus exists so the row a keyboard user is
                         aiming at does not move out from under them. But a tap
                         focuses the button too on Android, so the plain
                         handler left `hover` set after every tap and the cycle
                         stayed paused even once the pick was released — the
                         dead end, surviving the fix for it. :focus-visible is
                         exactly the "focused, and the browser thinks the
                         indicator should show" test, which is the keyboard
                         case and not the pointer one. */
                      onFocus={(e) => {
                        if (e.currentTarget.matches(":focus-visible")) setHover(i);
                      }}
                      onBlur={() => setHover(null)}
                      aria-pressed={isPicked}
                      className="group block w-full text-left"
                    >
                      <span className="flex items-baseline justify-between gap-4 py-[clamp(0.3rem,0.9svh,0.7rem)]">
                        {/* WEIGHT AND COLOUR, NOT OUTLINE.
                            These were stroked outlines with no fill. The
                            contrast RATIO was fine — full-strength ink on the
                            stroke — and the render was still wrong: 1.8px of
                            stroke around a 48px glyph has a fraction of the
                            visual mass of a filled one, so five of six
                            buttons read as disabled rather than as "not the
                            one showing". WCAG's number does not measure
                            visual mass and the eye does.

                            THE SIZE IS BOUND BY THE LONGEST NAME. That used
                            to be "Colleges & schools" at 8.93 em; it is now
                            "Showrooms & banks" at 9.55, which at the 3rem cap
                            is 459px against a 486px column. Twenty-seven
                            pixels. Any name longer than about 10.1 em wraps —
                            check before renaming one.

                            Medium-weight mute against extrabold ink is the
                            same hierarchy said in two dimensions that are
                            both legible: 3.65:1 and 16.59:1, and every name
                            is a word you can read at a glance. Manrope's 800
                            does not outline gracefully either — the counters
                            go chunky, which is what made the longer names
                            look crude. */}
                        <span
                          className={`ledger-name font-display leading-[1.12] tracking-[-0.02em] transition-[color,font-weight] duration-300 ${
                            solid
                              ? "font-extrabold text-ink"
                              : "font-medium text-mute group-hover:text-ink group-focus-visible:text-ink"
                          }`}
                        >
                          {pl.name}
                        </span>
                        <motion.span
                          aria-hidden="true"
                          className="shrink-0 self-center font-sans text-[1.4rem] leading-none text-orange-dark"
                          initial={false}
                          animate={{
                            opacity: isPicked ? 1 : 0,
                            x: isPicked ? 0 : -8,
                          }}
                          transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
                        >
                          &#10003;
                        </motion.span>
                      </span>

                      {/* the rule, and the round running along it */}
                      <span className="relative block h-px w-full bg-line">
                        {solid && (
                          <motion.span
                            /* remounts when the round moves, which is what
                               restarts the sweep — animating a width that is
                               already 100% does nothing */
                            key={`sweep-${shown}-${isPicked ? "lock" : "run"}`}
                            className="absolute inset-y-0 left-0 block bg-orange-dark"
                            initial={reduced ? false : { width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration: sweepDur,
                              ease: fast ? EASE : "linear",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              className="absolute -right-[11px] top-1/2 grid h-[22px] w-[22px] -translate-y-1/2 place-items-center rounded-full bg-orange-dark text-cream shadow-[0_4px_12px_-4px_rgba(58,20,14,0.55)]"
                            >
                              <span
                                aria-hidden="true"
                                className="van-steam absolute -top-1 left-1/2 h-[7px] w-[3px] -translate-x-1/2 rounded-full bg-orange-dark/60"
                                style={{ ["--dx" as string]: "-3px", ["--dx2" as string]: "-5px" }}
                              />
                              <span
                                aria-hidden="true"
                                className="van-steam absolute -top-1 left-1/2 h-[6px] w-[2.5px] -translate-x-1/2 rounded-full bg-orange-dark/45"
                                style={{
                                  ["--dx" as string]: "3px",
                                  ["--dx2" as string]: "6px",
                                  ["--lag" as string]: "1.1s",
                                }}
                              />
                              {/* THE HANDOFF: FLASK TRAVELS, CUP ARRIVES.
                                  Both glyphs are mounted in the same 22px
                                  disc and their opacity is traded at the
                                  moment the sweep finishes, so the flask
                                  reaches the end of the round and leaves a
                                  cup there. That is the sentence the section
                                  is already making — a flask leaves us and a
                                  cup reaches them — played out at 13px.

                                  The delay is `sweepDur`, the SAME value the
                                  width animation above is given. Hard-coding
                                  3.5 here would drift the instant either the
                                  dwell or the hover speed changed, and a
                                  handoff that fires before the flask lands
                                  reads as a glitch rather than an arrival.

                                  Under reduced motion the sweep completes in
                                  0s, so the delivery has already happened and
                                  the cup is simply what is there. */}
                              <motion.span
                                className="absolute inset-0 grid place-items-center"
                                initial={reduced ? false : { opacity: 1 }}
                                animate={{ opacity: 0 }}
                                transition={{ duration: reduced ? 0 : 0.2, delay: sweepDur }}
                              >
                                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="currentColor">
                                  <path d="M10 2h4v2h-1v3.2l3.4 9.1A3 3 0 0 1 13.6 21h-3.2a3 3 0 0 1-2.8-4.7L11 7.2V4h-1z" />
                                </svg>
                              </motion.span>
                              <motion.span
                                className="absolute inset-0 grid place-items-center"
                                initial={reduced ? false : { opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={
                                  reduced
                                    ? { duration: 0 }
                                    : { duration: 0.34, delay: sweepDur, ease: BACK }
                                }
                              >
                                {/* a cup, not a mug: one solid tapered shape
                                    with a saucer, which is the only kind of
                                    mark that survives 13px — see the four
                                    beverage glyphs that did not. */}
                                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="currentColor">
                                  <path d="M6 4h12l-1.5 12.5h-9z" />
                                  <path d="M3.5 19h17v2h-17z" />
                                </svg>
                              </motion.span>
                            </span>
                          </motion.span>
                        )}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>

            {/* ── the ask, relabelled ─────────────────────────── */}
            <motion.div {...rise(1.4)} className="mt-[clamp(0.75rem,2.2svh,1.25rem)]">
              <a
                href="#pricing"
                /* espresso on the amber wipe reads 5.94:1; cream would be
                   2.98. Same swap the blog and footer buttons make. */
                className="hero-btn group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-ink/25 px-7 py-[clamp(0.7rem,1.6svh,0.875rem)] font-sans text-[1.02rem] font-semibold text-espresso transition-colors duration-300 hover:border-orange"
              >
                <span className="relative z-10 inline-flex items-baseline gap-[0.35em]">
                  <span>Get pricing</span>
                  <AnimatePresence mode="wait" initial={false}>
                    {picked !== null && (
                      <motion.span
                        key={PLACES[picked].key}
                        initial={reduced ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: reduced ? 0 : 0.22, ease: EASE }}
                        className="whitespace-nowrap"
                      >
                        for {WORKPLACE_FOR[PLACES[picked].key]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span
                  aria-hidden="true"
                  className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
