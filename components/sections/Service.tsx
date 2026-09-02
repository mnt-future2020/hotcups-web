"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion, type Easing } from "motion/react";

/**
 * Section 01 — The Service.
 *
 * The right column carries the flask itself plus the three facts a customer
 * actually needs, rather than a second paragraph of prose.
 *
 * NO TIMES ANYWHERE IN THIS SECTION, at the client's direction. It used to
 * be built on two: a headline reading "before 9:30" and "at 6" with both
 * numerals rolling into place through DigitRoll, and a card whose first two
 * rows were MORNING DROP and EVENING PICKUP. The service is described by
 * what it does now — filled flasks arrive, empties leave — and the schedule
 * is settled in conversation instead of promised on a landing page.
 *
 * That cost the heading its only colour, since the orange lived entirely on
 * those two numerals. Line two now carries it instead, which is the same
 * two-tone heading sections 03 and 04 already use.
 *
 * Entrance (fires at 20% in view):
 *   0.05s  eyebrow slides in, its rule drawing outward
 *   0.15s  heading line 1 clip-reveals upward
 *   0.24s  heading line 2 clip-reveals upward
 *   0.35s  sub fades up in the right column
 *   0.55s  divider rule draws left to right
 *   0.75s  connecting line begins drawing, over 1.4s
 *   0.80s  dot 01 pops, card 01 lifts in
 *   1.25s  dot 02, card 02
 *   1.70s  dot 03, card 03
 *   2.15s  the line turns down at the right edge and carries on
 *
 * The cards wait for the line to reach them — the line is the cause, the
 * card is the effect.
 *
 * The rider runs the finished route once, slowly, pulling up at each of
 * the three stops before parking at the end. He stays on the page once
 * the journey is done.
 *
 * Arriving at a stop lights that step exactly as a pointer hover does —
 * card lifts, number goes solid, the segments either side brighten. So
 * the section demonstrates itself once, unattended, and the pointer
 * takes over the moment you use it.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* dot i pops as the line arrives; segment i then runs to the next dot */
const DOT_AT = [0.8, 1.25, 1.7];
const SEG_RUN = 0.45;

/* The three discs were supplied as 1254px squares on three different
   backgrounds — white, transparent and black. Each was measured, cut to its
   own circle and re-cut as a transparent disc, so they sit on the white
   section as one set rather than three pasted rectangles. */
const STEPS = [
  {
    n: "01",
    title: "Tell us your headcount",
    /* "timings" left this line with the times. What is asked for now is the
       team and their taste; when the flasks come is a conversation, not a
       field on a landing page. */
    body: "Share your team size and what your people prefer. We’ll take care of the rest.",
    img: "/img/step-1.webp",
  },
  {
    n: "02",
    title: "We deliver to your pantry",
    body: "Freshly prepared flasks, ready for your team to enjoy.",
    img: "/img/step-2.webp",
  },
  {
    n: "03",
    title: "We collect and refill",
    body: "Empty flasks go back with us. No washing, no storage, no pantry staff.",
    img: "/img/step-3.webp",
  },
];

/* a step being active — by the rider pulling up, or by the pointer —
   brightens the segments either side of its dot */
const LIT_BY_STEP: Record<number, number[]> = {
  0: [0],
  1: [0, 1],
  2: [1, 2],
};

/* ---------------------------------------------------------------------
   The ride.

   He is centred on his x position, so 0% / 33.33% / 66.67% put him on
   dots 01 / 02 / 03. He pulls away, decelerates into each stop, waits
   1.4s — long enough to read the box — then moves on, and finally parks
   at 88% and stays. One journey, no loop.

   His size follows --rider-w (clamped to viewport height), so on a short
   screen he shrinks rather than pushing the cards below the fold.

      -14%      0%           33.33%        66.67%        88%
        │       │              │             │            │
      start   stop 01       stop 02       stop 03      parked
       0.0    1.7  3.1     5.5   6.9     9.3  10.7     12.9s
   --------------------------------------------------------------------- */

/* his widest rendered size — only a hint for the image loader now,
   since his real geometry comes from the --rider-w custom property */
