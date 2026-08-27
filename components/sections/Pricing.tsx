"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { EMAIL, mailHref, PHONE_LABEL, TEL_HREF, waHref } from "@/lib/contact";
import {
  currentWorkplace,
  subscribeWorkplace,
  WORKPLACE_ASK,
  type WorkplaceKey,
} from "@/lib/workplace";

/**
 * Section 07 — Get pricing.
 *
 * IT IS THE ONLY ASK ON THE PAGE
 * There was a second one: a form section that wanted a headcount and four
 * fields. Two asks meant the page posed the same question twice and took the
 * same no twice. This one makes the smaller promise — a first delivery DATE,
 * tomorrow morning — and routes to email, WhatsApp or a phone number, none of
 * which cost the visitor anything before they have a price.
 *
 * It carries id="pricing" because the header, hero, menu, industries,
 * machines and footer all already point there. The anchor moves with the
 * section; the links never had to change.
 *
 * IT IS ITS OWN SECTION, NOT PART OF THE FOOTER
 * It sat inside <footer> while the footer was the only place a closing CTA
 * could go. Now that it is numbered 07 and sits above the blog, being inside
 * the footer element was just wrong markup — a conversion section is content,
 * not site furniture, and screen readers were being told otherwise.
 *
 * THE SCRIM IS MEASURED, NOT EYEBALLED
 * The photograph is unusually dark already (median luminance 0.020) with the
 * window blowing out to 1.0 in the top 2%. A scrim heavy enough to cover the
 * window would crush the other 98% into mud, so it is done in two layers: a
 * flat 0.60 that guarantees white text clears 5.4:1 even on the window, and a
 * bottom gradient over the half where the heading, buttons and contact row
 * actually sit.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
/** the brief's 90ms cadence */
const STEP = 0.09;
const T0 = 0.25;

/* The number, the inbox and the two hrefs now live in lib/contact — the
   footer shows the same ones, and one of them being stale would be worse
   than not repeating them at all. */

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05em] w-[1.05em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.05em] w-[1.05em] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

/**
 * The rotating badge.
 *
 * textLength is pinned to the ring's exact circumference so the caption
 * closes the loop at every font size — spacing it by eye leaves either a gap
 * or an overlap at the seam, and which one you get changes with the font.
 */
function SpinBadge() {
  const R = 46;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="fcta-badge relative h-[104px] w-[104px] md:h-[124px] md:w-[124px]">
      <svg viewBox="0 0 120 120" className="fcta-spin absolute inset-0 h-full w-full">
        <defs>
          <path
            id="fcta-ring"
            fill="none"
            d={`M 60,60 m -${R},0 a ${R},${R} 0 1,1 ${R * 2},0 a ${R},${R} 0 1,1 -${R * 2},0`}
          />
        </defs>
        <text
          fill="#ffffff"
          fontSize="10.5"
          fontWeight="600"
          letterSpacing="0.5"
          style={{ fontFamily: "var(--font-sans)", textTransform: "uppercase" }}
        >
          <textPath href="#fcta-ring" startOffset="0" textLength={CIRC}>
            HOTCUPS · GET A QUOTE ·
          </textPath>
        </text>
      </svg>

      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange md:h-[68px] md:w-[68px]"
      >
        <svg
          viewBox="0 0 24 24"
          className="fcta-arrow h-6 w-6"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </span>
    </div>
  );
}

