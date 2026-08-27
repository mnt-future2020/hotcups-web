"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Hero slides 2 and 3 — the cream ones.
 *
 * TWO LAYOUTS, BECAUSE THE TWO PLATES ARE DIFFERENT SHAPES
 * Slide 2's drinks are landscape: the plate fills whatever box it is given, so
 * it bleeds off the right edge and the copy sits against the container's left.
 * Slide 3's machine is portrait — at a sensible height it renders only ~530px
 * wide, so no box will make it fill half a 1900px screen. Bleeding it off the
 * left only moved the hole into the middle of the page. It is a CENTRED PAIR
 * instead: photograph and copy side by side, centred together, so the leftover
 * width lands as equal margins rather than as one big void.
 *
 * The centring is justify-center inside .shell-wide, not a calc against the
 * viewport. The container is already centred, so this centres on screen for
 * free AND cannot push the copy past the container's edge — which a
 * viewport-based calc did at 2560px.
 *
 * TITLE, SUB, TWO BUTTONS. NOTHING ELSE.
 * These carried an eyebrow, a three-icon trust row and the live cups badge —
 * all borrowed from slide 1, none of it earning its place a second and third
 * time. Slide 1 is where a visitor meets the company and needs the proof.
 *
 * THE CUT-OUTS ARE REAL
 * Both plates arrived as PNGs that LOOK like they sit on black. They do not:
 * measured, they carry genuine straight alpha — 45% and 29% fully clear, with
 * colour values well above their alpha in the partial pixels. That last figure
 * is the one that mattered: premultiplied alpha would have fringed every
 * splash and every rim dark against cream.
 *
 * ORANGE GOES DARK ON CREAM
 * The mockups set the accent line in the brand orange. On these grounds it is
 * 2.18:1 and 2.40:1, which fails even the 3.0 large-text floor. orange-dark is
 * 3.16 / 3.14 — the same swap sections 06 and 08 make.
 *
 * THE GROUNDS ARE AS DEEP AS THAT ALLOWS, NOT AS DEEP AS THE MOCKUP
 * The reference peach runs to about #efd2b4, where orange-dark falls to 2.85.
 * Each gradient's outer stop is set at the darkest value its accent line
 * survives — #f5dec6 and #e6e0d7 — a shade off the mockups and still legal.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
/** each headline line 90ms behind the one above it — slide 1's cadence */
const LINE_GAP = 0.09;
const LINE_DUR = 0.5;

/** The copy's measure and the type sized to fill it.

    4.3vw, DOWN FROM 4.7, BECAUSE THE COPY GOT LONGER
    The column is 40vw and the type is a fraction of the same viewport, so in
    the vw regime a line can only ever be (40 / fontVw) em however wide the
    window is — 9.30 em at 4.3vw. The longest line across both slides is
    "Chai, filter coffee,": 8.93 em of raw advances, less 0.70 em given back
    by tracking-[-0.035em] over twenty characters, so 8.23 em. That leaves 12%
    of the column as slack. 4.7vw would also have held it (8.51 em limit), but
    the margin there is 3% and the slides read well at this size, so it stays.

    Verified against the longest line on both slides at eighteen window sizes
    from 375 to 3440. Slide 3 is the binding one and it is NOT bound by this
    column: its copy shares a centred row with the machine, which is shrink-0,
    so above 2200 the flex compresses the text to 672px. */
/* SIDE BY SIDE NEEDS WIDTH RELATIVE TO HEIGHT, NOT WIDTH ALONE.
   The split layout was gated on `md` — 768px — and width alone cannot tell a
   1366x768 laptop from a 1024x1305 iPad in portrait. Both are "≥ 768", and
   the second one is the shape this layout is worst at: the copy and the plate
   each get half of 1024px, so the plate is width-bound at ~470px and 700px
   tall, sitting in a 1305px window. Everything is centred, so the leftover
   ~300px lands as air above the headline and another ~300px under the
   buttons — which is exactly what the screenshots show.

   `md:landscape:` is the honest test. A portrait tablet falls back to the
   stacked layout, where the plate gets the FULL width and takes flex-1 for
   whatever height the copy did not use — so the same window that had 600px
   of air now has a picture in it. Type sizes stay on plain `md:`, because a
   1024px column wants the bigger ramp whichever way the device is held. */