const RIDER_MAX_W = 132;
const RIDE_TOTAL = 9.3;
const RIDE_DELAY = 0.8; /* matches DOT_AT[0] — the ride starts with dot 01 */

const RIDE = [
  "-14%",
  "0%", "0%",
  "33.33%", "33.33%",
  "66.67%", "66.67%",
  "88%",
];

/* when he pulls up at each stop, and when he pulls away again — one
   source of truth for both his keyframes and the highlight schedule */
const ARRIVE = [1.2, 3.95, 6.7];
const LEAVE = [2.2, 4.95, 7.7];

const RIDE_TIMES = [
  0,
  ARRIVE[0] / RIDE_TOTAL, LEAVE[0] / RIDE_TOTAL,
  ARRIVE[1] / RIDE_TOTAL, LEAVE[1] / RIDE_TOTAL,
  ARRIVE[2] / RIDE_TOTAL, LEAVE[2] / RIDE_TOTAL,
  1,
];

/* accelerate away, decelerate in; "linear" spans are the stops */
const RIDE_EASE: Easing[] = [
  "easeInOut", "linear",
  "easeInOut", "linear",
  "easeInOut", "linear",
  "easeInOut",
];

export default function Service() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2 });
  const [hover, setHover] = useState<number | null>(null);
  const [riderAt, setRiderAt] = useState<number | null>(null);
  const [parked, setParked] = useState(false);

  const on = inView || Boolean(reduced);

  /* The rider lights a step the same way the pointer does — pulling up at
     a stop IS a hover. The pointer still wins if you are using it. */
  const active = hover ?? riderAt;
  const lit = active === null ? [] : LIT_BY_STEP[active];

  useEffect(() => {
    if (!on || reduced) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    ARRIVE.forEach((t, i) => {
      timers.push(setTimeout(() => setRiderAt(i), (RIDE_DELAY + t) * 1000));
    });
    LEAVE.forEach((t) => {
      timers.push(setTimeout(() => setRiderAt(null), (RIDE_DELAY + t) * 1000));
    });

    return () => {
      timers.forEach(clearTimeout);
      setRiderAt(null);
    };
  }, [on, reduced]);

  /* reduced motion: everything is simply in place */
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

  const draw = (delay: number, duration: number) =>
    reduced
      ? {}
      : {
          initial: { scaleX: 0 },
          animate: on ? { scaleX: 1 } : { scaleX: 0 },
          transition: { duration, delay, ease: "linear" as const },
        };

  return (
    <section
      id="service"
      ref={ref}
      className="relative flex min-h-svh flex-col justify-center overflow-x-clip bg-white"
      style={
        {
          /* SPLIT, BECAUSE THE HEADER WAS NEVER PAID FOR.
             This was a symmetric clamp(2rem, 4.5vh, 4.5rem) — 40px at 900px
             tall, against a 78px fixed header. Whenever a reader stopped with
             this section's top at the window top, its first row was behind
             the bar; snapping just makes that a resting position rather than
             an accident. The section is min-h-svh, a MINIMUM, so the extra
             top padding can only make it taller — nothing can be clipped. */
          paddingTop: "calc(var(--header-h) + clamp(0.5rem, 1.5vh, 1.25rem))",
          paddingBottom: "clamp(2rem, 4.5vh, 4.5rem)",
          /* the rider scales with viewport height, so his headroom shrinks
             on short screens instead of pushing the cards off the fold */
          "--rider-w": "clamp(92px, 10vh, 132px)",
          "--rider-h": "calc(var(--rider-w) * 0.779)",
        } as CSSProperties
      }
    >
      <div className="shell">
        {/* ---------------- header ---------------- */}
        <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            {/* the eyebrow slides in from the left while its rule draws outward */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, x: -14 }}
              animate={
                reduced ? undefined : on ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }
              }
              transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
              className="flex items-center gap-4"
            >
              <span className="eyebrow whitespace-nowrap">01 — Every working day</span>
              <motion.span
                {...draw(0.05, 0.8)}
                className="h-px w-16 origin-left bg-line md:w-24"
              />
            </motion.div>

            <h2 className="mt-6 font-display text-[clamp(1.85rem,3.6vw,2.9rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-ink">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span {...clipLine(0.15)} className="block">
                  Freshly filled flasks, delivered to your pantry.
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                {/* THE ACCENT MOVED HERE FROM THE NUMERALS.
                    Orange used to enter this heading only through DigitRoll,
                    which painted "9:30" and "6" and nothing else. With the
                    times gone the heading was left entirely in ink — the one
                    section on the page whose h2 had no second colour, which
                    reads as a missing style rather than a plain one.

                    orange-dark, not orange, and this ground is why: the
                    section is bg-white, where orange measures 3.13:1 and
                    orange-dark 4.08:1. The clamp tops out at 2.9rem extrabold
                    so large-text 3.0 is the bar and both clear it — but only
                    orange-dark also clears 4.5, which is what keeps the line
                    legal if the clamp is ever lowered. DigitRoll's own file
                    reaches the same conclusion for a figure on a light
                    ground; it simply was not passed the prop here. */}
                <motion.span {...clipLine(0.24)} className="block text-orange-dark">
                  We collect the empties and refill.
                </motion.span>
              </span>
            </h2>

            <motion.p
              {...reveal(0.35)}
              className="mt-6 max-w-[42ch] font-sans text-[1.0625rem] leading-[1.6] text-ink-soft"
            >
              {/* IT SAYS WHAT WE DO, NOT WHAT CATEGORY WE ARE.
                  The line before this opened "A hassle-free pantry solution
                  for your team" — and "solution" is a word that describes the
                  shape of a purchase rather than the thing being bought. The
                  headline above already promises filled flasks and collected
                  empties; this repeats it in the plain register and then names
                  the three jobs the customer does NOT inherit.

                  Every clause is already claimed elsewhere on the site: the
                  flasks and the empties are the headline's own, and "no
                  washing, no storage, no pantry staff" is step 03. Nothing new
                  is asserted, and no schedule is reintroduced.

                  KEEP IN STEP WITH /service. The hero of that page carries
                  this same sentence — see app/service/ServiceView.tsx. */}
              We bring the filled flasks and take the empties away. No machine
              to install, nothing to wash, and no pantry staff to manage.
            </motion.p>

          </div>

          {/* ---- the flask, and the facts that go with it ---- */}
          <div className="relative lg:col-span-5">
            {/* warm ground so the cut-out does not float on bare white */}
            <motion.span
              aria-hidden="true"
              initial={reduced ? undefined : { scale: 0.82, opacity: 0 }}
              animate={
                reduced
                  ? undefined
                  : on
                    ? { scale: 1, opacity: 1 }
                    : { scale: 0.82, opacity: 0 }
              }
              transition={{ duration: 1, delay: 0.3, ease: EASE }}
              className="absolute left-1/2 top-6 aspect-square w-[68%] -translate-x-1/2 rounded-full bg-cream-deep"
            />

            <motion.div
              initial={reduced ? undefined : { clipPath: "inset(100% 0% 0% 0%)" }}
              animate={
                reduced
                  ? undefined
                  : on
                    ? { clipPath: "inset(0% 0% 0% 0%)" }
                    : { clipPath: "inset(100% 0% 0% 0%)" }
              }
              transition={{ duration: 1.1, delay: 0.4, ease: EASE }}
              className="relative mx-auto w-[72%] max-w-[300px] lg:mr-0"
              style={{ maxHeight: "42vh" }}
            >
              <Image
                src="/img/flask-person.webp"
                alt="A Hotcups delivery partner in uniform holding a sealed steel flask"
                width={760}
                height={1261}
                sizes="(max-width: 1024px) 66vw, 280px"
                className="h-auto w-full"
                style={{ maxHeight: "42vh", objectFit: "contain" }}
              />
            </motion.div>

            {/* hard facts, not another paragraph.

                TWO OF THE THREE ROWS WERE TIMES — "Morning drop / before
                9:30" and "Evening pickup / 6:00" — and both are gone with
                the rest of the schedule, and "Per flask / 40+ cups" has since
                gone too at the client's direction. Two rows are what is left.

                THE CARD IS 46px SHORTER FOR IT, AND THAT IS FINE HERE.
                Three rows measured 176px; two measure about 130. From lg up
                the card is positioned `bottom-2`, so it is anchored by its
                FOOT — losing a row pulls its top edge down rather than
                shifting the whole thing, and the flask cut-out above it does
                not move at all. Below lg it is in flow at -mt-10 and simply
                takes less room. Neither case moves anything but itself.

                What replaced the times had to be short. The dd is extrabold
                at text-base in a 62% column, and the pair it had to beat was
                "MORNING DROP / before 9:30" at 23 characters across; both
                rows come in under that and were measured at one line each.

                tabular-nums is now inert — there is not a digit left in the
                card. It is kept rather than swept out because it costs
                nothing and is exactly what a numeric row would want if one
                is ever added back. */}
            <motion.dl
              {...reveal(0.7)}
              className="relative -mt-10 rounded-[var(--radius-card)] border border-line bg-white/95 p-5 backdrop-blur-sm lg:absolute lg:bottom-2 lg:left-0 lg:w-[62%]"
              style={{ boxShadow: "var(--shadow-2)" }}
            >
              {/* ONE ROW LEFT, AND EACH REMOVAL HAD A REASON.
                  This card began as three: MORNING DROP / before 9:30,
                  EVENING PICKUP / 6:00 and PER FLASK / 40+ cups. The two
                  times went when the section stopped quoting a schedule,
                  "Per flask" went at the client's direction, and PANTRY STAFF
                  / None has now gone too — the paragraph two inches above it
                  ends "and no pantry staff to manage", so the card was
                  answering a question the copy had just answered.

                  A one-row definition list is a thin thing to call a card,
                  and it is worth saying so: what is left states where the
                  flasks land and nothing else. If it ever looks too slight
                  beside the photograph, the fix is a second CONFIRMED fact
                  rather than bringing back one of the three above. */}
              {[["Delivered", "To your pantry"]].map(([k, v], i, rows) => (
                <div
                  key={k}
                  /* THE RULE IS DERIVED, AND IT HAD TO BECOME SO.
                     This read `i < 2`, which was correct for exactly three
                     rows: it drew a rule under the first two and left the
                     last one clean. At two rows the same test is true for
                     BOTH, so removing "Per flask" would have left a hairline
                     hanging under the final row with nothing beneath it —
                     a divider dividing the card from its own padding.

                     `rows.length - 1` says what was always meant: every row
                     but the last. Add a row back and it follows. */
                  className={`flex items-baseline justify-between gap-4 py-2.5 ${
                    i < rows.length - 1 ? "border-b border-line/70" : ""
                  }`}
                >
                  <dt className="font-sans text-[0.8rem] font-medium uppercase tracking-[0.1em] text-mute">
                    {k}
                  </dt>
                  <dd className="font-display text-base font-extrabold tabular-nums text-espresso">
                    {v}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </div>

        {/* ---------------- divider ---------------- */}
        <motion.div
          {...draw(0.55, 0.9)}
          className="h-px w-full origin-left bg-line"
          style={{ marginTop: "clamp(1.25rem, 3.5vh, 3.5rem)" }}
        />

        {/* ---------------- steps ---------------- */}
        <div
          className="relative"
          style={{ marginTop: "clamp(1.5rem, 9vh, 6rem)" }}
        >
          {/* the route: dots, segments, and the ambient highlight */}
          <div className="relative hidden h-3 md:block"
            style={{ marginBottom: "clamp(1rem, 3vh, 2.75rem)" }} aria-hidden="true">
            <div className="flex h-full">
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative flex-1">
                  {/* segment i runs from this dot to the next */}
                  <motion.span
                    {...draw(DOT_AT[i], SEG_RUN)}
                    className={`absolute left-0 top-1/2 h-[2px] w-full origin-left -translate-y-1/2 transition-colors duration-300 ${
                      lit.includes(i) ? "bg-orange" : "bg-orange/25"
                    }`}
                  />
                  {/* dot pops as the line arrives */}
                  <motion.span
                    initial={reduced ? undefined : { scale: 0 }}
                    animate={
                      reduced ? undefined : on ? { scale: 1 } : { scale: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      delay: DOT_AT[i],
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className={`absolute left-0 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white transition-colors duration-300 ${
                      active === i ? "bg-orange" : "bg-orange/70"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* The rider runs the route once, slowly, pulling up at each
                stop long enough to read the box, then parks at the end and
                stays there. He does not loop and he does not vanish. */}
            {!reduced && (
              /* The clip edge sits a full rider-width left of the route, so
                 he is never sliced in half while parked on dot 01 — which is
                 flush with the left edge. The inner track still spans exactly
                 the route width, so his 0 / 33.33 / 66.67% stops stay true. */
              <div
                className="pointer-events-none absolute overflow-x-clip"
                style={{
                  left: "calc(var(--rider-w) * -1)",
                  right: 0,
                  bottom: "calc(50% - 1px)",
                  height: "var(--rider-h)",
                }}
              >
                <motion.div
                  className="absolute inset-y-0"
                  style={{ left: "var(--rider-w)", right: 0 }}
                  initial={{ x: RIDE[0] }}
                  animate={on ? { x: RIDE } : { x: RIDE[0] }}
                  transition={{
                    duration: RIDE_TOTAL,
                    delay: DOT_AT[0],
                    times: RIDE_TIMES,
                    ease: RIDE_EASE,
                  }}
                  onAnimationComplete={() => setParked(true)}
                >
                  {/* engine idle — stops once he has parked for good */}
                  <div
                    className={`absolute bottom-0 left-0 ${parked ? "" : "rider-bob"}`}
                    style={{ marginLeft: "calc(var(--rider-w) / -2)" }}
                  >
                    <Image
                      src="/img/rider.png"
                      alt=""
                      width={420}
                      height={327}
                      sizes={`${RIDER_MAX_W}px`}
                      className="h-auto"
                      style={{ width: "var(--rider-w)" }}
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* cards */}
          <div className="grid gap-10 md:grid-cols-3 md:gap-x-10">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...reveal(DOT_AT[i], 18)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                className={`group relative rounded-[var(--radius-card)] outline-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  active === i ? "-translate-y-1.5" : ""
                }`}
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <span
                    className="block font-display text-[2.6rem] font-extrabold leading-none transition-colors duration-300 md:text-[3.25rem]"
                    style={
                      active === i
                        ? { color: "var(--color-orange)", WebkitTextStroke: "0px transparent" }
                        : {
                            color: "transparent",
                            WebkitTextStroke: "1.5px var(--color-orange)",
                          }
                    }
                  >
                    {step.n}
                  </span>

                  {/* the illustration lifts with its step. Plain CSS, not
                      motion — the card already owns a transform for the
                      entrance, and two animators on one element fight. */}
                  <span
                    aria-hidden="true"
                    className="relative block h-[clamp(58px,6.5vw,86px)] w-[clamp(58px,6.5vw,86px)] shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      transform: active === i ? "scale(1.07)" : "scale(1)",
                      filter:
                        active === i
                          ? "drop-shadow(0 12px 24px rgba(58,20,14,0.20))"
                          : "drop-shadow(0 5px 14px rgba(58,20,14,0.09))",
                    }}
                  >
                    <Image
                      src={step.img}
                      alt=""
                      fill
                      sizes="90px"
                      className="object-contain"
                    />
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[1.4rem] font-bold leading-[1.2] tracking-[-0.02em] text-ink md:text-[1.55rem]">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-[32ch] font-sans text-[1.0625rem] leading-[1.65] text-ink-soft">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>

        </div>

        {/* ---------------- closing ----------------
            THERE IS NO CLOSING LINE ANY MORE, at the client's direction.
            "All you pick is what goes in them." sat here, centred, in mute,
            arriving last at 2.2s.

            IT TOOK ITS SPACING WITH IT, WHICH IS THE POINT TO WATCH. The
            line carried marginTop: clamp(1.25rem, 3.5vh, 3rem), so the three
            cards now run straight into the section's own paddingBottom of
            clamp(2rem, 4.5vh, 4.5rem). That is still the larger of the two
            at every viewport height, so the cards are not tight against the
            edge — and the section is min-h-svh with justify-center, so on
            anything tall the whole block simply re-centres and the loss is
            shared top and bottom rather than taken off the bottom.

            Nothing else depended on it: `reveal` is still the cards' own
            entrance, and 2.2s was the last beat in the section, so no
            timing downstream of it had to move. */}
      </div>
    </section>
  );
}
