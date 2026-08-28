"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import Image from "next/image";
import DigitRoll from "@/components/ui/DigitRoll";

/**
 * Section 08 — Seven years of Hotcups.
 *
 * NO DRAWN LINE THROUGH THE STORY ITSELF.
 * The obvious build for a client timeline is a spine that draws downward with
 * seven dots popping as it reaches them. This page already does that twice:
 * section 01 draws a horizontal line whose cards arrive as it passes them, and
 * section 03 draws a curved route through five nodes. So the years are told by
 * one enormous numeral that CHANGES as you scroll, and the only line in here
 * is the progress rail at the foot — which is a control, not a narrative.
 *
 * ONE STOP AT A TIME. THE SECTION PINS; IT DOES NOT SCROLL.
 * A list shows you the next year's headline while you are still reading this
 * one, so the giant numeral would be labelling one of two things you can see.
 * The seven are therefore STACKED: a tall empty TRACK does the scrolling, and
 * a frame inside it stays put for the whole track and swaps its contents. The
 * outgoing stop travels up and fades, the incoming one rises into its place —
 * the same gesture and direction as the numeral rolling above it.
 *
 * THE WHOLE COMPOSITION IS IN THE PINNED FRAME
 * Heading, numeral, stop, picture and rail are one held view; only the stop
 * inside it changes. The heading is what says the numeral means a year, so it
 * cannot be off screen while the numeral is on it.
 *
 * There is nothing after the frame. A sign-off band — "From flask to future"
 * and a thank-you, both from the client's sheet — used to close the section
 * below the track, and it is gone at the client's direction. The section now
 * ends on 2026, which is the strongest stop in it anyway.
 *
 * safe_center rather than center: on a short window the frame can outgrow the
 * viewport, and plain centring would push the heading above the scroll origin
 * where it cannot be reached. `safe` falls back to start-aligned exactly then.
 *
 * WHY THE STOPS ARE A GRID AND NOT ABSOLUTE POSITIONING
 * All seven live in one grid cell (`col-start-1 row-start-1`), so they overlap
 * without leaving the flow. The stage then measures itself against its TALLEST
 * child — 2026, with its four bullets — and every shorter stop aligns inside
 * that same box. Absolute positioning would have made the stage zero-height
 * and needed a hand-typed min-height that 2026 would eventually outgrow.
 *
 * All seven stay in the accessibility tree. They are faded, not hidden, so a
 * screen reader gets the whole story in order rather than one stop and no way
 * to reach the rest.
 *
 * WHICH STOP IS LIVE
 * Scroll progress through the track, floored into seven — progress is the
 * thing actually being asked about, so nothing is observed.
 *
 * ORANGE COMES IN TWO WEIGHTS HERE, AND THAT IS A CONTRAST RULE.
 * On cream-deep, orange-dark measures 3.65:1 — legal for large text and for
 * non-text marks, illegal for anything under 18.66px bold. So the numeral, the
 * headline and the rail's dots take orange-dark, and every small orange word
 * (the chip, the live year on the rail, the counter) takes orange-deep
 * (#b8420c, 4.87:1). See the token's note in globals.css.
 *
 * THERE IS BOTH ICONRY AND A PLATE NOW, and both arrived from the client
 * after this file was first written saying there would be neither. The seven
 * rail glyphs are under the dots, not beside the copy — the numeral is still
 * the mark for each stop, which is the reason it is set as large as it is —
 * and the plate sits on the pinned frame at 9%. See Rail and the sticky div.
 *
 * THE CONTENT IS THE CLIENT'S SHEET, WITH ONE CORRECTION — see MILESTONES.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* THREE HEIGHT GUARDS, AND THEY ARE THE PRICE OF PINNING THE WHOLE FRAME.
   Heading, numeral, stop, picture and rail all have to fit ONE viewport or
   they hang below the fold, where the pin makes them unreachable. Measured
   across sixteen window sizes, the composition fits everywhere down to
   1152x620 and 360x640 once the type is clamped against vh as well as vw — but
   the last few hundred pixels of height have to come from somewhere, so each
   guard drops the least valuable thing left at that size.

   Width is deliberately NOT a condition. The earlier version was
   height-and-narrow, on the theory that only phones run out of room; the
   measurements said otherwise. A 1440x768 laptop overran by 28px and a
   1280x650 one by 87, because the numeral now sits ABOVE the copy rather than
   beside it, and that stack does not care how wide the window is.

   Order of sacrifice, least costly first:
     800  the tagline, its rule and the scroll cue — a line of flavour and a
          hint, on a window short enough that the hint is redundant anyway.
     700  the rail's year labels. The dots and the 03 / 07 count still say
          where you are; this costs only the years themselves.
     600  the chip. Only a small phone under a tall browser bar gets here, and
          by then the alternative is clipping the client's own bullet list. */
const HIDE_800 = "[@media(max-height:800px)]:hidden";
/* the sub-line and its rule went from 800 to 900 to pay for the bigger
   heading — see the note on the h2 */
const HIDE_900 = "[@media(max-height:900px)]:hidden";
/* the dateline, and it is what pays for a 60px heading — see the h2 */
const HIDE_820 = "[@media(max-height:820px)]:hidden";
const HIDE_700 = "[@media(max-height:700px)]:hidden";
/* THE RAIL CARD FLATTENS BACK TO NOTHING AT 740, and two things agree on it.
   Below 700 the year labels have gone and below 660 the icons and captions
   have, so down there the panel would be a 2rem-radius box around a single
   16px row of dots — a frame with nothing in it. And 740 is where the pinned
   frame runs out of room: the card is about 15px of inset, and with it on at
   720 the tightest windows sat at 19px of slack, which is inside my own
   estimating error on how the 2026 bullets wrap. Dropping it there takes
   every size to 28px or better. A 1366x768 laptop lands here; a 1920x1080 or
   a 1440x900 keeps the card. */
const FLAT_740 =
  "[@media(max-height:740px)]:rounded-none [@media(max-height:740px)]:border-0 [@media(max-height:740px)]:bg-transparent [@media(max-height:740px)]:p-0";
/* the rail's icon + caption rows, and the same line the picture goes at */
const HIDE_660 = "[@media(max-height:660px)]:hidden";

type Milestone = {
  key: string;
  /** what the numeral shows, and the rail's label */
  year: string;
  /** the second line under the numeral, only where a stop covers a period */
  span?: string;
  title: string;
  body?: string;
  bullets?: string[];
  /** the line under the rail's icon — it used to be a pill under the copy */
  caption: string;
  /** which glyph the rail draws under this stop's dot */
  icon: keyof typeof GLYPH;
  /** the photograph for this stop — see the note above MILESTONES */
  img: string;
};

