"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "motion/react";
import RollValue from "@/components/ui/RollValue";
import { setOffice } from "@/lib/office";

/**
 * Section 04 — Which one you need.
 *
 * THE PURPOSE IS THE SECOND LINE ON SCREEN
 * "Above 40 cups a day, a machine costs you less." It used to sit in a side
 * column at 65% opacity, which is where a reader's eye goes last. It is now
 * directly under the heading, at full size, because it is the one sentence
 * the section exists to deliver.
 *
 * THE CALCULATION IS ON SCREEN, NOT BEHIND A TOGGLE
 * A previous version hid the arithmetic behind "How we work that out". That
 * was wrong: a buyer being told they must spend money on a machine needs to
 * see WHY on the same screen. An accordion asks them to trust us first and
 * check later, which is exactly backwards.
 *
 * IT SHOWS THE WORKING, NOT A PRICE LIST
 * "128 cups x ₹8 / x 26 working days / = ₹26,624" is understood in one pass.
 * The labelled table it replaced ("Price per cup ₹8", "Machine —", "₹26,624")
 * held the same numbers but made the reader assemble the sum themselves. Same
 * count, far less work — that is the difference between visible and legible.
 *
 * ONE FIELD FOR THE OFFICE, THREE BUTTONS FOR THE RATE
 * The slider went first: a drag handle needs a caption explaining that it is
 * draggable and what dragging means, and it produced values like "87 people"
 * that nobody would ever choose deliberately. Six preset sizes replaced it,
 * then a typing box was added beside them, and then the presets went too —
 * they read as though the question had a small set of right answers, and an
 * office of 63 had to walk past all six to reach the box anyway. The question
 * is asked once now and takes any number from 10 up.
 *
 * The rate keeps its three buttons, because there genuinely are only three
 * answers a person gives to "how many cups do you drink a day".
 *
 * IT SITS ON .shell, LIKE EVERY OTHER SECTION
 * This was briefly widened to .shell-wide, 1720px, when the hero moved there.
 * That single change did more damage than anything else in the section's
 * history. 480px of extra width pulled the two cards apart, shrank the type
 * against its own container, thinned the whole layout — and stretched the
 * divider rule far enough right to run underneath the machine, which is what
 * then looked like an image bug. Everything else on the page is 1240. So is
 * this, again.
 *
 * THE PHOTOGRAPH IS ANCHORED TO THE HEADING AND ALIGNED TO THE CONTAINER
 * It is absolutely positioned inside the heading block, right-aligned to the
 * container, so it costs the section no height and still tracks the copy.
 * Anchoring it to the SECTION instead was the mistake: the section
 * is min-h-svh with its content vertically centred, so on a tall window the
 * copy began 240px below the photograph, and at the top of a scroll the
 * sticky header sliced the top off the unit.
 *
 * Three bounds hold it, all measured across 640-3440 at eleven window sizes:
 * the sticky header above, the divider rule below, and the headline's own
 * column to its left. The rule binds nearly everywhere and is what caps the
 * height at 236px.
 *
 * IT STILL ARGUES AGAINST ITS OWN LARGER SALE
 * Pick 10 people and it says stay on flasks, and shows no saving, because
 * there isn't one. That is what turns 40 cups from a threshold we assert into
 * one the visitor checked.
 *
 * THE SAVING IS EXACT, NOT ROUNDED
 * It was "about ₹6,900" while the working was hidden, which was the honest
 * framing for a figure nobody could check. Now that both totals are on screen
 * a reader can subtract them, so a rounded figure would simply look wrong.
 * The estimate disclaimer moved to a line under the sum where it belongs.
 *
 * CONTRAST
 * The ground is a two-layer gradient, so every value here was swept across a
 * grid of the actual composited colour rather than against a single stop —
 * base and amber halo, at each element's real position. The lowest AA-text
 * ratio anywhere on the section is 6.03; the cool navy this replaces bottomed
 * out at 4.50. Every 1px boundary — the chips, the typing field, the idle
 * card, the threshold pill — is cream/40 = 3.62, because cream/30 measured
 * 2.56 and a control whose only edge is invisible is not a control.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/* ===============================================================
   !!  PLACEHOLDER PRICING — INVENTED, NOT CLIENT DATA.       !!
   !!  DO NOT PUBLISH UNTIL EVERY FIGURE BELOW IS CONFIRMED.  !!
   ===============================================================

   The client gave us exactly ONE fact: above 40 cups a day, a machine
   is the answer. Every rupee in this file was invented here to make
   that sentence arithmetically true on screen.

     FLASK_RATE    ₹8 a cup   INVENTED. No client rate was supplied.
     MACHINE_RATE  ₹5 a cup   INVENTED. Likewise.
     MACHINE_FIXED            NOT a quoted price. It is SOLVED FOR, so
                              the two costs cross at exactly 40 cups.
                              Change either rate and this moves with it.

   WHY THERE IS A FIXED COST AT ALL
   Without one the arithmetic cannot produce a 40-cup line: a machine
   cup at ₹5 beats a flask cup at ₹8 at every volume, so the machine
   would always win and the rule would have nothing behind it. The
   fixed monthly charge is the only thing that makes 40 a crossover.

   WHAT WE DO NOT KNOW
   Whether that fixed charge is rent, a minimum monthly bill, or a
   purchase spread over a term. An earlier draft labelled the row
   "Machine, rented", which asserted a rental contract the client has
   never described. It is labelled neutrally now.

   BEFORE THIS SECTION GOES LIVE, GET FROM THE CLIENT
     1. the real per-cup rate on flask delivery
     2. the real per-cup rate once a machine is installed
     3. the real fixed monthly charge, and what it actually is
        (rent / minimum billing / instalment / nothing)
     4. confirmation that 40 cups is a COST crossover at all — it may
        well be an OPERATIONAL rule instead: above 40 cups flasks stop
        being practical (too many trips, tea arrives cold), which has
        nothing to do with rupees.

   If (4) comes back "operational", this section should argue logistics
   and the money comes out of it entirely.
   =============================================================== */

