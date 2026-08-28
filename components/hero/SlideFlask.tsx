"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import LiquidSurface, {
  type FlaskMouth,
  type LiquidHandle,
} from "./LiquidSurface";
import SteamCanvas from "./SteamCanvas";
import PourWord from "./PourWord";
import { currentCups, subscribeCups } from "@/lib/cups";

/**
 * Hero slide 1 — "Inside the cup".
 *
 * This was the whole hero until the carousel landed. It is unchanged except
 * that it no longer owns the <section>: it fills one, and it takes an `active`
 * flag so its shader and its steam stop costing anything while one of the two
 * cream slides is showing.
 *
 * One WebGL scene: the liquid surface with the flask composited into it as a
 * texture. The copy is real DOM on top, held legible by a scrim that sits
 * between the canvas and the text.
 *
 * THE HEADLINE ARRIVES, IT IS NOT POURED
 * A previous version ran a stream of chai out of the flask's spout and filled
 * each headline line from it. Removed: the arc read as a stray line rather
 * than as liquid, and filling a WRAPPED two-line block from a single rising
 * mask left the two visual lines at different densities, which looked like a
 * rendering fault. The lines clip-reveal instead, and only "Twice a day."
 * fills — one line, no wrap, which is the case the mask actually handles.
 *
 * THE SCRIM IS NOT OPTIONAL
 * The noise has frames far brighter than its average. Sitting text on an
 * animated surface without a guaranteed floor means the headline is legible
 * most of the time, which is another way of saying illegible.
 *
 * NOT BUILT: the feDisplacementMap wobble on the headline. The brief marks it
 * optional and says to drop it if it janks — it forces a filter repaint of
 * live text on every frame in Firefox and Safari, and the whole point of the
 * headline is that it stays readable.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* Four explicit lines. The copy is unchanged, but they have to be real
   elements rather than natural wrapping — a line cannot clip-reveal on its
   own if the browser decides where it starts. It also puts "Twice a day." on
   its own line, which the entrance requires. */
/* These three lines plus the accent are the shape, and they hold it.
   "Hot tea and filter coffee," is 12.04 em of raw advances, which is past the
   11.29 em a 48vw column allows against 4.25vw type — but the h1 carries
   tracking-[-0.035em], and CSS letter-spacing applies after every character.
   Twenty-six characters give back 0.91 em, so the real line is 11.13 em and
   it fits with 1.4% to spare. Measure tracking with the line or the number is
   meaningless. */
const LINES = [
  "Hot tea and filter coffee,",
  "delivered to your office",
  "in flasks.",
];
/** expo out - no overshoot */
const EXPO = [0.16, 1, 0.3, 1] as const;
/** each line 90ms behind the one above it */
const LINE_GAP = 0.09;
const LINE_DUR = 0.5;
/** "Twice a day." fills once its line has landed */
const T_LAST = LINES.length * LINE_GAP + LINE_DUR + 0.15;
/* The flask's rise runs 1.1s -> 1.75s. The steam used to fire at 0.7s, so on
   every load the plume arrived over an empty scene and only then did the cup
   come up underneath it. It now waits for the texture to decode AND for the
   rise to have landed. */
/** after the subject is up */
const T_STEAM_AFTER_SUBJECT = 1.6;
/** and a hard ceiling, so a texture that never loads cannot leave the hero
    with no steam at all — which is exactly what happened the last time this
    depended on a callback firing */
const T_STEAM_FALLBACK = 4;
/* THE TRUST ROW IS GONE, at the client's direction. It ran "2 deliveries /
   day - 500+ organizations - Brewed the Madurai way" between the buttons and
   the live counter, with the first item dropping below md so the remaining
   two stayed on one line.

   Nothing else needs it, but two of the three claims were the client's own
   and are worth keeping somewhere if they ever come back: "500+
   organizations" is cited in Story's note on verbatim client claims, and the
   delivery cadence is the headline's "Twice a day." said twice. */

/** an eased tween on a uniform, driven off rAF */
function tween(
  set: (v: number) => void,
  from: number,
  to: number,
  ms: number,
  delay = 0,
) {
  let raf = 0;
  const begin = setTimeout(() => {
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 4);
      set(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }, delay);
  return () => {
    clearTimeout(begin);
    cancelAnimationFrame(raf);
  };
}

