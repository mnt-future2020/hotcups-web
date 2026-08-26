"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import RollUp from "@/components/ui/RollUp";

/**
 * Section 03 — The delivery day.
 *
 * The heading makes a claim ("someone gets a flask at every hour") and the
 * chart under it is the proof. Hospitals goes last on purpose: that unbroken
 * bar across the full width is the strongest thing the chart says, so it
 * lands as the finish.
 *
 * THE AXIS IS NOT LINEAR
 * A linear 24-hour axis spends 37% of its width on 9PM–6AM, where only the
 * hospitals bar exists. Two fifths of the chart was empty, which reads as
 * "nothing happens at night" — the exact opposite of the headline. So the
 * scale is broken in two: 6AM–9PM (fifteen hours) takes 75% of the width,
 * 9PM–6AM (nine hours) takes the remaining 25%. Every bar, every tick and
 * the NOW marker run through the same `pos()`; nothing is placed by hand.
 *
 * A compressed scale that is not visible is a bug, so the night quarter sits
 * on slightly cooler ground and says "overnight". A shift in ground, not a
 * divider line.
 *
 * WHY EVERY BAR CARRIES ITS TIME
 * An unlabelled bar is only readable by tracing up to the axis. The times sit
 * above each bar, so the schedule is legible without the axis at all — the
 * axis is then just the ruler that proves the spacing is honest. Tick marks
 * do that job; full-height gridlines only competed with the NOW line, which
 * is the one vertical the eye should follow.
 *
 *   0.15s  heading clip-reveals; "every hour" rolls over in orange
 *   0.35s  sub fades up
 *   0.55s  axis draws left to right; hour labels fade in behind it
 *   0.95s  bars wipe in, one row every 140ms
 *   1.51s  hospitals — one continuous sweep, slower, so it reads as the end
 *   1.90s  the now marker drops in and starts creeping
 */

const EASE = [0.16, 1, 0.3, 1] as const;

const T_HEAD = 0.15;
const T_SUB = 0.35;
const T_AXIS = 0.55;
const T_ROW = 0.95;
const ROW_GAP = 0.14;
const T_NOW = 1.9;

/** the row that is active until the visitor points at another */
const DEFAULT_ROW = 1;

/* ---------------------------------------------------------------
   Time → position on a broken scale.

   The domain opens at 6AM: the working day is the subject, and starting at
   midnight would put four dead hours at the front and split the night shift
   across both edges.
   --------------------------------------------------------------- */

const DOMAIN_START = 6;
/** hours after 6AM at which the scale changes gear — 9PM */
const BREAK_AT = 15;
/** share of the track given to the fifteen daytime hours */
const DAY_W = 75;

/** hours since the axis opened, 0–24 */
const dh = (h: number) => (((h - DOMAIN_START) % 24) + 24) % 24;

/** the single mapping every position in this chart goes through */
const pos = (h: number) => {
  const d = dh(h);
  return d <= BREAK_AT
    ? (d / BREAK_AT) * DAY_W
    : DAY_W + ((d - BREAK_AT) / (24 - BREAK_AT)) * (100 - DAY_W);
};

const span = (from: number, to: number) => {
  /* both ends equal is the all-day case: hospitals */
  if (dh(from) === dh(to)) return 100;
  const w = pos(to) - pos(from);
  return w > 0 ? w : 100 - pos(from) + pos(to);
};

const holds = (from: number, to: number, h: number) => {
  const a = dh(from);
  const b = dh(to);
  const x = dh(h);
  if (a === b) return true;
  if (a < b) return x >= a && x < b;
  return x >= a || x < b;
};

const DAY_TICKS = [6, 9, 12, 15, 18, 21];
const NIGHT_TICKS = [0, 3];
const TICKS = [...DAY_TICKS, ...NIGHT_TICKS];