export default function Pricing() {
  /* Section 03's answer, if the visitor gave one. It does not change anything
     you can SEE here — see lib/workplace for why there is no field to fill —
     it changes what the email and the WhatsApp message say when they open. */
  const [place, setPlace] = useState<WorkplaceKey | null>(currentWorkplace);
  useEffect(() => subscribeWorkplace(setPlace), []);
  const asked = place ? WORKPLACE_ASK[place] : null;

  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const on = useInView(ref, { amount: 0.25, once: true }) || Boolean(reduced);

  /** each element trails the one before it by 90ms */
  const step = (i: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
          transition: { duration: 0.6, delay: T0 + i * STEP, ease: EASE },
        };

  return (
    <section
      id="pricing"
      ref={ref}
      className="overflow-x-clip bg-cream"
      /* 72px of top padding against a 78px header — the eyebrow was six
         pixels behind the bar at any rest position with this section at the
         top of the window. See the note on Service: same fix, same reason. */
      style={{
        paddingTop: "calc(var(--header-h) + clamp(1rem, 2vw, 1.75rem))",
        paddingBottom: "clamp(2.5rem, 6vw, 4.5rem)",
      }}
    >
      {/* .shell-wide, not .shell. The card is a PHOTOGRAPH with copy on it,
          not a column of reading text, so the 1240 measure that is right for
          prose was just cropping the picture: +197px at 1440 and +464px from
          1720 up. It is the same call the hero and the header already make. */}
      <div className="shell-wide">
        {/* the same eyebrow every other section wears. There is deliberately
            no <h2> out here: the card already carries one, and two headings
            for one section is how a page starts sounding like a brochure. */}
        <motion.div
          {...step(0)}
          className="mb-[clamp(1rem,2.5vw,1.75rem)] flex items-center gap-4"
        >
          <span className="eyebrow whitespace-nowrap">07 — Get pricing</span>
          <span className="h-px w-16 bg-line md:w-24" />
        </motion.div>

        <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-espresso-deep">
        {/* the photograph, developing bottom-up.
            The wipe and the scale live on this decorative layer alone. A
            clip-path that ends at inset(0) is still a clip-path, and putting
            it on the card itself would silently slice the badge and any
            focus ring that dared to overflow. */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          initial={
            reduced ? false : { clipPath: "inset(100% 0 0 0)", scale: 1.06 }
          }
          animate={
            on
              ? { clipPath: "inset(0% 0 0 0)", scale: 1 }
              : { clipPath: "inset(100% 0 0 0)", scale: 1.06 }
          }
          transition={{ duration: 1.1, ease: EASE }}
          style={{
            backgroundImage: "url(/img/hero-office.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center 62%",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* flat scrim — carries the worst case, which is the blown-out window
            in the photo's top-left. White clears 5.4:1 against it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "rgba(36,10,6,0.60)" }}
        />
        {/* and extra weight under the half where the copy actually sits */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(36,10,6,0) 12%, rgba(36,10,6,0.42) 78%)",
          }}
        />

        {/* A HEIGHT, SO THE PICTURE HAS ROOM.
            The card used to be exactly as tall as its own copy plus padding —
            about 450px — which made a 1672x941 photograph read as a letterbox
            strip with a cream field above and below it. It now asks for a real
            block of height and centres the copy inside that, so the image is
            shown at a size worth having.

            svh rather than vh: on a phone the URL bar makes vh jump as you
            scroll, and a card that changes height mid-scroll is worse than one
            that is slightly short. The rem floor and ceiling stop it collapsing
            on a laptop in landscape or turning into a wall on a tall monitor. */}
        <div className="relative flex min-h-[clamp(30rem,66svh,46rem)] flex-col items-center justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(2.5rem,6vw,4.5rem)]">
          <div className="mx-auto flex w-full max-w-[54rem] flex-col items-center text-center">
            <motion.span
              {...step(0)}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/35 px-5 py-2 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-orange"
              />
              Twice a day, every working day
            </motion.span>

            <motion.h2
              {...step(1)}
              className="mt-7 font-display text-[clamp(1.4rem,4.6vw,3.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white"
            >
              Your first flask can
              <br />
              arrive tomorrow morning.
            </motion.h2>

            <motion.p
              {...step(2)}
              className="mt-6 max-w-[44ch] font-sans text-[clamp(1.02rem,1.35vw,1.3rem)] leading-[1.55]"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              Tell us your team size and your timings. We&rsquo;ll send a price
              per cup and a first delivery date.
            </motion.p>

            <motion.div
              {...step(3)}
              className="mt-9 flex flex-wrap items-center justify-center gap-3.5"
            >
              <a
                href={mailHref(asked)}
                className="group relative isolate inline-flex h-[3.6rem] items-center gap-2 overflow-hidden rounded-full bg-orange px-8 font-sans text-[1.05rem] font-semibold text-white"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-orange-dark transition-transform duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                />
                Get a quote
                <span aria-hidden="true">&rarr;</span>
              </a>

              <a
                href={waHref(asked)}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn relative inline-flex h-[3.6rem] items-center gap-2.5 overflow-hidden rounded-full border border-white/45 bg-white/10 px-7 font-sans text-[1.05rem] font-semibold text-white backdrop-blur-sm"
              >
                <span className="relative z-10">WhatsApp us</span>
              </a>
            </motion.div>

            <motion.div
              {...step(4)}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 font-sans text-[1rem] text-white"
            >
              <a
                href={TEL_HREF}
                className="inline-flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-75"
              >
                <PhoneIcon />
                {PHONE_LABEL}
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-75"
              >
                <MailIcon />
                {EMAIL}
              </a>
            </motion.div>
          </div>

          {/* bottom right, and out of the copy's way on a phone */}
          <div className="mt-8 flex justify-center md:absolute md:bottom-[clamp(1.25rem,3vw,2.5rem)] md:right-[clamp(1.25rem,3vw,2.5rem)] md:mt-0">
            <a href={mailHref(asked)} aria-label="Get a quote by email">
              <SpinBadge />
            </a>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
