"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import SlideFlask from "./SlideFlask";
import SlideLight, { type LightSlide } from "./SlideLight";
import { setHeroTone, type HeroTone } from "@/lib/heroTone";

/**
 * The hero, as a carousel of three.
 *
 * THREE SLIDES, THREE ARGUMENTS
 * Delivery, then the machine, then the menu. A carousel whose slides all make
 * the same point is a slideshow of one idea, and a visitor learns nothing by
 * waiting for it. These three are the three reasons to buy, in order.
 *
 * THE THIRD ARGUMENT IS NOW FRAMED THROUGH THE MACHINE, and that is worth
 * watching. Slide three used to open "Tea, filter coffee, badam milk and hot
 * chocolate"; the client's copy opens "One Machine. Every Favourite." It is
 * still the MENU argument — the whole paragraph is four named drinks — but it
 * arrives through the same noun slide two leads with, so the gap between the
 * two is narrower than it was. If a fourth slide is ever added, or if these
 * start reading as one idea told twice, this is the pair to separate.
 *
 * THE MACHINE MOVED AHEAD OF THE MENU at the client's direction. It used to
 * run delivery -> menu -> machine. Nothing about the slides changed except
 * which comes second: each entry in LIGHT_SLIDES carries its own ground,
 * copy, buttons, `flip` and photograph, so reordering the array moves all of
 * that together and cannot separate a headline from its picture.
 *
 * Worth knowing if it is ever reordered again: the two are NOT
 * interchangeable objects. The machine slide is the one with `flip: true` —
 * its photograph faces right and is mirrored so it reads into the copy
 * rather than off the edge — and the two grounds are different (warm peach
 * for the drinks, cool greige for the machine). Swapping only the `image`
 * fields, rather than the whole entries, is what leaves a slide showing the
 * wrong picture under the right words.
 *
 * IT CROSSFADES, IT DOES NOT SLIDE
 * Slide one is a full-screen WebGL canvas. Translating it horizontally means
 * compositing a moving canvas layer every frame of the transition; crossfading
 * costs one opacity animation and cannot judder. It also lets all three sit in
 * the same box, so the section's height never changes.
 *
 * THE HEADER FOLLOWS THE SLIDE
 * The header floats over the hero with no ground of its own until it sticks,
 * so cream links over a cream slide would be invisible and the maroon logo
 * would be invisible over the dark one. Each slide publishes its tone to
 * lib/heroTone and the header reads it.
 *
 * It is announced at the MIDPOINT of the crossfade, not at either end. Switch
 * at the start and dark chrome sits on a still-dark ground for half a second;
 * switch at the end and light chrome hangs on over the new cream. At the
 * midpoint both grounds are half-present, which is the one moment either set
 * of chrome is equally readable — so the swap happens where it shows least.
 *
 * IT RUNS, AND IT KEEPS RUNNING
 * It used to stop on hover. That read as broken, because on a desktop the
 * pointer rests over the hero most of the time — and hover was never a
 * mechanism keyboard or touch users had anyway. There was briefly an explicit
 * pause button beside the dots; it is gone at the client's request.
 *
 * WHAT IS LEFT, AND WHAT IS NOT
 * It stops entirely under prefers-reduced-motion, which is how a visitor who
 * needs motion stopped actually stops it, and every slide is reachable
 * without waiting: dots, arrow keys, and a swipe on touch.
 *
 * Note for whoever audits this: there is no longer an in-page control, so
 * WCAG 2.2.2 is met only through the OS-level reduced-motion preference. That
 * is a deliberate call, not an oversight — putting the button back is the fix
 * if an audit asks for one.
 *
 * FOCUS STILL PAUSES, AND THAT IS A DIFFERENT THING.
 * Advancing the slide under a keyboard user who has tabbed into a button
 * moves the thing they were aiming at. That is not a courtesy, so it stays.
 *
 * OFF-SLIDE CONTENT IS INERT
 * Three slides stacked means three sets of links in the DOM. Without `inert`
 * a keyboard user tabs from the header into two invisible heroes before
 * reaching the page. Inactive slides are inert and aria-hidden; slide one
 * additionally stops its shader and unmounts its steam.
 */

/** how long a slide holds before the next one comes up */
const DWELL = 7000;
const FADE = 0.9;

/* SLIDE 2 FIRST, THEN SLIDE 3 — index 0 is the carousel's SECOND slide,
   because slide one is SlideFlask and is not in this list. */
