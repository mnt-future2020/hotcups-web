"use client";

import { useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Section 03 — The pantry.
 *
 * IT IS A ROUTE, NOT A ROW
 * The argument is that the snacks ride along on a delivery already happening,
 * so the section draws the round: in at "We prepare", clockwise past the five
 * things it carries, out at "We deliver". A row of food would have said "we
 * sell snacks"; a path says "on the same trip", which is the only claim worth
 * making here.
 *
 * The two ends are a VERB EACH, and that is what turns a diagram into a
 * promise. "Flask round" and "Ready for the team" both described a state; the
 * pills are the only two places on the page where the company is the subject
 * of the sentence, so they now say what it does.
 *
 * It is also the fifth product section on this page, after four glasses, three
 * machines, three cases and three posts — all of them rows. A diagram is the
 * one shape none of them has.
 *
 * EVERY COORDINATE IS IN ONE TABLE, IN ONE SPACE
 * The curve, the joint rings, the leader lines, the food and the labels all
 * live in the same 0-100 square: the SVG uses it as a viewBox, the HTML uses
 * it as percentages. That is what keeps a leader line pointing at the thing it
 * belongs to at every window size — nothing is positioned twice, so nothing
 * can be positioned inconsistently.
 *
 * THE PATH DRAWS ITSELF AND THE STOPS ARRIVE AS IT REACHES THEM
 * motion animates `pathLength` on the path directly, and each stop's delay is
 * its own position ALONG that path rather than a hand-typed number — see
 * `arriveAt`. Reorder the stops and the timing follows them; type the delays
 * in by hand and the second edit desynchronises it.
 *
 * NOTHING HERE IS EVER STILL
 * The food floats, each item on its own duration and its own negative delay so
 * the five are out of phase on frame one and never resynchronise — the rule
 * CardSteam is built on, because things pulsing together is the fastest way to
 * look synthetic. The hub's ring turns once a minute. The shadow under each
 * item answers its float, tightening and paling as it lifts, because a float
 * over a fixed shadow reads as a sticker sliding rather than as an object with
 * air beneath it.
 *
 * THE ARTWORK IS THE CLIENT'S, PROCESSED — see the note on STOPS.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------
   THE ROUTE.

   Seven points in the 0-100 square, in travel order: the entry pill, five
   stops, the exit pill. `d` is built from these rather than hand-written, so
   moving a stop moves the curve, the ring, the leader and the label together.

   !!  THE RANGE IS PLAUSIBLE, NOT CONFIRMED BY THE CLIENT, AND CARRIES NO
       PRICES — section 05 already holds every invented rupee this site can
       afford, and the argument here is consolidation rather than catalogue.

   THE IMAGES ARE THE CLIENT'S, PROCESSED. Supplied as 9.1MB of PNG at up to
   1536px for something never shown above ~200px, and two of the five — banana
   chips and samosa — arrived with a flat near-white background baked in as
   OPAQUE pixels rather than an alpha channel, which would have shown as white
   boxes on the cream. Those two were keyed on saturation (the food is
   saturated, the background was not); all five were trimmed to their own
   content so the box IS the object. The set is 427KB of WebP. The originals
   are untouched on disk.
   --------------------------------------------------------------- */
type Stop = {
  key: string;
  n: string;
  name: [string, string?];
  src: string;
  /** the file's real pixels — drives aspect-ratio, so nothing is letterboxed */
  w: number;
  h: number;
  /** where the route passes, 0-100 */
  px: number;
  py: number;
  /** the food's centre, and its width as a % of the square */
  ix: number;
  iy: number;
  iw: number;
  /** the label's anchor, and which side it hangs off */
  lx: number;
  ly: number;
  side: "left" | "right";
};

/* THE LABELS ALL HANG OUTWARD, AND SAMOSA'S IS WHY.
   It was first placed to the LEFT of the samosa, which is inward — and inward
   at the bottom of a ring is the middle, where the hub is. Rendered, "04
   SAMOSA" sat directly on top of "Delivered with care." Every label points
   away from the centre now, so the hub owns the middle and nothing can drift
   into it. (The hub was four lines of type then and is two now, which makes
   the clearance larger, not the rule less necessary.)

   The route is drawn behind the food deliberately: a line that stops at each
   silhouette reads as five separate arrows, and one that passes behind reads
   as a single round with things sitting on it. */
/* THE ROUND WAS TOO SMALL AND THE FOOD WITH IT. The first pass kept every
   stop inside about 80% of the square, which left a ring of empty cream all
   the way round and made five photographs of food look like clip art. The
   stops now sit against the edges and each image is 5-6 points wider.

   The labels are what stops it going further: "BANANA CHIPS" is the widest,
   and at lx 88 it runs to about 99% of the square. That is the real ceiling
   on the arc's radius, not the arc itself. */
const STOPS: Stop[] = [
  { key: "biscuits", n: "01", name: ["Butter", "biscuits"], src: "/img/snack-biscuits.webp", w: 560, h: 536, px: 31, py: 26, ix: 31, iy: 16, iw: 25, lx: 49, ly: 4, side: "right" },
  { key: "murukku", n: "02", name: ["Murukku"], src: "/img/snack-murukku.webp", w: 560, h: 449, px: 65, py: 34, ix: 68, iy: 26, iw: 24, lx: 85, ly: 15, side: "right" },
  { key: "chips", n: "03", name: ["Banana", "chips"], src: "/img/snack-chips.webp", w: 560, h: 357, px: 79, py: 60, ix: 80, iy: 55, iw: 29, lx: 88, ly: 41, side: "right" },
  { key: "samosa", n: "04", name: ["Samosa"], src: "/img/snack-samosa.webp", w: 560, h: 385, px: 58, py: 85, ix: 57, iy: 78, iw: 25, lx: 74, ly: 67, side: "right" },
  { key: "vada", n: "05", name: ["Medhu", "vada"], src: "/img/snack-vada.webp", w: 560, h: 421, px: 25, py: 87, ix: 23, iy: 78, iw: 28, lx: 4, ly: 63, side: "left" },
];

/* the entry and the exit — the two ends of the round.

   ENTRY IS AT 38, NOT 22, AND THAT IS A PHONE MEASUREMENT.
   The pill's type bottoms out at 0.6rem while the square keeps shrinking, so
   the pill is about 15% of the diagram on a desktop and about 26% of it on a
   393px phone. At y=22 that wider pill spanned y 16.8-27.2 against a biscuit
   box of y 4-28 — a real overlap, which is why the arrow was buried in the
   crumbs. At 38 it clears the biscuits by 4.8% and the hub's left edge by
   5.4%, at every width, and on a desktop it simply moves down an empty
   corner.

   One ENTRY rather than a responsive pair: the curve, the joints, the leaders
   and the labels are all derived from this table, so a breakpoint-dependent
   coordinate would need a second path, a second set of joints and a second set
   of delays. The whole reason this diagram stays correct is that nothing is
   positioned twice. */
const ENTRY = { x: 2, y: 38 };
const EXIT = { x: 92, y: 96 };

/* THE CURVE, BUILT FROM THE TABLE. A Catmull-Rom spline through the seven
   points, converted to the cubic beziers SVG understands — which is the only
   way to get one smooth line through hand-placed stops without hand-tuning
   twelve control points and re-tuning them all every time one stop moves.

   TENSION IS 0.26 BECAUSE OF THE RETURN LEG. At 0.42 the tangent into the
   last stop was long enough that the line swung out past the vada before
   coming back for it — a visible hook at the bottom-left. Lower tension pulls
   the curve closer to the points it is threading, which costs a little of the
   sweep through the top three and buys a clean bottom. */
function routeD(pts: { x: number; y: number }[], tension = 0.26) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 3;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 3;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 3;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const ROUTE = [ENTRY, ...STOPS.map((s) => ({ x: s.px, y: s.py })), EXIT];
const ROUTE_D = routeD(ROUTE);

/* the beat sheet. The path takes DRAW seconds; a stop arrives when the line
   reaches it, which is its index over the number of segments. */
const T_PATH = 0.75;
const DRAW = 2.1;
const arriveAt = (i: number) => T_PATH + (DRAW * (i + 1)) / (ROUTE.length - 1);
const T_EXIT = T_PATH + DRAW;

export default function Pantry() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, once: true });
  const on = inView || Boolean(reduced);
  const [lit, setLit] = useState<number | null>(null);

  const reveal = (delay: number, y = 16) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  return (
    <section
      ref={ref}
      id="pantry"
      /* min-h-svh, AND THAT IS THE FIX FOR "I CAN SEE THE NEXT SECTION".
         It was sized by its content, so on a tall window it ended part-way up
         the screen and section 04 sat underneath it in the same view. Section
         04 already takes a whole screen this way; this one now does too, so
         each is looked at on its own.

         safe_center rather than center: on a short laptop the round plus the
         copy can exceed the viewport, and plain centring would push the top of
         the section above the scroll origin where it cannot be reached.
         `safe` falls back to start-aligned exactly in that case. */
      className="relative flex min-h-svh flex-col [justify-content:safe_center] overflow-x-clip"
      style={{
        /* THE CLIENT'S DOODLE PLATE, AT FULL STRENGTH — AND THAT IS MEASURED.
           It replaces a radial gradient. Background art on this site is
           normally faded hard (the footer's doodle runs at 0.09) because it
           sits under text, so the first instinct was to do the same here. The
           measurements said not to: only 1.6% of this plate's pixels are
           darker than its own ground, its darkest line is 2.16:1 against that
           ground, and the site's body ink over that darkest pixel still holds
           7.39:1 — comfortably past the 4.5 body copy owes. It is already
           drawn as a background. Fading it would only throw away the drawing.

           1802KB of PNG became 26KB of WebP at 1600x900. Flat line art on a
           flat ground is the best case there is for WebP; the source PNG is
           still on disk, unreferenced.

           NOT bg-cream-deep, WHICH IS WHAT SECTION 04 IS. The two grounds were
           identical, so the boundary between them was invisible, and section
           04's empty upper half read as dead space belonging to this one. This
           plate's ground is warmer than the flat #fdefe3 below it, so the seam
           shows without needing a rule.

           cover, not the 100%-auto that section 09's plate takes. That one has
           two road signs pinned at 7% and 97% which a horizontal crop destroys;
           this one is a scatter with a deliberately empty middle, so losing a
           little off the sides costs nothing and cover can never letterbox.
           The backgroundColor is the plate's own mean, so the paint before it
           loads is the colour it is about to become. */
        /* THE SCRIM IS A SECOND BACKGROUND LAYER, NOT A DIV.
           CSS cannot fade a background-image on its own, so the usual fix is
           an absolutely positioned layer carrying `opacity`. A second entry in
           the same backgroundImage list does it with no extra element and no
           extra stacking context — the gradient is listed FIRST because in a
           multi-background list the first layer paints on top.

           IT IS TOP-WEIGHTED, BECAUSE THE TOP IS WHERE THE LOUD ONES ARE.
           The biscuit stack, the murukku spiral and the chips bowl all sit in
           the upper third, which is also where the headline and the first two
           stops are. Measured against its own ground, the darkest line up
           there reads 1.87:1 bare; under 0.46 it is 1.39:1 — still drawn, no
           longer competing. The scrim eases to 0.22 by the base, so the vada,
           the samosa and the flask crate down there keep most of their weight.

           It costs nothing in legibility, and in fact buys some: the site's
           body ink over that same darkest pixel goes from 8.54:1 to 11.3:1,
           because the scrim lightens what the text is sitting on. */
        backgroundColor: "#f8e7d2",
        backgroundImage:
          "linear-gradient(to bottom, rgba(248,231,210,0.46) 0%, rgba(248,231,210,0.34) 34%, rgba(248,231,210,0.22) 100%), url(/img/pantry-doodles.webp)",
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        paddingTop: "clamp(2.75rem, 6.5vh, 5rem)",
        paddingBottom: "clamp(2.75rem, 6.5vh, 5rem)",
      }}
    >
      <div className="shell">
        <div className="grid grid-cols-1 items-center gap-y-[clamp(2rem,5vh,3.5rem)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-[clamp(1.5rem,4vw,4rem)]">
          {/* ═══════════════ the argument ═══════════════ */}
          <div className="max-w-[36rem]">
            <motion.div {...reveal(0.05, 0)} className="flex items-center gap-4">
              <span className="eyebrow whitespace-nowrap">
                <span className="text-orange-dark">03</span> — The pantry
              </span>
              <motion.span
                initial={reduced ? undefined : { scaleX: 0 }}
                animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: "linear" }}
                className="h-px w-16 origin-left bg-line"
              />
            </motion.div>

            <h2 className="mt-5 font-display text-[clamp(2.05rem,4.05vw,3.7rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-ink">
              {["The break doesn’t", "stop at the cup."].map((line, i) => (
                <span
                  key={line}
                  className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
                >
                  <motion.span
                    initial={reduced ? false : { y: "112%" }}
                    animate={{ y: on || reduced ? "0%" : "112%" }}
                    transition={{
                      duration: 0.9,
                      delay: 0.15 + i * 0.09,
                      ease: EASE,
                    }}
                    className={`block ${i > 0 ? "text-orange-dark" : ""}`}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h2>

            <motion.span
              aria-hidden="true"
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: on || reduced ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: EASE }}
              className="mt-8 block h-[3px] w-[5rem] origin-left rounded-full bg-orange-dark"
            />

            <motion.p
              {...reveal(0.55)}
              className="mt-6 max-w-[30rem] font-sans text-[clamp(1.05rem,1.35vw,1.3rem)] leading-relaxed text-ink-soft"
            >
              From a quick biscuit to a hot samosa, give your team something
              more to look forward to.
            </motion.p>

            <motion.p
              {...reveal(0.8)}
              className="mt-8 font-display text-[clamp(1.2rem,1.7vw,1.6rem)] font-extrabold tracking-[-0.025em] text-ink"
            >
              Tea break, sorted.
            </motion.p>
            <motion.p
              {...reveal(0.86)}
              className="mt-1.5 font-sans text-[clamp(1rem,1.3vw,1.25rem)] text-orange-dark"
            >
              Drinks and bites, on the same round.
            </motion.p>

            <motion.div {...reveal(0.95)}>
              <a
                href="#menu"
                className="hero-btn group relative mt-7 inline-flex items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border border-orange-dark/45 px-7 py-[1.15rem] font-sans text-[clamp(0.78rem,0.92vw,0.88rem)] font-bold uppercase tracking-[0.12em] text-orange-dark transition-colors duration-300 hover:border-orange focus-visible:border-orange"
              >
                <span className="relative z-10">See what&rsquo;s on the pantry menu</span>
                <span
                  aria-hidden="true"
                  className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </a>
            </motion.div>
          </div>

          {/* ═══════════════ the round ═══════════════ */}
          <Round on={on} reduced={Boolean(reduced)} lit={lit} setLit={setLit} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   The diagram.

   ONE SQUARE, TWO LAYERS. The SVG carries everything drawn — the route, the
   rings, the dotted leaders — and the HTML carries everything readable: the
   food, the numbers, the names, the two pills, the hub. They share the 0-100
   space, so the two layers cannot drift apart.

   The SVG is aria-hidden and non-interactive; the list beneath it is the real
   content, so a screen reader gets five named items in travel order rather
   than a description of a picture.
   --------------------------------------------------------------- */
function Round({
  on,
  reduced,
  lit,
  setLit,
}: {
  on: boolean;
  reduced: boolean;
  lit: number | null;
  setLit: (n: number | null) => void;
}) {
  return (
    <div /* THE ROUND HANGS A LITTLE LOW. Optically its weight is in the top
           two-thirds — the biscuits and the murukku are the biggest things in
           it and both sit above the middle, while the bottom of the square is
           mostly the exit pill and air. Centred by the box it looked high;
           dropped 4% of its own height it sits level with the copy. */
        /* max-h AS WELL AS max-w, BECAUSE THE SECTION IS NOW min-h-svh.
           The square is sized by the COLUMN's width, so on a wide short laptop
           — 1440x800 — it wanted 736px of height in a viewport with about 640
           to give, and the section would have grown past the screen it is
           supposed to fit. aspect-square plus a max-height hands the width back
           instead: the height cap decides and the square shrinks to suit. */
        className="relative mx-auto aspect-square max-h-[68svh] w-full max-w-[46rem] lg:translate-y-[3%]">
      {/* ---- drawn layer ---- */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {/* THERE ARE NO RIPPLE RINGS, AND THAT WAS TESTED RATHER THAN
            ASSUMED. Three faint circles used to sit under the hub, on the
            grounds that the middle of a round otherwise reads as a hole.
            Rendered with guides they were the reason the hub looked
            off-centre: the hub is 148px of content and the outer ring was
            310px across, so it was mathematically concentric and visually
            adrift in a large empty halo. Centring the rings on the GLYPH
            instead is worse — the four lines of type then hang out of the
            bottom. To actually enclose a 34%-by-24% block the rings would
            need a radius of at least 21, which runs into the food.

            The route already encircles the hub, which is what defines a
            centre here. The rings were adding a second, competing one. */}

        {/* the route */}
        <motion.path
          d={ROUTE_D}
          fill="none"
          stroke="var(--color-orange-dark)"
          strokeWidth="0.42"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: on || reduced ? 1 : 0 }}
          transition={{ duration: DRAW, delay: T_PATH, ease: "easeInOut" }}
        />

        {/* NO SPARKS OVER THE EXIT. Three short strokes used to fan above the
            last pill, lifted from the reference. Every other mark in this
            square carries information — the route is the trip, the joints are
            where it stops, the leaders point at what is there. The sparks were
            the one decoration, and next to a pill that now says WE DELIVER
            they were a second, weaker way of saying the same thing. */}

        {STOPS.map((s, i) => (
          <g key={s.key}>
            {/* the joint, sitting ON the line where the food meets it */}
            <motion.circle
              cx={s.px}
              cy={s.py}
              r="1.05"
              fill="var(--color-cream-deep)"
              stroke="var(--color-orange-dark)"
              strokeWidth="0.4"
              initial={reduced ? false : { scale: 0, opacity: 0 }}
              animate={{
                scale: on || reduced ? 1 : 0,
                opacity: on || reduced ? 1 : 0,
              }}
              transition={{ duration: 0.4, delay: arriveAt(i), ease: EASE }}
              style={{ transformOrigin: `${s.px}px ${s.py}px` }}
            />
            {/* the leader: up out of the food, then across to its label. An L
                rather than a diagonal — a diagonal reads as a pointer, an L
                reads as a callout, and the reference is a callout. */}
            <motion.polyline
              points={`${s.ix} ${s.ly + 3.5} ${s.ix} ${s.ly} ${s.lx + (s.side === "right" ? -2.5 : 2.5)} ${s.ly}`}
              fill="none"
              stroke="var(--color-mute)"
              strokeWidth="0.28"
              strokeDasharray="1 1"
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: on || reduced ? 1 : 0,
                opacity: on || reduced ? (lit !== null && lit !== i ? 0.35 : 1) : 0,
              }}
              transition={{ duration: 0.45, delay: arriveAt(i) + 0.1, ease: EASE }}
            />
          </g>
        ))}
      </svg>

      {/* ---- the hub ---- */}
      {/* 46%, AND THE NUMBER MOVED BECAUSE THE BLOCK GOT SHORTER.
          It was 44%: with the title and its rule in place the hub was about
          151px tall in a 640px square, four lines of type hanging below the
          glyph, and a hub centred at 50% ran its last line into the samosa.
          Without them it is about 111px, so it spans 40.3% to 51.7% at 46 and
          the reason for sitting high is gone. 46 rather than 50 because the
          route's own mass is not centred either — the food boxes run y 4 to
          89, so their middle is 46.5. */}
      <motion.div
        className="absolute left-1/2 top-[46%] w-[34%] -translate-x-1/2 -translate-y-1/2 text-center"
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: on || reduced ? 1 : 0,
          scale: on || reduced ? 1 : 0.9,
        }}
        transition={{ duration: 0.8, delay: 0.45, ease: EASE }}
      >
        <span
          aria-hidden="true"
          className="relative mx-auto grid h-[3.4rem] w-[3.4rem] place-items-center rounded-full bg-orange-soft"
        >
          {/* the ring turns once a minute — slow enough that you never catch
              it moving and fast enough that the hub is never a still shape */}
          <span
            className="absolute -inset-[0.55rem] rounded-full border border-dashed border-orange-dark/25"
            style={
              reduced ? undefined : { animation: "pantry-ring 60s linear infinite" }
            }
          />
          <FlaskGlyph />
        </span>
        {/* THE TITLE IS GONE, AND THE RULE WENT WITH IT.
            "The pantry round" sat here in caps above a hairline that separated
            it from the caption below. Removing the title leaves that rule
            separating one thing from nothing, so it goes too — a divider needs
            two sides. What is left is the mark and its caption, which is the
            whole hub the diagram actually needs: the route already says it is
            a round, so naming it was the label on a label. */}
        <p className="mt-4 font-sans text-[clamp(0.7rem,0.82vw,0.8rem)] leading-[1.6] text-ink-soft">
          Delivered with care.
          <br />
          Enjoyed together.
        </p>
      </motion.div>

      {/* ---- the two ends ---- */}
      <Pill x={ENTRY.x} y={ENTRY.y} label="We prepare" on={on} reduced={reduced} delay={T_PATH - 0.25} anchor="start" />
      <Pill x={EXIT.x} y={EXIT.y} label="We deliver" on={on} reduced={reduced} delay={T_EXIT} anchor="end" solid />

      {/* ---- the stops ---- */}
      <ul>
        {STOPS.map((s, i) => (
          <StopItem
            key={s.key}
            stop={s}
            index={i}
            on={on}
            reduced={reduced}
            lit={lit}
            setLit={setLit}
          />
        ))}
      </ul>
    </div>
  );
}

