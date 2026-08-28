"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import Logo from "@/components/layout/Logo";
import {
  ADDRESS_LINES,
  EMAIL,
  MAIL_HREF,
  MAPS_HREF,
  PHONE_LABEL,
  SOCIALS,
  TEL_HREF,
  WA_HREF,
  type SocialKey,
} from "@/lib/contact";

/**
 * The footer.
 *
 * IT IS LIGHT, AND IT CARRIES A DOODLE WASH
 * It was briefly espresso-deep, to break the run of cream sections above it.
 * The doodle does that job instead — a drawn band reads as its own zone even
 * in the same colour family, and it does it warmly rather than by dropping
 * the lights. cream-deep sits a half-step under the blog's cream so the seam
 * is felt before the illustration is even noticed.
 *
 * THE WASH IS CAPPED, AND THE CAP IS MEASURED
 * Dark copy on a cream ground LOSES contrast as the wash darkens it, so the
 * opacity is a ceiling rather than a taste call. Every line in the artwork is
 * flattened to one colour, #4e2b0c, so the worst case is knowable: at 0.09
 * the ground under a doodle line is #edddd0, giving ink 14.12:1, ink-soft
 * 7.57 and espresso 12.33 — all far clear of 4.5.
 *
 * orange-dark is the binding constraint at 3.11, which is why the only two
 * things set in it are the tagline (21.6-28px at weight 800, so the 3.0
 * large-text threshold applies) and the icons (non-text, also 3.0). Nothing
 * at body size is ever amber down here. The wash stops clearing 3.0 at 0.110,
 * so 0.09 is the number with a little air under it and not a round guess.
 *
 * Rendering the wash at 0.09, 0.16, 0.24 and 0.34 side by side showed almost
 * no difference — the art is thin line work at 7% ink coverage, so the ceiling
 * costs nothing. There was never a version worth breaking contrast for.
 *
 * mute (#8b7a6f) is the one palette colour that does NOT survive the wash —
 * 3.65 clean, 3.05 under a line. The copyright used to be set in it and is
 * now ink-soft.
 *
 * IT EARNS id="contact"
 * The id has been here since the beginning while the number, inbox and
 * address lived only in section 07. They are here now, from lib/contact, so
 * the two places cannot drift apart.
 *
 * EVERY LINK POINTS AT A REAL ANCHOR
 * Nothing here is a dead href waiting for a route that does not exist. There
 * is no Privacy or Terms in this footer because there is no privacy policy
 * to link to.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP = 0.06;

/**
 * The doodle wash.
 *
 * 2073x758 of transparent line art, 7% ink coverage, composed as a U — dense
 * down both edges and across the bottom, with the middle measurably empty
 * (0.12% ink through the centre block). That shape is what the layout below
 * is built around.
 *
 * THE ASSET IS FLAT-COLOURED ON PURPOSE
 * The source is one warm brown with compression speckle in it. Every pixel's
 * RGB is rewritten to #4e2b0c and only the alpha channel is kept meaningful,
 * which does two things: the worst-case composite becomes a single knowable
 * colour instead of "whatever the darkest pixel happens to be", and the file
 * drops from 900 KB to 73 KB, since the three constant colour planes cost
 * almost nothing to compress. At 0.09 opacity the alpha channel survives
 * alphaQuality 30 with a maximum error of 2/255 — measured, not assumed.
 */
const DOODLE: string | null = "/img/footer-doodle.webp";
const DOODLE_OPACITY = 0.09;

/**
 * The link columns.
 *
 * SEVEN LINKS, NOT FIFTEEN.
 * There were four columns of them, and they were mostly the same page wearing
 * different hats: Tea, Filter coffee, Milk drinks and Specialty ALL pointed at
 * #menu, and IT & offices, Manufacturing, Colleges & schools and Hospitals ALL
 * pointed at #industries. Fifteen links, eight destinations, and a visitor who
 * clicked four of them in a row would land in the same place four times.
 *
 * These are the six sections the header nav carries, plus the ask. Every entry
 * now goes somewhere the others do not.
 *
 * #savings — the flasks-or-machine section — is the one anchor left out, because
 * the nav leaves it out too. It is reachable from the machines section it
 * belongs to.
 */
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "The service", href: "#service" },
      { label: "The menu", href: "#menu" },
      { label: "Who we serve", href: "#industries" },
      { label: "Machines", href: "#machines" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Case studies", href: "#cases" },
      { label: "Our story", href: "#story" },
      { label: "Blog", href: "#blog" },
      { label: "Get pricing", href: "#pricing" },
    ],
  },
];
/* ---------------------------------------------------------------
   Icons. Stroke-only at 1.75, matching section 07's pair — drawn here
   rather than shared because section 07 keeps its two private and a
   two-path SVG is not worth a module.
   --------------------------------------------------------------- */

