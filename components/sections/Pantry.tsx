"use client";

import { useId, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Section 03 — The pantry.
 *
 * IT IS A LIST WITH A ROUTE BESIDE IT, AND IT USED TO BE A ROUTE WITH FOOD ON
 * IT. The section spent most of its life as a diagram: a Catmull-Rom curve
 * through seven points in a 0-100 square, five photographs sitting on the
 * stops, leader lines out to their names, joint rings, a hub in the middle.
 * The client's mockup replaces all of it with five stacked entries, a rule and
 * a dot between each, and the route reduced to a dashed line running down the
 * gutter. This file is that mockup.
 *
 * WHAT THE CHANGE ACTUALLY BUYS, since a diagram was the harder thing to
 * build: every entry now gets a SENTENCE. The round could carry a two-word
 * category and nothing else — anything longer collided with the food, the
 * leader or the next label, which is why the names were split over two lines
 * in the first place. A list has as much room as it needs, so "Healthy
 * Choices" can say what it means instead of leaving a photograph to imply it.
 *
 * AND IT SETTLES THE PHOTOGRAPH PROBLEM BY DELETING IT. Four of the five
 * pairings on the round were stand-ins, and one of them — "Healthy Choices"
 * over deep-fried banana chips — contradicted its own label. There is no
 * picture to contradict anything now. The five files are untouched on disk and
 * still rendered by /menu, so nothing is orphaned.
 *
 * THE ROUTE SURVIVES AS THE RAIL, which is the one idea worth keeping: the
 * argument here is that the snacks ride along on a delivery already happening,
 * so the section still draws a line from "We prepare" at the top to "We
 * deliver" at the bottom, and the entries still arrive as the line reaches
 * them. It is a margin now rather than the subject.
 *
 * THE TWO ENDS ARE A VERB EACH. That was true of the pills on the round and is
 * true of the handwritten marks that replace them: they are the only two
 * places on the page where the company is the subject of the sentence.
 *
 * THE ARTWORK BEHIND IT IS THE CLIENT'S — see the note on the background.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------------------------------------------------------------
   THE FIVE ENTRIES.

   NAMES AND SENTENCES ARE BOTH THE CLIENT'S, off the mockup. Nothing here is
   an operational claim: no schedule, no count, no price, no named supplier.
   That matters more on this section than on most, because section 03 is the
   one that sells an idea rather than a fact, and the site's standing rule is
   that copy may not invent facts about a real company. "Made daily" is the
   closest any of it comes, and it is the client's own wording.

   THE SENTENCE IS TWO AUTHORED LINES, NOT ONE STRING LEFT TO WRAP.
   Four of the five break at a full stop — "Made daily." / "Always fresh,
   always delicious." — which no wrapping algorithm will find. Set as one
   string at the width the mockup draws, the second entry breaks after
   "always" and reads as a stray. Each line still wraps within itself on a
   narrow screen, so this costs nothing below lg.

   THE PRICES ARE STILL ABSENT AND STILL DELIBERATE. Section 05 already holds
   every invented rupee this site can afford.
   --------------------------------------------------------------- */
type Item = {
  key: string;
  name: string;
  /** the description, broken where the mockup breaks it */
  lines: [string, string];
};

const ITEMS: Item[] = [
  { key: "snacks",     name: "Customised Snacks",         lines: ["Personalised treats", "made just for your team."] },
  { key: "hot",        name: "Hot & Fresh",               lines: ["Made daily.", "Always fresh, always delicious."] },
  { key: "healthy",    name: "Healthy Choices",           lines: ["Wholesome choices", "for a better everyday."] },
  { key: "favourites", name: "Team Favourites",           lines: ["Loved by all.", "Picked for every kind of craving."] },
  { key: "beverages",  name: "Beverages for Every Break", lines: ["Refreshing drinks", "for every kind of break."] },
];

/* ---------------------------------------------------------------
   THE RAIL.

   Five points in the rail's own box, in travel order: it comes in at the top
   beside the first entry, bows left through the middle, and runs out at the
   bottom towards the delivery mark. `d` is built from them by the same
   Catmull-Rom routine the round used, for the same reason — one smooth line
   through hand-placed points, without twelve control numbers to re-tune every
   time one of them moves.

   THE BOX IS 40 x 100 AND THAT RATIO IS LOAD-BEARING. The SVG is stretched to
   fill the rail with preserveAspectRatio="none", so x and y scale
   independently; a viewBox whose proportions are far from the rendered box's
   would draw a stroke noticeably fatter across than along. 40:100 is close to
   the rail's real shape at the sizes this renders, so the distortion stays
   under about a fifth and the dashes stay square.
   --------------------------------------------------------------- */
/* THE SPREAD IS 10.5 UNITS WIDE AND THE FIRST PASS WAS TWENTY.
   Built at x 13.5-34 the curve swung out far enough at the top to run under
   the first entry's heading and bulged left at the waist into the copy
   column — a bow rather than the near-vertical drift the mockup draws, where
   the line wanders about 68px across a 715px cell. 17.5-28 of 40 is 11% of
   the cell, which is that. */
const RAIL_PTS = [
  { x: 28, y: 1 },
  { x: 20, y: 13 },
  { x: 17.5, y: 46 },
  { x: 20, y: 78 },
  { x: 25.5, y: 99 },
];

/* Catmull-Rom through the points, converted to the cubics SVG understands.

   TENSION IS 0.45 HERE AND WAS 0.26 ON THE ROUND, because the points are
   close together now. On the round they were 20-40 units apart and a low
   tension was what stopped the line hooking past a stop before coming back
   for it. Five points down one narrow column need the opposite: at 0.26 the
   tangents are short enough that the curve reads as a bent polyline. */
function routeD(pts: { x: number; y: number }[], tension: number) {
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

const RAIL_D = routeD(RAIL_PTS, 0.45);

/* the beat sheet. The rail takes DRAW seconds top to bottom, and an entry
   arrives when the line is level with it — its band's midpoint over the
   number of bands, rather than a hand-typed number. Six bands: five entries
   and the delivery mark under them. Reorder ITEMS and the timing follows;
   type the delays in and the second edit desynchronises it. */
const T_RAIL = 0.5;
const DRAW = 1.9;
const BANDS = ITEMS.length + 1;
const arriveAt = (i: number) => T_RAIL + (DRAW * (i + 0.5)) / BANDS;
const T_EXIT = T_RAIL + DRAW;

export default function Pantry() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, once: true });
  const on = inView || Boolean(reduced);

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

         safe_center rather than center: on a short laptop the list plus the
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

           IT ALREADY CARRIES THE MOCKUP'S EDGE MARKS. The pin and its dashed
           trail top-left, the loose dashed arcs, the paper plane bottom-right
           — every decoration drawn around the edge of the client's new layout
           is in this plate, and several it does not draw are too. Nothing had
           to be added for the redesign.

           NOT bg-cream-deep, WHICH IS WHAT SECTION 04 IS. The two grounds were
           identical, so the boundary between them was invisible, and section
           04's empty upper half read as dead space belonging to this one. This
           plate's ground is warmer than the flat #fdefe3 below it, so the seam
           shows without needing a rule.

           cover, not the 100%-auto that section 09's plate takes. That one has
           two road signs pinned at 7% and 97% which a horizontal crop destroys;
           this one is a scatter with a deliberately empty middle, so losing a
           little off the sides costs nothing and cover can never letterbox. */
        /* THE SCRIM IS A SECOND BACKGROUND LAYER, NOT A DIV.
           CSS cannot fade a background-image on its own, so the usual fix is
           an absolutely positioned layer carrying `opacity`. A second entry in
           the same backgroundImage list does it with no extra element and no
           extra stacking context — the gradient is listed FIRST because in a
           multi-background list the first layer paints on top.

           IT WENT FROM 0.46/0.34/0.22 TO 0.66/0.60/0.54 WITH THE REDESIGN,
           AND THE REASON IS WHAT IS NOW SITTING ON IT. The round covered the
           right half of this section with five large photographs, so the
           plate was only ever behind the copy column and the empty middle;
           at 0.46 it read as texture. The list put TEXT across that whole
           half, and the plate's three loudest drawings sit exactly there —
           the fruit bowl lands behind "Customised Snacks", the milk can
           behind "Team Favourites", the samosa behind "Beverages for Every
           Break". Rendered at the old strength they are legible objects
           behind legible words, which is the one thing background art may
           not be. The client's mockup draws the plate at roughly this
           strength too.

           IT IS STILL TOP-WEIGHTED, because the top is where the biggest
           ones are — the biscuit stack, the murukku spiral, the bowl. The
           scrim eases to 0.54 at the base so the flask crate and the samosa
           down there keep a little more of their weight than the top three.

           It costs nothing in legibility and buys some: the site's body ink
           over the plate's darkest pixel went from 8.54:1 bare to 11.3:1 at
           the old scrim, and further still at this one. */
        backgroundColor: "#f8e7d2",
        backgroundImage:
          "linear-gradient(to bottom, rgba(248,231,210,0.66) 0%, rgba(248,231,210,0.60) 34%, rgba(248,231,210,0.54) 100%), url(/img/pantry-doodles.webp)",
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        paddingTop: "clamp(2.75rem, 6.5vh, 5rem)",
        paddingBottom: "clamp(2.75rem, 6.5vh, 5rem)",
      }}
    >
      <div className="shell">
        {/* THE SPLIT IS 0.63 TO 1, AND IT IS READ OFF THE MOCKUP RATHER THAN
            CHOSEN. There the copy runs 453px, the gutter 313 and the list 402
            of a 1171px shell. The gutter belongs to the RIGHT cell here — the
            rail is drawn inside it and the delivery mark sits under it — so
            the two cells are 453 and 715, which is 0.63 : 1.

            The grid's own gap is therefore small: nearly all the air between
            the two columns is inside the right cell, where the rail can use
            it. A large gap here would push the list right and leave the rail
            drawing in a margin that belongs to neither side.

            0.7 RATHER THAN THE 0.63 THE MOCKUP MEASURES, AND THE HEADLINE IS
            WHY. "stop at the cup." is one line there and has to be one here:
            it is the accent half of the heading, and broken after "the" it
            leaves a two-character line reading "cup." under it. At 0.63 plus
            a 2.5rem gap the copy column came to 420px and the line needed
            about 450. 0.7 with a smaller gap gives it 460, which is also
            what let the display clamp keep its 3.7rem ceiling instead of
            being shaved to make room. */}
        <div className="grid grid-cols-1 items-center gap-y-[clamp(2.25rem,5vh,3.5rem)] lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:gap-x-[clamp(0.75rem,1.6vw,1.75rem)]">
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
              /* max-w-[26rem], DOWN FROM 30. The copy column is 454px at
                 1600 and the paragraph was allowed 480, so it filled the
                 column and broke as "...more to look forward / to." — a
                 two-character last line. 416px breaks it after "look", which
                 is where the mockup breaks it, and leaves the measure at a
                 comfortable 52 characters rather than 60. */
              className="mt-6 max-w-[26rem] font-sans text-[clamp(1.05rem,1.35vw,1.3rem)] leading-relaxed text-ink-soft"
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

          {/* ═══════════════ the list, with the route beside it ═══════════════ */}
          <List on={on} reduced={Boolean(reduced)} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   The five entries and the rail.

   ONE RELATIVE BOX, TWO LAYERS. The rail is absolutely positioned down the
   left 42% of it and spans the entries AND the delivery mark below them,
   because the line has to reach that mark — it is the bottom end of the
   route. The list and the mark sit in normal flow at the right, so the box's
   height is theirs and the rail can never be longer or shorter than the thing
   it runs beside.

   The rail is aria-hidden throughout. The list is the content: five named
   items with a sentence each, in order, and a screen reader gets those rather
   than a description of a dashed line.
   --------------------------------------------------------------- */