const clock = (h: number) => {
  /* round to the minute first, so 3:59:40 never prints as "3:60" */
  const total = ((Math.round(h * 60) % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const ampm = hh < 12 ? "AM" : "PM";
  const twelve = hh % 12 === 0 ? 12 : hh % 12;
  return `${twelve}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${ampm}`;
};

type Round = { from: number; to: number; label: string };

type Row = {
  key: string;
  name: string;
  cadence: string;
  img: string;
  alt: string;
  rounds: Round[];
};

const ROWS: Row[] = [
  {
    key: "office",
    name: "IT & offices",
    cadence: "Morning and evening",
    img: "/img/who-office.webp",
    alt: "A team in an IT office taking a break with Hotcups mugs",
    rounds: [
      { from: 9.5, to: 10.5, label: "9:30" },
      { from: 16, to: 17, label: "4:00" },
    ],
  },
  {
    key: "factory",
    name: "Manufacturing",
    cadence: "Every shift",
    img: "/img/who-factory.webp",
    alt: "Hotcups served to workers on a manufacturing shop floor",
    rounds: [
      { from: 6, to: 7, label: "6:00" },
      { from: 13.5, to: 14.5, label: "1:30" },
      { from: 21.5, to: 22.5, label: "9:30" },
    ],
  },
  {
    key: "college",
    name: "Colleges & schools",
    cadence: "Between classes",
    img: "/img/who-college.webp",
    alt: "Students with Hotcups cups in a college library",
    rounds: [
      { from: 10.25, to: 11.25, label: "10:15" },
      { from: 13.5, to: 14.5, label: "1:30" },
    ],
  },
  {
    key: "retail",
    name: "Retail shops",
    cadence: "Peak hours",
    img: "/img/who-retail.webp",
    alt: "A shop owner and customers with Hotcups cups at a neighbourhood store",
    rounds: [
      { from: 11, to: 14, label: "11 – 2" },
      { from: 17, to: 20.5, label: "5 – 8:30" },
    ],
  },
  {
    key: "hospital",
    name: "Hospitals",
    cadence: "Round the clock",
    img: "/img/who-hospital.webp",
    alt: "Doctors and nurses on a Hotcups break in a hospital",
    rounds: [{ from: 6, to: 6, label: "Every hour, day and night" }],
  },
];

/* photo · name · track. No column gap, so --gut is exactly the two left
   columns and the axis, ticks and now marker all line up with the bars. */
const COLS = {
  gridTemplateColumns: "var(--thumb) var(--name) 1fr",
} as const;

/* espresso, the brand's dark token, at the weight that leaves orange room
   to be the loudest thing in the chart */
const BAR_REST = "rgba(58,20,14,0.28)";
const BAR_ON = "var(--color-orange)";

const TRACK_VARS = {
  "--barh": "clamp(1.7rem,3.9vh,2.45rem)",
} as React.CSSProperties;

export default function Industries() {
  const ref = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.15 });
  const on = inView || Boolean(reduced);

  const [hover, setHover] = useState<number | null>(null);
  const [now, setNow] = useState<{ h: number; pct: number } | null>(null);

  const active = hover ?? DEFAULT_ROW;

  /* the clock is read on the client only — rendering it on the server would
     bake in the build time and mismatch on hydration */
  useEffect(() => {
    const read = () => {
      const d = new Date();
      const h = d.getHours() + d.getMinutes() / 60;
      setNow({ h, pct: pos(h) });
    };
    read();
    const id = setInterval(read, 30_000);
    return () => clearInterval(id);
  }, []);

  /* on a narrow screen the chart scrolls; open it where the day actually is */
  useEffect(() => {
    const el = scroller.current;
    if (!el || !now) return;
    const over = el.scrollWidth - el.clientWidth;
    if (over <= 0) return;
    /* --gut lives on the track, not on the scroller that clips it */
    const track = el.firstElementChild;
    if (!track) return;
    const gut =
      parseFloat(getComputedStyle(track).getPropertyValue("--gut")) || 0;
    const x = gut + (el.scrollWidth - gut) * (now.pct / 100);
    el.scrollLeft = Math.max(0, Math.min(over, x - el.clientWidth / 2));
    /* position once, on the first clock read — not on every tick, or it
       would yank the view back while someone is reading */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now !== null]);

  const running = now
    ? ROWS.filter((r) => r.rounds.some((d) => holds(d.from, d.to, now.h))).length
    : 0;

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

  const fade = (delay: number, duration = 0.5) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0 },
          animate: on ? { opacity: 1 } : { opacity: 0 },
          transition: { duration, delay },
        };

  return (
    <section
      id="industries"
      ref={ref}
      className="relative flex min-h-svh flex-col [justify-content:safe_center] overflow-x-clip bg-cream-deep"
      style={{
        paddingTop: "calc(var(--header-h) + clamp(1rem, 3vh, 2.25rem))",
        paddingBottom: "clamp(2rem, 5vh, 3.5rem)",
      }}
    >
      <div className="shell relative z-10">
        {/* ---------------- header ---------------- */}
        <div className="grid gap-y-5 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            <motion.div {...reveal(0.05, 0)} className="flex items-center gap-4">
              <span className="eyebrow whitespace-nowrap">
                03 — Where the flasks go
              </span>
              <motion.span
                initial={reduced ? undefined : { scaleX: 0 }}
                animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
                className="h-px w-16 origin-left bg-line md:w-24"
              />
            </motion.div>

            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.7vw,3rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span {...clipLine(T_HEAD)} className="block">
                  Someone gets a flask at
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span {...clipLine(T_HEAD + 0.09)} className="block">
                  <RollUp play={on} delay={0.5}>
                    every hour
                  </RollUp>{" "}
                  of the day.
                </motion.span>
              </span>
            </h2>
          </div>

          <motion.div {...reveal(T_SUB)} className="lg:col-span-5 lg:pt-11">
            <h3 className="font-display text-[clamp(1.08rem,1.4vw,1.32rem)] font-extrabold tracking-[-0.02em] text-ink">
              The workplaces we deliver to most
            </h3>
            <p className="mt-1.5 max-w-[46ch] font-sans text-[clamp(0.98rem,1.1vw,1.12rem)] leading-[1.55] text-ink-soft">
              Five kinds of workplace, and the hours their flasks arrive. We
              deliver to your rhythm, not ours.
            </p>
          </motion.div>
        </div>

        {/* ---------------- the chart ----------------
            Below lg the track scrolls sideways and the photo and name pin to
            the left, so a row never loses what names it. */}
        <div
          ref={scroller}
          className="mt-[clamp(1.2rem,2.8vh,2.1rem)] overflow-x-auto pb-1 lg:overflow-x-visible"
        >
          <div
            className="relative min-w-[880px] lg:min-w-0"
            style={
              {
                "--rowh": "clamp(58px, min(5.6vw, 8.4vh), 84px)",
                "--thumb": "calc(var(--rowh) + 1.15rem)",
                "--name": "clamp(150px, 14vw, 215px)",
                "--gut": "calc(var(--thumb) + var(--name))",
              } as React.CSSProperties
            }
          >
            {/* hour labels, and the line that says what to do with the chart */}
            <div className="grid items-end" style={COLS}>
              <div />
              <div />
              <div className="relative h-[17px]">
                {TICKS.map((t, i) => (
                  <motion.span
                    key={t}
                    {...fade(T_AXIS + i * 0.05)}
                    className="absolute top-0 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-ink/40"
                    style={{
                      left: `${pos(t)}%`,
                      transform: i === 0 ? "none" : "translateX(-50%)",
                    }}
                  >
                    {clock(t)}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* everything from the axis line down */}
            <div className="relative mt-1.5">
              {/* the night quarter stands on cooler ground, so the change of
                  gear in the scale is felt rather than discovered */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 z-0"
                style={{ left: "var(--gut)", right: 0 }}
              >
                <motion.span
                  {...fade(T_AXIS + 0.3, 0.8)}
                  className="absolute inset-y-0"
                  style={{
                    left: `${DAY_W}%`,
                    right: 0,
                    background: "rgba(43,47,51,0.045)",
                  }}
                />
                <motion.span
                  {...fade(T_AXIS + 0.45, 0.6)}
                  className="absolute font-sans text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink/30"
                  style={{ left: `calc(${DAY_W}% + 9px)`, top: "7px" }}
                >
                  Overnight
                </motion.span>
              </div>

              {/* the axis, drawn left to right, with ticks hanging off it */}
              <div className="relative z-10 grid" style={COLS}>
                <div />
                <div />
                <div>
                  <motion.div
                    initial={reduced ? undefined : { scaleX: 0 }}
                    animate={
                      reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }
                    }
                    transition={{ duration: 0.6, delay: T_AXIS, ease: "linear" }}
                    className="h-px w-full origin-left"
                    style={{ background: "rgba(58,20,14,0.22)" }}
                  />
                  <div className="relative h-[6px]">
                    {TICKS.map((t, i) => (
                      <motion.span
                        key={t}
                        {...fade(T_AXIS + 0.2 + i * 0.04, 0.4)}
                        className="absolute top-0 h-[6px] w-px"
                        style={{
                          left: `${pos(t)}%`,
                          background: "rgba(58,20,14,0.26)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* ---------------- rows ---------------- */}
              <div className="relative z-10 mt-[clamp(0.5rem,1.4vh,0.9rem)] flex flex-col gap-[clamp(0.55rem,1.7vh,1.15rem)]">
                {ROWS.map((r, i) => {
                  const at = T_ROW + i * ROW_GAP;
                  const last = i === ROWS.length - 1;
                  const hot = active === i;

                  return (
                    <motion.div
                      key={r.key}
                      tabIndex={0}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      {...reveal(at, 10)}
                      className="grid cursor-pointer items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
                      style={COLS}
                    >
                      {/* photo — pins left while the track scrolls.
                          The dim lives on the label side only. Putting it on
                          the whole row would multiply with the bar's own 28%
                          and leave the inactive bars at 11% — invisible. */}
                      <div className="sticky left-0 z-20 bg-cream-deep">
                        <div
                          className="relative h-[var(--rowh)] w-[var(--rowh)] overflow-hidden rounded-[0.75rem] transition-all duration-[400ms]"
                          style={{
                            /* a face at 40% opacity reads as a broken image,
                               not as an unselected row. Inactive photos keep
                               their brightness and only lose some colour; the
                               active row is carried by the orange ring, name
                               and bars instead. */
                            filter: hot ? "none" : "saturate(0.5)",
                            boxShadow: hot
                              ? "0 0 0 2px var(--color-orange), var(--shadow-2)"
                              : "0 0 0 1px var(--color-line), var(--shadow-1)",
                          }}
                        >
                          <Image
                            src={r.img}
                            alt={r.alt}
                            fill
                            sizes="110px"
                            className="object-cover"
                          />
                        </div>
                      </div>

                      {/* name, and what its rhythm is called */}
                      <div className="sticky left-[var(--thumb)] z-20 bg-cream-deep pr-4 lg:static">
                        <h3
                          className="font-display text-[clamp(1.05rem,1.5vw,1.35rem)] font-extrabold leading-[1.15] tracking-[-0.02em] transition-colors duration-[400ms]"
                          style={{
                            color: hot
                              ? "var(--color-orange)"
                              : "var(--color-ink)",
                          }}
                        >
                          {r.name}
                        </h3>
                        <p className="mt-0.5 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.13em] text-ink/40">
                          {r.cadence}
                        </p>
                      </div>

                      {/* the track: times above, bars below */}
                      <div
                        className="relative h-[calc(1.25rem+var(--barh))]"
                        style={TRACK_VARS}
                      >
                        {r.rounds.map((d, j) => (
                          <motion.span
                            key={"t" + j}
                            {...fade(at + 0.25 + j * 0.06, 0.4)}
                            className="absolute top-0 whitespace-nowrap font-sans text-[0.78rem] font-semibold tabular-nums transition-colors duration-[400ms]"
                            style={{
                              left: `${pos(d.from)}%`,
                              color: hot
                                ? "var(--color-orange)"
                                : "rgba(58,20,14,0.5)",
                            }}
                          >
                            {d.label}
                          </motion.span>
                        ))}

                        {r.rounds.map((d, j) => (
                          <motion.span
                            key={"b" + j}
                            initial={reduced ? undefined : { scaleX: 0 }}
                            animate={
                              reduced
                                ? undefined
                                : on
                                  ? { scaleX: 1 }
                                  : { scaleX: 0 }
                            }
                            transition={{
                              /* the last row sweeps slower, so twenty-four
                                 unbroken hours read as the finish rather than
                                 as one more bar */
                              duration: last ? 0.9 : 0.5,
                              delay: at + j * 0.06,
                              ease: last ? "easeInOut" : EASE,
                            }}
                            className="absolute bottom-0 h-[var(--barh)] origin-left rounded-full transition-colors duration-[400ms]"
                            style={{
                              left: `${pos(d.from)}%`,
                              width: `${span(d.from, d.to)}%`,
                              backgroundColor: hot ? BAR_ON : BAR_REST,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ---------------- the now marker ----------------
                  The only vertical line inside the chart body. */}
              {now && !reduced && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-30"
                  style={{ left: "var(--gut)", right: 0 }}
                >
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={
                      on ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.55, delay: T_NOW, ease: EASE }}
                    className="absolute inset-y-0 origin-top"
                    style={{ left: `${now.pct}%` }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 w-px"
                      style={{
                        backgroundImage:
                          "linear-gradient(to bottom, var(--color-orange) 62%, transparent 62%)",
                        backgroundSize: "1px 7px",
                      }}
                    />
                    <span
                      className="absolute left-0 top-full w-px"
                      style={{
                        height: "clamp(1.25rem,3vh,2.25rem)",
                        background:
                          "linear-gradient(to bottom, var(--color-orange), rgba(242,101,34,0))",
                      }}
                    />
                    <span
                      className="absolute -top-[9px] left-0 font-sans text-[0.66rem] font-bold uppercase tracking-[0.18em] text-orange"
                      style={{
                        transform:
                          now.pct > 88
                            ? "translateX(calc(-100% - 6px))"
                            : "translateX(6px)",
                      }}
                    >
                      now
                    </span>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- the live readout ---------------- */}
        <motion.div
          {...reveal(T_NOW + 0.35)}
          className="mt-[clamp(1.3rem,3.2vh,2.4rem)] flex flex-wrap items-center justify-between gap-x-6 gap-y-2"
        >
          <p className="flex min-h-[1.6rem] items-center gap-3 font-sans text-[clamp(0.95rem,1.05vw,1.08rem)] text-ink-soft">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange" />
            </span>
            {now ? (
              <span>
                Right now, {clock(now.h)} &mdash;{" "}
                <strong className="font-semibold text-ink">
                  {running} {running === 1 ? "round" : "rounds"} in progress
                </strong>
              </span>
            ) : (
              <span>Reading the clock&hellip;</span>
            )}
          </p>

          {/* the question stays as text and the action becomes the button —
              as one long link in body ink it read as a caption, not a thing
              to press. Same pill the hero uses, so the page has one button. */}
          <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-sans text-[clamp(0.95rem,1.05vw,1.08rem)] text-ink-soft">
              Not on this list?
            </span>
            <a
              href="#pricing"
              className="hero-btn-dark group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-orange px-7 py-4 font-sans text-sm font-semibold text-white shadow-[0_12px_34px_-14px_rgba(242,101,34,0.95)] outline-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 focus-visible:ring-offset-cream-deep"
            >
              <span className="relative z-10">Tell us your timings</span>
              <span
                aria-hidden="true"
                className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
