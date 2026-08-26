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
 * Delivery, then the menu, then the machine. A carousel whose slides all make
 * the same point is a slideshow of one idea, and a visitor learns nothing by
 * waiting for it. These three are the three reasons to buy, in order.
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
 * WHAT AUTOPLAY OWES THE VISITOR
 * It stops on hover, on keyboard focus anywhere inside, and entirely under
 * prefers-reduced-motion — an auto-advancing hero that cannot be stopped is
 * a WCAG 2.2.2 failure, not a style choice. Every slide is also reachable
 * without waiting: dots, arrow keys, and a swipe on touch.
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

const LIGHT_SLIDES: LightSlide[] = [
  {
    /* The mockup's warm peach: light at the upper left, deepening across to
       the drinks. Outer stop capped at #f5dec6 — the reference runs to about
       #efd2b4, where the orange-dark accent line drops to 2.85:1. */
    ground:
      "radial-gradient(125% 125% at 26% 12%, #fefaf5 0%, #faeadb 45%, #f5dec6 100%)",
    lines: ["Chai, filter coffee,", "badam milk and", "hot chocolate."],
    accent: ["Something for", "everyone."],
    sub: "Give your team more to choose from, with fresh hot beverages made for every taste and delivered straight to your workplace.",
    primary: { label: "See the menu", href: "#menu" },
    secondary: { label: "Get pricing", href: "#pricing" },
    image: {
      src: "/img/hero-slide-drinks.webp",
      alt: "Chai, filter coffee, badam milk and hot chocolate with whole spices",
    },
  },
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
];

const TONES: HeroTone[] = ["dark", "light", "light"];
const COUNT = TONES.length;

export default function Hero() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
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
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
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
