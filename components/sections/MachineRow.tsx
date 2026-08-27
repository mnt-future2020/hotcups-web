"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import { currentOffice, subscribeOffice } from "@/lib/office";

/**
 * Section 05 — The machines.
 *
 * IT REMEMBERS WHAT THE SLIDER WORKED OUT
 * The visitor set section 04 to 85 people; it worked out 128 cups a day. So
 * this section opens by answering THEIR question, and each machine carries
 * its own verdict. One shared store between two sections is the whole
 * differentiator, and it costs almost nothing.
 *
 * IT MOVES LIKE MACHINERY, NOT LIKE LIQUID
 * Hard easing, exact stagger, no overshoot anywhere — machines do not bounce.
 * Only one thing moves at rest: the screens take turns.
 *
 * THE BACKDROP IS SCOPED TO THE STAGE, NOT THE SECTION
 * The brief asks for the studio image as the section background with the
 * machines standing on its wall-to-floor curve. Those two cannot both hold:
 * a `cover` background on a content-height element puts that curve at a
 * different place on every viewport, so the machines would float on one
 * screen and sink on the next. The image is therefore scoped to the stage —
 * the band the machines actually stand in — which is the only way the curve
 * lands under their bases at every width. The section keeps steel-pale so
 * the ground still reads as one continuous studio.
 */

/* hard ease-out. No overshoot. */
const HARD = [0.33, 1, 0.68, 1] as const;

const T_HEAD = 0.15;
const T_FLOOR = 0.45;
const T_RIG = 0.7;
const RIG_GAP = 0.14;
const T_COUNT = 1.5;
const T_VERDICT = 1.8;

/**
 * A machine fits if its rated capacity carries the load with headroom.
 * Sizing equipment to run flat out all day is how you get a queue at 4pm, so
 * the test is capacity >= cups x 1.25 — which puts Cothas out at 128 a day
 * and the other two in.
 */
const HEADROOM = 1.25;

const RIGS = [
  {
    key: "cothas",
    name: "Cothas",
    src: "/img/machine-cothas.png",
    cap: 150,
    /* One line, not two. "150 / day" above already said what "offices up to
       100" said, and the m² figure meant nothing to anyone — the desk
       comparison carries it. */
    line: "Counter-top · up to 100 people",
    aspect: 900 / 754,
    /* the display, in fractions of the IMAGE — read off each photograph */
    screen: { u: 0.505, v: 0.076, w: 0.14, h: 0.085 },
  },
  {
    key: "chaipoint",
    name: "Chai Point",
    src: "/img/machine-chaipoint.png",
    cap: 200,
    line: "A third of a desk · chai-first",
    aspect: 1290 / 1219,
    screen: { u: 0.589, v: 0.237, w: 0.31, h: 0.2 },
  },
  {
    key: "brewmax",
    name: "Brew Max",
    src: "/img/machine-brewmax-clean.png",
    cap: 300,
    line: "Half a desk · shift work",
    aspect: 1278 / 1230,
    screen: { u: 0.329, v: 0.425, w: 0.19, h: 0.354 },
  },
];

/** ✓ and ✗ have no glyph in either of the page's typefaces — the cross was
    rendering as tofu. Drawn instead, so they cannot fail. */
function Tick({ ok }: { ok: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="inline-block h-[0.78em] w-[0.78em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    >
      {ok ? <path d="M2.4 6.4 L4.9 8.9 L9.6 3.2" /> : <path d="M3 3 L9 9 M9 3 L3 9" />}
    </svg>
  );
}

function Count({ to, play, delay }: { to: number; play: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (!play || reduced) {
      if (reduced) setN(to);
      return;
    }
    let raf = 0;
    const begin = setTimeout(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 700);
        setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay * 1000);
    return () => {
      clearTimeout(begin);
      cancelAnimationFrame(raf);
    };
  }, [to, play, delay, reduced]);
  return <span className="tabular-nums">{n}</span>;
}

