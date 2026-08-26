"use client";

import type { CSSProperties } from "react";

/**
 * Steam rising off a drink.
 *
 * Three things decide whether this reads as steam or as fog:
 *
 *   1. It needs a dark background. Steam is light; on a light page it is
 *      invisible, which is why the menu section is espresso.
 *   2. It has to come out of the cup — the right height AND the right
 *      place across. Garnish sits beside every drink, so no vessel is at
 *      the middle of its frame; `cx` and `mouth` are measured off each
 *      photograph rather than assumed.
 *   3. It has to move like steam: curling through three waypoints while
 *      growing, never travelling straight at a fixed size.
 *
 * EVERY DRINK GETS ITS OWN PLUME
 * A shared wisp set makes four drinks steam in unison, which is the fastest
 * way to look synthetic. Each vessel gets a set that matches what it is:
 *
 *   tea        a wide glass of scalding chai — full, steady plumes
 *   coffee     a small brass tumbler, hottest of the four — narrow, fast,
 *              tightly grouped, because the mouth is only 37% wide
 *   milk       a tall glass of warm badam milk — few, wide, slow and faint;
 *              warm milk barely steams at all
 *   specialty  a broad mug of chocolate — thick, lazy, spread out
 *
 * No two drinks share a cycle length, so nothing ever pulses together.
 */

type Wisp = {
  /** position across the mouth, 0–100 */
  at: number;
  size: number;
  dur: number;
  lag: number;
  blur: number;
  peak: number;
  /** the curl: three waypoints, alternating so it wavers */
  x: [string, string, string];
};

/* extra room above the stage, as a % of stage height, so wisps are never
   clipped mid-plume */
const HEADROOM = 20;

const VARIANTS: Wisp[][] = [
  /* 0 — tea: full, steady, evenly spread */
  [
    { at: 34, size: 34, dur: 9, lag: -2.4, blur: 18, peak: 0.72, x: ["-26%", "14%", "-46%"] },
    { at: 58, size: 27, dur: 7, lag: -5.1, blur: 14, peak: 0.62, x: ["18%", "-12%", "42%"] },
    { at: 47, size: 44, dur: 11, lag: -8.3, blur: 26, peak: 0.5, x: ["-8%", "22%", "-16%"] },
    { at: 70, size: 24, dur: 13, lag: -3.7, blur: 15, peak: 0.42, x: ["14%", "-20%", "34%"] },
    { at: 22, size: 29, dur: 8, lag: -6.6, blur: 20, peak: 0.38, x: ["-20%", "6%", "-36%"] },
  ],
  /* 1 — coffee: narrow mouth, hottest, so tight fast columns */
  [
    { at: 42, size: 22, dur: 6, lag: -1.8, blur: 12, peak: 0.82, x: ["-16%", "10%", "-28%"] },
    { at: 56, size: 18, dur: 5, lag: -3.4, blur: 10, peak: 0.74, x: ["12%", "-8%", "26%"] },
    { at: 49, size: 30, dur: 8.5, lag: -6.9, blur: 20, peak: 0.6, x: ["-6%", "16%", "-12%"] },
    { at: 34, size: 16, dur: 4.5, lag: -2.6, blur: 9, peak: 0.55, x: ["-12%", "4%", "-22%"] },
    { at: 64, size: 20, dur: 10, lag: -7.7, blur: 14, peak: 0.46, x: ["10%", "-14%", "24%"] },
    { at: 47, size: 38, dur: 12.5, lag: -10.2, blur: 28, peak: 0.34, x: ["4%", "-10%", "14%"] },
  ],
  /* 2 — milk: warm, not scalding. Barely steams. */
  [
    { at: 44, size: 44, dur: 16, lag: -4.2, blur: 30, peak: 0.34, x: ["-14%", "8%", "-26%"] },
    { at: 60, size: 36, dur: 19, lag: -11.5, blur: 26, peak: 0.26, x: ["10%", "-6%", "20%"] },
    { at: 51, size: 52, dur: 14, lag: -8.8, blur: 34, peak: 0.2, x: ["-4%", "12%", "-8%"] },
  ],
  /* 3 — specialty: broad mug, thick and lazy */
  [
    { at: 32, size: 46, dur: 12, lag: -3.1, blur: 26, peak: 0.6, x: ["-22%", "10%", "-38%"] },
    { at: 55, size: 38, dur: 15, lag: -9.4, blur: 22, peak: 0.52, x: ["16%", "-10%", "30%"] },
    { at: 44, size: 56, dur: 17, lag: -13.6, blur: 34, peak: 0.4, x: ["-6%", "18%", "-14%"] },
    { at: 68, size: 30, dur: 10.5, lag: -5.8, blur: 19, peak: 0.34, x: ["12%", "-16%", "26%"] },
  ],
];