const COPY_W =
  "max-w-[min(34rem,90vw)] md:landscape:max-w-[min(48rem,40vw)]";
/* The mobile leg is slide 1's, and for the same reason: a rem floor does not
   shrink with a 90vw column, so five headline lines at a fixed 32.8px plus a
   three-line sub plus a button row measured 364px of copy inside a box that
   is only 358px tall at 393x852 and 258px at 375x667. Centred, that overflow
   comes off BOTH ends — the headline was running up under the header. The
   ramp tops out at 2.04rem, which is what 4.3vw gives at 768, so there is no
   step where the two legs meet. */
const HEADLINE =
  "font-display text-[clamp(1.5rem,7.2vw,2.04rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink md:text-[clamp(2.05rem,4.3vw,5.15rem)]";

export type LightSlide = {
  /** a warm or a cool cream, so the ground agrees with the photograph */
  ground: string;
  /** rendered in ink, one clip-revealed line each */
  lines: string[];
  /** the closing lines, in orange-dark. An array because the client's copy
      does not fit on one: "Something for everyone." is 12.24 em against a
      column that holds 9.3, so it breaks like any other line rather than
      being shrunk to fit or silently wrapping mid-reveal. */
  accent: string[];
  sub: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  /** portrait plate: centred pair instead of a bleed */
  flip?: boolean;
  image: { src: string; alt: string };
};

