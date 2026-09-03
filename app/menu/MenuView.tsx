"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MAIL_HREF, PHONE_LABEL, TEL_HREF, WA_HREF } from "@/lib/contact";

/**
 * /menu, animated. Same two-engine split as ServiceView, and the same rule:
 * motion owns time-based entrances, GSAP owns scroll-BOUND continuous motion,
 * and nothing is animated by both.
 *
 * WHAT GSAP DOES HERE, AND WHY THESE TWO
 *
 *   1. THE FOUR GLASSES DRIFT AT DIFFERENT RATES. A row of cut-outs on a flat
 *      dark ground is the one place on this site where parallax buys something
 *      real: give each glass its own rate and the row gains a depth order it
 *      cannot get from a single static frame. The rates are small and
 *      deterministic per index, never random — a random rate differs between
 *      renders and there is nothing to hydrate against.
 *
 *   2. THE DOODLE PLATE MOVES SLOWER THAN THE SECTION IT IS BEHIND. It is a
 *      background-image, so this animates backgroundPositionY rather than a
 *      transform: the plate is not an element and has nothing to translate.
 *      That is also why it is the only tween here that cannot composite — a
 *      background-position change repaints. It is one property on one element
 *      over a short range, which is affordable; doing it to a foreground image
 *      would not be.
 *
 * Both are scrubbed, so both reverse when the reader scrolls back. Neither
 * would be better expressed as a motion entrance, which is the test for
 * whether GSAP has earned its place on a page.
 *
 * REDUCED MOTION: as in ServiceView, every GSAP tween is created INSIDE a
 * `(prefers-reduced-motion: no-preference)` matchMedia block, so under `reduce`
 * none is constructed and no transform is written. motion branches separately
 * on useReducedMotion.
 *
 * The content rule and its provenance table live in page.tsx. Animating this
 * changed no copy.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* ===============================================================
   !!  THIRTEEN OF THESE TWENTY-ONE DRINK NAMES ARE INVENTED.  !!
   !!  DO NOT PUBLISH UNTIL THE CLIENT SUPPLIES THE REAL LIST.  !!
   ===============================================================
   The cards were asked to open and show what is in each category. Nothing
   on this site has ever listed one. Section 02, /service and this page all
   published the COUNTS — "8 blends", "6 roasts", "5 options" — and page.tsx
   already records that those carry no provenance either, and that only
   "2 specials" was ever confirmed. So the counts promised twenty-one drinks
   that were never named anywhere, and opening a card is what finally asks
   the question out loud.

   EIGHT NAMES ARE REAL, in the weak sense that this site already publishes
   them and has for as long as the repo goes back. They are marked
   `real: true` below and they came from:

     components/ui/Ticker.tsx   Masala Chai, Green Tea, Ginger Tea,
                                Filter Coffee, Premium Coffee, Badam Milk
     components/sections/Menu.tsx  Masala Buttermilk — the photograph on the
                                fourth card — and Rose Sarbath, which was
                                that photograph until today and whose plate
                                is still on disk.

   THE OTHER THIRTEEN WERE WRITTEN TO FILL THE SHAPE. They are ordinary
   South Indian workplace drinks and none of them is a wild guess, but no
   one has confirmed that Hotcups pours a single one. Replacing them is one
   array; that is the whole reason the list lives here rather than in JSX.

   THE LENGTHS ARE NOT FREE CHOICES. Each list is exactly as long as the
   count that was already published — 8, 6, 5, 2 — and `count` is now
   DERIVED from the list rather than typed beside it, so the number on the
   card and the number of names behind it cannot drift apart again. If the
   client's real list has seven teas, the card will say seven blends by
   itself, and section 02 and /service are then the two places that have to
   be corrected to match.

   NO BRAND NAMES. The client had the machine makers taken off the site;
   a malt drink is "Malted Milk" here rather than the label on the tin.

   ---------------------------------------------------------------
   THE PICTURES ARE ARRIVING, CATEGORY BY CATEGORY. Do not trust a count
   written here — read the table. An entry with `img` has one; an entry with
   `tint` is still waiting. Milk is the last category with any left.

   WHERE THEY COME FROM. The client's own photographs are opaque 1402x1122
   scenes — a cup on a wooden table with the spices around it — cropped 4:3
   on the drink and cut to 720x540 tiles, and they carry `cover`. Four
   entries instead use a CUT-OUT plate this site already had: Hot Milk,
   Badam Milk, Masala Buttermilk and Rose Sarbath.

   menu-specialty.webp is the only plate still unused, and it stays that
   way — nothing on this list is hot chocolate any more. menu-milk.webp
   came back into use on Hot Milk when it was asked for by name, with the
   caveat recorded on that entry: the almonds are still in the picture.

   WHAT A `tint` IS, FOR THE ONES STILL WAITING: the colour the drink
   actually is, drawn into a glass mark. It is a deliberate choice over the
   two alternatives. Repeating the category plate down its own column would
   put the same glass of chai beside eight different names, which is worse
   than no picture because it asserts something false about seven of them;
   an empty slot makes a grid with holes in it.

   A tint is also not a claim — it is how the drink looks, and a rose milk
   is pink whoever pours it. Drop a photograph in `img` and the mark gives
   way to it in the same tile at the same size, so the grid does not move
   when the artwork lands. That swap has now happened thirteen times and
   the layout has not shifted once.

   FIVE OF THE SIX COFFEES ARE THE SAME CUP. The client's coffee photographs
   are one mug shot repeatedly with a different liquid in it, so Milk Coffee,
   Strong Filter and Light Roast are near-identical tiles and the row reads
   as one drink named three times. Black Coffee and Premium are distinct.
   That is the photography, not the layout, and it is worth saying to the
   client before this page is shown to anyone.

   AND A PHOTOGRAPH DOES NOT CONFIRM A NAME. Having a picture of a cardamom
   tea does not make it a drink Hotcups pours. The banner above still
   stands for every name marked without `real`.
   =============================================================== */