const ICON =
  "h-[1.05em] w-[1.05em] shrink-0 text-orange-dark transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110";

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={ICON}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const PhoneIcon = () => (
  <Svg>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </Svg>
);

const MailIcon = () => (
  <Svg>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </Svg>
);

const PinIcon = () => (
  <Svg>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

/* ---------------------------------------------------------------
   The social marks.

   DRAWN, NOT PASTED. The published brand paths are single filled outlines a
   few hundred characters long, and next to the stroked phone, mail and pin
   above they would read as three solid stickers dropped into a line of
   drawings. These are the same 1.75 stroke as the rest of the footer, so the
   row belongs to the page rather than to the platforms.

   FACEBOOK IS A ROUNDED SQUARE, NOT A CIRCLE. The first draft drew it the
   way the platform does, as an f inside a CIRCLE — and inside the circular
   button, beside Instagram's rounded square, it read as a target rather than
   a logo. Rendered side by side the fix was obvious.

   YouTube keeps its own 16:9 frame, because that shape IS the logo and
   squaring it off would be the one change that stopped it being recognised.
   Rendered alongside the other two it sits fine: all three are a mark inside
   a frame inside a circle, and only the frame's proportion differs.

   THEY DO NOT CARRY THEIR OWN COLOUR. `Svg` above hard-codes orange-dark;
   these inherit `currentColor` from the button, which is what lets the whole
   thing — ring, glyph and lift — move together on one hover. */
const SOCIAL_MARKS: Record<SocialKey, React.ReactNode> = {
  instagram: (
    <>
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="4.6" />
      <path d="M15.1 8.2h-1.4a1.7 1.7 0 0 0-1.7 1.7v11.5" />
      <path d="M9.6 12.8h4.9" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.2" y="5.2" width="19.6" height="13.6" rx="4.4" />
      <path d="M10.3 9.4 15.5 12l-5.2 2.6V9.4Z" />
    </>
  ),
};

/* 44px, which is the touch-target floor rather than a look. The glyph is 21
   so the ring has room to read as a ring; the same two numbers were what the
   render was checked at. */
function Social() {
  const shown = SOCIALS.filter((s) => s.href);
  if (shown.length === 0) return null;
  return (
    <ul className="mt-8 flex flex-wrap items-center gap-3">
      {shown.map((s) => (
        <li key={s.key}>
          <a
            href={s.href as string}
            target="_blank"
            rel="noopener noreferrer"
            /* the platform name alone would announce as "Instagram", which in
               a footer is ambiguous about whose. */
            aria-label={`Hotcups on ${s.label}`}
            className="group grid h-11 w-11 place-items-center rounded-full border border-line text-ink-soft transition-[color,border-color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-orange-dark hover:text-orange-dark focus-visible:-translate-y-0.5 focus-visible:border-orange-dark focus-visible:text-orange-dark"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[21px] w-[21px] shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {SOCIAL_MARKS[s.key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------
   A link, with the underline wiping in from the left.

   Not `hover:underline` and not a border: a transform on a full-width bar is
   the only version that animates, and it animates on the compositor rather
   than relaying out the line box.

   orange-dark, not orange: a 1px rule at 2.80:1 on this ground looks washed
   out. 3.65 reads as a line.
   --------------------------------------------------------------- */

function Wipe({ label }: { label: string }) {
  return (
    <span className="relative">
      {label}
      <span
        aria-hidden="true"
        className="absolute -bottom-[3px] left-0 h-px w-full origin-left scale-x-0 bg-orange-dark transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </span>
  );
}

/* Alignment is NOT in the base: the address is two lines and wants its pin at
   the top. Putting `items-center` here and `items-start` at the call site
   leaves two align-items utilities on one element, and which one wins is
   decided by the order Tailwind happened to emit them. */
const ROW_BASE =
  "group inline-flex gap-3 font-sans text-[1.15rem] text-ink-soft transition-colors duration-300 hover:text-espresso focus-visible:text-espresso";
const ROW = `${ROW_BASE} items-center`;

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const on = useInView(ref, { amount: 0.15, once: true }) || Boolean(reduced);

  /** the house entrance: 14px up, opacity, on the 60ms cadence */
  const rise = (at: number) => ({
    initial: reduced ? false : { opacity: 0, y: 14 },
    animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.6, delay: at, ease: EASE },
  });

  return (
    <footer
      id="contact"
      ref={ref}
      className="relative isolate overflow-hidden border-t border-line bg-cream-deep"
    >
      {/* The seam. Amber in the middle, gone at both ends, so the cream above
          hands over rather than just stopping. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, rgba(217,80,15,0) 0%, rgba(217,80,15,0.45) 50%, rgba(217,80,15,0) 100%)",
        }}
      />

      {/* The doodle band.

          NOT `cover`. The artwork is 2.73:1 and its whole value is the dense
          column down each edge, so any horizontal crop eats the best of it.
          `cover` only leaves those alone once the footer itself is wider than
          2.73:1, and it never is: roughly 2.2:1 at 1440 (8% off each side),
          1.7:1 at 1024 (19%), 1.3:1 at 768 (26% — by then you are looking at
          the empty middle), and on a phone the footer is TALLER than it is
          wide, where cover would show a sliver of blank centre and nothing
          else.

          `100% auto` bottom-anchored never crops. The whole composition is
          always visible, and the cost is bare ground above it — which lands
          on the logo and tagline, the part that is better clean anyway. Where
          the band is taller than the footer (~1830px and up) it is the sparse
          TOP of the image that gets clipped, which is the right end to lose.

          The radial mask is belt and braces. The centre of the artwork is
          measurably empty already, but a background image cannot be trusted
          to hold its composition at every window shape, so the wash is thinned
          to a fifth through the middle regardless. */}
      {DOODLE && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[length:100%_auto] bg-bottom bg-no-repeat"
          style={{
            backgroundImage: `url(${DOODLE})`,
            opacity: DOODLE_OPACITY,
            maskImage:
              "radial-gradient(115% 80% at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,1) 84%)",
            WebkitMaskImage:
              "radial-gradient(115% 80% at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,1) 84%)",
          }}
        />
      )}

      {/* Warmth in the corners, so the band is not a flat rectangle of cream
          in the stretch the artwork does not reach. */}
      <div
        aria-hidden="true"
        className="foot-glow pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(56% 46% at 90% 2%, rgba(242,101,34,0.11) 0%, rgba(242,101,34,0.03) 46%, rgba(0,0,0,0) 74%)," +
            "radial-gradient(50% 50% at 3% 98%, rgba(217,80,15,0.08) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="shell relative pb-[clamp(1.5rem,2.6vw,2.25rem)] pt-[clamp(3.25rem,6.5vw,5.5rem)]">
        {/* ONE ROW, NOT TWO TIERS.
            Brand and contact used to be a row of their own with the four link
            columns underneath. At 1890px that left a 500px hole in the middle
            of the first row — the descriptor stopped at x=735 and GET IN TOUCH
            did not start until x=1243 — and the two tiers did not share a
            grid, so nothing in the lower one lined up with anything in the
            upper one. Four columns in a single row closes the hole and gives
            everything one set of gridlines.

            It folds down rather than reflows: four columns at lg, three at md
            with the brand across the top, two below that. The brand and the
            contact block are the ones that span, because they are the two that
            look wrong squeezed into half a phone.

            At lg the four columns are content-sized and the leftover width is
            handed to the GAPS, not to the brand. A minmax(0,1fr) first column
            swallows all of it, which put the three link columns in the right
            30% of a 1890px window with 555px of air beside the wordmark; this
            spreads them across 52% of it and the columns still start and end
            flush with the rule underneath them. */}
        <div className="grid grid-cols-2 gap-x-[clamp(1.5rem,3vw,3.5rem)] gap-y-[clamp(2.5rem,5vw,3.5rem)] md:grid-cols-3 lg:grid-cols-[auto_auto_auto_auto] lg:justify-between">
          <motion.div {...rise(0)} className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo size="w-[176px] md:w-[196px] xl:w-[214px]" />

            {/* orange-dark on this ground is 3.65 clean and 3.11 under the
                wash. Both clear 3.0, and at 23-32px in weight 800 this is
                large text, so 3.0 is the threshold that applies. It is the
                only amber word on the page's last screen for that reason. */}
            <p className="mt-7 max-w-[21rem] font-display text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink">
              Recharges you.{" "}
              <span className="text-orange-dark">Twice a day.</span>
            </p>

            {/* THE CAP IS IN rem NOW, AND THE UNIT IS THE POINT.
                It was 38ch, which is a READING measure — and ch scales with
                the font, so raising the type from 1.06 to 1.18rem would have
                widened this column by 11% at the same time. With
                content-sized columns the brand's max-content width IS this
                paragraph's cap, and at 1024 the four columns had only 18px of
                air to give: 44ch (455px) once overflowed by 44px and re-wrapped
                everything.

                21rem is 336px, fixed whatever the type does. It pays for the
                bigger links and the wider contact column and still leaves the
                row about 38px at its tightest. The descriptor sets on three
                lines instead of two, which costs height the footer has and
                width it does not. The tagline above carries the same cap for
                the same reason — uncapped, its max-content was a rival
                candidate for the column's width. */}
            <p className="mt-4 max-w-[21rem] font-sans text-[1.18rem] leading-[1.62] text-ink-soft">
              Flask delivery for daily tea and filter coffee, and machines for
              workplaces above 40 cups a day.
            </p>

            {/* UNDER THE BRAND, NOT IN "GET IN TOUCH". The contact column is
                four ways to start a conversation about an order — a phone
                that dials, an inbox, a WhatsApp thread, a pin on a map. A
                social profile is not that; it is where you go to see whether
                the company is real before you ring it. It belongs beside the
                wordmark and the descriptor, which is the block that answers
                exactly that question.

                It also fills the one hole in this row. The brand column ran
                out of content about 80px above the rule while the three
                columns beside it did not, so the footer's tallest column was
                the one carrying the least. */}
            <Social />
          </motion.div>

          {COLUMNS.map((col, i) => (
            <motion.nav key={col.title} aria-label={col.title} {...rise(STEP * (2 + i))}>
              <h2 className="font-sans text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-ink">
                {col.title}
              </h2>
              <ul className="mt-6 space-y-4">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={ROW}>
                      <Wipe label={l.label} />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}

          <motion.div
            {...rise(STEP * (2 + COLUMNS.length))}
            className="col-span-2 md:col-span-1 lg:min-w-[13.5rem]"
          >
            <h2 className="font-sans text-[0.86rem] font-semibold uppercase tracking-[0.18em] text-ink">
              Get in touch
            </h2>

            <ul className="mt-6 space-y-4">
              <li>
                <a href={TEL_HREF} className={ROW}>
                  <PhoneIcon />
                  <Wipe label={PHONE_LABEL} />
                </a>
              </li>
              <li>
                <a href={MAIL_HREF} className={ROW}>
                  <MailIcon />
                  <Wipe label={EMAIL} />
                </a>
              </li>
              <li>
                <a
                  href={WA_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ROW}
                >
                  <WhatsAppIcon />
                  <Wipe label="WhatsApp us" />
                </a>
              </li>
              <li>
                <a
                  href={MAPS_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ROW_BASE} items-start`}
                >
                  <span className="mt-[0.2em]">
                    <PinIcon />
                  </span>
                  <address className="not-italic leading-[1.5]">
                    {ADDRESS_LINES.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ── the bottom bar ─────────────────────────────────────── */}
        <motion.div
          initial={reduced ? false : { scaleX: 0 }}
          animate={on ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.9, delay: STEP * 6, ease: EASE }}
          className="mt-[clamp(2.5rem,5vw,4rem)] h-px origin-left bg-line"
        />

        <motion.div
          {...rise(STEP * 7)}
          className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* ink-soft, not mute: mute is 3.65 on clean cream-deep but 2.75
              under a doodle line, and this line sits inside the band. */}
          {/* One paragraph, not two flex children: the credit has to be able
              to WRAP under the copyright on a narrow phone, and a separate
              flex item would have taken the separator dot with it and left it
              stranded at the end of the line above. */}
          <p className="font-sans text-[1rem] text-ink-soft">
            &copy; {new Date().getFullYear()} Hotcups. All rights reserved.
            <span aria-hidden="true" className="mx-2 text-mute">
              &middot;
            </span>
            Designed & developed by{" "}
            <a
              href="https://mntfuture.com/"
              target="_blank"
              /* noreferrer alongside noopener: noopener alone still leaks the
                 referring URL, and target=_blank without either hands the
                 opened page a live window.opener handle back to this one. */
              rel="noopener noreferrer"
              className="font-semibold text-espresso underline decoration-orange decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark focus-visible:text-orange-dark"
            >
              MnT Future
            </a>
          </p>

          <a
            href="#hero"
            /* espresso, so when the amber wipes up the label reads 5.18:1 —
               the same reason the blog's "All posts" is set in it. */
            className="hero-btn group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-line px-6 py-3.5 font-sans text-[1rem] font-semibold text-espresso transition-colors duration-300 hover:border-orange focus-visible:border-orange"
          >
            <span className="relative z-10">Back to top</span>
            <span
              aria-hidden="true"
              className="relative z-10 text-[1.05em] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5"
            >
              &uarr;
            </span>
          </a>
        </motion.div>
      </div>
    </footer>
  );
}
