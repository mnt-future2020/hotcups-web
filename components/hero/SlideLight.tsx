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
const COPY_W = "max-w-[min(34rem,90vw)] md:max-w-[min(48rem,40vw)]";
const HEADLINE =
  "font-display text-[clamp(2.05rem,4.3vw,5.15rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink";

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

  const photo = (
    <Image
      src={slide.image.src}
      alt=""
      fill
      priority={active}
      sizes="(max-width: 767px) 100vw, 50vw"
      className="object-contain object-bottom md:object-center"
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
        className="mt-6 max-w-[46ch] font-sans text-base leading-relaxed text-ink-soft md:text-lg"
      >
        {slide.sub}
      </motion.p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <motion.a
          {...rise(0.82)}
          href={slide.primary.href}
          tabIndex={active ? undefined : -1}
          className="hero-btn-dark group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-orange px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_12px_34px_-14px_rgba(242,101,34,0.95)]"
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
          className="hero-btn group relative inline-flex items-center overflow-hidden rounded-full border border-ink/55 px-6 py-4 font-sans text-sm font-semibold text-ink transition-colors duration-300 hover:border-ink/80"
        >
          <span className="relative z-10">{slide.secondary.label}</span>
        </motion.a>
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: slide.ground }}
    >
      {/* Below md both layouts are identical: a band of photograph along the
          bottom with the copy above it. The split only matters once there is
          width to arrange things across. */}
      <motion.div
        aria-hidden="true"
        {...photoIn}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44svh] md:hidden"
      >
        {photo}
      </motion.div>

      <div className="relative z-10 flex min-h-svh flex-col justify-center pb-[46svh] pt-[calc(var(--header-h)+1.5rem)] md:pb-[clamp(3rem,8vh,6rem)]">
        {flip ? (
          /* CENTRED PAIR — see the note at the top of this file. The box is
             sized off the HEIGHT, min(46vw, 60svh), because object-contain
             sizes a portrait plate by whichever axis binds first and height
             always does here — so the box ends up within ~12px of the
             subject and there is no empty box beside the copy. */
          <div className="shell-wide">
            <div className="flex w-full items-center justify-center gap-[clamp(1.5rem,3vw,3.5rem)]">
              <motion.div
                aria-hidden="true"
                {...photoIn}
                className="relative hidden h-[88svh] w-[min(46vw,60svh)] shrink-0 md:block"
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
              className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[48%] max-w-[980px] md:block"
            >
              {photo}
            </motion.div>
            <div className="shell-wide">{copy}</div>
          </>
        )}
      </div>
    </div>
  );
}
