"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";

import { useSiteContent } from "@/lib/content/context";
import { drinkCount } from "@/lib/content/schema";
import CardSteam from "@/components/ui/CardSteam";

/**
 * Section 02 — The Menu.
 *
 * Centred, unlike The Service above it, which is a left-weighted split.
 * Four equal categories are a symmetrical idea and deserve a symmetrical
 * header; it also stops the two sections reading as the same layout twice.
 *
 * The heading is a problem and its answer: line one is why a facilities
 * manager cares, line two is what we do about it, in orange. An earlier
 * draft stopped after line one, which left a menu section that named a
 * need and never said what it pours.
 *
 * DARK SECTION, NO CARDS
 * The drinks stand free — no box, no ring, no scrim. The section itself
 * is espresso, and that is not a style choice: steam is light, and light
 * steam on a light page is invisible.
 *
 * A per-glass pool of colour was tried first and failed, because a radial
 * centred on the glass has already faded to nothing by the top quarter of
 * the stage — which is exactly where the wisps rise. They were crossing
 * bare cream. Darkening the whole section fixes it everywhere at once,
 * and the pools stay as warm light behind each drink.
 *
 * Every drink carries three numbers measured off its own photograph:
 * `rim` (where the liquid sits), `cx` (the centre of the vessel mouth)
 * and `mouth` (its width). None of them can be assumed — garnish sits
 * beside each drink, so no vessel is centred in its frame, and the four
 * rims land anywhere from 30% to 45% down. Guessing put the steam over
 * empty background.
 *
 * HOVER, AND NOTHING ELSE
 * The row used to cycle on its own every 2.8s, which made four static
 * drinks read as a carousel — something the visitor was expected to wait
 * for rather than something they could use. It waits for them now: at
 * rest all four stand at full strength, and hovering one lifts it,
 * brightens its pool, doubles its steam, dims the other three and slides
 * a wash behind the row in its colour. Nothing moves until you move.
 *
 * NO CARDS UNDER THE GLASSES
 * The name and the count used to sit in a bordered, blurred box each,
 * alongside a per-cup price. Four boxes in a row under a heading read as
 * TABS — as though they switched something — and they were the loudest
 * thing in a section whose subject is the photographs. They are plain text
 * now, centred under each drink, which is also how a menu is written.
 *
 * THERE IS NO PRICE IN THIS SECTION ANY MORE, AT THE CLIENT'S DIRECTION.
 * The four per-cup prices under the drinks went first; the sub-heading kept
 * closing "From ₹8 a cup" with the 8 rolling on entrance, flagged here as
 * the same unconfirmed figure and the last rupee left. It has now gone too,
 * and the sentence ends on "and more." — which is what it was already
 * building to, since the list before it is the actual subject.
 *
 * DigitRoll went with it: that span was its only caller in this file.
 *
 * The section now names the drinks and shows them, and nothing on the page
 * quotes a rate. Section 05 stopped costing cups at the same instruction,
 * so if a price ever comes back it needs a home and a confirmed number,
 * not a corner of a sub-heading.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const DEAL_AT = 0.55;
const DEAL_GAP = 0.12;

/* THE FOUR DRINKS AND THE FOUR NAMES ARE ONE LIST NOW, and they are stored
   content — see DrinkContent in lib/content/schema, which holds these exact
   values as its defaults along with every note that used to sit here: why tea
   says "1 blend" rather than "8 blends", why the milk plate is badam and why
   its rim of 55 looks low and is not, why the buttermilk is plain while the
   photograph still shows the spiced drink, and why that card has no plume.

   THIS FILE USED TO CARRY TWO PARALLEL ARRAYS — the cards here and the names in
   the sentence above them in `NAMED` — and the comment on the fourth entry of
   the second one recorded what that cost: it "has said 'hot chocolate' and
   'sarbath' in front of this same slot; both were wrong the moment the
   photograph under them changed and neither was caught by a type". The name and
   the card are one object in the schema, so that particular drift is no longer
   something anyone can type.

   THE COUNT IS NOT FIXED ANY MORE, and the note that used to say it was had
   inherited a constraint that turned out not to exist. It read that CardSteam's
   fourth variant must stay "because `variant` is the card's index, so deleting
   the entry would shift tea, coffee and milk onto each other's plumes" —
   true about which plume each card gets, and not a reason the count cannot
   change: CardSteam indexes VARIANTS[variant % VARIANTS.length], so a fifth
   drink reuses the first one's plume rather than reading off the end.

   What DID constrain it was this row's `lg:grid-cols-4`, which is now derived
   from the list — see COLUMNS below. Drinks are added and removed at
   /admin/menu. Four still fills a row exactly and is what the layout was
   measured at; the panel says so rather than enforcing it. */


