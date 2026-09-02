"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
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

const CATEGORIES = [
  {
    key: "tea",
    name: "Tea",
    count: "8 blends",
    img: "/img/menu-tea.webp",
    alt: "A glass of masala chai with loose tea leaves",
    wash: "#E5A863",
    rim: 39,
    cx: 66,
    mouth: 52,
    steam: true,
  },
  {
    key: "coffee",
    name: "Coffee",
    count: "6 roasts",
    img: "/img/menu-coffee.webp",
    alt: "South Indian filter coffee in a brass tumbler and davara",
    wash: "#C08A57",
    rim: 39,
    cx: 60,
    mouth: 37,
    steam: true,
  },
  {
    key: "milk",
    name: "Milk",
    count: "5 options",
    /* REBUILT FROM app/milks.png, which is the client's transparent export at
       1448x1086. The plate that shipped before it stood 691px tall in its
       800x1000 frame against tea's 598 and coffee's 604 — 69% of the frame
       where those two fill 60%, and the largest area of the four by a clear
       margin, so it read as oversized next to its own row. The replacement is
       trimmed to its alpha bbox and scaled to a 601px content height, the mean
       of the two it sits between, then bottom-aligned at 96% like the rest of
       the set. Rebuilding it at another size means going back to that source
       rather than upscaling this. */
    img: "/img/menu-milk.webp",
    alt: "A tall milk beverage with almonds and cardamom",
    wash: "#E7CFA6",
    rim: 30,
    cx: 66,
    mouth: 51,
    steam: true,
  },
  {
    /* THE ONE COLD DRINK, and everything odd about this entry follows from
       that. It was a mug of hot chocolate; it is now a rose sarbath, at the
       client's direction. /img/menu-specialty.webp is unreferenced from here
       on but left on disk.

       THE SOURCE WAS SHOT ON A WET WHITE TABLE, which the other three were
       not — they are clean cut-outs floating on the section's espresso. Its
       alpha channel was already correct, but the opaque subject included the
       white puddle the glass stands in, and on this ground that read as a milky
       haze under one drink and nothing under the other three.

       It could not be keyed out: measured, the puddle runs sat 0.01-0.19 at
       luminance 141-240 and the ICE CUBES run sat 0.02 at luminance 226-242.
       They occupy the same range, so any colour key that removed the surface
       removed the ice and the glass base with it. What worked instead was
       blending the wet surface TOWARDS the ground rather than erasing it —
       low-saturation pixels below y1150 fade to espresso-deep, saturated
       ones (lemon, mint, the drink) are held back — so it now reads as the
       shadow the glass sits in. See the build note in the commit.

       THAT BAKES #240a06 INTO THE FILE. If this section's ground ever stops
       being espresso-deep, this one image will show a brown smear at its
       base and has to be rebuilt from app/sarbath.png.

       rim / cx / mouth were measured off the rose liquid in the finished
       800x1000 frame, not guessed: the glass spans 31% of the frame against
       tea's 52%, because a highball is narrow. `wash` is the mean of the
       drink's own lit quartile (#EC817E, luminance 161) which lands inside
       the range the other three already occupy (148-210). */
    key: "seasonal",
    /* "Seasonal", not "Specialty", at the client's direction — and the count
       under it could then no longer say "seasonal" too. The row's pattern is
       <number> <noun> ("8 blends", "6 roasts", "5 options"), so the noun had
       to change rather than be dropped; "specials" keeps the pattern, keeps
       the length near "5 options", and does not repeat the word directly
       above it. If the client would rather it read "2 seasonal", that is
       this one string. */
    name: "Seasonal",
    count: "2 specials",
    img: "/img/menu-sarbath.webp",
    alt: "Rose sarbath over ice with lemon, mint and basil seeds",
    wash: "#EC817E",
    rim: 35,
    cx: 56,
    mouth: 31,
    /* NO PLUME. This section is built on steam and this drink is served over
       ice — a visible plume off a glass of sarbath is not a stylistic choice,
       it is wrong about the drink. CardSteam is simply not mounted for it.

       VARIANTS[3] in CardSteam is now unreachable. It is left in place
       because `variant` is the card's index, so deleting the entry would
       shift tea, coffee and milk onto each other's plumes. */
    steam: false,
  },
];

/* one real drink per glass, in the same order — "badam milk" is a thing a
   person in Madurai actually asks for; "milk drinks" is a category. Each
   name lights up when its glass is the one being poured, so the sentence
   and the row are one mechanism rather than a caption over a grid. */
const NAMED = [
  /* "Tea", not "Chai" — the client's word. It also matches the card directly
     under it, which has always been labelled Tea, so the sentence and the row
     no longer call the same glass two different things. */
  { label: "Tea", sep: ", " },
  { label: "filter coffee", sep: ", " },
  { label: "badam milk", sep: ", " },
  /* follows the fourth glass, and has to: each name lights up when its own
     card is hovered, so leaving "hot chocolate" here would light those two
     words while a sarbath came forward. */
  { label: "sarbath", sep: " and " },
];

export default function Menu() {
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
              02 — On the menu
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
              phone. */}
          <h2 className="mt-6 font-display text-[clamp(1.9rem,4.25vw,3.8rem)] font-extrabold leading-[1.12] tracking-[-0.035em] text-white">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span {...clipLine(0.15)} className="block">
                Everyone drinks something different.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span {...clipLine(0.26)} className="block text-orange">
                We pour all of it.
              </motion.span>
            </span>
          </h2>

          <motion.p
            {...reveal(0.4)}
            className="mx-auto mt-5 max-w-[68ch] font-sans text-[clamp(1.05rem,1.35vw,1.4rem)] leading-[1.6] text-white/70"
          >
            {NAMED.map((n, i) => (
              <span key={n.label}>
                <span
                  className={`transition-colors duration-500 ${
                    active === i ? "text-orange" : ""
                  }`}
                >
                  {n.label}
                </span>
                {n.sep}
              </span>
            ))}
            more.
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
                active === null ? "#C79A6B" : CATEGORIES[active].wash,
              opacity: active === null ? 0.26 : 0.42,
            }}
            transition={{
              left: { type: "spring", stiffness: 55, damping: 17 },
              backgroundColor: { duration: 0.9, ease: "easeInOut" },
              opacity: { duration: 0.6, ease: "easeOut" },
            }}
          />

          <div className="relative mx-auto grid max-w-[1150px] grid-cols-2 gap-x-5 gap-y-8 md:gap-x-6 lg:grid-cols-4 lg:gap-x-7">
            {CATEGORIES.map((cat, i) => {
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
                    <p className="mt-2 font-sans text-[1rem] font-medium text-white/70">
                      {cat.count}
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