/* the glow on the liquid, sized to how hard the drink is steaming */
const BASE = [
  { w: "62%", h: 22, a: 0.85, dur: "5.5s" },
  { w: "72%", h: 26, a: 0.95, dur: "4.2s" },
  { w: "54%", h: 16, a: 0.45, dur: "7.5s" },
  { w: "66%", h: 24, a: 0.7, dur: "6.4s" },
];

export default function CardSteam({
  rim,
  cx,
  mouth,
  variant,
  boost = false,
}: {
  /** liquid surface, as a % of stage height */
  rim: number;
  /** centre of the vessel mouth, as a % of stage width */
  cx: number;
  /** width of the vessel mouth, as a % of stage width */
  mouth: number;
  /** which plume set — one per drink, never shared */
  variant: number;
  boost?: boolean;
}) {
  const wisps = VARIANTS[variant % VARIANTS.length];
  const base = BASE[variant % BASE.length];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -translate-x-1/2 overflow-hidden transition-opacity duration-700"
      style={{
        left: `${cx}%`,
        /* the box reaches above the stage so a rising wisp has somewhere to
           go; its bottom still lands exactly on the liquid */
        top: `${-HEADROOM}%`,
        height: `${rim + HEADROOM}%`,
        /* steam spreads wider than the cup it leaves */
        width: `${mouth * 1.9}%`,
        opacity: boost ? 1 : 0.72,
        /* dissolve toward the top instead of meeting the clip edge — an
           overflow boundary cuts a wisp in a dead straight line, which is
           the one thing steam never does */
        maskImage:
          "linear-gradient(to top, #000 0%, #000 40%, rgba(0,0,0,0.3) 72%, transparent 94%)",
        WebkitMaskImage:
          "linear-gradient(to top, #000 0%, #000 40%, rgba(0,0,0,0.3) 72%, transparent 94%)",
      }}
    >
      {/* the glow sitting on the liquid — this is what ties the steam to
          the cup. Without it the wisps read as fog that happens to be near. */}
      <span
        className="steam-base absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%]"
        style={
          {
            width: base.w,
            height: base.h,
            background: `radial-gradient(ellipse at 50% 70%, rgba(255,252,246,${base.a}), rgba(255,252,246,0) 72%)`,
            filter: "blur(9px)",
            animationDuration: base.dur,
          } as CSSProperties
        }
      />

      {wisps.map((w, i) => (
        <span
          key={i}
          className="wisp absolute bottom-0 rounded-full"
          style={
            {
              left: `${w.at}%`,
              width: w.size,
              height: w.size * 2.9,
              marginLeft: -w.size / 2,
              background:
                "radial-gradient(ellipse at 50% 68%, rgba(255,253,250,0.98), rgba(255,253,250,0) 72%)",
              filter: `blur(${w.blur}px)`,
              "--dur": `${w.dur}s`,
              "--lag": `${w.lag}s`,
              "--peak": w.peak,
              "--x1": w.x[0],
              "--x2": w.x[1],
              "--x3": w.x[2],
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