type Variety = {
  name: string;
  real?: true;
  /** a picture, where one exists on disk for THIS drink */
  img?: string;
  /** true when `img` is a SCENE photograph that should fill the tile.
      False/absent means a cut-out plate, which is centred inside it instead —
      see the note on the tile for why one frame has to hold both. */
  cover?: true;
  /** the drink's own colour, for the glass mark that stands in until it does */
  tint?: string;
};

const DRINKS = [
  {
    name: "Tea",
    noun: "blends",
    img: "/img/menu-tea.webp",
    alt: "A glass of masala chai with loose tea leaves",
    varieties: [
      /* THE CLIENT'S OWN PHOTOGRAPHS, and the first two of their kind here.
         Both arrived as 1402x1122 opaque scenes — a glass on a wooden table
         with the spices around it — not the cut-outs every other drink on
         this site is. They cannot be keyed: the ground is a photographed
         table, not a flat colour, so there is nothing to remove. Framed as
         tiles instead, cropped 4:3 on the drink and cut to 720x540.

         Masala Chai gave up the category plate to take its own picture. */
      { name: "Masala Chai", real: true, img: "/img/variety-masala-chai.webp", cover: true },
      { name: "Ginger Tea", real: true, img: "/img/variety-ginger-tea.webp", cover: true },
      { name: "Green Tea", real: true, img: "/img/variety-green-tea.webp", cover: true },
      /* the source is app/cardomomtea.png — the client's spelling, kept as
         the filename it arrived under so it can be found again */
      { name: "Cardamom Tea", img: "/img/variety-cardamom-tea.webp", cover: true },
      { name: "Lemon Tea", img: "/img/variety-lemon-tea.webp", cover: true },
      { name: "Black Tea", img: "/img/variety-black-tea.webp", cover: true },
      { name: "Sulaimani", img: "/img/variety-sulaimani.webp", cover: true },
      { name: "Herbal Tea", img: "/img/variety-herbal-tea.webp", cover: true },
    ] as Variety[],
  },
  {
    name: "Coffee",
    /* "roasts" is the site's own noun and it is a slightly odd fit: a roast
       is a bean, and what a workplace actually orders is a cup. The names
       below are cups. Changing the noun means changing it in section 02 and
       /service too, so it is left alone until someone decides. */
    noun: "roasts",
    img: "/img/menu-coffee.webp",
    alt: "South Indian filter coffee in a brass tumbler and davara",
    varieties: [
      /* Filter Coffee moved off the cut-out plate and onto its own scene when
         that photograph arrived. The plate is still the CARD's picture above,
         where a cut-out is what the design wants; down here every other tile
         is a scene, and one plate among five would have been the odd one. */
      { name: "Filter Coffee", real: true, img: "/img/variety-filter-coffee.webp", cover: true },
      { name: "Premium Coffee", real: true, img: "/img/variety-premium-coffee.webp", cover: true },
      { name: "Black Coffee", img: "/img/variety-black-coffee.webp", cover: true },
      { name: "Milk Coffee", img: "/img/variety-milk-coffee.webp", cover: true },
      { name: "Strong Filter", img: "/img/variety-strong-filter.webp", cover: true },
      { name: "Light Roast", img: "/img/variety-light-roast.webp", cover: true },
    ] as Variety[],
  },
  {
    name: "Milk",
    noun: "options",
    img: "/img/menu-badam.webp",
    alt: "Badam milk in a glass tumbler, topped with saffron, pistachio and almond flakes",
    varieties: [
      { name: "Badam Milk", real: true, img: "/img/menu-badam.webp" },
      /* THE ALMONDS ARE STILL IN THIS PICTURE and Badam Milk is the tile
         directly before it. Asked for by name, so it is in — but the plate
         has whole almonds and two leaves beside the glass, and they cannot
         be cropped off without slicing the front almond, which overlaps the
         glass. The milk itself is plain white and is the right drink; the
         garnish is the thing to check with the client. */
      { name: "Hot Milk", img: "/img/menu-milk.webp" },
      { name: "Turmeric Milk", tint: "#E3B84A" },
      { name: "Rose Milk", tint: "#E9A0B0" },
      { name: "Malted Milk", tint: "#B98B5E" },
    ] as Variety[],
  },
  {
    name: "Seasonal",
    noun: "specials",
    img: "/img/menu-buttermilk.webp",
    alt: "Masala buttermilk with coriander, cumin and a slice of cucumber",
    /* THE ONLY CATEGORY THAT IS FULLY GROUNDED, and the only count that was
       ever confirmed. Both names are drinks this site has photographed. */
    varieties: [
      { name: "Masala Buttermilk", real: true, img: "/img/menu-buttermilk.webp" },
      /* menu-sarbath.webp comes back into use here. It was left on disk this
         morning when the buttermilk took the fourth card; it is still the
         photograph of this drink, and this is still a seasonal special. */
      { name: "Rose Sarbath", real: true, img: "/img/menu-sarbath.webp" },
    ] as Variety[],
  },
];

