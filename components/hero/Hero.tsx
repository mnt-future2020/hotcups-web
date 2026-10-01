"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import SlideFlask from "./SlideFlask";
import SlideLight, { type LightSlide } from "./SlideLight";
import { setHeroTone, type HeroTone } from "@/lib/heroTone";
import { useSiteContent } from "@/lib/content/context";
import { groundStyle } from "@/lib/content/schema";

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
 * which comes second: each entry carries its own ground, copy, buttons, `flip`
 * and photograph, so reordering them moves all of that together and cannot
 * separate a headline from its picture. That order now lives in
 * DEFAULT_CONTENT.hero.slides — parseContent maps over the defaults rather than
 * over the stored file, so the positions are fixed and a saved document can
 * only change what is IN each one.
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
/* THE TWO LIGHT SLIDES ARE BUILT FROM STORED COPY, not written here. The array
   that stood in this place held the ground, the headline, the sub, both buttons,
   `flip` and the photograph for each — all of which except the ground are now
   editable at /admin/hero, and the ground is chosen there by name from the two
   measured options in lib/content/schema.

   WHAT HAS NOT CHANGED is the thing the old comment above was warning about:
   each entry still carries its own ground, copy, buttons, flip and photograph
   TOGETHER, so the pairing cannot come apart. Swapping only a photograph and
   leaving a slide's ground and flip alone is still how you get the machine
   under the drinks' peach — the panel says so on the form.

   The ORDER is still the argument's order — delivery, machine, menu — and it is
   still fixed in code, because it is a claim about what the site argues rather
   than a content edit. See the note at the top of this file. */

/* THE TONES ARE DERIVED, WHICH IS WHAT LETS A SLIDE BE ADDED.
   This was the literal ["dark", "light", "light"], and it was the only thing
   actually pinning the carousel to three — a fourth slide would have read
   TONES[3] as undefined and told the header to light itself for `undefined`,
   which is neither of the two things it knows how to be.

   It is not a judgement call. Slide one is SlideFlask, a near-black WebGL
   scene, and it is always index 0; every slide that can be ADDED is a
   SlideLight on a cream ground. So the array is one dark followed by one light
   per stored slide, and there is nothing to keep in step. */
const tonesFor = (lightCount: number): HeroTone[] => [
  "dark",
  ...Array.from({ length: lightCount }, () => "light" as const),
];

export default function Hero() {
  const { hero } = useSiteContent();

  /* The stored slides, with the named ground resolved into the gradient the
     component actually needs. Built inline rather than memoised: it is two
     object literals, and a useMemo whose dependency is `hero` would re-run on
     exactly the renders this does. */
  const lightSlides: LightSlide[] = hero.slides.map((slide) => ({
    ground: groundStyle(slide),
    lines: slide.lines,
    accent: slide.accent,
    sub: slide.sub,
    primary: slide.primary,
    secondary: slide.secondary,
    flip: slide.flip,
    image: slide.image,
    bg: slide.bg,
  }));

  const TONES = tonesFor(lightSlides.length);
  const COUNT = TONES.length;

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

  /* COUNT IS A DEPENDENCY NOW. It used to be a module constant, so an empty
     dep list was correct; with the count coming from the store, a `go` frozen
     at the first render would wrap against a stale number the moment a slide
     was added. */
  const go = useCallback(
    (n: number) => setI(((n % COUNT) + COUNT) % COUNT),
    [COUNT],
  );

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
            <SlideLight slide={lightSlides[n - 1]} active={n === i} />
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