export default function SlideLight({
  slide,
  active,
}: {
  slide: LightSlide;
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const flip = Boolean(slide.flip);

  /* The entrance replays every time the slide comes round, which is what
     makes a carousel feel alive rather than three static screenshots. */
  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: active ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  const clipLine = (i: number) =>
    reduced
      ? {}
      : {
          initial: { y: "112%" },
          animate: active ? { y: "0%" } : { y: "112%" },
          transition: { duration: LINE_DUR, delay: i * LINE_GAP, ease: EASE },
        };

  const photoIn = {
    initial: reduced ? false : { opacity: 0, scale: 1.04 },
    animate: active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 },
    transition: { duration: 1.1, ease: EASE },
  } as const;

  /* MOBILE FIT DEPENDS ON THE PLATE'S OWN SHAPE, AND IT HAS TO.
     object-contain fits BOTH axes, so a landscape plate in a phone-width band
     is sized by its WIDTH and then leaves the rest of the band empty above
     it — the drinks rendered 390x260 in a 368px band and the 108px left over
     was the gap under the buttons. Cover fills the band instead: the same
     plate comes out about 1.5x bigger, and the 81px it loses off each side
     is the ginger at the left edge and the mug handle at the right. Every
     drink survives, and on a phone that trade is not close.

     The portrait plate is the opposite case. Cover would scale the machine to
     the band's WIDTH and crop 217px off its top — it would be beheaded. It
     stays contain, where height binds and a taller band simply makes the
     machine bigger. Nothing is cropped and nothing is wasted either way. */
  const photo = (
    <Image
      src={slide.image.src}
      alt=""
      fill
      priority={active}
      sizes="(max-width: 767px) 100vw, 50vw"
      className={`object-bottom md:landscape:object-contain md:landscape:object-center ${
        flip ? "object-contain" : "object-cover"
      }`}
    />
  );

  const copy = (
    <div className={COPY_W}>
      <h1 className={HEADLINE}>
        {slide.lines.map((line, i) => (
          <span key={line} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span {...clipLine(i)} className="block">
              {line}
            </motion.span>
          </span>
        ))}
        {slide.accent.map((line, i) => (
          <span key={line} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span
              {...clipLine(slide.lines.length + i)}
              className="block text-orange-dark"
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.p
        {...rise(0.72)}
        className="mt-4 max-w-[46ch] font-sans text-base leading-relaxed text-ink-soft md:mt-6 md:text-lg"
      >
        {slide.sub}
      </motion.p>

      <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-9">
        <motion.a
          {...rise(0.82)}
          href={slide.primary.href}
          tabIndex={active ? undefined : -1}
          className="hero-btn-dark group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-orange px-5 py-3.5 font-sans text-sm font-semibold text-white shadow-[0_12px_34px_-14px_rgba(242,101,34,0.95)] md:px-7 md:py-4"
        >
          <span className="relative z-10">{slide.primary.label}</span>
          <span
            aria-hidden="true"
            className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </motion.a>

        <motion.a
          {...rise(0.9)}
          href={slide.secondary.href}
          tabIndex={active ? undefined : -1}
          className="hero-btn group relative inline-flex items-center overflow-hidden rounded-full border border-ink/55 px-5 py-3.5 font-sans text-sm font-semibold text-ink transition-colors duration-300 hover:border-ink/80 md:px-6 md:py-4"
        >
          <span className="relative z-10">{slide.secondary.label}</span>
        </motion.a>
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden md:landscape:block"
      style={{ background: slide.ground }}
    >

      {/* NOTHING IS RESERVED ANY MORE, WHICH IS THE WHOLE FIX.
          Below md this was a picture band of min(38svh, 100svh - 440px) with
          the copy centred in a matching pixel reservation above it. Two
          numbers guessing at each other, and on every phone taller than 710px
          the svh leg won and left the difference empty: 44px at 800, 64px at
          852, 94px at 932 — gaps ABOVE the plate, and justify-center then
          split the copy's own slack into a second gap under the header.

          The column below owns its height instead. The copy costs what it
          costs, the plate takes flex-1 — everything left, whatever the phone
          — and there is no leftover to place because nothing was set aside.
          The picture also gets bigger on a taller phone rather than smaller,
          which is what a reader expects.

          md keeps the original box exactly: min-h-svh and centred, with the
          plate positioned inside it rather than under it. */}
      <div className="relative z-10 flex flex-col pb-4 pt-[calc(var(--header-h)+1rem)] md:landscape:min-h-svh md:landscape:justify-center md:landscape:pb-[clamp(3rem,8vh,6rem)] md:landscape:pt-[calc(var(--header-h)+1.5rem)]">
        {flip ? (
          /* CENTRED PAIR — see the note at the top of this file. The box is
             sized off the HEIGHT, min(46vw, 60svh), because object-contain
             sizes a portrait plate by whichever axis binds first and height
             always does here — so the box ends up within ~12px of the
             subject and there is no empty box beside the copy. */
          <div className="shell-wide">
            <div className="flex w-full items-center justify-start gap-[clamp(1.5rem,3vw,3.5rem)] md:landscape:justify-center">
              <motion.div
                aria-hidden="true"
                {...photoIn}
                className="relative hidden h-[88svh] w-[min(46vw,60svh)] shrink-0 md:landscape:block"
              >
                {photo}
              </motion.div>
              {copy}
            </div>
          </div>
        ) : (
          <>
            {/* landscape plate: it fills its box, so it can bleed off the
                right edge without leaving anything empty beside the copy */}
            <motion.div
              aria-hidden="true"
              {...photoIn}
              className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[48%] max-w-[980px] md:landscape:block"
            >
              {photo}
            </motion.div>
            <div className="shell-wide">{copy}</div>
          </>
        )}
      </div>

      {/* the plate, on phones only — it takes every pixel the copy did not */}
      <motion.div
        aria-hidden="true"
        {...photoIn}
        className="pointer-events-none relative min-h-0 w-full flex-1 md:landscape:hidden"
      >
        {photo}
      </motion.div>
    </div>
  );
}