function List({ on, reduced }: { on: boolean; reduced: boolean }) {
  return (
    <div className="relative">
      <Rail on={on} reduced={reduced} />

      {/* ml-[44%] CLEARS THE RAIL'S 42% PLUS A LITTLE AIR, and only above lg.
          Below it the rail is not drawn at all, so the list takes the full
          width rather than indenting past nothing. */}
      <ul className="lg:ml-[44%]">
        {ITEMS.map((item, i) => (
          <li key={item.key} className="group">
            <motion.div
              initial={reduced ? false : { opacity: 0, x: 18 }}
              animate={{
                opacity: on || reduced ? 1 : 0,
                x: on || reduced ? 0 : 18,
              }}
              transition={{ duration: 0.65, delay: arriveAt(i), ease: EASE }}
              /* THE TEXT HANGS IN FROM THE RULE, which is the mockup's one
                 quiet detail here: the rules and their dots run the full
                 width of the column and the words start about 22px inside
                 them. It reads as the rules belonging to the column and the
                 entries sitting on them, rather than as five boxes each with
                 a line under it. */
              className="pl-[clamp(0.5rem,1.2vw,1.4rem)]"
            >
              <h3 className="font-display text-[clamp(1.08rem,1.32vw,1.32rem)] font-extrabold leading-[1.25] tracking-[-0.02em] text-ink transition-colors duration-300 group-hover:text-orange-dark">
                {item.name}
              </h3>
              <p className="mt-1.5 font-sans text-[clamp(0.95rem,1.12vw,1.08rem)] leading-[1.5] text-ink-soft">
                {item.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </motion.div>

            {/* i < ITEMS.length - 1, NOT A TYPED NUMBER. A trailing rule under
                the last entry would be a line separating it from nothing, and
                a hard-coded index is the kind of thing that survives one edit
                to the list and not two. */}
            {i < ITEMS.length - 1 && (
              <Divider on={on} reduced={reduced} delay={arriveAt(i) + 0.12} />
            )}
          </li>
        ))}
      </ul>

      {/* ---- the bottom end of the route ---- */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: on || reduced ? 1 : 0,
          scale: on || reduced ? 1 : 0.9,
        }}
        transition={{ duration: 0.5, delay: T_EXIT, ease: EASE }}
        /* ml-[29%] SITS IT UNDER THE RAIL'S EXIT rather than under the list.
           In the mockup the mark straddles the gutter — the dashed line runs
           out of the bottom of the rail and into its left edge — so it is
           anchored to the rail's geometry, not the column's. */
        className="mt-[clamp(1.75rem,4vh,2.75rem)] lg:ml-[29%]"
      >
        <a
          /* !!  THE MOCKUP DRAWS THIS AS A BUTTON AND GIVES IT NOWHERE TO GO.
                 IT POINTS AT /service, WHICH IS A DECISION, NOT THE MOCKUP.  !!

             On the old round this was a `<span aria-hidden>` — the exit pill
             of a diagram, decoration with an arrow on it. The mockup keeps the
             arrow and gives it the site's own button chrome, at which point
             leaving it inert stops being a diagram convention and becomes a
             control that does nothing when clicked.

             /service is the page that IS this sentence: "We bring the filled
             flasks and take the empties away." Retargeting it is one line if
             the client meant something else — but a dead button is the one
             option that could not be defended. */
          href="/service"
          className="group inline-flex items-center gap-2.5 rounded-full border border-orange-dark/50 px-[clamp(1.25rem,2vw,1.9rem)] py-[clamp(0.7rem,1.2vh,0.95rem)] font-display text-[clamp(0.68rem,0.8vw,0.8rem)] font-extrabold uppercase leading-none tracking-[0.14em] text-orange-deep transition-colors duration-300 hover:border-orange hover:text-orange-dark focus-visible:border-orange"
        >
          We deliver
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </a>
      </motion.div>
    </div>
  );
}