/* ---------------------------------------------------------------
   THE SEVEN STOPS, FROM THE CLIENT'S ANNIVERSARY SHEET.

   ONE CORRECTION, AND IT WAS NEEDED. The sheet lists "2022 TO 2024" for the
   growth stretch and then 2024 AGAIN for Trichy. On a poster the eye forgives
   a repeated year; here the numeral would have shown 2024, moved on, and come
   back to it — a story that goes backwards, and a rail carrying the same stop
   twice. The growth stretch is therefore 2022-2023 and 2024 belongs to Trichy
   alone. Seven stops, seven distinct periods, no overlap. If the client
   confirms the growth ran into 2024, change `span` and merge the two.

   THE `caption` LINES ARE THE ONLY WORDS HERE THAT ARE NOT THE CLIENT'S SHEET,
   and they are the client's all the same: they are the captions off the
   timeline reference and the background plate they supplied, which is why
   "It started small." replaced "Where it began." and "We grew." replaced
   "Steady growth." Each still restates the body directly above it rather than
   making a new claim, and none asserts a number, a date or a capability the
   sheet does not.

   They used to be a pill under each stop's copy. They are the rail's captions
   now — see Rail — because the same words in both places is the same words
   twice, and under the icon is where the reference puts them.

   EVERYTHING ELSE IS VERBATIM, including "50+ machines deployed" and the RFID
   claim. Those go live as public statements the moment this ships — they came
   from the client, they are not ours to soften, and they are not ours to
   invent either. (This used to say "alongside the hero's 500+
   organizations"; that row has been removed, so these two are now the only
   hard numbers the site claims about the business.)

   Titles are stored in sentence case and uppercased in CSS. The sheet sets
   them in caps, but caps in the markup is what makes a screen reader spell
   "COVID IMPACT" letter by letter.

   THE SEVEN PHOTOGRAPHS ARE REAL NOW, one per stop, delivered as ~2MB PNGs
   and converted to 1280px webp on the way in — 14.3MB of source became 580KB
   across all seven, which matters because a pinned frame mounts ALL of them at
   once (see Pictures) rather than fetching each as you reach it.

   THE ART DIRECTION HELD, AND IT WAS LEARNED THE EXPENSIVE WAY.
   The first brief for these described "a row of flasks being filled", "dozens
   of flasks lined up on trolleys" and "racks of flasks" — and the pictures
   that came back were of a flask WAREHOUSE. They read as a company that sells
   vacuum flasks, which is not the business: Hotcups sells the drink, and the
   flask is only how it travels.

   The rule that replaced it is that the subject of every frame is a PERSON or
   a DRINK — a pour, a cup being handed over, an office at tea break, a machine
   filling a cup — and a flask may appear once or twice, in use, never stacked,
   racked, loaded or displayed. The delivered set keeps it: a pour in a small
   kitchen, a masked delivery to an empty office, two hands at a bigger urn, a
   counter at tea break, a production kitchen, a machine in a lobby, a pantry
   counter. Anything that replaces one of these owes the same rule.

   Sources are 3:2 and 5:4; the boxes crop with object-cover, so a replacement
   does not have to match a ratio — but it should keep its subject off the
   edges, because the mobile box crops to 3:2 and the desktop one to whatever
   the viewport leaves.
   --------------------------------------------------------------- */
const MILESTONES: Milestone[] = [
  {
    key: "start",
    img: "/img/story-2019.webp",
    year: "2019",
    title: "Started in 200 sq. ft.",
    body: "Hotcups began from a humble 200 sq. ft. space.",
    caption: "It started small.",
    icon: "shop",
  },
  {
    key: "covid",
    img: "/img/story-2020.webp",
    year: "2020",
    title: "Faced COVID",
    body: "The world stopped. We chose to survive, adapt and keep moving.",
    caption: "We kept going.",
    icon: "cup",
  },
  {
    key: "impact",
    img: "/img/story-2021.webp",
    year: "2021",
    title: "COVID impact",
    body: "COVID continued to impact business, but it strengthened our foundation.",
    caption: "We adapted.",
    icon: "people",
  },
  {
    key: "growth",
    img: "/img/story-2022.webp",
    year: "2022",
    span: "through 2023",
    title: "30%+ growth YoY",
    body: "Consistent growth, stronger team, happier customers, scalable operations.",
    caption: "We grew.",
    icon: "chart",
  },
  {
    key: "trichy",
    img: "/img/story-2024.webp",
    year: "2024",
    title: "Establishment in Trichy & moved to 2,500 sq. ft.",
    body: "Expanded our footprint and upgraded to serve more, better.",
    caption: "We expanded.",
    icon: "building",
  },
  {
    key: "tech",
    img: "/img/story-2025.webp",
    year: "2025",
    title: "Stepped into technology",
    body: "Making impact for bigger corporates, other cities and states with our vending solutions.",
    caption: "We got smarter.",
    icon: "machine",
  },
  {
    key: "ecosystem",
    img: "/img/story-2026.webp",
    year: "2026",
    title: "Building the beverage ecosystem",
    bullets: [
      "50+ machines deployed",
      "RFID technology incorporated for corporate vending machines",
      "In-house pantry services",
      "Moved from a traditional delivery business to beverage ecosystem infrastructure provider",
    ],
    caption: "Building what's next.",
    icon: "sprout",
  },
];

const N = MILESTONES.length;

/** how many of 2026's four bullets a phone shows — see the note on the list */
const MOBILE_BULLETS = 3;

/* THE TRACK, AND WHY IT IS 42 AND NOT 60.
   The track is the tall empty thing you actually scroll; the frame pinned
   inside it consumes one viewport of that height, so the pin lasts
   (N x PER - 100) svh and each stop gets a seventh of THAT — not a seventh of
   the track. At 42 that is 294svh of track, 194svh of pin, and about 28svh of
   scroll per year: a firm flick each, quick enough that seven do not feel like
   a chore and slow enough that a year is legible before it goes. */
const PER_STOP = 42;
const TRACK = N * PER_STOP;

