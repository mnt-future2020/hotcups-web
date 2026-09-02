"use client";

import { useRef, useState } from "react";
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
 * The curve, the leader lines, their terminal dots, the food and the labels
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
   moving a stop moves the curve, the leader, the dot and the label together.

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
  /** the CATEGORY, over two lines. It is not what the photograph shows — see
      the note on STOPS — so it cannot double as the alt text. */
  name: [string, string?];
  /** what the photograph actually shows, for a reader who cannot see it */
  alt: string;
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

/* THE LABELS ALL HANG OUTWARD, AND THE BOTTOM-RIGHT STOP IS WHY.
   Its label was first placed to the LEFT of the food, which is inward — and
   inward at the bottom of a ring is the middle, where the hub used to be.
   Rendered, it sat directly on top of "Delivered with care." Every label
   points away from the centre, which is why nothing drifts into it — and it
   stays that way now the hub has gone, because a label pointing INWARD would
   run at an empty middle and read as broken aim. (The hub was four lines of
   type then and two by the end, which makes the clearance larger, not the
   rule less necessary.)

   The names have since become the mockup's categories, so the label that
   proved this is "Team Favourites" rather than "04 SAMOSA" — the geometry it
   established did not change with them.

   The route is drawn behind the food deliberately: a line that stops at each
   silhouette reads as five separate arrows, and one that passes behind reads
   as a single round with things sitting on it. */
/* !!  THE LABELS ARE CATEGORIES AND THE PHOTOGRAPHS ARE NOT.            !!
   !!  FOUR OF THE FIVE PAIRINGS ARE STAND-INS — NOT FINAL ART.          !!

   The client's mockup names five categories and shows five photographs made
   for them: an assorted cracker bowl, fried bondas, a fruit salad, a slider
   board and a cup of coffee. None of those five files exist. The only
   cut-outs on disk are the original snack set, so the NAMES here are the
   mockup's and the PICTURES are the nearest thing we own — which is a
   different claim in four places:

     Customised Snacks   butter biscuits   one biscuit, not an assortment
     Hot & Fresh         medhu vadai       honest — fried, hot, served warm
     Healthy Choices     banana chips      THE BAD ONE. Deep-fried, under a
                                           label promising the opposite.
     Team Favourites     a samosa          defensible, but it is one item
     Beverages ...       filter coffee     honest, and closest to the mockup

   "Healthy Choices" over banana chips is the pairing to fix first: it is not
   a weaker picture of a true claim, it contradicts the label. Dropping a
   fruit photograph in is a one-line change on that row.

   MURUKKU IS NO LONGER RENDERED. Five categories, five slots, and the vada
   took the one it used to hold. /img/snack-murukku.webp is still on disk and
   is the obvious candidate if a sixth stop is ever wanted.

   THE ROUND WAS TOO SMALL AND THE FOOD WITH IT. The first pass kept every
   stop inside about 80% of the square, which left a ring of empty cream all
   the way round and made five photographs of food look like clip art. The
   stops sit against the edges and each image is 5-6 points wider.

   THE LABELS ARE WHAT STOPS IT GOING FURTHER, and the constraint moved when
   the names did. It used to be "BANANA CHIPS" at lx 88 reaching ~99%; it is
   now "Choices" at the same lx, reaching about 96% — shorter because every
   name is deliberately split over two lines. That split is load-bearing, not
   styling: set on one line, "Beverages for Every Break" is wider than the
   diagram it is supposed to sit beside.

   THE BEVERAGE PLATE IS DERIVED, NOT NEW. /img/pantry-beverage.webp is
   menu-coffee.webp trimmed to its own alpha bounding box and resized to the
   snack set's 560px. The source carried 355px of empty pixels above the cup,
   and object-contain sizes by the BOX — so untrimmed it would have drawn the
   cup at two-thirds the mass of everything else and sitting low in its slot.
   Trimmed it is 560x458, between the vada and the murukku. Same treatment
   the snack set already had; menu-coffee.webp is untouched for section 02.

   TWO COORDINATES ARE SET BY A PHONE, NOT BY THE DESKTOP DRAWING. Both were
   measured at 390px, where the label type has bottomed out at its 0.7rem
   clamp floor while the square has gone on shrinking to 335px — so the words
   are at their largest RELATIVE to the diagram exactly where there is least
   room for them. Neither fault is visible on a desktop.

   healthy.lx IS 83, NOT 88. "Healthy Choices" ran to 102.2% of the square:
   past the right edge, into the shell's own gutter, and closer to the screen
   edge than anything else on the page. 83 brings it back to about 99% on a
   phone and 94% at 1920. The horizontal run of its leader is short as a
   result — three units — which is what the mockup draws for this stop too.

   beverages.ly IS 55, NOT 63. This is the one label that hangs BELOW its
   leader (see StopItem), so it grows down TOWARDS its own photograph rather
   than away from it: at 63 the second line reached 70.5% and the cup's box
   begins at 67.4%. It cleared only because that corner of the plate happens
   to be transparent — which stops being true the moment the photograph is
   replaced, and this table says in writing that it will be. 55 clears the
   box itself rather than the pixels that happen to be in it.

   Moving it up that far is what forced the leader's vertical run to be
   derived rather than fixed — see leaderFrom. */