export default function MachineRow() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, once: true });
  const on = inView || Boolean(reduced);

  const [cups, setCups] = useState(() => currentOffice().cups);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => subscribeOffice((_, c) => setCups(c)), []);

  const fits = (cap: number) => cap >= cups * HEADROOM;

  const reveal = (delay: number, y = 16) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.6, delay, ease: HARD },
        };

  const clipLine = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { y: "112%" },
          animate: on ? { y: "0%" } : { y: "112%" },
          transition: { duration: 0.8, delay, ease: HARD },
        };

  return (
    <section
      id="machines"
      ref={ref}
      className="relative flex min-h-svh flex-col [justify-content:safe_center] overflow-x-clip bg-steel-pale"
      style={{
        paddingTop: "calc(var(--header-h) + clamp(0.5rem, 1.4vh, 1.1rem))",
        paddingBottom: "clamp(1.5rem, 3.5vh, 2.5rem)",
      }}
    >
      {/* The room the machines live in — an office pantry, so the section has
          context rather than a colour. It sits UNDER a pale wash: measured
          against the photograph's darkest 2%, 0.88 is the lightest wash that
          keeps every text colour above its threshold, so no text can land on a dark
          patch of the image and fail. The machine stage keeps its own studio
          ground on top, because three dark cut-outs on a photographed room
          is mush. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/img/machines-office.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(228,231,234,0.88)" }}
      />

      <div className="shell relative z-10">
        {/* ---------------- header ---------------- */}
        <div className="grid gap-y-4 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            <motion.div {...reveal(0.05, 0)} className="flex items-center gap-4">
              <span className="eyebrow whitespace-nowrap text-ink/72">
                05 — The machines
              </span>
              <motion.span
                initial={reduced ? undefined : { scaleX: 0 }}
                animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: "linear" }}
                className="h-px w-16 origin-left bg-steel-mid md:w-24"
              />
            </motion.div>

            {/* ONE SPAN, AND IT WRAPS ON ITS OWN.
                The headline used to be split across two spans so each line
                could clip-reveal separately. It was shortened to a single
                sentence and the second span was left behind holding nothing —
                an empty block that still took a full 51px line of headline
                height under the title and still ran a reveal on no text. The
                sentence is 17.50 em, which is 798px against a 638px column,
                so it breaks to two lines by itself and reveals as one block.
                That is the right behaviour for a sentence; it was only ever
                two spans because it used to be two written lines.

                THE SIZE
                60px at the top, and the vw leg is 4.4 rather than the 3.5 it
                was, so it actually REACHES 60 — .shell caps at 1240, which
                caps this column at 638px, and 3.5vw would not have hit the
                new ceiling until a 1714px window. 4.4vw gets there at 1366.
                Checked at eleven widths from 768 to 2560: two lines
                everywhere, and the longest word ("workplace.") is 307px
                against 638, so nothing overflows the column at the cap. */}
            <h2 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
              <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                <motion.span {...clipLine(T_HEAD)} className="block">
                  The right machine for your workplace.
                </motion.span>
              </span>
            </h2>
          </div>

          {/* STATIC, AND ABOUT THE MACHINES.
              This read "At N cups a day, all three of these fit your office",
              driven live from section 04's calculator. Two problems. It made
              the reader carry a number down from the section above before the
              sentence meant anything, and at any realistic office size the
              answer was "all three" — so the line spent its place in the
              layout telling everyone the same thing in a way that looked
              personalised.

              What a reader actually wants here is what these machines ARE.
              Both claims trace to copy already on the page: the sizes are the
              cards' own captions, and "at the touch of a button" is the
              client's wording from hero slide 3. */}
          <motion.div {...reveal(0.35)} className="lg:col-span-5 lg:pt-10">
            <p className="max-w-[30ch] font-sans text-[clamp(1.05rem,1.6vw,1.375rem)] leading-[1.55] text-ink-soft">
              Three sizes, counter-top to half a desk — all at the touch of a
              button.
            </p>
          </motion.div>
        </div>

        {/* ---------------- the stage ----------------
            The studio backdrop, scoped so its wall-to-floor curve lands under
            the machines' bases at every width. */}
        <div
          className="relative mt-[clamp(1rem,2.4vh,1.75rem)] overflow-hidden rounded-[var(--radius-panel)]"
          style={{
            backgroundImage: "url(/img/machine-bg.png)",
            backgroundSize: "cover",
            backgroundPosition: "center 34%",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="px-[clamp(0.75rem,2.5vw,2rem)] pb-[clamp(0.75rem,2vh,1.4rem)] pt-[clamp(0.9rem,2.4vh,1.75rem)]">
            <div className="grid grid-cols-1 gap-x-6 gap-y-7 sm:grid-cols-3">
              {RIGS.map((r, i) => {
                const at = T_RIG + i * RIG_GAP;
                const ok = fits(r.cap);
                const hot = hover === r.key;
                const dim = hover !== null && !hot;

                return (
                  <div
                    key={r.key}
                    onMouseEnter={() => setHover(r.key)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(r.key)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    className="group rounded-[var(--radius-card)] px-3 pb-3 pt-2.5 outline-none focus-visible:ring-2 focus-visible:ring-orange/60"
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      transform: hot ? "translateY(-8px)" : "translateY(0)",
                      boxShadow: hot ? "var(--shadow-2)" : "var(--shadow-1)",
                      transition: `transform ${hot ? 300 : 250}ms cubic-bezier(0.33,1,0.68,1), box-shadow ${hot ? 300 : 250}ms linear`,
                    }}
                  >
                    {/* the dim stops here: the verdict below stays at full
                        opacity in every state, so a machine never becomes
                        harder to rule in or out just by not being hovered */}
                    <div
                      style={{
                        opacity: dim ? 0.55 : 1,
                        transition: `opacity ${hot ? 300 : 250}ms linear`,
                      }}
                    >
                    <p className="text-center font-display text-[clamp(1.05rem,1.7vw,1.4rem)] font-extrabold leading-none text-ink">
                      <Count to={r.cap} play={on} delay={T_COUNT + i * 0.08} />
                      <span className="ml-1.5 font-sans text-[0.76rem] font-medium text-ink/72">
                        / day
                      </span>
                    </p>

                    {/* the machine, rising from behind the floor line */}
                    <div className="relative mt-3 h-[clamp(112px,18vh,196px)] overflow-hidden">
                      <motion.div
                        className="relative mx-auto h-full w-auto"
                        style={{
                          aspectRatio: String(r.aspect),
                          /* "too small" desaturates — it does NOT fade out.
                             opacity(0.55) was inherited from the dark version
                             of this section; on the light ground it drops the
                             machine to 3.7:1 against its own card and the
                             product all but disappears. Grayscale carries the
                             same meaning and keeps it at 15.4:1. The verdict
                             underneath does the rest of the work. */
                          filter: ok ? "none" : "grayscale(1)",
                        }}
                        initial={reduced ? false : { y: "34%", opacity: 0 }}
                        animate={
                          on ? { y: "0%", opacity: 1 } : { y: "34%", opacity: 0 }
                        }
                        transition={{ duration: 0.7, delay: at, ease: HARD }}
                      >
                        {/* ambient: each machine warms in turn, behind it */}
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                            reduced ? "" : `rig-screen rig-screen-${i + 1}`
                          }`}
                          style={{
                            width: "86%",
                            height: "70%",
                            background:
                              "radial-gradient(ellipse at 50% 55%, rgba(242,101,34,0.30), rgba(242,101,34,0) 68%)",
                          }}
                        />

                        {/* hover: light spilling from the dispenser, pooling
                            BEHIND the lower half. Never in front — that is
                            what made the last version read as a smear. */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
                          style={{
                            bottom: "-6%",
                            width: "92%",
                            height: "46%",
                            background:
                              "radial-gradient(ellipse at 50% 62%, rgba(242,101,34,0.42), rgba(242,101,34,0) 70%)",
                            filter: "blur(14px)",
                            opacity: hot ? 1 : 0,
                            transition: `opacity ${hot ? 300 : 250}ms linear`,
                          }}
                        />

                        <Image
                          src={r.src}
                          alt={`${r.name} — ${r.cap} cups a day`}
                          fill
                          sizes="(max-width: 640px) 70vw, 26vw"
                          className="relative object-contain"
                        />

                        {/* hover: the machine's own screen lights up. This
                            changes something already in the photograph rather
                            than adding an object, which is why it cannot look
                            broken. The wrapper carries the image's aspect, so
                            these fractions land on the real display. */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[18%]"
                          style={{
                            left: `${r.screen.u * 100}%`,
                            top: `${r.screen.v * 100}%`,
                            width: `${r.screen.w * 190}%`,
                            height: `${r.screen.h * 190}%`,
                            background:
                              "radial-gradient(ellipse at 50% 50%, rgba(255,214,166,0.85), rgba(255,180,110,0.35) 42%, rgba(255,150,70,0) 70%)",
                            mixBlendMode: "screen",
                            opacity: hot ? 1 : 0,
                            transition: `opacity ${hot ? 300 : 250}ms linear`,
                          }}
                        />
                      </motion.div>
                    </div>

                    {/* the floor they stand on */}
                    <motion.div
                      initial={reduced ? undefined : { scaleX: 0 }}
                      animate={
                        reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }
                      }
                      transition={{ duration: 0.8, delay: T_FLOOR, ease: "linear" }}
                      className="h-px w-full origin-left"
                      style={{ background: "rgba(23,17,14,0.28)" }}
                    />

                    <p className="mt-2.5 text-center font-display text-[clamp(1rem,1.4vw,1.22rem)] font-extrabold tracking-[-0.02em] text-ink">
                      {r.name}
                    </p>
                    <p className="mt-1 text-center font-sans text-[0.86rem] leading-[1.45] text-ink-soft">
                      {r.line}
                    </p>
                    </div>

                    <motion.p
                      className="mt-2 flex items-center justify-center gap-1.5 font-sans text-[0.84rem] font-semibold"
                      initial={reduced ? false : { opacity: 0, scale: 1.14 }}
                      animate={
                        on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.14 }
                      }
                      transition={{
                        duration: 0.24,
                        delay: T_VERDICT + i * 0.09,
                        ease: HARD,
                      }}
                      style={{
                        /* #f26522 is 2.5:1 on this ground and #d9500f is
                           3.3:1 — neither clears 4.5 for text this size. So
                           the TICK carries the orange (an icon only needs
                           3.0) and the words take a colour that passes. */
                        color: ok
                          ? "var(--color-espresso)"
                          : "rgba(23,17,14,0.72)",
                      }}
                    >
                      <span style={{ color: ok ? "var(--color-orange-dark)" : "inherit" }}>
                        <Tick ok={ok} />
                      </span>
                      {ok ? "fits you" : "too small"}
                    </motion.p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <CustomBand />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------
   The custom band. The animation IS the pitch: the drawing builds in the
   order a real one is made — outline, then internal detail, then the
   dimension arrows — and resolves into the machine itself.
   --------------------------------------------------------------- */
function CustomBand() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useInView(ref, { amount: 0.4, once: true }) || Boolean(reduced);
  const [resolved, setResolved] = useState(Boolean(reduced));

  useEffect(() => {
    if (!on || reduced) return;
    const t = setTimeout(() => setResolved(true), 2000);
    return () => clearTimeout(t);
  }, [on, reduced]);

  return (
    /* IT IS A PANEL NOW, NOT A RULE AND SOME TEXT.
       This used to be a border-top and content sitting straight on the
       section ground, which is why it read as a separate thing bolted under
       the machines rather than the fourth option in the same set. It takes
       the stage's own radius, the cards' own translucent white and the same
       shadow — and, critically, the SAME horizontal padding as the stage, so
       the drawing's left edge lands on exactly the line the first machine
       card starts on. The top margin is deliberately tighter than the gap
       above the stage: near things group, far things separate. */
    <div
      ref={ref}
      className="mt-[clamp(0.75rem,1.6vh,1.25rem)] overflow-hidden rounded-[var(--radius-panel)]"
      style={{
        background: "rgba(255,255,255,0.5)",
        boxShadow: "var(--shadow-1)",
      }}
    >
      <div className="grid items-center gap-x-[clamp(1.5rem,3vw,3rem)] gap-y-6 px-[clamp(0.75rem,2.5vw,2rem)] py-[clamp(1.1rem,2.6vh,1.9rem)] md:grid-cols-[auto_1fr]">
        {/* Sized by HEIGHT, not width. At a fixed 232px wide the 4:5 drawing
            stood 290px tall on every screen and was single-handedly pushing
            this section past the bottom of the viewport. Height-first keeps it
            the biggest thing in the band on a tall window and lets it collapse
            on a short one, instead of being the same size on both and
            overflowing the short one. 22vh -> 30vh and the cap 252 -> 340,
            which is a 35% bigger drawing on a 1080 window and still shrinks
            out of the way on a short one. Left-aligned from md up so it sits
            on the panel's padding line rather than floating in its column. */}
        <div className="relative mx-auto aspect-[4/5] h-[clamp(190px,30vh,340px)] w-auto max-w-full md:mx-0">
          <motion.svg
            viewBox="0 0 200 250"
            className={`bp absolute inset-0 h-full w-full ${on ? "on" : ""}`}
            fill="none"
            stroke="var(--color-orange)"
            strokeWidth="1.4"
            animate={{ opacity: resolved ? 0 : 1 }}
            transition={{ duration: 0.7, ease: HARD }}
            aria-hidden="true"
          >
            <rect x="46" y="30" width="108" height="190" rx="7"
              style={{ "--len": 620, "--at": "0s" } as CSSProperties} />
            <rect x="62" y="52" width="76" height="52" rx="4"
              style={{ "--len": 270, "--at": "0.55s" } as CSSProperties} />
            <rect x="70" y="132" width="60" height="40" rx="3"
              style={{ "--len": 210, "--at": "0.8s" } as CSSProperties} />
            <line x1="62" y1="196" x2="138" y2="196"
              style={{ "--len": 80, "--at": "1s" } as CSSProperties} />
            <circle cx="100" cy="118" r="5"
              style={{ "--len": 34, "--at": "1.1s" } as CSSProperties} />
            <line x1="46" y1="238" x2="154" y2="238"
              style={{ "--len": 110, "--at": "1.3s" } as CSSProperties} />
            <line x1="46" y1="232" x2="46" y2="244"
              style={{ "--len": 14, "--at": "1.45s" } as CSSProperties} />
            <line x1="154" y1="232" x2="154" y2="244"
              style={{ "--len": 14, "--at": "1.45s" } as CSSProperties} />
            <line x1="172" y1="30" x2="172" y2="220"
              style={{ "--len": 192, "--at": "1.55s" } as CSSProperties} />
            <line x1="166" y1="30" x2="178" y2="30"
              style={{ "--len": 14, "--at": "1.7s" } as CSSProperties} />
            <line x1="166" y1="220" x2="178" y2="220"
              style={{ "--len": 14, "--at": "1.7s" } as CSSProperties} />
          </motion.svg>

          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: resolved ? 1 : 0 }}
            transition={{ duration: 0.8, ease: HARD }}
          >
            <Image
              src="/img/machine-brewmax-clean.png"
              alt="A Hotcups machine built to a customer's specification"
              fill
              sizes="340px"
              className="object-contain object-bottom"
            />
          </motion.div>
        </div>

        <div>
          {/* text-balance because it is 24.78 em and the column it sits in
              swings either side of that as the drawing grows with the window
              — one line at 1366, two at 1920. When it does break, balance
              splits it evenly instead of leaving one word on line two. */}
          <h3 className="text-balance font-display text-[clamp(1.45rem,2.7vw,2.3rem)] font-extrabold leading-[1.14] tracking-[-0.02em] text-ink">
            Custom machines designed around your workspace.
          </h3>
          <p className="mt-3.5 max-w-[54ch] font-sans text-[clamp(1.02rem,1.2vw,1.18rem)] leading-[1.6] text-ink-soft">
            Size, branding, drinks, payment, timings — tell us the constraint
            and we design around it.
          </p>
          <a
            href="#pricing"
            className="hero-btn-dark group relative mt-5 inline-flex items-center gap-2 overflow-hidden rounded-full bg-orange px-6 py-3 font-sans text-[1.02rem] font-semibold text-white shadow-[0_12px_34px_-16px_rgba(242,101,34,0.95)] transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] hover:-translate-y-0.5"
          >
            <span className="relative z-10">Talk to us</span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