/** the rule the whole section is built on — the one confirmed fact */
const THRESHOLD_CUPS = 40;

const WORKING_DAYS = 26;
/** INVENTED — blended flask rate a cup, across the menu */
const FLASK_RATE = 8;
/** INVENTED — consumables a cup, once a machine is in the pantry */
const MACHINE_RATE = 5;

/** DERIVED, NOT QUOTED: the fixed monthly figure that puts the crossover
    on THRESHOLD_CUPS. It is a consequence of the rule, not a price. */
const MACHINE_FIXED =
  THRESHOLD_CUPS * WORKING_DAYS * (FLASK_RATE - MACHINE_RATE);

/** a desk job through a double shift. Whole cups only — 1.5 was a blended
    average nobody would ever say out loud about their own office. */
const RATES = [1, 2, 3];

/** Bounds for the typed number. Ten is the floor because it is the smallest
    office anyone orders a daily round for, and the ceiling only exists to
    stop 999999999 rendering. The six preset sizes that used to sit beside
    this field are gone: they read as the answer being pre-chosen, and a
    visitor whose office is 63 people had to hunt for the box anyway. */
const MIN_PEOPLE = 10;
const MAX_PEOPLE = 5000;
const clampPeople = (n: number) =>
  Number.isFinite(n)
    ? Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, Math.round(n)))
    : MIN_PEOPLE;

/** The section opens on the floor, so the first thing a visitor sees is an
    empty-handed starting point they type over rather than a number we chose
    for them. NOTE the consequence: 10 x 2 = 20 cups, which is UNDER the
    40-cup line, so the section's opening verdict is "stay on flasks". */
const START_PEOPLE = MIN_PEOPLE;
const START_RATE = 2;