/* The rule between two entries, and the dot that ends it.

   THE RULE IS ORANGE AT A LOW ALPHA, NOT bg-line. --color-line is #f0e2d6 and
   this section's ground is #f8e7d2 — the token is LIGHTER than the thing it
   would be drawn on, so it is invisible here. It is the right colour on white
   and on cream-deep, which is everywhere else it is used. The doodle plate is
   the one ground on the site that needs its own hairline.

   THE DOT ARRIVES AFTER THE RULE REACHES IT. The rule scales from its left
   edge over 0.55s and the dot lands at +0.4 — late enough to read as the line
   arriving at a stop, early enough that the pair still feels like one gesture.
   Every dot is the terminus of its own rule, which is the whole reason the
   mockup draws them: they are what is left of the round's five stops. */
function Divider({
  on,
  reduced,
  delay,
}: {
  on: boolean;
  reduced: boolean;
  delay: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative my-[clamp(1.15rem,2.5vh,1.85rem)] h-px w-full"
    >
      <motion.span
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: on || reduced ? 1 : 0 }}
        transition={{ duration: 0.55, delay, ease: EASE }}
        className="absolute inset-0 origin-left bg-orange-deep/25"
      />
      {/* -translate-y-1/2 translate-x-1/2 ARE TAILWIND'S STANDALONE `translate`
          PROPERTY, which is exactly why they survive next to motion's `scale`.
          Motion writes `transform` and owns it completely; anything this file
          adds to `transform` alongside an animated value is silently dropped.
          The two properties compose — translate applies first, then the scale
          about the moved centre — so the dot grows in place. */}
      <motion.span
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: on || reduced ? 1 : 0 }}
        transition={{ duration: 0.4, delay: delay + 0.4, ease: EASE }}
        className="absolute right-0 top-1/2 h-[7px] w-[7px] -translate-y-1/2 translate-x-1/2 rounded-full bg-orange-dark"
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   The rail: a dashed route down the gutter, annotated by hand at both ends.

   hidden lg:block. It is decoration that depends on there being two columns.
   Stacked on a phone the "gutter" is the full width of the screen and a line
   drawn down it would run through the copy above and the list below.
   --------------------------------------------------------------- */