const STOPS: Stop[] = [
  { key: "snacks",     name: ["Customised", "Snacks"],         alt: "A stack of butter biscuits",                      src: "/img/snack-biscuits.webp",  w: 560, h: 536, px: 31, py: 26, ix: 31, iy: 16, iw: 25, lx: 49, ly: 4,  side: "right" },
  { key: "hot",        name: ["Hot &", "Fresh"],               alt: "Two medhu vadai, freshly fried",                  src: "/img/snack-vada.webp",      w: 560, h: 421, px: 65, py: 34, ix: 68, iy: 26, iw: 24, lx: 85, ly: 15, side: "right" },
  { key: "healthy",    name: ["Healthy", "Choices"],           alt: "A heap of banana chips with curry leaves",        src: "/img/snack-chips.webp",     w: 560, h: 357, px: 79, py: 60, ix: 80, iy: 55, iw: 29, lx: 83, ly: 41, side: "right" },
  { key: "favourites", name: ["Team", "Favourites"],           alt: "A samosa",                                        src: "/img/snack-samosa.webp",    w: 560, h: 385, px: 58, py: 85, ix: 57, iy: 78, iw: 25, lx: 74, ly: 67, side: "right" },
  { key: "beverages",  name: ["Beverages", "for Every Break"], alt: "Filter coffee in a brass davara set, with beans", src: "/img/pantry-beverage.webp", w: 560, h: 458, px: 25, py: 87, ix: 23, iy: 78, iw: 26, lx: 5,  ly: 55, side: "left" },
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

/* WHERE A LEADER HAS TO START, DERIVED RATHER THAN GUESSED.

   The vertical run used to begin a flat 3.5 units below its label, which
   worked only because all five images happened to sit about that far under
   their labels. They no longer do: the beverage stop's label had to move up
   to 55 to keep clear of its own photograph, and a 3.5-unit stub from there
   stopped at y 58.5 with the cup's box beginning at 67.4 — nine units of
   nothing between the line and the thing it points at, which reads as a
   leader aimed at empty cream.

   The image's own top edge is knowable: iy is its centre and its height is
   iw scaled by the file's real aspect, so the top is one half-height up. The
   run starts 0.8 units inside that, which is enough to look attached without
   burying the line in the food.

   THE GUARD IS FOR THE TOP STOP. The biscuits sit at y 4.04 and their label
   at ly 4 — the image top is ABOVE the label, so the derivation alone would
   draw the stub upwards and the polyline would double back on itself. Two
   units below the label is the floor, which is what that stop drew before. */
/* `imgTop` and `leaderFrom` stood here. They derived a leader's starting
   height from the photograph's own box — iy for the centre, iw scaled by the
   file's real aspect for the half-height — so a leader began just inside the
   top edge of the thing it pointed away from. With no photographs and no
   leaders there is nothing left for either to measure. */

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
              From a quick snack to a customised spread, give your team
              something more to look forward to.
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
              Drinks and bites, customised for your team.
            </motion.p>

            <motion.div {...reveal(0.95)}>
              <a
                /* it said "See what's on the pantry menu" and scrolled UP to
                   the drinks — the one place on the page that is not the
                   pantry. /menu carries both halves, so the button now goes
                   where its own words say. */
                href="/menu"
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

        {/* THE JOINT RINGS ARE GONE, and the mockup is only half the reason.

            Five cream-filled, orange-stroked circles used to sit ON the route
            where each item met it. The mockup has no such marks — the curve
            runs clean behind the food — but "the reference does not have it"
            is not on its own a reason to delete something that was carrying
            information. What settles it is that the ring and the dot at the
            far end of the leader were both saying "there is a stop here", and
            the dot says it where the reader is actually looking: next to the
            words. Two markers for one fact, and the redundant one was also
            the one sitting under a photograph.

            The route still reads as a round with five things on it, because
            the five things are on it. */}

        {/* ---- NO LEADERS, NO TERMINAL DOTS ----

            Both existed to join a photograph to a name set some way off it.
            The names have moved ONTO the round, into the slots the food
            occupied, so there is no gap left to bridge — a leader would be a
            line from a point on the curve to a box already standing on that
            point. See the note in StopItem for why the boxes had to move
            rather than the leaders stay. */}
      </svg>

      {/* ---- THE HUB IS GONE, at the client's direction ----
          A mark in a turning dashed ring with "Delivered with care. / Enjoyed
          together." under it sat at the centre of the round. It had already
          lost its title and its rule; this is the rest of it.

          The centre is empty on purpose now rather than by accident. The
          orange route is a closed loop with five stops on it, so the shape
          reads as a round whether or not anything stands in the middle — the
          hub was always a label on something the drawing already said.

          Two knock-on notes for anyone putting something back: the five
          labels all hang AWAY from the centre (see the note on
          LABEL placement) because the hub used to own that space, and the
          route's own mass is not centred either — the food boxes run y 4 to
          89, so their middle is 46.5, not 50. */}

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

/* ---------------------------------------------------------------
   THE GLYPHS.

   The photographs came off and the boxes were bare, which made five
   identical rectangles that could only be told apart by reading them. These
   put the difference back without putting the photographs back.

   THEY ARE DRAWN, NOT PHOTOGRAPHED, AND THAT IS THE POINT. The plate behind
   this section is the client's own line art — biscuits, a bowl of fruit, a
   flask, a mug, all outline at a constant weight. Five photographs sat on top
   of that as a second, louder medium; five drawings belong to it. It is also
   the one thing no other section on the site does: 02 photographs its drinks,
   04 photographs its workplaces, 06 photographs its machines. This is the
   only one that draws.

   ONE STROKE, NO FILLS. `currentColor` so a glyph inherits its box's colour
   and shifts to orange with it on hover, one shared stroke width so the five
   read as a set, and round caps and joins because the plate's line art has
   them. 1.4 at a ~24px render is close to the plate's own weight at the size
   it is displayed.

   A 32-unit box for all five, so swapping one out later means matching one
   number rather than re-measuring the row.
   --------------------------------------------------------------- */
const GLYPH = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Glyph({ name, className }: { name: string; className?: string }) {
  /* aria-hidden throughout: the box already says the category in words, so a
     labelled glyph would have a screen reader announce it twice. */
  const common = { ...GLYPH, className, "aria-hidden": true as const };

  switch (name) {
    /* a stack of three biscuits seen from the side, with two holes pricked in
       the top one — the detail that stops it reading as a stack of coins */
    case "snacks":
      return (
        <svg {...common}>
          <ellipse cx="16" cy="9.5" rx="9" ry="3.3" />
          <path d="M7 9.5v3.4c0 1.8 4 3.3 9 3.3s9-1.5 9-3.3V9.5" />
          <path d="M7 15.2v3.4c0 1.8 4 3.3 9 3.3s9-1.5 9-3.3v-3.4" />
          <path d="M7 20.9v3.4c0 1.8 4 3.3 9 3.3s9-1.5 9-3.3v-3.4" />
          <path d="M13.2 8.8h.01M18.9 9.9h.01" />
        </svg>
      );

    /* a vada — a ring, with steam over it. The steam is what carries "Hot",
       and the ring is what stops it being any other hot thing. */
    case "hot":
      return (
        <svg {...common}>
          <circle cx="16" cy="20.5" r="7.8" />
          <circle cx="16" cy="20.5" r="2.5" />
          <path d="M11.2 9.4c0-1.6 1.5-1.9 1.5-3.5" />
          <path d="M16 8.8c0-1.8 1.7-2.1 1.7-3.8" />
          <path d="M20.8 9.4c0-1.6 1.5-1.9 1.5-3.5" />
        </svg>
      );

    /* a leaf. It is the one glyph that is not a dish, deliberately: the label
       says "Healthy Choices", and the photograph under that label was
       deep-fried banana chips. A leaf claims the category without claiming
       the contradiction. */
    case "healthy":
      return (
        <svg {...common}>
          <path d="M6.5 25.5C6.5 14 14 6.5 25.5 6.5c0 11.5-7.5 19-19 19Z" />
          <path d="M25.5 6.5 11 21" />
        </svg>
      );

    /* a samosa: triangle, bowed base, seam running off the apex.

       THE SEAM IS DIAGONAL BECAUSE A CENTRED ONE IS A WARNING SIGN. The first
       version ran it straight down the middle — `M16 5v20.9` — and a triangle
       with a vertical bar through it is the exclamation glyph every alert on
       the web uses. Rendered at 24px it read as a caution icon sitting in a
       box that says "Team Favourites", which is the opposite of the intended
       feeling. Taking the seam off-axis breaks that read instantly, and it is
       also where a samosa's fold actually is. */
    case "favourites":
      return (
        <svg {...common}>
          <path d="M16 5 27.5 25c-7.2 2.1-16.3 2.1-23 0L16 5Z" />
          <path d="M16 5.2 10.2 24.6" />
        </svg>
      );

    /* a cup with steam — the only stop that is a drink rather than a bite */
    case "beverages":
    default:
      return (
        <svg {...common}>
          <path d="M6.5 13.5h14.8v5.8a6 6 0 0 1-6 6h-2.8a6 6 0 0 1-6-6v-5.8Z" />
          <path d="M21.3 15.6h2.4a3 3 0 0 1 0 6h-2.4" />
          <path d="M11.6 9.6c0-1.5 1.4-1.8 1.4-3.3" />
          <path d="M16.4 9.2c0-1.7 1.6-2 1.6-3.7" />
        </svg>
      );
  }
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

  return (
    <li>
      {/* ---- THE BOX, STANDING WHERE THE FOOD STOOD ----

          The photographs are gone at the client's direction, and the name has
          taken the slot rather than staying out at its old label anchor. That
          is the whole reason this still reads as a round: the curve is drawn
          through px/py, the food sat 5-10 units off it at ix/iy, and a box in
          that same place is a thing sitting ON the route exactly as the food
          was.

          IT WAS BUILT THE OTHER WAY FIRST AND IT DID NOT WORK. Leaving the
          boxes at lx/ly and keeping the leaders turns the five slots the food
          vacated into five holes, loops the curve through empty space, and
          makes every leader a long line crossing the round to reach a box.
          The boxes have to take the food's place or the drawing has nothing
          in it.

          px/py — THE ROUTE POINT ITSELF, not ix/iy where the food stood.
          That difference is small in the table and large on screen. The food
          sat 5-10 units OFF the curve, and at the size a photograph rendered
          that offset was invisible: the plate simply overlapped the line. A
          box is a fraction of that size, so the same offset leaves a visible
          gap between the curve and the thing that is supposed to be standing
          on it — measured on the first pass, the top box floated clear of the
          line with the curve passing underneath it.

          Centred on px/py instead, the curve enters one edge of each box and
          leaves the other. They read as stations on a route rather than as
          five labels scattered near a line.

          ix/iy and lx/ly both stay in the table. Neither is read now; both
          record where the photographs and their callouts were, and restoring
          the photographs means restoring them.

          Centred on its point, so a box that grows with its text grows both
          ways and stays on the route instead of drifting off one side. */}
      <motion.div
        onMouseEnter={() => setLit(index)}
        onMouseLeave={() => setLit(null)}
        onFocus={() => setLit(index)}
        onBlur={() => setLit(null)}
        tabIndex={0}
        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-default rounded-[0.7rem] border px-4 py-2.5 text-center font-display text-[clamp(0.72rem,0.85vw,0.98rem)] font-semibold leading-[1.3] tracking-[-0.005em] outline-none backdrop-blur-[2px] transition-[background-color,border-color,color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-orange/50 ${
          isLit
            ? "border-orange-dark bg-cream text-orange-dark shadow-[0_6px_18px_-8px_rgba(58,20,14,0.45)]"
            : "border-line bg-cream/92 text-ink"
        }`}
        style={{
          left: `${stop.px}%`,
          top: `${stop.py}%`,
          /* the dim rides on a plain CSS transition rather than inside
             motion's `animate`: there it inherited the entrance's own delay
             and answered a hover up to three seconds late */
          opacity: dim ? 0.4 : 1,
          transition: "opacity 0.3s linear",
        }}
        initial={reduced ? false : { opacity: 0, scale: 0.86 }}
        animate={{
          opacity: on || reduced ? (dim ? 0.4 : 1) : 0,
          scale: on || reduced ? 1 : 0.86,
        }}
        transition={{ duration: 0.5, delay: at, ease: EASE }}
      >
        {/* The glyph carries the colour shift on hover and the label stays
            ink, so the box brightens without the words changing weight. It is
            the drawing that responds, which is the right way round — the text
            is what has to stay readable. */}
        <Glyph
          name={stop.key}
          className={`mx-auto mb-1.5 block h-[clamp(19px,2.1vw,26px)] w-[clamp(19px,2.1vw,26px)] transition-colors duration-300 ${
            isLit ? "text-orange-dark" : "text-orange-dark/65"
          }`}
        />
        <span className="whitespace-nowrap">
          {stop.name[0]}
          {stop.name[1] && (
            <>
              <br />
              {stop.name[1]}
            </>
          )}
        </span>
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