const perMonth = (cups: number) => cups * WORKING_DAYS;
const flaskCost = (cups: number) => perMonth(cups) * FLASK_RATE;
const machineCost = (cups: number) =>
  MACHINE_FIXED + perMonth(cups) * MACHINE_RATE;

const rupees = (n: number) =>
  "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));

const int0 = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(n));

/**
 * The machine that actually fits, by volume — the same three units, names and
 * capacities as section 05, so the two sections cannot disagree about what a
 * given office gets.
 *
 * NAMES AND CAPACITIES ARE ALSO UNCONFIRMED. They came from the machine
 * photographs we were given, not from a spec sheet. The cup ceilings in
 * particular are guesses and belong on the same list as the rates above.
 */
const MACHINES = [
  { key: "cothas", src: "/img/machine-cothas.png", name: "Cothas", upTo: 150 },
  {
    key: "chaipoint",
    src: "/img/machine-chaipoint.png",
    name: "Chai Point",
    upTo: 200,
  },
  {
    key: "brewmax",
    /* the brief asks for machine-brewmax.png; that file was renamed to
       -clean when its retouched replacement landed, and this is it */
    src: "/img/machine-brewmax-clean.png",
    name: "Brew Max",
    upTo: Infinity,
  },
];

const machineFor = (cups: number) => {
  const i = MACHINES.findIndex((m) => cups <= m.upTo);
  return i === -1 ? MACHINES.length - 1 : i;
};

const FLASK_SRC = "/img/rig-flasks.webp";

/* ---------------------------------------------------------------
   One row of choices.

   Real radio inputs behind the chips: arrow-key navigation, a single tab
   stop for the group and correct announcement all come free, and none of it
   would if these were <button>s with aria-pressed.
   --------------------------------------------------------------- */