const LIGHT_SLIDES: LightSlide[] = [
  {
    /* the mockup's cool studio greige, with the light off the upper left */
    ground:
      "radial-gradient(125% 125% at 30% 20%, #fbf9f5 0%, #f1ece4 48%, #e6e0d7 100%)",
    lines: ["Smart beverage", "machines,"],
    accent: ["built for busy", "workplaces."],
    sub: "Serve hot tea, coffee and more at the touch of a button — quick, convenient and ready whenever your team needs it.",
    primary: { label: "Get pricing", href: "#pricing" },
    secondary: { label: "Explore machines", href: "#machines" },
    /* mirrored: the machine faces right, so it reads into the copy rather
       than off the edge of the page. */
    flip: true,
    image: {
      src: "/img/hero-slide-machine.webp",
      alt: "A Hotcups vending machine dispensing coffee into a paper cup",
    },
    /* Portrait plate, and object-contain sizes it by whichever axis binds
       first — at 46% of 1834px the box is 843x900, so HEIGHT bound and the
       machine filled the viewport top to bottom however narrow the box got.
       Insetting it 9% each way is what actually makes it smaller. */
  },
  {
    /* The mockup's warm peach: light at the upper left, deepening across to
       the drinks. Outer stop capped at #f5dec6 — the reference runs to about
       #efd2b4, where the orange-dark accent line drops to 2.85:1. */
    ground:
      "radial-gradient(125% 125% at 26% 12%, #fefaf5 0%, #faeadb 45%, #f5dec6 100%)",
    /* THE CLIENT'S "SHORT & PREMIUM" WORDING, and short is why it is this one
       rather than the longer draft that came with it.

       A slide holds for DWELL — seven seconds — and then crossfades whether
       or not it has been read. The long version ran a headline, a
       sub-headline and a ~50-word body; at that length a reader gets through
       maybe half of it before the machine slide replaces it, so the back half
       is words nobody sees. It also needed a fourth field on LightSlide for
       the sub-headline, which no other slide would use.

       This version says the same thing in one paragraph and fits the shape
       the type already has. The long draft is kept in the client's message if
       it is ever wanted for the /menu page, where nothing is on a timer. */
    lines: ["One Machine."],
    accent: ["Every Favourite."],
    sub: "Enjoy freshly prepared Tea, Filter Coffee, Badam Milk, and Hot Chocolate, all conveniently served from our beverage machine — giving everyone something they love, right at the workplace.",
    primary: { label: "See the menu", href: "#menu" },
    secondary: { label: "Get pricing", href: "#pricing" },
    /* THE DRINKS PLATE STAYS, UNDER A HEADLINE THAT SAYS "MACHINE".
       That pairing is deliberate and was chosen over the machine plate. The
       sentence is about what comes OUT of the machine — four named drinks —
       so the photograph showing those four is the one that carries it. The
       machine plate would also have put the same picture on two consecutive
       slides, and the hero set has only one of them. */
    image: {
      src: "/img/hero-slide-drinks.webp",
      alt: "Tea, filter coffee, badam milk and hot chocolate with whole spices",
    },
  },
];

const TONES: HeroTone[] = ["dark", "light", "light"];
const COUNT = TONES.length;

export default function Hero() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  /** something inside has keyboard focus — see the note above */
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (reduced) {
      setHeroTone(TONES[i]);
      return;
    }
    const t = window.setTimeout(() => setHeroTone(TONES[i]), (FADE * 1000) / 2);
    return () => window.clearTimeout(t);
  }, [i, reduced]);

  const go = useCallback((n: number) => setI(((n % COUNT) + COUNT) % COUNT), []);

  useEffect(() => {
    if (reduced || held) return;
    const t = window.setTimeout(() => setI((v) => (v + 1) % COUNT), DWELL);
    return () => window.clearTimeout(t);
  }, [i, reduced, held]);

  /* swipe, on touch only — a pointer drag would fight text selection */
  const x0 = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    x0.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (x0.current === null) return;
    const dx = e.changedTouches[0].clientX - x0.current;
    x0.current = null;
    if (Math.abs(dx) > 48) go(i + (dx < 0 ? 1 : -1));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(i - 1);
    }
  };

  /* the dots belong to the carousel, so they follow the index directly
     rather than the tone the header is being told about */
  const dark = TONES[i] === "dark";

  const fade = (on: boolean) => ({
    initial: false as const,
    animate: { opacity: on ? 1 : 0 },
    transition: { duration: reduced ? 0 : FADE, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section
      id="hero"
      aria-roledescription="carousel"
      aria-label="Hotcups"
      className="relative min-h-svh overflow-hidden bg-espresso-deep"
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      {TONES.map((_, n) => (
        <motion.div
          key={n}
          {...fade(n === i)}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          inert={n === i ? undefined : true}
          aria-hidden={n === i ? undefined : true}
          role="group"
          aria-roledescription="slide"
          aria-label={`${n + 1} of ${COUNT}`}
          className="absolute inset-0"
          style={{ zIndex: n === i ? 2 : 1 }}
        >
          {n === 0 ? (
            <SlideFlask active={n === i} />
          ) : (
            <SlideLight slide={LIGHT_SLIDES[n - 1]} active={n === i} />
          )}
        </motion.div>
      ))}

      {/* ---------------- the dots ----------------
          They flip with the ground rather than trying to work on both. A
          single dark pill measured 1.48:1 for the active dot once a cream
          slide was up — invisible. Two treatments, both computed: on the dark
          slide 6.15 active / 4.47 idle, on cream 3.96 / 4.09, against the 3.0
          a non-text indicator needs. */}
      <div className="absolute inset-x-0 bottom-[clamp(1.25rem,3.5vh,2.25rem)] z-20 flex justify-center">
        <div
          className={`flex items-center gap-1 rounded-full border px-2.5 py-2 backdrop-blur-md transition-colors duration-700 ${
            dark ? "border-white/15 bg-black/25" : "border-ink/10 bg-white/75"
          }`}
        >
          {TONES.map((_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => go(n)}
              aria-label={`Show slide ${n + 1} of ${COUNT}`}
              aria-current={n === i ? "true" : undefined}
              className="group grid h-6 w-6 place-items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  n === i
                    ? dark
                      ? "w-6 bg-orange"
                      : "w-6 bg-orange-dark"
                    : dark
                      ? "w-1.5 bg-white/45 group-hover:bg-white/80"
                      : "w-1.5 bg-ink/55 group-hover:bg-ink/80"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