const PANTRY = [
  {
    name: "Customised Snacks",
    img: "/img/snack-biscuits.webp",
    alt: "A stack of butter biscuits",
  },
  {
    name: "Hot & Fresh",
    img: "/img/snack-vada.webp",
    alt: "Two medhu vadai, freshly fried",
  },
  {
    name: "Healthy Choices",
    img: "/img/snack-chips.webp",
    alt: "A heap of banana chips with curry leaves",
  },
  {
    name: "Team Favourites",
    img: "/img/snack-samosa.webp",
    alt: "A samosa",
  },
  {
    name: "Beverages for Every Break",
    img: "/img/pantry-beverage.webp",
    alt: "Filter coffee in a brass davara set, with beans",
  },
];

/* THE COUNT IS DERIVED, NOT TYPED. It used to be a string sitting beside the
   name — "8 blends" — with nothing behind it. Now that the names exist, the
   card counts them, so the two can never disagree. See the banner on DRINKS
   for why that matters more here than it looks. */
const countOf = (d: { noun: string; varieties: Variety[] }) =>
  `${d.varieties.length} ${d.noun}`;

/* one panel serves all four cards, so every card's aria-controls points at
   this same id — see the note where it is rendered */
const PANEL_ID = "menu-varieties";

/* THE STAND-IN FOR A DRINK WITH NO PHOTOGRAPH.

   A tapered tumbler filled to a little over half with the drink's own colour.
   It is drawn rather than photographed on purpose — see the banner on DRINKS
   — and it is drawn to the SAME height as the photographs beside it, so a
   real picture arriving later changes what is in the slot and not the shape
   of the grid.

   THE GLASS IS ONE PATH AND THE LIQUID IS ANOTHER, sharing the same two
   edges. The taper runs from x8-x32 at the rim to x10.6-x29.4 at the base
   over 39.4 units, which is a slope of 0.066; the liquid's own top corners
   are that slope evaluated at y18, not eyeballed, so the fill meets the
   walls exactly at every size instead of leaving a hairline of ground down
   one side.

   THE SURFACE IS ITS OWN ELLIPSE, slightly lighter than the body. Without it
   the fill reads as a flat coloured block behind glass; with it the liquid
   has a top, which is the whole difference between a drink and a swatch.

   The outline takes currentColor so the caller owns it, and every drop of
   colour that IS the drink comes in through `tint`. */