function Choices({
  name,
  legend,
  options,
  value,
  onPick,
  format,
}: {
  name: string;
  legend: string;
  options: number[];
  value: number;
  onPick: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <fieldset>
      {/* full cream at 1.02rem, matching the field's label. cream/70 was
          7.81:1 — legal, but the quietest thing in a row of controls, which
          is most of why this read as dull. */}
      <legend className="mb-3 font-sans text-[1.02rem] font-semibold text-cream">
        {legend}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={() => onPick(o)}
              className="peer sr-only"
            />
            {/* selected is a filled orange chip with espresso text: 5.95:1,
                where cream on orange would have been 2.97 */}
            <span className="block rounded-full border border-cream/40 px-4 py-2 font-sans text-[0.95rem] font-semibold tabular-nums text-cream/75 transition-colors duration-200 hover:border-cream/60 hover:text-cream peer-checked:border-orange peer-checked:bg-orange peer-checked:text-espresso-deep peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange">
              {format(o)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------------------------------------------------------------
   How many people. One field, no presets.

   The six chips that used to lead this row are gone. They looked like the
   question had a small set of right answers, and an office of 63 had to
   find the typing box at the end of them anyway. A single field asks the
   question once and takes any answer.

   It is a real <input type="number">, so a phone raises the numeric keypad
   and the browser's own min/max validation applies. It carries the visible
   label rather than an sr-only one, because it is now the only thing
   answering "How many people?" and a lone number box with no caption is a
   puzzle.

   WHY THERE IS A DRAFT STRING
   Holding the field's text separately from the number the sum uses is what
   lets a visitor clear the box and start again. Bound straight to `people`,
   deleting a digit would immediately snap the floor back into the field and
   they could never type "240" — they would get "10240". The draft holds
   whatever they have typed, the sum uses the clamped value of it, and on
   blur the draft is dropped so the field settles on the real number. That
   is also what makes the floor painless: type "7", the sum quietly uses 10,
   and the field corrects itself the moment you tab away.
   --------------------------------------------------------------- */
function PeopleEntry({
  value,
  onPick,
}: {
  value: number;
  onPick: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <label className="block cursor-text">
      <span className="mb-3 block font-sans text-[1.02rem] font-semibold text-cream">
        Select the number of people
      </span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* THE FOCUS RING BELONGS TO THE PILL, NOT THE INPUT.
            globals.css gives every :focus-visible element a 2px orange
            outline at 3px offset with its own 3px radius. On the input that
            drew a second rounded rectangle INSIDE the pill — a box in a box,
            and on an emptied field it was the only thing you could see. The
            input's outline is suppressed and the pill takes the ring, so
            keyboard focus is still obvious and it is one shape.

            The faint fill is the other half of "it looks dull": a bare
            outline with a number in it does not read as somewhere you type. */}
        <span className="inline-flex items-baseline gap-2 rounded-full border border-cream/45 bg-cream/[0.06] px-5 py-2 transition-colors duration-200 hover:border-cream/70 focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/45">
          <input
            type="number"
            inputMode="numeric"
            min={MIN_PEOPLE}
            max={MAX_PEOPLE}
            aria-describedby="people-floor"
            value={draft ?? String(value)}
            onChange={(e) => {
              const text = e.target.value;
              setDraft(text);
              if (text.trim() !== "") onPick(clampPeople(Number(text)));
            }}
            onBlur={() => setDraft(null)}
            className="w-[4.6rem] appearance-none border-0 bg-transparent text-right font-display text-[1.45rem] font-extrabold tabular-nums leading-none text-cream outline-none focus:outline-none focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {/* cream/70 = 8.05:1 at the worst point of the ground */}
          <span aria-hidden="true" className="whitespace-nowrap font-sans text-[0.95rem] text-cream/70">
            people
          </span>
        </span>
        {/* On the field's own row, not under it: as a block it cost the
            section 32px of height, and this section is already past a 768px
            screen. Kept short for the same reason it is inline — "Any number
            from 10 up." measured 137px, which left ONE pixel of slack in the
            column at 768 and would have wrapped or not depending on how the
            browser rounded. This leaves 66. */}
        <span
          id="people-floor"
          className="font-sans text-[0.8rem] text-cream/60"
        >
          Minimum {MIN_PEOPLE}.
        </span>
      </span>
    </label>
  );
}

/* ---------------------------------------------------------------
   One side of the sum, with its working shown.
   --------------------------------------------------------------- */
function Sum({
  label,
  best,
  image,
  lines,
  total,
}: {
  label: string;
  best: boolean;
  image: React.ReactNode;
  lines: [string, string][];
  total: number;
}) {
  /* the reference colours the cheaper total. Orange is 4.50:1 on this ground
     and the figure is 21px+ extrabold, so the 3.0 large-text bar applies. */
  const totalTone = best ? "text-orange" : "text-cream";
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-[clamp(0.9rem,2vh,1.35rem)] transition-colors duration-500 ${
        best ? "border-orange" : "border-cream/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[0.74rem] font-bold uppercase tracking-[0.14em] text-cream/85">
          {label}
        </p>
        {best && (
          <span className="shrink-0 rounded-full bg-orange px-2.5 py-1 font-sans text-[0.66rem] font-bold uppercase tracking-[0.1em] text-espresso-deep">
            Cheaper
          </span>
        )}
      </div>

      <div className="relative mt-2 h-[clamp(80px,10.5vh,126px)] w-full">
        {image}
      </div>

      {/* the working. Two columns so the operator and the amount line up down
          the card, and so the two cards line up with each other. */}
      <dl className="mt-3 border-t border-cream/12 pt-3">
        {lines.map(([a, b]) => (
          <div key={a} className="flex items-baseline justify-between gap-3 py-[0.2rem]">
            <dt className="font-sans text-[0.88rem] text-cream/70">{a}</dt>
            <dd className="font-sans text-[0.88rem] font-semibold tabular-nums text-cream/70">
              {b}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-2.5 border-t border-cream/20 pt-2.5">
        <p className={`font-display text-[clamp(1.3rem,2.2vw,1.7rem)] font-extrabold leading-none tracking-[-0.02em] ${totalTone}`}>
          <RollValue value={total} format={rupees} duration={420} />
          <span className="ml-1.5 font-sans text-[0.8rem] font-medium text-cream/60">
            a month
          </span>
        </p>
      </div>
    </div>
  );
}

export default function Machines() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.25, once: true });
  const on = inView || Boolean(reduced);

  const [people, setPeople] = useState(START_PEOPLE);
  const [rate, setRate] = useState(START_RATE);

  const cups = Math.round(people * rate);
  /* section 05 answers with this number, so it has to know it */
  useEffect(() => setOffice(people, cups), [people, cups]);

  const machineWins = cups > THRESHOLD_CUPS;
  const flaskBill = flaskCost(cups);
  const machineBill = machineCost(cups);
  const gap = flaskBill - machineBill;
  const rig = machineFor(cups);

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

  return (
    <section
      id="savings"
      ref={ref}
      className="relative flex min-h-svh flex-col [justify-content:safe_center] overflow-x-clip"
      style={{
        paddingTop: "calc(var(--header-h) + clamp(1rem, 3vh, 2rem))",
        paddingBottom: "clamp(1.5rem, 2.8vh, 2.25rem)",
        /* Deep and warm, with an amber halo where the machine stands. The
           flat cool navy this replaces (#262b35 at its lightest) sat lighter
           than the machine's own black body, so the plate read as a cut-out
           pasted on rather than a lit object standing in the scene. Worst
           case under text is #21252d, and every value is measured on it. */
        background:
          "radial-gradient(56% 44% at 84% 13%, rgba(226,132,58,0.22) 0%, rgba(132,68,28,0.11) 44%, rgba(0,0,0,0) 74%), radial-gradient(120% 100% at 76% 6%, #21252d 0%, #15181e 46%, #0b0d11 100%)",
      }}
    >
      <div aria-hidden="true" className="rig-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="shell relative z-10">
        {/* ---------------- purpose, and the machine beside it ---------------- */}
        <div className="relative">
          <motion.div {...reveal(0.05, 0)} className="flex items-center gap-4">
            {/* cream/60 = 5.61:1 on the worst ground. It was cream/45 = 3.90,
                which is below AA and part of why this section read as dull. */}
            <span className="eyebrow whitespace-nowrap text-cream/60">
              04 — Which one you need
            </span>
            <motion.span
              initial={reduced ? undefined : { scaleX: 0 }}
              animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
              className="h-px w-16 origin-left bg-cream/25 md:w-24"
            />
          </motion.div>

          {/* The percentage caps are what hold the copy clear of the machine.
              They apply from sm up only, because below that the machine is
              hidden and the text should have the whole column. */}
          <h2 className="mt-4 max-w-[30ch] font-display text-[clamp(1.9rem,3.9vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-cream sm:max-w-[min(30ch,58%)]">
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
              <motion.span {...clipLine(0.15)} className="block">
                Flasks or a{" "}
                {/* the reference puts the choice in the brand colour. It is
                    30px+ extrabold, so orange's ratio here is judged against
                    the 3.0 large-text threshold. */}
                <span className="text-orange">machine?</span>
              </motion.span>
            </span>
          </h2>

          {/* The sentence the section exists to deliver, in the position a
              reader actually reads second. */}
          <motion.p
            {...reveal(0.3)}
            className="mt-3 max-w-[34ch] font-display text-[clamp(1.15rem,1.9vw,1.55rem)] font-bold leading-[1.28] text-cream/80 sm:max-w-[min(34ch,56%)]"
          >
            Above {THRESHOLD_CUPS} cups a day, a machine costs you less.
          </motion.p>

          {/* ---------------- the machine ----------------
              ANCHORED TO THE HEADING, NOT TO THE SECTION
              It used to be a child of the <section> at top-0, which put it
              at the section's top edge — and the section is min-h-svh with
              its content vertically centred, so on a tall window the copy
              started 240px lower than the photograph and the two had nothing
              to do with each other. Worse, at the top of a scroll the sticky
              header sat over its first 78px and sliced the top off the unit.

              As a child of the heading block it is centred on the headline at
              every window size, and its own height is the only thing that has
              to be bounded.

              IT ALIGNS TO THE CONTAINER, IT DOES NOT BLEED PAST IT
              An earlier version pushed it out to the viewport's edge with
              calc((100% - 100vw) / 2). That is what kept it reading as stuck
              in the corner of the window: it sat 150px to the right of
              everything else on the page, out in the margin, aligned to
              nothing. right-0 lands its edge on the container's edge — the
              same line the right-hand card, the divider rule and the footnote
              all end on.

              The box is aspect-[3/2], the plate's own ratio (1200x800), so
              object-contain fills it exactly and the image's left edge is
              always 1.5x its height in from the right. That is what keeps the
              clearance against the headline predictable: at its widest it is
              354px against a 474px gap.

              THE HEIGHT
              min(22vh, 15vw), capped at 236. Two things bound it, both
              measured across 640–3440: the sticky header above (it must not
              start under it) and the divider rule below (the tray must not
              cross it). The rule binds almost everywhere and caps it at 236;
              15vw is what stops a tall narrow window inflating it. */}
          <motion.div
            aria-hidden="true"
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
            className="pointer-events-none absolute right-0 top-1/2 hidden aspect-[3/2] h-[clamp(150px,min(22vh,15vw),236px)] -translate-y-1/2 sm:block"
          >
            <Image
              src="/img/section4-machine.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 34vw, 26vw"
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* ---------------- the two questions ---------------- */}
        <motion.div
          {...reveal(0.45)}
          className="mt-[clamp(1.25rem,2.8vh,2rem)] grid gap-x-10 gap-y-5 border-t border-cream/15 pt-[clamp(1rem,2.4vh,1.6rem)] md:grid-cols-2"
        >
          <PeopleEntry value={people} onPick={setPeople} />
          <Choices
            name="rate"
            legend="How many cups does each drink a day?"
            options={RATES}
            value={rate}
            onPick={setRate}
            format={(v) => (v === 1 ? "1 cup" : `${v} cups`)}
          />
        </motion.div>

        {/* ---------------- what that comes to ---------------- */}
        <motion.div
          {...reveal(0.6)}
          className="mt-[clamp(1rem,2.4vh,1.5rem)] flex flex-wrap items-center gap-x-4 gap-y-3"
        >
          <p className="font-sans text-[clamp(1rem,1.3vw,1.15rem)] text-cream/75">
            {int0(people)} people &times; {rate} {rate === 1 ? "cup" : "cups"}{" "}
            ={" "}
            <span className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-none tracking-[-0.02em] text-cream">
              <RollValue value={cups} format={int0} duration={320} />
            </span>{" "}
            cups a day
          </p>

          {/* the rule, restated against the visitor's own number */}
          <span
            className={`rounded-full px-3 py-1.5 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] transition-colors duration-500 ${
              machineWins
                ? "bg-orange text-espresso-deep"
                : "border border-cream/40 text-cream/80"
            }`}
          >
            {machineWins ? "Above" : "Under"} the {THRESHOLD_CUPS}-cup line
          </span>
        </motion.div>

        {/* ---------------- the sum, both sides ---------------- */}
        <motion.div
          {...reveal(0.75)}
          className="mt-[clamp(0.85rem,2vh,1.4rem)] grid gap-4 md:grid-cols-2 md:gap-5"
        >
          <Sum
            label="Flasks"
            best={!machineWins}
            total={flaskBill}
            image={
              <Image
                src={FLASK_SRC}
                alt="Hotcups flasks"
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-contain"
              />
            }
            /* two addends and a total, so the rows visibly sum to the figure
               under them. An earlier draft put the running subtotal on row 2,
               which made it identical to the total and read as a mistake. */
            lines={[
              [
                `${int0(cups)} cups × ${rupees(FLASK_RATE)} × ${WORKING_DAYS} days`,
                rupees(flaskBill),
              ],
              ["No machine charge", rupees(0)],
            ]}
          />

          <Sum
            label={`Machine · ${MACHINES[rig].name}`}
            best={machineWins}
            total={machineBill}
            image={
              <>
                {/* Matte black cut-outs need a little light behind them or
                    they disappear into a dark ground. Sized off the image
                    BOX, not the card — as a percentage of the CARD it became
                    a pale ellipse several times the size of the machine
                    standing in it the moment the card got wider. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-[58%] aspect-[1.7/1] h-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(255,247,240,0.15), rgba(255,247,240,0))",
                  }}
                />
                {MACHINES.map((m, i) => (
                  <motion.span
                    key={m.key}
                    className="absolute inset-0 block"
                    initial={false}
                    animate={{
                      opacity: rig === i ? 1 : 0,
                      scale: rig === i ? 1 : 0.94,
                    }}
                    transition={
                      reduced ? { duration: 0 } : { duration: 0.5, ease: EASE }
                    }
                  >
                    <Image
                      src={m.src}
                      alt={m.name}
                      fill
                      sizes="(max-width: 768px) 90vw, 420px"
                      className="object-contain"
                    />
                  </motion.span>
                ))}
              </>
            }
            /* "Machine on site", NOT "Machine, rented". The client has never
               told us whether the fixed monthly figure is rent, a minimum
               bill or an instalment, and the earlier label asserted one of
               the three. See the banner at the top of this file. */
            lines={[
              [
                `${int0(cups)} cups × ${rupees(MACHINE_RATE)} × ${WORKING_DAYS} days`,
                rupees(perMonth(cups) * MACHINE_RATE),
              ],
              ["Machine on site", rupees(MACHINE_FIXED)],
            ]}
          />
        </motion.div>

        {/* ---------------- the answer ----------------
            The closing row that used to sit under this ("Sized, installed and
            serviced by us." on its own line with the link) is gone: the
            section is min-h-svh and the machine photo plus the deeper cards
            pushed it past one screen, which is the overlap that had to go.
            The link survives on the footnote's row, where it costs no height,
            and the reference does not show that line at all. */}
        <motion.div
          {...reveal(0.9)}
          className="mt-[clamp(0.9rem,2.2vh,1.4rem)] flex items-start gap-4"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-orange/60 text-orange sm:grid"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17l6-6 4 4 7-7" />
              <path d="M14 8h6v6" />
            </svg>
          </span>

          <div className="min-w-0">
            <p className="font-sans text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.4] text-cream">
              {machineWins ? (
                <>
                  A machine saves you{" "}
                  <span className="font-display text-[clamp(1.4rem,2.2vw,1.85rem)] font-extrabold text-orange">
                    <RollValue value={gap} format={rupees} duration={420} />
                  </span>{" "}
                  a month.
                </>
              ) : (
                <>
                  <strong className="font-semibold">Stay on flasks.</strong> A
                  machine wouldn&rsquo;t pay for itself at {int0(cups)} cups a
                  day.
                </>
              )}
            </p>

            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              {/* Says "indicative", because it is. Until the client confirms
                  the rates this sum is a worked example of the 40-cup rule,
                  not a price — and the page must not imply otherwise. */}
              <p className="max-w-[82ch] font-sans text-[0.85rem] leading-[1.5] text-cream/60">
                *Indicative, not a quote. Blended rates across the menu — your
                price depends on what your team drinks.
              </p>
              <a
                href="#machines"
                className="hero-btn group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-full border border-cream/40 px-5 py-2.5 font-sans text-[0.9rem] font-semibold text-cream transition-colors duration-300 hover:border-orange"
              >
                <span className="relative z-10">See the machines</span>
                <span
                  aria-hidden="true"
                  className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