function StopItem({
  stop,
  index,
  on,
  reduced,
  lit,
  setLit,
}: {
  stop: Stop;
  index: number;
  on: boolean;
  reduced: boolean;
  lit: number | null;
  setLit: (n: number | null) => void;
}) {
  const isLit = lit === index;
  const dim = lit !== null && !isLit;
  const at = arriveAt(index);

  /* every item on its own clock. Deterministic from the index, never random —
     a random duration differs between the server render and the client and
     hydrates wrong. The negative delay starts them already out of phase. */
  const dur = (6.6 + index * 0.8).toFixed(1);
  const lag = (-index * 1.4).toFixed(1);

  return (
    <li>
      {/* the food */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${stop.ix}%`,
          top: `${stop.iy}%`,
          width: `${stop.iw}%`,
          opacity: dim ? 0.42 : 1,
          transition: "opacity 0.3s linear",
        }}
        initial={reduced ? false : { opacity: 0, scale: 0.78 }}
        animate={{
          opacity: on || reduced ? (dim ? 0.42 : 1) : 0,
          scale: on || reduced ? 1 : 0.78,
        }}
        transition={{ duration: 0.6, delay: at, ease: EASE }}
      >
        <div
          className="relative w-full"
          style={{ aspectRatio: `${stop.w} / ${stop.h}` }}
        >
          {/* the shadow answers the float — a float over a fixed shadow reads
              as a sticker sliding, not as an object with air under it. It
              carries its own centring inside the keyframe, because a keyframe
              on `transform` has to be that element's only writer. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[6%] left-1/2 h-[8%] w-[54%] rounded-[50%] bg-[#6b4324] blur-[6px]"
            style={
              reduced
                ? { transform: "translateX(-50%)", opacity: 0.22 }
                : { animation: `pantry-shadow ${dur}s ease-in-out ${lag}s infinite` }
            }
          />
          <div
            style={
              reduced
                ? undefined
                : ({
                    animation: `pantry-float ${dur}s ease-in-out ${lag}s infinite`,
                    ["--rise" as string]: `${5 + (index % 3)}px`,
                  } as CSSProperties)
            }
          >
            <div
              className={`relative transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isLit ? "scale-[1.07]" : ""
              }`}
              style={{ aspectRatio: `${stop.w} / ${stop.h}` }}
            >
              <Image
                src={stop.src}
                alt={stop.name.filter(Boolean).join(" ")}
                fill
                sizes="(max-width: 1024px) 26vw, 190px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* the number and the name */}
      <motion.div
        onMouseEnter={() => setLit(index)}
        onMouseLeave={() => setLit(null)}
        onFocus={() => setLit(index)}
        onBlur={() => setLit(null)}
        tabIndex={0}
        className={`absolute cursor-default rounded outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-orange/50 ${
          dim ? "opacity-45" : "opacity-100"
        } ${stop.side === "right" ? "text-left" : "text-left"}`}
        style={{
          left: `${stop.lx}%`,
          top: `${stop.ly}%`,
          transform: "translateY(-0.35em)",
        }}
        initial={reduced ? false : { opacity: 0, x: stop.side === "right" ? -6 : 6 }}
        animate={{
          opacity: on || reduced ? (dim ? 0.45 : 1) : 0,
          x: on || reduced ? 0 : stop.side === "right" ? -6 : 6,
        }}
        transition={{ duration: 0.5, delay: at + 0.18, ease: EASE }}
      >
        <p
          className={`font-display text-[clamp(0.85rem,1.15vw,1.1rem)] font-extrabold leading-none tracking-[-0.01em] transition-colors duration-300 ${
            isLit ? "text-orange" : "text-orange-dark"
          }`}
        >
          {stop.n}
        </p>
        <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(0.68rem,0.88vw,0.85rem)] font-extrabold uppercase leading-[1.3] tracking-[0.06em] text-ink">
          {stop.name[0]}
          {stop.name[1] && (
            <>
              <br />
              {stop.name[1]}
            </>
          )}
        </p>
      </motion.div>
    </li>
  );
}

/* the two ends of the round. `anchor` decides which corner sits on the route,
   so the pill hangs off the line rather than sitting astride it.

   THE ANCHOR SHIFT IS A MOTION VALUE, AND IT HAS TO BE.
   It was `style={{ transform: "translate(-100%,-50%)" }}`, and it silently did
   nothing: motion writes `transform` for its own scale, so the built markup
   read `transform:scale(0.85)` and the -100% was gone. The exit pill was
   therefore placed by its LEFT edge at x=92 and ran off the right of the
   screen — invisible on a wide desktop, a clipped WE DEL on a phone.

   The vertical half only survived because Tailwind v4 splits the transform
   utilities: `-translate-y-1/2` writes the standalone `translate` property,
   which motion never touches. That split is exactly what made the bug look
   like a mobile-only overflow rather than a dropped declaration — the pill was
   vertically right and horizontally wrong.

   Rule for this file: if motion animates the element, motion owns `transform`
   entirely. Nothing else may write it. */
function Pill({
  x,
  y,
  label,
  on,
  reduced,
  delay,
  anchor,
  solid = false,
}: {
  x: number;
  y: number;
  label: string;
  on: boolean;
  reduced: boolean;
  delay: number;
  anchor: "start" | "end";
  solid?: boolean;
}) {
  /* -100% of the pill's OWN width, so the route point lands on its right edge */
  const shift = anchor === "end" ? "-100%" : "0%";

  return (
    <motion.span
      aria-hidden="true"
      /* TIGHTER CHROME BELOW sm, BECAUSE THE TYPE CANNOT GET SMALLER.
         The font clamp bottoms out at 0.6rem and the padding was a fixed 12px,
         so as the square shrank the pill kept its pixels and took a bigger and
         bigger share of it: about 15% of the diagram on a desktop, about 29% on
         a 393px phone. Half of that growth is chrome rather than words, and
         chrome is the half that can be given back. */
      className={`absolute inline-flex -translate-y-1/2 items-center gap-1.5 rounded-[0.7rem] border px-2 py-2 font-display text-[clamp(0.6rem,0.75vw,0.72rem)] font-extrabold uppercase leading-[1.3] tracking-[0.1em] sm:gap-2 sm:px-3 sm:py-2.5 ${
        solid
          ? "border-orange-dark bg-orange-soft text-orange-dark"
          : "border-orange-dark/45 bg-cream text-orange-dark"
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={reduced ? false : { opacity: 0, scale: 0.85, x: shift }}
      animate={{
        opacity: on || reduced ? 1 : 0,
        scale: on || reduced ? 1 : 0.85,
        x: shift,
      }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {/* nowrap, not pre: the exit used to be "Ready for / the team" and needed
          a literal newline honoured. Both ends are two words on one line now,
          and identical in length, so the pair reads as one instruction split
          across the round rather than as two unrelated captions. */}
      <span className="whitespace-nowrap">{label}</span>
      <span>&rarr;</span>
    </motion.span>
  );
}

/* the hub's mark. Stroke-only at 1.6, the same drawing language as the
   footer's phone/mail/pin, so it reads as part of the site rather than as
   clip art dropped into the middle of a diagram. */
function FlaskGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="relative h-7 w-7 text-orange-dark"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7.5" y="6" width="9" height="15" rx="2.2" />
      <path d="M9.5 6V4.4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" />
      <path d="M7.5 10.5h9" />
    </svg>
  );
}