export default function Story() {
  const reduced = useReducedMotion();
  const headRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const headSeen = useInView(headRef, { amount: 0.4, once: true });
  const on = headSeen || Boolean(reduced);

  const [active, setActive] = useState(0);

  /* THE HOLE UNDER THE CHIP, AND WHY IT TAKES JAVASCRIPT TO CLOSE IT.
     The seven stops are stacked in ONE grid cell, so the cell is as tall as
     the tallest of them — 2026, with its four bullets — and every other year
     leaves the difference blank between its chip and the rail. Measured on a
     phone that is 76px at 768 wide and 133px at 320. It is not spacing that
     can be tuned away: it is a reserve, and the reserve is what stops the
     layout jumping as you scroll from one year to the next.

     On a phone there is nothing below the copy that a jump would disturb — the
     picture sits under it and cross-fades on every stop anyway — so the ol
     takes the LIVE stop's height there and the picture, which is the 1fr row,
     grows into whatever the ol gives back. The transition is a plain CSS one
     on height, and because the grid re-solves 1fr continuously the picture
     animates with it off that single declaration.

     At lg the height stays auto and the reserve stands, because there the
     picture is beside the copy and centred against it: an ol that changed
     height would move the photograph on every year.

     Heights are measured rather than guessed — the stops wrap differently at
     every width, and a ResizeObserver on each is what survives a rotation. */
  const olRef = useRef<HTMLOListElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [stopH, setStopH] = useState<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const ol = olRef.current;
    if (!ol) return;
    const items = Array.from(ol.children) as HTMLElement[];
    const measure = () => setStopH(items.map((li) => li.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    items.forEach((li) => ro.observe(li));
    return () => ro.disconnect();
  }, []);

  /* start start -> end end is exactly the window the frame is pinned for: 0
     when the track's top reaches the top of the window, 1 when its bottom
     reaches the bottom. The frame pins 78px earlier than that, because it is
     offset by the fixed header, so the whole 0..1 range is spent pinned and no
     stop ever changes while the frame is sliding away.

     This runs whether or not motion is reduced: which stop you are on is
     state, not decoration — only the way it arrives is. */
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const stopAt = (p: number) => Math.max(0, Math.min(N - 1, Math.floor(p * N)));

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const i = stopAt(p);
    setActive((prev) => (prev === i ? prev : i));
  });

  /* AND ONCE ON MOUNT, BECAUSE "change" ONLY FIRES ON A CHANGE.
     useScroll measures during its own setup, so a reload part-way into the
     section — or a link that lands inside it — can set the progress value
     before this component has subscribed to it. Without this read the frame
     would sit on 2019 with "01 / 07" under it while the scroll position says
     2024, until you nudged the wheel. */
  useEffect(() => {
    setActive(stopAt(scrollYProgress.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress]);

  const reveal = (delay: number, y = 18) =>
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

  return (
    <section
      id="story"
      /* cream-deep, NOT cream. Case studies above and Get pricing below are
         both bg-cream, so this on cream would have run into its neighbours
         with no seam at either end. The deeper ground marks it as its own
         chapter, which is what a story section between two sales sections
         needs to be.

         NO paddingTop. The track has to start at the section's top: any pad
         above it holds the frame that far down the window until the pin
         engages, and the bottom of the frame hangs off the screen by exactly
         that much in the meantime. The frame's own padding does the spacing. */
      className="relative overflow-x-clip bg-cream-deep"
      style={{ paddingBottom: "clamp(3.5rem, 6vw, 6rem)" }}
    >
      <div ref={trackRef} className="relative" style={{ height: `${TRACK}svh` }}>
        {/* THE CLIENT'S PLATE, AT 9%.
            It is on the STICKY frame, not the section: the section is 294svh
            of track and a `cover` background across that would be stretched to
            four times its height and would scroll away from the content
            standing on it. On the frame it is exactly one viewport and it
            holds still under the pin.

            0.91 IS MEASURED, NOT TASTE. The plate's illustrations — the
            shopfront, the office block, the botanicals — are saturated orange,
            and its darkest 2% is rgb(235,134,54). orange-deep is the tightest
            thing that has to sit on it (the rail's live caption and the count,
            both small text, both owing 4.5): it measures 4.35 at a 0.86 scrim
            and 4.50 at 0.90. 0.91 buys the margin. ink-soft is 8.2 and the
            numeral's orange-dark is 3.4 against the 3.0 large text owes.

            What survives at 9% is the paper texture and the ghost of the two
            buildings, which is what a plate like this is for. */}
        <div
          className="sticky top-[var(--header-h)] h-[calc(100svh-var(--header-h))]"
          style={{
            backgroundColor: "var(--color-cream-deep)",
            backgroundImage:
              "linear-gradient(rgba(253,239,227,0.91), rgba(253,239,227,0.91)), url(/img/story-bg.webp)",
            backgroundSize: "cover, cover",
            /* BOTTOM, NOT CENTRE, AND THAT IS WHAT LIFTS THE GHOST YEARS.
               The plate has its own "2019 / It started small." and "2026 /
               Building what is next." painted into it, and centred they landed
               at 24% of the frame — level with the sub-line, right beside the
               live numeral, which is where two sets of years read as a mistake
               rather than as texture.

               cover always makes this image taller than the frame on a desktop
               window (it is 1.78:1 against a frame nearer 2.2:1), so there IS
               vertical travel to spend, and bottom spends all of it: measured,
               the ghost 2019 goes from 24% to 10% at 1900x830, 25% to 13% at
               1920x872, and 28% to 23% at 1366x700. That puts it alongside the
               heading instead of alongside the story.

               What it costs is the top 22% of the plate at the widest frames —
               the upper botanicals and one dot grid. The year blocks themselves
               start at 29.8%, so they survive the crop at every size. On a
               phone the image is height-fitted and the labels are outside the
               visible band entirely, so this changes nothing there. */
            backgroundPosition: "center, center bottom",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          <div className="shell flex h-full flex-col [justify-content:safe_center] py-[clamp(0.5rem,1.7vh,2rem)]">
            {/* ═══════════ heading ═══════════ */}
            <div ref={headRef} className="shrink-0 text-center">
              <motion.div
                {...reveal(0, 0)}
                className="flex items-center justify-center gap-4"
              >
                <motion.span
                  aria-hidden="true"
                  initial={reduced ? undefined : { scaleX: 0 }}
                  animate={
                    reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }
                  }
                  transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
                  className="h-px w-12 origin-right bg-line md:w-20"
                />
                <span className="eyebrow whitespace-nowrap text-ink-soft">
                  08 — Our story
                </span>
                <motion.span
                  aria-hidden="true"
                  initial={reduced ? undefined : { scaleX: 0 }}
                  animate={
                    reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }
                  }
                  transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
                  className="h-px w-12 origin-left bg-line md:w-20"
                />
              </motion.div>

              {/* two lines, each clipping up out of its own box. The vh leg in
                  the clamp is not decoration: the frame is pinned to one
                  viewport, so a width-only clamp can outgrow a short window.

                  60px AT THE CAP, AT THE CLIENT'S DIRECTION, AND THE
                  DATELINE UNDER IT IS WHAT PAYS FOR IT.
                  3.35rem/5.6vh reached 46px at a 1625x812 window. 3.75rem/7.3vh
                  reaches the full 60 on any window about 900px tall, which is
                  where the client is reading it. Two lines of it is +33px, and
                  the year title going to 40px is another +41px on the tallest
                  stop — 74px against frames that had 52px spare.

                  So "2019 - 2026" goes at 820px of viewport. It is the cheapest
                  thing in the block (about 30px with its margin) and the most
                  redundant: the rail spells all seven years out, in order, a
                  few hundred pixels below it. Swept across seventeen window
                  sizes, that takes the tightest from -10px to +21px, and the
                  three that had actually gone negative — 1024x600 and both
                  720-tall windows — clear by 21 to 33.

                  1.7rem at the floor, not 1.75: at 1.75 "One growing journey."
                  measures 282px against the 280px a 320px phone leaves, so the
                  heading broke to three lines on the narrowest screen there is.

                  AND THE SUB-LINE PAID FOR THE ROUND BEFORE THIS ONE.
                  The vh leg went 5 -> 5.6 and the cap 3rem -> 3.35rem, which
                  at a 1625x812 window takes it from 41px to 46px. That window
                  had 16px of slack in the WHOLE frame, so the growth had to
                  come from somewhere: the sub-line and its rule now go at
                  900px of viewport rather than 800, which frees about 46px
                  there. They are a supporting line under a heading the client
                  wants read first, so that is the right thing to spend.

                  IT WAS BUILT BIGGER THAN THIS FIRST — 6vh and a 3.5rem cap —
                  and a sweep of seventeen window sizes killed it: 1024x600 had
                  2px left and three separate 720-tall windows had 5 to 8px.
                  The numeral was going to grow with it and that went too,
                  because nobody asked for a bigger numeral and it was costing
                  8px a window. What survives clears every size by at least
                  14px, and 20px+ everywhere but the smallest.

                  18ch -> 20ch because the floor rose too. "One growing
                  journey." is 10.07em wide — measured off the rendered
                  headline, not guessed — and 18ch is 10.8em, which was only 7%
                  of margin. At the 1.6rem floor on a 320px phone that margin
                  was gone. */}
              <h2 className="mx-auto mt-[clamp(0.5rem,1.4vh,0.875rem)] max-w-[20ch] text-balance font-display text-[clamp(1.7rem,min(4.6vw,7.3vh),3.75rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span {...clipLine(0.15)} className="block">
                    Seven years.
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
                  <motion.span {...clipLine(0.24)} className="block">
                    One{" "}
                    <span className="text-orange-dark">growing journey.</span>
                  </motion.span>
                </span>
              </h2>

              {/* the sheet's own dateline. DigitRoll renders anything that is
                  not 0-9 as a static character, so the dash and its spaces keep
                  their shape while the eight digits spin.

                  AN EN DASH, AFTER AN EM DASH READ AS AN UNDERSCORE HERE.
                  The character was never an underscore — it was U+2014 — but
                  DigitRoll was dropping non-digits a fifth of an em below the
                  figures beside them (fixed there), and an em dash is 1em long
                  with 0.22em of tracking either side of it, so a long low bar
                  between two numbers is exactly what it looked like. The
                  alignment fix is what makes it read as a dash at all; U+2013
                  is what it should have been anyway, because an en dash is the
                  mark for a range and an em dash is for a parenthetical. */}
              {/* GONE AT 820px OF VIEWPORT, and that is what buys the 60px
                  heading above it — see the note there. It is the cheapest
                  line in the block and the most redundant, because the rail
                  prints all seven years in order a few hundred pixels below. */}
              <motion.p
                {...reveal(0.34, 12)}
                className={`mt-[clamp(0.5rem,1.4vh,0.875rem)] font-display text-[clamp(1.2rem,min(1.5vw,2.4vh),1.4rem)] font-extrabold tracking-[0.22em] ${HIDE_820}`}
              >
                <DigitRoll
                  value="2019 – 2026"
                  play={on}
                  delay={0.4}
                  to="var(--color-orange-dark)"
                />
              </motion.p>

              {/* THE SUB-LINE IS GONE, at the client's direction.
                  "From a 200 sq. ft. beginning to a growing beverage
                  ecosystem." stood here. It was already the most guarded thing
                  in the section — hidden below lg and again under 900px of
                  viewport — because it cost about 50px of a pinned frame to
                  summarise what the seven stops underneath say one at a time,
                  starting with 200 sq. ft. and ending with the ecosystem.

                  The rule below it stays. It had two sides before and it has
                  two sides now: the heading above, the story below. */}

              <motion.span
                aria-hidden="true"
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: on ? 1 : 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
                className={`mt-[clamp(0.625rem,2vh,1.75rem)] block h-px w-full origin-center bg-line max-lg:hidden ${HIDE_900}`}
              />
            </div>

            {/* ═══════════ the numeral, the picture and the stop ═══════════ */}
            {/* THE PICTURE EATS THE SLACK, AND THAT IS THE WHOLE MOBILE FIX.
                It used to be a ~70px thumb in a flex row beside the numeral,
                on the reasoning that a stacked picture costs its full height.
                With real photographs in it that reads as a broken thumbnail —
                and the reasoning was wrong anyway, because the height was
                already being spent: the seven stops are STACKED IN ONE GRID
                CELL, so this block always reserves the tallest of them (2026,
                four bullets) and every other year leaves that difference blank.
                On a phone that is 100-250px of nothing between the copy and
                the rail. It is exactly the void in the screenshot.

                So on a phone the group is a three-row grid — numeral, stop,
                picture — the LAST row is 1fr, and the group is the flex child
                that grows.

                THE PICTURE IS LAST, NOT SECOND, AND THAT IS THE WHOLE REASON
                THE COPY NEVER MOVES. The ol above it takes the live stop's
                height (see the note in Story), so the row under it changes
                size on every year. Put the picture second and that change
                pushes the title and the body up and down as you scroll. Put it
                last and the numeral and the copy are both anchored to the top
                while the rail holds the bottom, so the only thing that resizes
                is the photograph — which is already cross-fading at that exact
                moment.

                Measured, with the sub-line and rule dropped below lg (they are
                a desktop nicety and they were costing ~70px), and with the ol
                handing back its reserve: 390x844 gives it 277px where the
                reserve left 163px, 430x932 gives 346px against 232px, and even
                a 375x667 phone goes from 60px to 174px. It is capped to 3:2 and
                to the column width, so it never letterboxes, and it goes
                entirely at 660px of viewport where there is nothing left to
                give it — the group stops growing at the same breakpoint, so
                below it the frame simply centres as it always did rather than
                holding an empty 1fr row where the picture used to be.

                At lg the rows collapse to two and the explicit col/row starts
                place all three, so the DOM order the phone needs costs the
                desktop nothing. */}
            <div className="mt-[clamp(0.625rem,1.8vh,1.625rem)] grid grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-y-[clamp(0.5rem,1.4vh,1.125rem)] max-lg:min-h-0 max-lg:[@media(min-height:661px)]:flex-1 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:grid-rows-[auto_auto] lg:gap-x-[clamp(1.25rem,3vw,3.25rem)]">
              <Numeral active={active} reduced={Boolean(reduced)} />

              <ol
                ref={olRef}
                className="grid transition-[height] duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:col-start-1 lg:row-start-2"
                style={
                  narrow && stopH[active]
                    ? { height: stopH[active] }
                    : undefined
                }
              >
                {MILESTONES.map((m, i) => (
                  <Stop
                    key={m.key}
                    m={m}
                    index={i}
                    active={active}
                    reduced={Boolean(reduced)}
                  />
                ))}
              </ol>

              <Pictures active={active} reduced={Boolean(reduced)} />
            </div>

            {/* ═══════════ the rail ═══════════ */}
            <Rail active={active} reduced={Boolean(reduced)} on={on} />
          </div>
        </div>
      </div>

    </section>
  );
}

/* ---------------------------------------------------------------
   The numeral: a strip of all seven years behind a one-cell clip.

   Each cell is 1.05em of the giant size, so the travel is one seventh of the
   strip's OWN height — expressed as a percentage, because motion resolves a
   percentage on y against the element itself and the element is seven cells
   tall. It leaves upward, the same direction the stop below it leaves in.
   --------------------------------------------------------------- */
function Numeral({ active, reduced }: { active: number; reduced: boolean }) {
  const current = MILESTONES[active];

  return (
    <div className="min-w-0 lg:col-start-1 lg:row-start-1">
      <div
        aria-hidden="true"
        className="font-display text-[clamp(2.5rem,11vw,3.25rem)] font-extrabold leading-none tracking-[-0.045em] text-orange-dark lg:text-[clamp(2.5rem,min(6.5vw,10.5vh),6rem)]"
      >
        <div className="h-[1.05em] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ y: `${(-active * 100) / N}%` }}
            transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
          >
            {MILESTONES.map((m) => (
              <span key={m.key} className="block h-[1.05em] leading-[1.05em]">
                {m.year}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* the period line, only on the stop that covers one. Fixed height and
          absolute children, so a stop without a span does not shorten the
          column and jog everything under it. */}
      <div aria-hidden="true" className="relative hidden h-[1.1rem] lg:block">
        {MILESTONES.map((m, i) =>
          m.span ? (
            <motion.span
              key={m.key}
              className="absolute inset-x-0 top-0 font-sans text-[0.85rem] tracking-[0.08em] text-ink-soft"
              initial={false}
              animate={{ opacity: i === active ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
            >
              {m.span}
            </motion.span>
          ) : null,
        )}
      </div>

      {/* what the numeral says out loud. The strip is aria-hidden — it holds
          all seven years at once and would be read as one long number — so
          this is the only thing assistive tech gets from it, and it is polite
          rather than assertive because it changes as you scroll. */}
      <p className="sr-only" aria-live="polite">
        {current.year}
        {current.span ? ` ${current.span}` : ""} — {current.title}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------
   The picture for the live stop.

   All seven are mounted and cross-fade, exactly as the stops do — swapping a
   single `src` would show the browser fetching each photograph the first time
   you reach it, which on a pinned frame is a white box for as long as the
   network takes.

   NEITHER BOX TAKES ITS HEIGHT FROM ITS WIDTH, AND THAT IS THE RULE.
   The frame has a fixed height budget, and an ordinary aspect-ratio box takes
   whatever height its column's width implies — which is how a picture quietly
   becomes the tallest thing in the frame and pushes 2026's bullets off the
   bottom. At lg the height is a vh clamp, so the viewport decides and the
   photograph crops to suit.

   On a phone the height comes from the 1fr row it sits in — the slack the rest
   of the frame did not use — and the WIDTH is simply the column.

   IT USED TO DERIVE THE WIDTH FROM THAT HEIGHT, via aspect-[3/2] and w-auto,
   so that a short row could not letterbox. That was the wrong trade and 2026
   is what proved it. 2026 is the one stop with a bullet list, so its copy is
   the tallest and the row under it the shortest — and a narrower row made a
   narrower PICTURE, which sat hard against the left edge of the column with a
   third of the width empty beside it. A short picture reads as a crop. A
   narrow one reads as a bug.

   Full width and a variable height instead: about 1.2:1 on a short stop and
   2:1 on 2026, both of which are ordinary crops of a 3:2 source. The case
   aspect-[3/2] was defending against — a wide, short window turning this into
   a 10:1 strip — cannot arise any more, because the picture is hidden below
   660px of viewport and that is the only place a frame is short enough.

   alt is empty on purpose. Each picture illustrates a heading and a paragraph
   already in the DOM beside it, so captioning all seven would make a screen
   reader read the story twice.
   --------------------------------------------------------------- */
function Pictures({ active, reduced }: { active: number; reduced: boolean }) {
  return (
    <div className={`relative min-h-0 h-full w-full overflow-hidden rounded-[var(--radius-media)] bg-orange-soft ${HIDE_660} lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:h-[clamp(11rem,43vh,25rem)] lg:self-center`}>
      {MILESTONES.map((m, i) => (
        <motion.div
          key={m.key}
          className="absolute inset-0"
          initial={false}
          animate={{
            opacity: i === active ? 1 : 0,
            scale: i === active ? 1 : 1.06,
          }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
        >
          <Image
            src={m.img}
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 58vw"
            className="object-cover"
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   One stop, stacked with the other six in a single grid cell.

   THE TRAVEL IS SIGNED BY POSITION IN THE STORY, NOT BY A DIRECTION FLAG.
   A stop that has been passed sits ABOVE (-y), one still to come sits BELOW
   (+y), and the live one is at zero. That one rule gives the right motion in
   both directions without tracking which way the page is moving.

   36px, not more. The stop has to clear its own space in the ~0.55s the
   numeral takes to roll, and a longer throw reads as a slide-in banner rather
   than as a page turning.

   THE TITLE IS INK, NOT ORANGE, AND SO IS EVERY OTHER SMALL WORD.
   Only the numeral, the rail's dots and the headline are large enough to carry
   orange-dark's 3.65:1 — see the note at the top of this file. The chip is the
   exception that proves it: its text takes orange-deep, the token that exists
   precisely so small orange type is legal.
   --------------------------------------------------------------- */
function Stop({
  m,
  index,
  active,
  reduced,
}: {
  m: Milestone;
  index: number;
  active: number;
  reduced: boolean;
}) {
  const live = index === active;

  return (
    <motion.li
      className="col-start-1 row-start-1 self-start"
      style={{ pointerEvents: live ? "auto" : "none" }}
      initial={false}
      animate={{
        opacity: live ? 1 : 0,
        y: live ? 0 : index < active ? -36 : 36,
      }}
      transition={{ duration: reduced ? 0 : 0.55, ease: EASE }}
    >
      {/* the dash between the numeral and the title */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scaleX: live ? 1 : 0 }}
        transition={{
          duration: reduced ? 0 : 0.6,
          delay: reduced ? 0 : 0.12,
          ease: EASE,
        }}
        className="block h-[3px] w-8 origin-left rounded-full bg-orange-dark"
      />

      {/* THE TITLE IS THE STORY, SO IT IS SIZED LIKE IT.
          40px at the cap at the client's direction, from 1.8rem, with the vh
          leg 2.9 -> 4.9 so it actually reaches it on the windows that can
          afford it. 28ch stays: the measure has to grow when the type does or
          the same words wrap one line earlier, and at 40px the 28ch cap is
          672px against a left column of about 453px, so the column is what
          bounds the line now. "BUILDING THE BEVERAGE ECOSYSTEM" still takes
          two lines at every size — that is what sets the height this whole
          column reserves, and at 40px those two lines are 100px of it.

          A side effect worth having: the empty band between this column and
          the photograph, which was ~150px, closes to about 45. Bigger type
          fills a column that a measure was leaving half empty. */}
      <h3 className="mt-[clamp(0.4375rem,1.2vh,0.75rem)] max-w-[28ch] font-display text-[clamp(1.25rem,min(2.8vw,4.9vh),2.5rem)] font-extrabold uppercase leading-[1.25] tracking-[0.03em] text-ink">
        {m.title}
      </h3>

      {m.body ? (
        <p className="mt-2 max-w-[44ch] font-sans text-[clamp(0.9rem,min(1.05vw,1.6vh),1.05rem)] leading-[1.5] text-ink-soft">
          {m.body}
        </p>
      ) : null}

      {/* THE PHONE GETS THREE OF THE FOUR, AND SMALLER.
          2026 is the only stop with a list, so its copy is the tallest by a
          long way: six lines of list where a short stop has a two-line body,
          measured at 390px wide. The picture below takes whatever the copy
          leaves, so 2026 was the one year whose photograph came out half the
          size of everybody else's. At the client's direction the phone drops
          the last bullet and steps the rest down to 0.78rem with tighter
          leading and gaps.

          THE LAST ONE, because it is the one the heading already makes:
          "Moved from a traditional delivery business to beverage ecosystem
          infrastructure provider" sits directly under a title that reads
          BUILDING THE BEVERAGE ECOSYSTEM. It is also the longest at 87
          characters, so it was two of the six lines on its own.

          BELOW lg ONLY. Desktop keeps all four, verbatim, because there the
          copy sits beside the picture rather than above it and costs it
          nothing — and a claim this substantive should not quietly leave the
          site.

          MEASURED, at 390x844: the list goes from six lines to four, and with
          the smaller type and gaps the block sheds 54px — 13.12px/1.45 over
          6px gaps becomes 12.48px/1.4 over 4px. All 54 go to the photograph,
          which grows 350x182 -> 350x236. The other four phone widths gain 54
          to 72px the same way.

          52ch, NOT 46. The longest bullet — "Moved from a traditional delivery
          business to beverage ecosystem infrastructure provider", 87
          characters — wrapped to THREE lines at 46ch, and 2026 is the stop that
          sets the height of the whole pinned frame. 52ch takes it to two.

          This comment sits OUTSIDE the ternary on purpose. A braced JSX comment
          inside the truthy branch is a second expression in the same pair of
          parentheses, and it does not parse. */}
      {m.bullets ? (
        <ul className="mt-2.5 grid max-w-[68ch] gap-1.5 max-lg:gap-1">
          {m.bullets.map((b, i) => (
            <li
              key={b}
              className={`flex items-start gap-2.5 font-sans text-[clamp(0.82rem,min(1vw,1.5vh),1rem)] leading-[1.45] text-ink-soft max-lg:gap-2 max-lg:text-[0.78rem] max-lg:leading-[1.4] ${
                i >= MOBILE_BULLETS ? "max-lg:hidden" : ""
              }`}
            >
              <Check play={live} delay={0.22 + i * 0.08} reduced={reduced} />
              {b}
            </li>
          ))}
        </ul>
      ) : null}

      {/* THE CHIP IS GONE, AND IT PAID FOR THE TIMELINE.
          It carried this stop's caption in an orange pill under the copy —
          about 63px of the frame on a desktop window. The rail now prints the
          same words under its own icon, which is where the client's reference
          puts them, so keeping both would have been the same sentence twice.
          The icon and caption rows cost 59px; this freed 63. */}
    </motion.li>
  );
}

/* ---------------------------------------------------------------
   THE SEVEN RAIL GLYPHS, and every one of them was rendered at 22px before it
   was allowed in. This site has drawn icons twice and been burned both times:
   a virus read as a SUN once it was small (a circle with straight rays), a
   machine read as a PHONE (a screen centred in a rounded box), and a shop read
   as a HOUSE (an awning steep enough to be a roof).

   All three lessons are in here. The machine has a CUP under a spout, which is
   the one thing a phone does not have. The shop's canopy is a shallow 2.8-unit
   band, not a 4.4-unit wedge — rendered side by side, the wedge is a house and
   the band is a shopfront. The chart lost its trend line and kept three bars,
   because at 22px the extra strokes closed into a blob and the rise stopped
   reading at all.

   24-unit box, stroke 1.7, currentColor, so they take the rail's own live/past
   colours without a second code path.
   --------------------------------------------------------------- */
const GLYPH = {
  shop: (
    <>
      <path d="M2.2 9.4h19.6l-1.3-2.8H3.5L2.2 9.4Z" />
      <path d="M4.4 9.4v11.4h15.2V9.4" />
      <path d="M13.2 20.8v-5.4h4.2v5.4" />
      <path d="M6.6 12.6h4.2v3.2H6.6z" />
    </>
  ),
  cup: (
    <>
      <path d="M6.3 8.6h11.4l-1.15 11.5a1.9 1.9 0 0 1-1.9 1.7H9.35a1.9 1.9 0 0 1-1.9-1.7L6.3 8.6Z" />
      <path d="M4.7 5.6h14.6v3H4.7z" />
      <path d="M9.9 3.4c.7-.75.3-1.5 0-2.1M14.1 3.4c.7-.75.3-1.5 0-2.1" />
    </>
  ),
  people: (
    <>
      <circle cx="9.2" cy="8" r="3.1" />
      <path d="M3.4 20.4a5.8 5.8 0 0 1 11.6 0" />
      <circle cx="16.9" cy="9.8" r="2.4" />
      <path d="M16.4 14.6a5.2 5.2 0 0 1 4.3 4.6" />
    </>
  ),
  chart: (
    <>
      <path d="M3.2 21h17.6" />
      <path d="M5.6 21v-6.6h3.2V21" />
      <path d="M10.4 21v-9.8h3.2V21" />
      <path d="M15.2 21v-13h3.2V21" />
    </>
  ),
  building: (
    <>
      <path d="M2.6 21.2h18.8" />
      <path d="M5 21.2V3.6h9.2v17.6" />
      <path d="M14.2 21.2V10.4h4.6v10.8" />
      <path d="M7.4 7.4h1.6M10.6 7.4h1.6M7.4 12.4h1.6M10.6 12.4h1.6" />
    </>
  ),
  machine: (
    <>
      <rect x="4.6" y="2.4" width="14.8" height="19.2" rx="2" />
      <rect x="7" y="4.8" width="10" height="5" rx="0.9" />
      <path d="M12 11.2v2.4" />
      <path d="M8.8 14.6h6.4l-.85 4.8H9.65L8.8 14.6Z" />
    </>
  ),
  sprout: (
    <>
      <path d="M5.8 12.6h12.4l-1.1 7.7a1.9 1.9 0 0 1-1.9 1.6H8.8a1.9 1.9 0 0 1-1.9-1.6L5.8 12.6Z" />
      <path d="M12 12.6V8.2" />
      <path d="M12 9.2c0-2.4 1.9-4.3 4.3-4.3 0 2.4-1.9 4.3-4.3 4.3Z" />
      <path d="M12 11.2c0-1.9-1.6-3.4-3.5-3.4 0 1.9 1.6 3.4 3.5 3.4Z" />
    </>
  ),
};

function Glyph({ name }: { name: keyof typeof GLYPH }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[clamp(1.15rem,2vh,1.5rem)] w-[clamp(1.15rem,2vh,1.5rem)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPH[name]}
    </svg>
  );
}

/* ---------------------------------------------------------------
   The rail: seven years, a track that fills to where you are, an icon and a
   caption under each stop, and the count.

   IT IS A CONTROL, NOT PART OF THE STORY. Sections 01 and 03 both narrate with
   a drawn line, which is why the story above deliberately has none; this is a
   position indicator at the foot of a pinned frame — the same thing a scroll
   bar is — and reads as one.

   THE TRACK IS INSET BY HALF A CELL AT EACH END. Seven dots in a seven-column
   grid put the first at 1/14 across and the last at 13/14, so a full-width line
   would stick out past both. 7.143% is that half cell, and it is why the fill's
   scaleX maps active/(N-1) rather than active/N.

   THE LABELS DROP ON HEIGHT, NOT ON WIDTH, AND orange-deep IS WHY THEY CAN.
   They were lg-only on the theory that the live year has to be orange and
   orange has a size floor before it is legal — true of orange-dark, which
   needs 18.66px bold. orange-deep is 4.87:1 and legal at ANY size, so the
   labels can shrink to 0.94rem and still show on a phone. What they cannot
   survive is a SHORT window, where the frame runs out of height, so they go at
   700px of viewport. A 03 / 07 count used to carry the position once they had;
   it is gone at the client's direction, so below 700 the dots carry it alone.
   --------------------------------------------------------------- */
function Rail({
  active,
  reduced,
  on,
}: {
  active: number;
  reduced: boolean;
  on: boolean;
}) {
  return (
    /* A CARD, FULL WIDTH OF THE FRAME, at the client's direction.
       The rail was seven columns of type floating straight on the plate, which
       is the one thing in this section that is a CONTROL rather than part of
       the story — and it read as neither. A panel gives it an edge to be a
       control inside.

       IT ALSO MAKES THE RAIL EASIER TO READ, not harder. The plate behind this
       section is a 9% wash whose darkest 2% is a saturated orange; cream/70
       over that lands on rgb(254,242,231), which is lighter than the ground
       the rail's live caption was already measured legal against. The card can
       only raise its contrast.

       THE PADDING IS PAID FOR BY THE MARGIN ABOVE IT. The frame is pinned and
       the tightest window had 21px spare, so a card cannot simply add its own
       inset: py is clamped on vh and the rail's own top margin drops from
       1.8vh to 1.2vh, because the card's edge now does the separating that
       margin was doing. Net cost is about 10px at 1024x600 and 13px at
       1625x812. */
    <div className={`mt-[clamp(0.375rem,1.2vh,1rem)] shrink-0 rounded-[var(--radius-panel)] border border-line/70 bg-cream/70 px-[clamp(0.75rem,2vw,1.75rem)] py-[clamp(0.375rem,1.1vh,0.875rem)] ${FLAT_740}`}>
      {/* ---- the year labels ---- */}
      <div className={`grid grid-cols-7 ${HIDE_700}`} aria-hidden="true">
        {MILESTONES.map((m, i) => (
          <span
            key={m.key}
            className={`text-center font-display text-[clamp(0.94rem,min(1.15vw,1.9vh),1.25rem)] font-extrabold tabular-nums transition-colors duration-500 ${
              i === active ? "text-orange-deep" : "text-ink-soft"
            }`}
          >
            {m.year}
          </span>
        ))}
      </div>

      {/* ---- the track and the dots ---- */}
      <div className="relative mt-[clamp(0.375rem,1vh,0.625rem)] h-4">
        <span
          aria-hidden="true"
          className="absolute inset-x-[7.143%] top-1/2 h-px -translate-y-1/2 bg-line"
        />
        <motion.span
          aria-hidden="true"
          className="absolute inset-x-[7.143%] top-1/2 h-[2px] -translate-y-1/2 origin-left rounded-full bg-orange-dark"
          initial={false}
          animate={{ scaleX: active / (N - 1) }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
        />

        <ol className="relative grid h-full grid-cols-7 items-center">
          {MILESTONES.map((m, i) => {
            const done = i <= active;
            const live = i === active;
            return (
              <li key={m.key} className="grid place-items-center">
                {/* the halo, behind the dot */}
                <motion.span
                  aria-hidden="true"
                  className="col-start-1 row-start-1 block h-4 w-4 rounded-full bg-orange/25"
                  initial={false}
                  animate={{ opacity: live ? 1 : 0, scale: live ? 1 : 0.5 }}
                  transition={{ duration: reduced ? 0 : 0.45, ease: EASE }}
                />
                {/* MOTION ANIMATES THE SIZE, CSS ANIMATES THE COLOUR. These are
                    token colours, so the value is a var() — and motion cannot
                    interpolate a var(): it has nothing to parse, so it snaps to
                    the end instead of tweening. A CSS transition resolves the
                    custom property first and tweens the resulting colour. */}
                <motion.span
                  aria-hidden="true"
                  className="col-start-1 row-start-1 block rounded-full border-2 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    borderColor: done
                      ? "var(--color-orange-dark)"
                      : "var(--color-line)",
                    backgroundColor: done
                      ? "var(--color-orange-dark)"
                      : "var(--color-cream-deep)",
                  }}
                  initial={false}
                  animate={{
                    width: live ? 13 : 9,
                    height: live ? 13 : 9,
                    opacity: on ? 1 : 0,
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.45,
                    delay: on && !reduced ? 0.6 + i * 0.04 : 0,
                    ease: EASE,
                  }}
                />
                <span className="sr-only">
                  {m.year}
                  {live ? " (current)" : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ---- the icons, one under each dot ----
          They go at the same 660px line the picture goes at, and that is not a
          coincidence: below it the frame has nothing left to give, and this
          block plus its captions is 59px. What pays for it is the chip that
          used to sit under the copy, which was 63px — so on any window tall
          enough to show both, the timeline is 4px CHEAPER than what it
          replaced. Below 601px the chip was already hidden, which is why the
          guard here cannot be looser than the chip's was. */}
      <div
        aria-hidden="true"
        className={`mt-[clamp(0.35rem,1.1vh,0.7rem)] grid grid-cols-7 ${HIDE_660}`}
      >
        {MILESTONES.map((m, i) => (
          <span
            key={m.key}
            className={`flex justify-center transition-colors duration-500 ${
              i === active ? "text-orange-deep" : "text-ink-soft"
            }`}
          >
            <Glyph name={m.icon} />
          </span>
        ))}
      </div>

      {/* ---- the captions ----
          SEVEN OF THEM AT lg, ONE BELOW IT. Seven columns of a 1128px content
          width is 161px a column, and "Building what's next." is about 144px
          at this size — it fits, but only just, and at 375px a column is 47px
          and it cannot fit at all. So the phone gets the live caption alone,
          centred, which is the same thing the chip used to do. */}
      <div
        className={`mt-[clamp(0.2rem,0.7vh,0.4rem)] hidden grid-cols-7 lg:grid ${HIDE_660}`}
        aria-hidden="true"
      >
        {MILESTONES.map((m, i) => (
          <span
            key={m.key}
            className={`px-1 text-center font-sans text-[clamp(0.72rem,min(0.85vw,1.3vh),0.85rem)] leading-[1.25] transition-colors duration-500 ${
              i === active ? "font-semibold text-orange-deep" : "text-ink-soft"
            }`}
          >
            {m.caption}
          </span>
        ))}
      </div>
      <p
        className={`mt-[clamp(0.2rem,0.7vh,0.4rem)] text-center font-sans text-[clamp(0.78rem,1.1vh,0.9rem)] font-semibold leading-[1.25] text-orange-deep lg:hidden ${HIDE_660}`}
      >
        {MILESTONES[active].caption}
      </p>

      {/* THE 04 / 07 COUNT IS GONE, at the client's direction, and one thing
          went with it that is worth knowing about. It was the FALLBACK: the
          year labels drop at 700px of viewport and the icons and captions at
          660, and the count was what still said where you were once they had.
          Below 700 the rail is now dots alone — which is what a scroll bar is,
          and this rail was always framed as one. The dots still fill to the
          live stop and the live one is still the larger, so position is shown
          rather than counted; every dot also carries its year and a
          "(current)" in sr-only text, so nothing was lost to assistive tech.

          It also gives about 28px back to the frame, which every window size
          spends on the picture. */}

      {/* ---- the scroll cue, while there is somewhere left to scroll to ---- */}
      <motion.p
        aria-hidden="true"
        initial={false}
        animate={{ opacity: active < N - 1 ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.4, ease: EASE }}
        className={`mt-[clamp(0.4375rem,1.2vh,0.625rem)] flex items-center justify-center gap-2 font-sans text-[clamp(0.65rem,0.78vw,0.74rem)] uppercase tracking-[0.18em] text-ink-soft ${HIDE_800}`}
      >
        {/* a mouse, from the reference. The wheel is a short stroke inside the
            body rather than a dot, because a dot centred in a rounded
            rectangle at 13px is the phone problem again. */}
        <svg
          viewBox="0 0 24 24"
          className="h-[1.35em] w-[1.35em] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <rect x="8" y="2.6" width="8" height="18.8" rx="4" />
          <path d="M12 6.4v3.4" />
        </svg>
        Scroll to explore
      </motion.p>
    </div>
  );
}

/** the tick beside a 2026 bullet — the ring is drawn, the check draws itself */
function Check({
  play,
  delay,
  reduced,
}: {
  play: boolean;
  delay: number;
  reduced: boolean;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-[0.15em] h-[1.1em] w-[1.1em] shrink-0 text-orange-dark"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="8.3" />
      <motion.path
        d="M6.1 10.2 8.8 12.9 14 7.3"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: play ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.4, delay, ease: EASE }}
      />
    </svg>
  );
}
