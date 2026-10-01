"use client";

import { groundStyle, type HeroGround } from "@/lib/content/schema";

/**
 * The slide, roughly, as it is being typed.
 *
 * ── IT IS AN APPROXIMATION AND IT SAYS SO ON ITS FACE ─────────────────────
 *
 * This is NOT SlideLight. The real one is built for a full viewport — svh
 * units, a header-height custom property, a clip-reveal per line, a plate that
 * bleeds off the right edge, framer-motion driving all of it. Dropped into a
 * 16:9 box a tenth of that size it would not render smaller, it would render
 * wrong, and a preview that is wrong in ways nobody can predict is worse than
 * no preview: it gets trusted.
 *
 * So this redraws the same ARRANGEMENT at preview scale — ground, background,
 * plate, headline, accent, sub, buttons, in their real positions and their real
 * colours — and the caption under it says what it cannot promise. What it is
 * for is the questions you can actually answer at this size: is the headline
 * too long, does the photograph fight the ground, is the accent readable on
 * this colour, does the subject face into the copy or off the edge.
 *
 * THE GROUND AND THE SCRIM ARE THE REAL MATHS, not approximations of it.
 * `groundStyle()` is the same function the page calls, and the background
 * picture sits under the same 82% scrim SlideLight paints. Those two are
 * exactly why somebody opens this — a custom colour and a photograph behind
 * the headline — so they are the two things that had to be honest.
 *
 * NO MOTION. The entrance is 0.9s of clip-reveals and a preview that replays
 * it on every keystroke is unusable. What is shown is the settled state, which
 * is the state a visitor reads.
 */
export default function SlidePreview({
  lines,
  accent,
  sub,
  primary,
  secondary,
  img,
  bg,
  ground,
  groundHex,
  flip = false,
  dark = false,
  darkGround = "#240a06",
}: {
  lines: string;
  accent: string;
  sub: string;
  primary: string;
  secondary: string;
  img: string;
  bg: string;
  ground?: HeroGround;
  groundHex?: string;
  flip?: boolean;
  /** slide 1 — a dark scene rather than a plate on a cream gradient */
  dark?: boolean;
  /** the dark slide's ground, now that it is chosen rather than fixed */
  darkGround?: string;
}) {
  const heads = lines.split("\n").filter((l) => l.trim());
  const accents = accent.split("\n").filter((l) => l.trim());

  const groundCss = dark
    ? darkGround
    : groundStyle({ ground: ground ?? "warm", groundHex: groundHex ?? "" });

  const copy = (
    <div className="flex min-w-0 flex-[1.15] flex-col justify-center gap-[0.35em] p-[4%]">
      <p className="text-[clamp(0.7rem,2.1cqw,1.25rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
        {heads.map((l, n) => (
          <span key={n} className={`block ${dark ? "text-cream" : "text-ink"}`}>
            {l}
          </span>
        ))}
        {accents.map((l, n) => (
          <span
            key={`a${n}`}
            /* orange-dark on a light ground, orange on a dark one — the same
               swap the real slides make, and the reason the contrast readout
               on the colour field measures against orange-dark. */
            className={`block ${dark ? "text-orange" : "text-orange-dark"}`}
          >
            {l}
          </span>
        ))}
      </p>

      {sub ? (
        <p
          className={`line-clamp-3 text-[clamp(0.38rem,1cqw,0.62rem)] leading-snug ${
            dark ? "text-cream/70" : "text-ink-soft"
          }`}
        >
          {sub}
        </p>
      ) : null}

      <div className="mt-[0.3em] flex flex-wrap gap-[0.4em]">
        {[primary, secondary].filter(Boolean).map((label, n) => (
          <span
            key={n}
            className={`rounded-full px-[0.9em] py-[0.42em] text-[clamp(0.34rem,0.85cqw,0.55rem)] font-bold ${
              n === 0
                ? "bg-orange text-white"
                : dark
                  ? "border border-cream/40 text-cream"
                  : "border border-ink/25 text-ink"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );

  const plate = (
    <div className="relative min-w-0 flex-1">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt=""
          className="absolute inset-0 size-full object-contain p-[4%]"
          style={flip ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : null}
    </div>
  );

  return (
    /* SMALL ON PURPOSE. Full width this ran past 1200px, which is a second
       copy of the page rather than a preview — it pushed the fields it is
       meant to be read ALONGSIDE off the screen, so checking a change meant
       scrolling away from the box you changed.

       AT 24rem THE WHOLE THING SITS BESIDE ITS FORM, and it is still big
       enough for every question this can actually answer: is the headline too
       long, does the accent read on that colour, is the subject facing into
       the copy. Anything finer than that belongs on the live page, which the
       caption says.

       `@container` + cqw UNITS ARE WHAT MAKE THAT WORK. The type sizes off
       this box's own width rather than the viewport's, so shrinking the frame
       shrinks the headline with it and the arrangement holds instead of the
       copy overflowing a smaller box. */
    <div className="max-w-[24rem]">
      <div
        className="@container relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-line"
        style={{ background: groundCss }}
      >
        {bg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bg}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            {/* THE SAME 82% SlideLight USES. If this were a different number
                the preview would be quietly lying about the one thing it is
                most often opened to check. */}
            <div
              className="absolute inset-0 opacity-[0.82]"
              style={{ background: groundCss }}
            />
          </>
        ) : null}

        <div className="relative flex size-full">
          {flip ? (
            <>
              {plate}
              {copy}
            </>
          ) : (
            <>
              {copy}
              {plate}
            </>
          )}
        </div>
      </div>

      <p className="mt-1.5 text-[0.75rem] leading-snug text-mute">
        Roughly how it will look. The colours, pictures and order are real; the
        type sizes and the entrance are not.
      </p>
    </div>
  );
}