function GlassMark({ tint, className }: { tint: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      aria-hidden="true"
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMax meet"
    >
      {/* the liquid, then its surface, then the glass over both */}
      <path
        d="M8.79 18 H31.21 L29.4 43 Q29.4 45.4 27 45.4 H13 Q10.6 45.4 10.6 43 Z"
        fill={tint}
        opacity="0.92"
      />
      <ellipse cx="20" cy="18" rx="11.21" ry="2.1" fill={tint} />
      <ellipse cx="20" cy="18" rx="11.21" ry="2.1" fill="#fff" opacity="0.22" />
      <path
        d="M8 6 H32 L29.4 43 Q29.4 45.4 27 45.4 H13 Q10.6 45.4 10.6 43 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <ellipse
        cx="20"
        cy="6"
        rx="12"
        ry="2.6"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

/* deterministic per index — see the note on the glasses above */
const DRIFT = [10, -6, 8, -9];

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

export default function MenuView() {
  const pour = useSectionIn();
  const pantry = useSectionIn();
  const ask = useSectionIn();

  const rPour = useReveal(pour.on, pour.reduced);
  const rPantry = useReveal(pantry.on, pantry.reduced);
  const rAsk = useReveal(ask.on, ask.reduced);

  /* WHICH CATEGORY IS OPEN, or null for none — and null is the honest
     starting state rather than "Tea is selected". Opening one by default
     would push the pantry section down on first paint for a reader who
     never asked, and it would make the row look like it had a current
     selection when what it has is four equal categories.

     Clicking the open card closes it, so the control is a toggle in both
     directions. A card that only ever opens leaves no way back to the
     resting state except reloading. */
  const [open, setOpen] = useState<number | null>(null);

  /* GSAP's two targets. The glass refs are the INNER wrappers — motion owns
     the <li>'s own transform for the entrance, so GSAP is given a different
     node to write to rather than fighting it for one. */
  const glassRefs = useRef<(HTMLDivElement | null)[]>([]);
  const plateRef = useRef<HTMLElement>(null);
  const drinksRowRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- 1. the glasses, each at its own rate ---- */
      glassRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { y: -DRIFT[i % DRIFT.length] },
          {
            y: DRIFT[i % DRIFT.length],
            ease: "none",
            scrollTrigger: {
              trigger: drinksRowRef.current ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          },
        );
      });

      /* ---- 2. the doodle plate lags its section ----
         The section is the trigger AND the target. 0%/100% of an over-sized
         `cover` plate is a small real movement, not a jump, because cover
         already crops it. */
      if (plateRef.current) {
        gsap.fromTo(
          plateRef.current,
          { backgroundPositionY: "45%" },
          {
            backgroundPositionY: "55%",
            ease: "none",
            scrollTrigger: {
              trigger: plateRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          },
        );
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <>
      {/* ═══════════════ what we pour ═══════════════ */}
      <section
        ref={pour.ref}
        className="relative overflow-x-clip bg-espresso-deep"
        style={{
          paddingTop: "calc(var(--header-h) + clamp(2rem, 6vh, 4.5rem))",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
        }}
      >
        <div className="shell">
          <div className="text-center">
            <motion.span
              {...rPour(0.05, 0)}
              className="eyebrow block text-cream/55"
            >
              <span className="text-orange">02</span> — On the menu
            </motion.span>

            <h1 className="mx-auto mt-5 max-w-[24ch] font-display text-[clamp(2rem,4.2vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-cream">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pour.reduced ? false : { y: "112%" }}
                  animate={{ y: pour.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                  className="block"
                >
                  Everyone drinks something different.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pour.reduced ? false : { y: "112%" }}
                  animate={{ y: pour.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.23, ease: EASE }}
                  className="block text-orange"
                >
                  We pour all of it.
                </motion.span>
              </span>
            </h1>

            <motion.p
              {...rPour(0.42)}
              className="mx-auto mt-6 max-w-[46ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-cream/70"
            >
              Tea, filter coffee, badam milk, buttermilk and more.
            </motion.p>
          </div>

          <ul
            ref={drinksRowRef}
            className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-7"
          >
            {DRINKS.map((d, i) => {
              const isOpen = open === i;
              const dim = open !== null && !isOpen;

              return (
                <motion.li
                  key={d.name}
                  {...rPour(0.5 + i * 0.1, 26)}
                  className="flex flex-col"
                >
                  {/* THE CARD IS A BUTTON NOW, and the dim lives on IT rather
                      than on the <li>. The <li> is what motion animates on
                      entrance, so an opacity written there would inherit the
                      entrance's own delay and answer a click up to a second
                      late — the same trap the pantry's hover-dim fell into.
                      A CSS transition on the child answers immediately.

                      type="button" matters: this sits inside no form, but an
                      unqualified <button> defaults to submit and a stray
                      Enter would try to navigate. */}
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={PANEL_ID}
                    className={`group flex w-full cursor-pointer flex-col rounded-[var(--radius-card)] outline-none transition-opacity duration-300 focus-visible:ring-2 focus-visible:ring-orange/60 ${
                      dim ? "opacity-45" : "opacity-100"
                    }`}
                  >
                    {/* GSAP writes THIS node's y; motion writes the <li>'s.
                        Two engines, two elements, one visual result — which
                        is why the hover lift below is on the TEXT and the
                        ring, never on this div. A third writer here would
                        silently lose to whichever ran last. */}
                    <div
                      ref={(el) => {
                        glassRefs.current[i] = el;
                      }}
                      className="relative aspect-[4/5] w-full"
                    >
                      <Image
                        src={d.img}
                        alt={d.alt}
                        fill
                        sizes="(max-width: 1024px) 44vw, 22vw"
                        className="object-contain object-bottom"
                      />
                    </div>
                    <p
                      className={`mt-5 text-center font-display text-[1.35rem] font-extrabold tracking-[-0.02em] transition-colors duration-300 md:text-[1.5rem] ${
                        isOpen ? "text-orange" : "text-cream group-hover:text-orange"
                      }`}
                    >
                      {d.name}
                    </p>
                    <span className="mt-1 flex items-center justify-center gap-1.5 font-sans text-[0.92rem] text-cream/60 transition-colors duration-300 group-hover:text-cream/85">
                      {countOf(d)}
                      {/* the chevron IS the affordance. Without it a card that
                          opens looks identical to one that does not, and the
                          only hint is the cursor — which a touch screen has
                          no way to show. */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 12 12"
                        className={`h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 4.5 6 8l3.5-3.5" />
                      </svg>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </ul>

          {/* ═══ what is in the category, under the whole row ═══

              ONE PANEL BELOW THE ROW, NOT FOUR INSIDE IT. The row is a grid —
              four across above lg, two across below it — and a panel opening
              inside a grid cell either squashes itself into a quarter of the
              width or shoves the cards beside it out of line. Under the row
              it gets the full measure at every breakpoint, and on a phone,
              where the cards are two-up, it still lands directly beneath the
              pair rather than halfway up the grid.

              HEIGHT IS ANIMATED TO "auto", WHICH MOTION RESOLVES. The lists
              are 2 to 8 names long, so a fixed height would clip the teas or
              leave a hole under the seasonals. overflow-hidden on the
              animated element is what makes the collapse read as a shutter
              rather than a fade. */}
          <motion.div
            id={PANEL_ID}
            initial={false}
            animate={{
              height: open === null ? 0 : "auto",
              opacity: open === null ? 0 : 1,
            }}
            transition={
              pour.reduced
                ? { duration: 0 }
                : { duration: 0.45, ease: EASE }
            }
            className="overflow-hidden"
          >
            {open !== null && (
              <div className="mt-10 rounded-[var(--radius-card)] border border-cream/12 bg-cream/[0.04] px-6 py-7 sm:px-8">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-[1.15rem] font-extrabold tracking-[-0.02em] text-cream">
                    {DRINKS[open].name}
                  </h2>
                  <span className="font-sans text-[0.92rem] text-cream/55">
                    {countOf(DRINKS[open])}
                  </span>
                </div>

                {/* THE VARIETIES ARE CARDS, NOT A BULLET LIST. Each carries a
                    picture of the drink where one exists and a glass mark in
                    the drink's own colour where one does not — see the banner
                    on DRINKS for why those sixteen are marks rather than
                    borrowed photographs.

                    ONE BOX, TWO KINDS OF CONTENT, IDENTICAL SIZE. The image
                    slot is a fixed height with object-contain inside it and
                    the mark is drawn to the same height, so a photograph
                    arriving later drops into a slot that already has its
                    shape. The grid does not reflow when the artwork lands.

                    keyed on the open index so switching categories replays
                    the stagger instead of cross-fading two different lists
                    in place. */}
                <ul
                  key={open}
                  className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                >
                  {DRINKS[open].varieties.map((v, j) => (
                    <motion.li
                      key={v.name}
                      initial={pour.reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        pour.reduced
                          ? { duration: 0 }
                          : { duration: 0.4, delay: j * 0.05, ease: EASE }
                      }
                      className="group/v overflow-hidden rounded-[0.9rem] border border-cream/10 bg-cream/[0.03] transition-colors duration-300 hover:border-orange/45 hover:bg-cream/[0.06]"
                    >
                      {/* ═══ ONE TILE, THREE KINDS OF PICTURE ═══

                          The grid has to hold three things that arrive in
                          different shapes, and it holds them in one 4:3 frame
                          so the cards stay a single object rather than three
                          designs sharing a row:

                            cover   a SCENE photograph — the client's own, a
                                    glass on a wooden table. It fills the tile
                                    edge to edge, because a scene cropped
                                    small and floated in the middle stops
                                    being a scene.
                            plate   a CUT-OUT on transparency, the kind the
                                    rest of this site is built from. It sits
                                    INSIDE the tile with air around it, on the
                                    tile's own ground, because a cut-out
                                    stretched to the edges would be cropped
                                    into a fragment of a glass.
                            mark    the drawn stand-in, same placement as a
                                    plate.

                          The cut-outs are 800x1000 with the drink standing
                          from 35.9% to 96% — headroom the category row needs
                          so four glasses of different heights share one
                          baseline, and dead space here. object-bottom plus a
                          little scale pulls the drink down into the frame
                          instead of leaving it floating high with a third of
                          the tile empty above it. */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-cream/[0.07] to-transparent">
                        {v.img ? (
                          <Image
                            src={v.img}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                            className={
                              v.cover
                                ? "object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/v:scale-[1.06]"
                                : "origin-bottom scale-[1.18] object-contain object-bottom p-2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/v:scale-[1.24]"
                            }
                          />
                        ) : (
                          /* text-cream/40 IS NOT DECORATION, IT IS THE FIX.
                             The mark's outline is stroked with currentColor
                             so the caller owns it — and with no colour set
                             here it inherited the body's dark ink, which on
                             an espresso ground drew the rim as a black band
                             across the top of every glass. It needs a light
                             colour stated, not merely a light context. */
                          <GlassMark
                            tint={v.tint ?? "#C98B4B"}
                            className="absolute inset-0 m-auto h-[78%] w-full text-cream/40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/v:scale-105"
                          />
                        )}
                      </div>
                      <span className="block px-3 py-3 text-center font-sans text-[0.9rem] leading-tight text-cream/85 transition-colors duration-300 group-hover/v:text-cream">
                        {v.name}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ the pantry ═══════════════ */}
      <section
        ref={(el) => {
          pantry.ref.current = el;
          plateRef.current = el;
        }}
        className="relative overflow-x-clip"
        style={{
          backgroundColor: "#f8e7d2",
          backgroundImage:
            "linear-gradient(to bottom, rgba(248,231,210,0.46) 0%, rgba(248,231,210,0.34) 34%, rgba(248,231,210,0.22) 100%), url(/img/pantry-doodles.webp)",
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center 50%",
          backgroundRepeat: "no-repeat, no-repeat",
          paddingTop: "clamp(3rem, 8vh, 5.5rem)",
          paddingBottom: "clamp(3rem, 8vh, 5.5rem)",
        }}
      >
        <div className="shell">
          <div className="max-w-[46rem]">
            <motion.span {...rPantry(0.05, 0)} className="eyebrow block">
              <span className="text-orange-deep">03</span> — The pantry
            </motion.span>

            <h2 className="mt-5 font-display text-[clamp(1.85rem,3.6vw,2.9rem)] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pantry.reduced ? false : { y: "112%" }}
                  animate={{ y: pantry.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.14, ease: EASE }}
                  className="block"
                >
                  The break doesn’t
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span
                  initial={pantry.reduced ? false : { y: "112%" }}
                  animate={{ y: pantry.on ? "0%" : "112%" }}
                  transition={{ duration: 0.9, delay: 0.23, ease: EASE }}
                  className="block text-orange-dark"
                >
                  stop at the cup.
                </motion.span>
              </span>
            </h2>

            <motion.p
              {...rPantry(0.42)}
              className="mt-6 max-w-[42ch] font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.6] text-ink-soft"
            >
              From a quick snack to a customised spread, give your team
              something more to look forward to.
            </motion.p>

            <motion.p
              {...rPantry(0.55)}
              className="mt-7 font-display text-[clamp(1.2rem,1.7vw,1.6rem)] font-extrabold tracking-[-0.025em] text-ink"
            >
              Tea break, sorted.
            </motion.p>
            <motion.p
              {...rPantry(0.62)}
              className="mt-1.5 font-sans text-[clamp(1rem,1.3vw,1.25rem)] text-orange-deep"
            >
              Drinks and bites, customised for your team.
            </motion.p>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {PANTRY.map((p, i) => (
              <motion.li
                key={p.name}
                {...rPantry(0.6 + i * 0.09, 22)}
                className="flex flex-col items-center rounded-[var(--radius-card)] border border-line/70 bg-cream/70 px-4 py-6 text-center backdrop-blur-[2px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5"
              >
                <div className="relative h-[clamp(84px,10vw,120px)] w-full">
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 1024px) 30vw, 140px"
                    className="object-contain"
                  />
                </div>
                <p className="mt-5 font-display text-[1.02rem] font-extrabold leading-[1.3] tracking-[-0.01em] text-ink md:text-[1.1rem]">
                  {p.name}
                </p>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {["We prepare", "We deliver"].map((label, i) => (
              <motion.span
                key={label}
                initial={pantry.reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: pantry.on ? 1 : 0,
                  scale: pantry.on ? 1 : 0.85,
                }}
                transition={{
                  duration: 0.5,
                  delay: 1.05 + i * 0.12,
                  ease: EASE,
                }}
                className={`inline-flex items-center gap-2 rounded-[0.7rem] border px-4 py-2.5 font-display text-[0.72rem] font-extrabold uppercase tracking-[0.1em] ${
                  i === 1
                    ? "border-orange-dark bg-orange-soft text-orange-dark"
                    : "border-orange-dark/45 bg-cream text-orange-dark"
                }`}
              >
                {label}
                <span aria-hidden="true">&rarr;</span>
              </motion.span>
            ))}
            <motion.p
              {...rPantry(1.3)}
              className="font-sans text-[0.95rem] text-ink-soft"
            >
              The snacks ride along on a delivery already happening.
            </motion.p>
          </div>
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
                Tell us what your people drink.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span
                initial={ask.reduced ? false : { y: "112%" }}
                animate={{ y: ask.on ? "0%" : "112%" }}
                transition={{ duration: 0.9, delay: 0.19, ease: EASE }}
                className="block text-orange"
              >
                We’ll pour it.
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

            <a
              href={MAIL_HREF}
              className="inline-flex h-[3.25rem] items-center rounded-full border border-cream/25 px-7 font-sans text-[0.95rem] font-semibold text-cream transition-colors duration-300 hover:border-cream/60"
            >
              Email us
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
              href="/machines"
              className="font-semibold text-cream underline decoration-orange decoration-2 underline-offset-4"
            >
              The machines
            </Link>
          </motion.p>
        </div>
      </section>
    </>
  );
}