function Rail({ on, reduced }: { on: boolean; reduced: boolean }) {
  /* a real unique id: two masks sharing one id in a document is a class of bug
     that only shows when the component is used twice, which is the worst time
     to find it */
  const maskId = `${useId()}-pantry-rail`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 hidden w-[42%] lg:block"
    >
      <svg
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        {/* ---- WHY THE DRAW IS A MASK AND NOT `pathLength` ON THE LINE ----

            motion animates `pathLength` by writing strokeDasharray and
            strokeDashoffset onto the element itself. That is the whole
            mechanism. A DASHED line needs strokeDasharray for its dashes, so
            the two cannot share a path — animate pathLength on the visible
            line and the dashes disappear the moment the animation touches it.

            So: a solid, fat, white path draws itself inside a mask, and the
            dashed line is painted through it. The mask's stroke is 2 units
            against the line's 0.34, which is generous coverage at every point
            of the curve including the tight bottom bend, and the round cap
            means the reveal front is a soft end rather than a chopped one.

            THE ROUND'S OWN VERSION OF THIS WAS SIMPLER because its route was
            SOLID — pathLength went straight on the visible path. The dashes
            are the mockup's, and they cost this indirection. */}
        <mask id={maskId} maskUnits="objectBoundingBox">
          <motion.path
            d={RAIL_D}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            /* initial={false} under `reduce` is what stops the rail being
               permanently blank: with no animation created, an inline
               pathLength of 0 would never be raised and the mask would hide
               the line forever. Drawn is the default; the animation is the
               exception. */
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: on || reduced ? 1 : 0 }}
            transition={{ duration: DRAW, delay: T_RAIL, ease: "easeInOut" }}
          />
        </mask>

        <path
          d={RAIL_D}
          fill="none"
          stroke="var(--color-orange-dark)"
          strokeOpacity="0.55"
          strokeWidth="0.34"
          strokeLinecap="round"
          strokeDasharray="0.9 1.15"
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* ---- the two hands ----

          They are the round's two pills, rewritten. Those were uppercase
          display type in a bordered chip — the same chrome as every other
          label on the site — and they read as UI. The mockup writes them by
          hand instead, which is the one register that says a person is
          annotating their own diagram.

          text-orange-deep, NOT orange-dark. Measured on this section's ground
          (#f8e7d2): orange-dark is 3.40:1 and orange-deep 4.54:1. These are
          aria-hidden decoration and so owe nothing formally, but they are
          words a sighted reader is meant to read, at a size and a weight that
          would need 4.5 if they were content. The darker token is free.

          THE SECOND MARK NAMES THE BUTTON BESIDE IT. "We deliver" in hand,
          with an arrow pointing at a control that says WE DELIVER, is the
          mockup's own arrangement — the handwriting is a caption ON the mark
          rather than a second copy of it. */}
      <motion.span
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: on || reduced ? 1 : 0, y: on || reduced ? 0 : 8 }}
        transition={{ duration: 0.6, delay: T_RAIL, ease: EASE }}
        className="absolute left-[3%] top-[13%] font-hand text-[clamp(1.15rem,1.6vw,1.5rem)] leading-none text-orange-deep"
      >
        We prepare
      </motion.span>
      <motion.span
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: on || reduced ? 1 : 0,
          scale: on || reduced ? 1 : 0.9,
        }}
        transition={{ duration: 0.5, delay: T_RAIL + 0.25, ease: EASE }}
        className="absolute left-[24%] top-[16%] block w-[clamp(34px,3.4vw,52px)] text-orange-deep"
      >
        <Squiggle variant="down" />
      </motion.span>

      <motion.span
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: on || reduced ? 1 : 0, y: on || reduced ? 0 : 8 }}
        transition={{ duration: 0.6, delay: T_EXIT - 0.15, ease: EASE }}
        className="absolute bottom-[3%] left-[3%] font-hand text-[clamp(1.15rem,1.6vw,1.5rem)] leading-none text-orange-deep"
      >
        We deliver
      </motion.span>
      <motion.span
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{
          opacity: on || reduced ? 1 : 0,
          scale: on || reduced ? 1 : 0.9,
        }}
        transition={{ duration: 0.5, delay: T_EXIT + 0.1, ease: EASE }}
        className="absolute bottom-[2%] left-[46%] block w-[clamp(30px,3vw,46px)] text-orange-deep"
      >
        <Squiggle variant="right" />
      </motion.span>
    </div>
  );
}

/* The little hand-drawn arrow that joins a mark to the thing it names.

   TWO SHAPES, BECAUSE THEY POINT AT DIFFERENT THINGS. "down" leaves the
   handwriting and falls onto the rail; "right" runs flat across into the
   delivery button. One shape rotated would put the arrowhead at the wrong
   angle in one of the two places, and an arrowhead that does not follow its
   own tangent is the detail that makes a drawn mark look pasted on.

   They are stroked with `currentColor` so the colour decision lives once, on
   the span that positions them. */
function Squiggle({ variant }: { variant: "down" | "right" }) {
  const down = variant === "down";

  return (
    <svg
      viewBox={down ? "0 0 60 52" : "0 0 60 34"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-auto w-full opacity-80"
    >
      {down ? (
        <>
          <path d="M3 6 C 24 0, 47 13, 54 41" />
          <path d="M45 28 L55 43 L38 40" />
        </>
      ) : (
        <>
          <path d="M3 6 C 18 2, 34 6, 52 20" />
          <path d="M43 10 L54 21 L40 26" />
        </>
      )}
    </svg>
  );
}