/**
 * How many columns the row takes at lg, by how many drinks there are.
 *
 * WHY A TABLE AND NOT `lg:grid-cols-${n}`. Tailwind scans source files for
 * complete class names at build time; an interpolated one is not in the output
 * at all, so the grid would silently fall back to two columns for every count.
 * This is the standard way round it — every class that can be used is written
 * out somewhere a scanner can see it.
 *
 * WHY THESE NUMBERS. Four is what the row was measured at and it fills a line
 * exactly. Five would leave one card alone on a second row, so five and six
 * both take three columns — 3+2 and 3+3 — which reads as two deliberate rows
 * rather than a row with a straggler. Seven and eight go back to four. Beyond
 * eight the cards are too small to be worth more rows, so it caps there.
 *
 * The panel says which counts sit well rather than refusing the others; this
 * makes sure none of them actually breaks.
 */
const COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-3",
  6: "lg:grid-cols-3",
  7: "lg:grid-cols-4",
  8: "lg:grid-cols-4",
};

export default function Menu() {
  const { menu } = useSiteContent();
  /* The name the card wears and the name the sentence uses are fields of the
     same drink now, so `drinks` is what both the row and the paragraph read. */
  const drinks = menu.drinks;
  const columns = COLUMNS[drinks.length] ?? "lg:grid-cols-4";

  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2 });
  const on = inView || Boolean(reduced);

  /* null is the resting state, and it is a real state rather than "drink
     one is selected": at rest every drink is at full strength and none is
     singled out. That is only possible because nothing cycles. */
  const [active, setActive] = useState<number | null>(null);

  const reveal = (delay: number, y = 16) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  const clipLine = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { y: "112%" },
          animate: on ? { y: "0%" } : { y: "112%" },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      id="menu"
      ref={ref}
      className="relative overflow-x-clip bg-espresso-deep"
      style={{
        paddingTop: "calc(var(--header-h) + clamp(1.25rem, 3.5vh, 2.5rem))",
        paddingBottom: "clamp(2rem, 5vh, 4rem)",
      }}
    >
      <div className="shell">
        {/* ---------------- header, centred ---------------- */}
        {/* 70rem, up from 54: the heading grew and "Everyone drinks something
            different." is 18.34 em, which at the new 3.6rem cap needs 1056px.
            The shell itself (1128px inside its padding) is what actually
            bounds it from 1280 up. */}
        <div className="mx-auto max-w-[70rem] text-center">
          <motion.div
            {...reveal(0.05, 0)}
            className="flex items-center justify-center gap-4"
          >
            <motion.span
              initial={reduced ? undefined : { scaleX: 0 }}
              animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "linear" }}
              className="h-px w-10 origin-right bg-white/25 md:w-16"
            />
            <span
              className="eyebrow whitespace-nowrap"
              style={{ color: "rgba(255,233,220,0.6)" }}
            >
              {menu.eyebrow}
            </span>
            <motion.span
              initial={reduced ? undefined : { scaleX: 0 }}
              animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: "linear" }}
              className="h-px w-10 origin-left bg-white/25 md:w-16"
            />
          </motion.div>

          {/* 2.75rem -> 3.8rem cap, 3.5vw -> 4.25vw: 61px at 1920 where it was
              44. "Everyone drinks something different." is 18.34 em raw, less
              1.26 em from tracking-[-0.035em] across its 36 characters, so
              17.08 em — 1038px at the cap against a 1120px measure. Swept at
              seventeen window sizes: one line from 640 up, and below 610 it
              wraps to two, which is what a 36-character sentence does on a
              phone.

              THAT IS A MEASUREMENT OF THE DEFAULT SENTENCE AND IT DOES NOT
              TRAVEL WITH AN EDIT. The headline is editable now, the type is
              sized by the viewport rather than by the words, and a longer
              sentence will simply take a second line earlier than 610px. The
              panel says so beside the field; nothing here can enforce it. */}
          <h2 className="mt-6 font-display text-[clamp(1.9rem,4.25vw,3.8rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-white">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span {...clipLine(0.15)} className="block">
                {menu.headline}
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span {...clipLine(0.26)} className="block text-orange">
                {menu.headlineAccent}
              </motion.span>
            </span>
          </h2>

          <motion.p
            {...reveal(0.4)}
            className="mx-auto mt-5 max-w-[68ch] font-sans text-[clamp(1.05rem,1.35vw,1.4rem)] leading-[1.6] text-white/70"
          >
            {/* keyed by `key` rather than by the label: the label is typed in
                the panel, two drinks can share one while a rename is half done,
                and a duplicate React key here would swap which word lights. */}
            {drinks.map((drink, i) => (
              <span key={drink.key}>
                <span
                  className={`transition-colors duration-500 ${
                    active === i ? "text-orange" : ""
                  }`}
                >
                  {drink.label}
                </span>
                {drink.separator}
              </span>
            ))}
            {menu.tail}
          </motion.p>
        </div>

        {/* ---------------- the round ---------------- */}
        <div
          className="relative mt-[clamp(1.25rem,3.5vh,2.25rem)]"
          onMouseLeave={() => setActive(null)}
        >
          {/* the wash — one element, travelling between the drinks and
              taking the colour of whichever is hovered. At rest it sits
              in the middle of the row, dimmer and warm-neutral, so the
              row has depth without anything appearing to be selected. */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 hidden h-[70%] w-[34%] -translate-x-1/2 rounded-full lg:block"
            style={{ filter: "blur(90px)" }}
            initial={false}
            animate={{
              left: active === null ? "50%" : `${(active + 0.5) * 25}%`,
              backgroundColor:
                active === null ? "#C79A6B" : drinks[active].wash,
              opacity: active === null ? 0.26 : 0.42,
            }}
            transition={{
              left: { type: "spring", stiffness: 55, damping: 17 },
              backgroundColor: { duration: 0.9, ease: "easeInOut" },
              opacity: { duration: 0.6, ease: "easeOut" },
            }}
          />

          {/* THE COLUMN COUNT FOLLOWS THE LIST — see `columns` above for why the
              rule is what it is, and why this is a lookup rather than an
              interpolated class. Two columns on a phone whatever the count:
              these are tall glasses and one per row would be a very long
              scroll, three would make each about 110px wide. */}
          <div
            className={`relative mx-auto grid max-w-[1150px] grid-cols-2 gap-x-5 gap-y-8 md:gap-x-6 lg:gap-x-7 ${columns}`}
          >
            {drinks.map((cat, i) => {
              const at = DEAL_AT + i * DEAL_GAP;
              const isOn = active === i;
              /* only the OTHERS go quiet, and only while one is hovered —
                 at rest `active` is null and nothing is dimmed */
              const dim = active !== null && !isOn;

              return (
                <motion.div
                  key={cat.key}
                  onMouseEnter={() => setActive(i)}
                  {...reveal(at, 26)}
                  className="relative flex flex-col"
                >
                  {/* the stage: pool of light, steam, glass. No card. */}
                  <div className="relative aspect-[4/5] w-full">
                    {/* the pool — what makes light steam visible on a light
                        page, and it reads through the transparent glass */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-[44%] h-[100%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700"
                      style={{
                        left: `${cat.cx}%`,
                        background: `radial-gradient(circle, ${cat.wash}, transparent 68%)`,
                        opacity: isOn ? 0.62 : dim ? 0.22 : 0.34,
                      }}
                    />

                    {cat.steam && (
                      <CardSteam
                        rim={cat.rim}
                        cx={cat.cx}
                        mouth={cat.mouth}
                        variant={i}
                        boost={isOn}
                      />
                    )}

                    <motion.div
                      className="absolute inset-0"
                      animate={
                        reduced
                          ? undefined
                          : { scale: isOn ? 1.08 : 1, y: isOn ? -6 : 0 }
                      }
                      transition={{ type: "spring", stiffness: 150, damping: 17 }}
                      style={{ transformOrigin: "50% 100%" }}
                    >
                      <Image
                        src={cat.img}
                        alt={cat.alt}
                        fill
                        sizes="(max-width: 1024px) 44vw, 22vw"
                        /* full strength at rest AND when hovered — only a
                           drink that is NOT the hovered one steps back */
                        className={`object-contain object-bottom transition-[filter] duration-[900ms] ${
                          dim
                            ? "brightness-[0.72] saturate-[0.8]"
                            : "brightness-100 saturate-100"
                        }`}
                      />
                    </motion.div>

                    {/* contact shadow, so it stands on something */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-[4%] left-1/2 h-3 w-[48%] -translate-x-1/2 rounded-[50%] blur-md transition-opacity duration-700"
                      style={{
                        background: "rgba(0,0,0,0.6)",
                        opacity: isOn ? 0.7 : dim ? 0.32 : 0.45,
                      }}
                    />
                  </div>

                  {/* ---- the details: text, no box ----
                      Name and what is in the category. A per-cup price used
                      to sit under both and has been removed at the client's
                      direction; the figures were never confirmed. The count
                      sits at white/70 rather than the /55 it wore inside the
                      card: without a panel behind it, it is reading straight
                      off the section and off the tail of the wash, where /55
                      measured 3.94:1. /70 holds 5.29 even under the
                      brightest wash. */}
                  <motion.div
                    animate={reduced ? undefined : { y: isOn ? -4 : 0 }}
                    transition={{ type: "spring", stiffness: 170, damping: 19 }}
                    className="mt-5 text-center"
                  >
                    <h3 className="font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.02em] text-white md:text-[2rem]">
                      {cat.name}
                    </h3>
                    {/* DERIVED, NOT TYPED. This line used to be a string in
                        the array above, and the note on Tea recorded what that
                        cost: "/menu derives its count from the list of names, so
                        it changed itself; this one and /service are typed by
                        hand and had to be corrected to match." All three now
                        call drinkCount on the same list. */}
                    <p className="mt-2 font-sans text-[1rem] font-medium text-white/70">
                      {drinkCount(cat)}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          {...reveal(1.25)}
          className="mt-[clamp(1.5rem,3.5vh,2.5rem)] text-center"
        >
          <a
            /* "Explore more menu" pointed at #pricing, which was the only
               honest destination while the menu was four glasses in a row —
               there was no more menu to explore. There is now. */
            href="/menu"
            /* hover:text-orange had to go: the fill IS orange, so orange
               text on it would vanish the moment the wipe arrived */
            className="hero-btn group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-white/25 px-7 py-4 font-sans text-sm font-semibold text-white transition-colors duration-300 hover:border-orange"
          >
            <span className="relative z-10">Explore more menu</span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