export default function SlideFlask({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const liquid = useRef<LiquidHandle | null>(null);

  const [cups, setCups] = useState(currentCups);
  const [rollTo, setRollTo] = useState(reduced ? currentCups() : 0);
  const [rush, setRush] = useState(1);
  const [steam, setSteam] = useState(reduced ? 1 : 0);
  /* the steam must leave the flask’s MOUTH, so the shader reports where
     that is rather than the hero guessing at it */
  const [mouth, setMouth] = useState<FlaskMouth>([0.79, 0.12]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-22%"]);
  const copyFade = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  const onReady = useCallback((h: LiquidHandle) => {
    liquid.current = h;
  }, []);

  const onMouth = useCallback((m: FlaskMouth) => setMouth(m), []);

  /* the steam is held back until the thing it leaves is actually on screen */
  const [subjectUp, setSubjectUp] = useState(false);
  const onSubject = useCallback(() => setSubjectUp(true), []);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(
      () => setSteam(1),
      (subjectUp ? T_STEAM_AFTER_SUBJECT : T_STEAM_FALLBACK) * 1000,
    );
    return () => window.clearTimeout(t);
  }, [subjectUp, reduced]);

  /* ---------------- the entrance ---------------- */
  useEffect(() => {
    if (reduced) {
      liquid.current?.set("uWake", 1);
      liquid.current?.set("uRim", 0.8);
      liquid.current?.set("uFlaskRise", 1);
      liquid.current?.set("uReflect", 1);
      return;
    }
    const kill: Array<() => void> = [];
    const u = (name: string) => (v: number) => liquid.current?.set(name, v);

    kill.push(tween(u("uWake"), 0, 1, 800, 100)); // the surface wakes
    kill.push(tween(u("uRim"), 0.42, 0.8, 900, 550)); // the rim pulls back
    kill.push(tween(u("uFlaskRise"), 0, 1, 650, 1100));
    kill.push(tween(u("uReflect"), 0, 1, 700, 1600));

    /* The ring, and the counter. The steam is NOT here: it is gated on the
       subject texture actually being on screen — see the effect above. */
    const t2 = setTimeout(() => {
      const [bx, by] = liquid.current?.base() ?? [0.78, 0.4];
      liquid.current?.ripple(bx, by, 1.6);
    }, 1150);
    const t3 = setTimeout(() => setRollTo(currentCups()), 1300);
    kill.push(() => {
      clearTimeout(t2);
      clearTimeout(t3);
    });
    return () => kill.forEach((f) => f());
  }, [reduced]);

  /* the counter keeps ticking for as long as the page is open */
  useEffect(() => subscribeCups(setCups), []);

  /* the badge counts up once, then tracks the live value */
  const [shown, setShown] = useState(reduced ? currentCups() : 0);
  useEffect(() => {
    if (rollTo === 0) return;
    if (reduced) {
      setShown(rollTo);
      return;
    }
    return tween((v) => setShown(Math.round(v)), 0, rollTo, 900);
  }, [rollTo, reduced]);
  useEffect(() => {
    if (shown > 0) setShown(cups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cups]);

  /* ---------------- the scroll ---------------- */
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const h = liquid.current;
    if (!h || reduced) return;
    h.set("uScroll", p);
    /* 0.2 -> 0.8 the rim expands: the cup wall moves outward and away */
    const rim = 0.8 + Math.min(Math.max((p - 0.2) / 0.6, 0), 1) * 0.85;
    h.set("uRim", rim);
    /* 0.4 -> 0.9 the flask sinks back under */
    const sink = 1 - Math.min(Math.max((p - 0.4) / 0.5, 0), 1);
    h.set("uFlaskRise", sink);
    h.set("uReflect", sink);
    /* steam accelerates past the camera as the content leaves */
    setRush(1 + Math.min(p / 0.4, 1) * 3.2);
  });

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  /* The pour's resting brown was tuned for cream and goes muddy on the
     liquid. Only the two that need it are overridden, and both resolve to
     existing tokens — the meniscus keeps --color-pour-edge as authored. */
  const pourOnDark = {
    "--color-pour-rest": "rgba(255, 247, 240, 0.42)",
    "--color-pour-fill": "var(--color-orange)",
  } as CSSProperties;


  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-espresso-deep"
    >
      {/* ---------------- the scene ---------------- */}
      <LiquidSurface
        className="absolute inset-0 h-full w-full"
        active={active}
        onReady={onReady}
        onMouth={onMouth}
        onSubject={onSubject}
      />

      {/* Steam is its own canvas at half resolution — see SteamCanvas. It is
          unmounted rather than dimmed while another slide is up: it has its
          own rAF loop, and a plume nobody can see is pure battery. The
          crossfade covers the remount when this slide comes back. */}
      {active && (
        <div className="pointer-events-none absolute inset-0">
          <SteamCanvas origin={mouth} intensity={steam} rush={rush} />
        </div>
      )}

      {/* ---------------- the scrim ----------------
          Between the canvas and the copy, guaranteeing contrast whatever the
          noise does on a given frame. Heavy where the words are, gone by the
          time it reaches the flask. */}
      {/* Above md the copy is on the LEFT and the flask on the right, so the
          scrim is a radial anchored left. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:landscape:block"
        style={{
          background:
            "radial-gradient(76% 120% at 12% 50%, rgba(18,5,2,0.95) 0%, rgba(18,5,2,0.92) 45%, rgba(18,5,2,0.74) 62%, rgba(18,5,2,0.26) 80%, rgba(18,5,2,0) 100%)",
        }}
      />
      {/* Below md they are STACKED, copy over flask, so the scrim has to be
          too. A left-anchored radial on a phone darkened the left edge and
          left the copy's right-hand words sitting on open shader — and it
          also sat on top of the flask, which is now the bottom of the frame.
          Vertical: heavy through the copy, clearing by the base.

          IT WAS NOT CLEARING BY THE BASE, AND THAT IS WHAT LOOKED FADED.
          The old ramp held 0.86 at 66% and 0.58 at 82%. The plate stands in
          the bottom ~42% of the frame, so its top two thirds sat under an
          86%-black veil: the flask and the glass were THERE, they were just
          painted out. What that reads as on a phone is a big empty gap under
          the copy and a dim picture at the very bottom — which is exactly the
          two complaints, from one cause.

          The new ramp holds 0.93 across the copy, then falls off a cliff: 0.72
          by 62%, 0.34 by 73%, 0.12 by 84%. The copy keeps the same ground it
          had (its last element, the counter pill, sits above 55% on any phone
          taller than ~760px) and the plate gets the bottom third almost clean.

          The stops stay in PERCENT on purpose. On a short phone the copy runs
          further down the frame and the veil is correspondingly heavier where
          it lands — which is the behaviour you want, because below ~700px the
          copy genuinely does overlap the flask and legibility has to win. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 md:landscape:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(18,5,2,0.94) 0%, rgba(18,5,2,0.93) 50%, rgba(18,5,2,0.72) 62%, rgba(18,5,2,0.34) 73%, rgba(18,5,2,0.12) 84%, rgba(18,5,2,0.02) 100%)",
        }}
      />
      {/* Desktop only. On a phone this ramp sat exactly where the flask now
          stands and crushed its base to almost black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-60 md:landscape:block"
        style={{
          background:
            "linear-gradient(to top, rgba(18,5,2,0.9), rgba(18,5,2,0))",
        }}
      />

      {/* ---------------- the copy ---------------- */}
      {/* TOP-ALIGNED BELOW md, CENTRED ABOVE IT.
          justify-center split the leftover height in two and handed half of
          it to the top, which is what put ~140px of nothing under the header
          and another ~230px under the copy on a tall phone. Top-aligning
          collects ALL of the slack at the bottom in one piece, which is where
          the flask now sits — so the same space that read as a gap now reads
          as the photograph. Above md the copy shares the row with the flask
          rather than stacking above it, and centring is right again. */}
      {/* see the note in SlideLight: the split is gated on landscape, not on
          width, so a portrait tablet stacks instead of halving 1024px */}
      <div className="relative z-10 flex min-h-svh flex-col justify-start pb-[clamp(6rem,13vh,9rem)] pt-[calc(var(--header-h)+1.25rem)] md:landscape:justify-center md:landscape:pt-[calc(var(--header-h)+2rem)]">
        <motion.div
          className="shell-wide"
          style={reduced ? undefined : { y: copyY, opacity: copyFade }}
        >
          {/* Capped in vw as well as rem: at 1440 a fixed 43rem column runs
                into the chai glass, because the shell's gutter shrinks faster
                than the copy does.

                THE 48vw CAP IS A DESKTOP RULE AND NOW SAYS SO
                It used to apply at every width, which on a 375px phone left a
                180px column holding 37px type — every headline line overflowed
                sideways. Below md the flask is a background the copy sits on
                top of (that is what the radial scrim above is for), so there
                is nothing to stay clear of and the text takes the width.
                LiquidSurface duplicates this rule and skips its collision
                floor below md for the same reason. */}
            <div className="max-w-[min(34rem,90vw)] md:landscape:max-w-[min(58rem,48vw)]" style={pourOnDark}>
            {/* NO EYEBROW. It read "Workplace beverage service", which is a
                category label — and the headline directly under it already
                says the same thing in specifics ("delivered to your office").
                Slides 2 and 3 never had one, so the slide that did was the odd
                one out; the three now open the same way.

                It is worth 29px on a phone (17px of its own plus the 12px gap
                to the headline), which is most of a line of the subcopy in a
                frame that has none to spare. */}
            {/* Real DOM text at every stage — the masks and the highlight
                are decoration over it. Selectable, and complete in
                view-source. */}
            {/* Sized against the column, not chosen by eye. The column cap
                went 43rem -> 52rem when the hero moved onto .shell-wide, and
                the type followed it: the longest line ("Hot tea and filter
                coffee,") measures 484px at 1024, 681px at 1440 and 890px from
                1882 up, against a column of 491 / 691 / 914. The vw leg is
                what binds below 1756, the rem cap above it.

                The 48vw half of the cap is DELIBERATELY unchanged: it is what
                keeps the copy clear of the flask, and LiquidSurface duplicates
                min(928, w*0.48) for exactly that reason. Both move together or
                neither does.

                A FLAT FLOOR CANNOT WORK BELOW md, BECAUSE THE COLUMN MOVES
                A single clamp(2.05rem, 4.25vw, 5rem) held everywhere from
                768 up and wrapped on every phone made. Below md the column is
                90vw, so it shrinks with the window while a rem floor does not
                shrink at all: "Hot tea and filter coffee," is 11.13 em, so it
                needs 365px and the column only reaches that at 406px wide.
                Measured, it wrapped at 320, 360, 375, 390 and 393 — which is
                every common phone and none of the widths the old floor was
                checked against.

                So the floor is a vw ramp of its own below md. The cap is
                2.04rem rather than a round number: 4.25vw at 768 is 32.64px,
                so the mobile leg tops out at exactly what the desktop leg
                starts at and there is no step at the breakpoint. 7.2vw hits
                that cap at 453px and rides the column down below it — 296px
                of line in 320px of column at 360, 267 in 280 at 320. */}
            <h1 className="font-display text-[clamp(1.5rem,7.2vw,2.04rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-cream md:text-[clamp(2.05rem,4.25vw,5rem)]">
              {LINES.map((line, i) => (
                <span
                  key={line}
                  className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
                >
                  <motion.span
                    className={`block ${reduced ? "" : "hl-shimmer"}`}
                    initial={reduced ? false : { y: "112%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: LINE_DUR,
                      delay: i * LINE_GAP,
                      ease: EXPO,
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}

              {/* line four arrives as an orange outline, then fills */}
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  className="block"
                  initial={reduced ? false : { y: "112%" }}
                  animate={{ y: "0%" }}
                  transition={{
                    duration: LINE_DUR,
                    delay: LINES.length * LINE_GAP,
                    ease: EXPO,
                  }}
                >
                  <PourWord outline delay={T_LAST} duration={0.55}>
                    Twice a day.
                  </PourWord>
                </motion.span>
              </span>
            </h1>

            <motion.p
              {...rise(1.0)}
              /* 1.5 on a phone rather than 1.625: three lines at 16px, so the
                 looser figure spends 6px of a frame that has none to spare,
                 and at this measure 1.5 is still comfortably inside the range
                 that reads well. Above md it goes back to relaxed. */
              className="mt-4 max-w-[44ch] font-sans text-base leading-[1.5] text-cream/75 md:mt-6 md:text-lg md:leading-relaxed"
            >
              {/* "No machine to buy." USED TO OPEN THIS LINE AND IT HAD TO GO.
                  It is true of the flask service in isolation, but it is the
                  first promise a visitor reads on a site whose nav carries a
                  "Machines" link and whose section 04 exists to argue that
                  above 40 cups a day a machine is the answer. Opening with a
                  reason not to want one contradicts the page underneath it.

                  "No pantry staff" survives because it is true either way —
                  flask or machine, nobody on their payroll makes the tea. */}
              No pantry staff. We deliver at your timings and collect the
              empties.
            </motion.p>

            {/* THE THREE GAPS BELOW ARE TIGHTER THAN THEY WERE, ON PHONES ONLY.
                Measured across five phones, the copy column is ~520px tall on
                every one of them — the headline clamp barely moves between 360
                and 390 — while the photograph starts at a FIXED 52% of the
                frame, because LiquidSurface stands the plate 4% off the bottom
                at 44% of the height. So the shorter the phone, the further the
                copy runs into the picture: 91px of overlap at 390x844, 154px
                at 365x707, 178px on an SE.

                Rendered, that overlap is not abstract — the counter pill was
                landing at 74% of the frame, which is squarely on the splash,
                and the scrim has fallen to 0.30 by then so it sat on an almost
                clean photograph. A bordered chip floating over a picture reads
                as a mistake in a way that plain text over the same picture
                does not.

                Dropping one trust item and taking 4px out of each of the three
                gaps lifts the pill to 67%, where the scrim is still ~0.55 and
                the splash has not started. It is the last element either way —
                the point is only WHERE it lands.

                The md: overrides are untouched, so nothing above 768px moves. */}
            <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-8">
              <motion.a
                {...rise(1.08)}
                href="#pricing"
                className="hero-btn group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-orange px-5 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_12px_34px_-14px_rgba(242,101,34,0.95)] md:px-7 md:py-4"
              >
                <span className="relative z-10">Get pricing</span>
                <span
                  aria-hidden="true"
                  className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </motion.a>

              <motion.a
                {...rise(1.16)}
                href="#savings"
                className="hero-btn group relative inline-flex items-center overflow-hidden rounded-full border border-cream/25 px-5 py-3.5 font-sans text-sm font-semibold text-cream backdrop-blur-sm transition-colors duration-300 hover:border-cream/60 md:px-6 md:py-4"
              >
                <span className="relative z-10">Flasks or a machine?</span>
              </motion.a>
            </div>

            {/* mt-4/md:mt-8 and rise(1.26) were the TRUST row's, inherited when
                it was removed: the chip now sits where that row sat, at the gap
                the buttons have always had below them, and arrives on the beat
                the row used to — otherwise there is a dead 180ms after the
                buttons land and nothing following them. */}
            <motion.p
              {...rise(1.26)}
              /* This carried a `max-height:699px` rule that hid it outright on
                 the shortest phones, because at the time the copy still ended
                 at 72% and the splash began around 68%. Dropping the eyebrow
                 and "No machine to buy." took 53px out of the column, which is
                 more than the rule was buying: measured again at 375x667 the
                 copy now ends at 64% and the chip clears the splash on its
                 own. A special case that no longer does anything still costs
                 something — it silently withholds the counter from every small
                 phone — so it is gone rather than left in place. */
              /* IT YIELDS TO THE HEADER DOCK AT 1280, at the client's
                 direction — the badge belongs at the top of the page now.
                 It cannot simply move, because the bar has no room for it
                 below 1280 (the model is in Header.tsx): so above that width
                 the dock renders and this hides, below it this renders and
                 the dock hides. Exactly one at any width. Both read the same
                 lib/cups.ts value, so they cannot disagree. */
              className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-cream/15 bg-cream/[0.06] px-4 py-1.5 font-sans text-[0.82rem] text-cream/70 backdrop-blur-sm md:mt-8 md:py-2 min-[1280px]:hidden"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
              </span>
              <span className="tabular-nums">
                <strong className="font-semibold text-cream">
                  {shown.toLocaleString("en-IN")}+
                </strong>{" "}
                cups served this month
              </span>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
