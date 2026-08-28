"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import RollValue from "@/components/ui/RollValue";
import { setOffice } from "@/lib/office";

/**
 * Section 05 — Which one you need.
 *
 * THE PURPOSE IS THE SECOND LINE ON SCREEN
 * "Above 50 cups a day, a machine is the better fit." It used to sit in a
 * side column at 65% opacity, which is where a reader's eye goes last. It is
 * now directly under the heading, at full size, because it is the one
 * sentence the section exists to deliver.
 *
 * THERE IS NO LONGER ANY MONEY IN THIS SECTION, AND THAT IS THE CLIENT'S CALL.
 * It used to be a cost calculator: a per-cup flask rate, a per-cup machine
 * rate, a fixed monthly machine charge, two monthly bills and the difference
 * between them. Every one of those rupees was INVENTED here — the banner that
 * stood where this paragraph is said so in capitals, and listed four things to
 * get from the client before publishing. The fourth was "confirmation that the
 * threshold is a COST crossover at all — it may well be an OPERATIONAL rule
 * instead", and the answer came back operational: above the line you want a
 * machine, and machines are rented or sold rather than billed per cup.
 *
 * So the arithmetic is gone rather than corrected. What is left is the one
 * fact the client has actually given us — the line — and what each option IS
 * on either side of it. A section that argued a saving it could not evidence
 * was the single biggest publishing risk on this page.
 *
 * WHAT THE CARDS DO INSTEAD
 * They show the two options rather than describing them: a name, a badge and
 * a photograph nearly twice the height it was, because the differences that
 * briefly stood under each one were the kind of thing a picture says faster.
 * "Rent it or buy it" — the one genuinely new fact — moved to the footnote
 * under the verdict, where it reads as a term rather than a feature.
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
 * The rate runs 1 to 5 at the client's direction. It stopped at 3 on the
 * reasoning that nobody says a fourth number out loud about their own desk,
 * which is true of an office and not true of a factory floor or a hospital
 * through a night shift — and both are on this site's own industries list.
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
 * Open it and it says stay on flasks, because 10 people at 2 cups is 20 a day
 * and that is under the line. The section has to be willing to say "you do not
 * need the bigger thing" or the line is a threshold we assert rather than one
 * the visitor checked.
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
   THE PRICING IS GONE. THIS IS WHAT WAS HERE AND WHY IT LEFT.
   ===============================================================

   A banner stood here in capitals reading PLACEHOLDER PRICING —
   INVENTED, NOT CLIENT DATA — DO NOT PUBLISH UNTIL CONFIRMED. It
   carried a flask rate of ₹8 a cup, a machine rate of ₹5 a cup and a
   fixed monthly machine charge, none of them supplied by the client:
   the fixed charge was not even a price, it was SOLVED FOR so that the
   two monthly bills would cross at exactly the threshold.

   That banner listed four questions to put to the client. The fourth
   was whether the threshold is a COST crossover at all, or an
   OPERATIONAL rule — above the line flasks stop being practical, too
   many trips, tea arrives cold — which would have nothing to do with
   rupees. The answer is operational, and machines are RENTED OR SOLD
   rather than billed by the cup.

   So the money came out rather than being corrected, which is what the
   old banner said should happen in exactly this case. Every rate, the
   working-day count, the two monthly totals, the difference between
   them and the "indicative, not a quote" disclaimer went with it.

   IF A REAL PRICE EVER ARRIVES it does not belong back in here. This
   section answers one question — flasks or a machine — and it now does
   that on volume alone. A price is a different question and section 08
   is where it is asked.
   =============================================================== */

/** the rule the whole section is built on — the one confirmed fact.
    It was 40 and the client has since moved it to 50. Everything that
    reads as a threshold on screen derives from this constant, so the
    headline, the pill, the slider mark, the slider's own non-linear
    mapping and the aria label all followed it without being touched. */
const THRESHOLD_CUPS = 50;

/* ---------------------------------------------------------------
   THE TRACK'S SCALE, AND WHY IT IS NOT LINEAR.

   It ran 0 to 80 cups — twice the threshold, so the line landed on the exact
   midpoint. That was tidy and it was broken: the steppers reach 5,000 people,
   so anything past 80 cups pinned the handle against the right end and left
   it there. Eighty people at a cup each and the control was dead. Two hundred
   and it was dead AND lying, because `value` was clamped to the ceiling while
   the readout directly above it said 200.

   A LINEAR TRACK CANNOT FIX THAT. Stretch it to the real ceiling and the
   40-cup line lands at 0.6% of the width — the entire argument of the section
   compressed into six pixels at the left edge.

   So the scale is two legs joined at the line:

     0 .. LINE_AT      minCups -> 50 cups   LINEAR
     LINE_AT .. 1      50 cups -> maxCups   LOGARITHMIC

   which buys three things. The 50-cup mark sits at the SAME place on the
   track whatever the rate — it is a fixed landmark now, not a number that
   slides about when you change cups-per-head. A third of the track is spent
   on the handful of cups where the answer actually changes. And the far end
   reaches the steppers' own ceiling, so the control can no longer run out
   before they do.

   AT THE TOP RATE THE LOW LEG HAS NOTHING TO SPAN, AND IT GOES FLAT.
   5 cups a head times the 10-person floor is 50 — the line exactly. So the
   linear leg would run from 50 to 50, and the guard it used to carry (a span
   clamped to 1 cup) put 50 cups at 0% and 55 at 34%: one click of the
   headcount threw the handle a third of the track. It is a SHELF instead.
   The first third parks at the floor, 50 cups sits on its own mark, and the
   crossing stays exactly where the label says it is at every rate.

   The compression above the line is the honest shape, not a compromise: 200
   cups and 300 cups are different numbers but the same ANSWER, and the
   distance between them should say so. */
const LINE_AT = 0.33;
/** the range input carries a POSITION, 0..POS_STEPS — see the note there */
const POS_STEPS = 1000;

/** One cup is a token appearance; five is a factory floor or a hospital
    through a night shift. Whole cups only — 1.5 was a blended average nobody
    would ever say out loud about their own desk.

    THE CEILING IS LOAD-BEARING: MIN_PEOPLE * MAX_RATE must not EXCEED
    THRESHOLD_CUPS, or the slider's low leg inverts. At 10 x 5 it lands on it
    exactly, which the shelf at LINE_AT handles; raise either bound past that
    and read that note first. */
const MIN_RATE = 1;
const MAX_RATE = 5;

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
    line, so the section's opening verdict is "stay on flasks". */
const START_PEOPLE = MIN_PEOPLE;
const START_RATE = 2;


const int0 = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.round(n));

/**
 * The machine that actually fits, by volume — the same three units, names and
 * capacities as section 05, so the two sections cannot disagree about what a
 * given office gets.
 *
 * THE CEILINGS ARE THE CLIENT'S NOW, not the guesses they were: under 100,
 * 100-200 and 200-500 a day. Section 06 PRINTS those three bands on its
 * cards, so a change here has to be made there too — these upTo values are
 * the top of each band.
 *
 * The set before this capped Cothas at 50, which was exactly the line this
 * section starts recommending a machine at, so the smallest unit could never
 * be the answer here. At 100 it covers 51-100, which is the commonest office
 * that crosses the line at all. Brew Max caps at 500 rather than the Infinity
 * it once carried, so machineFor's -1 fallback is what names it above that.
 */
const MACHINES = [
  { key: "cothas", src: "/img/machine-cothas.png", name: "Cothas", upTo: 100 },
  {
    key: "tata",
    /* the photograph is a CHACONY-branded unit — see the note in
       MachineRow.tsx. It stood under "Chai Point" before this and was not
       that either. */
    src: "/img/machine-chaipoint.png",
    name: "Tata's",
    upTo: 200,
  },
  {
    key: "brewmax",
    /* the brief asks for machine-brewmax.png; that file was renamed to
       -clean when its retouched replacement landed, and this is it */
    src: "/img/machine-brewmax-clean.png",
    name: "Brew Max",
    upTo: 500,
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
/* ---------------------------------------------------------------
   Both questions are a stepper AND a field. Not one or the other.

   The history here is a loop: a typed box, then six preset chips, then the
   box beside the chips, then chips only, then steppers only. Each pass fixed
   the previous one's complaint and reintroduced the one before it. They were
   never in competition, which is exactly why swapping kept failing:

     a stepper is right for ADJUSTING — nudge to 55, watch the answer move,
     nudge back. Typing 55 to do that is absurd.
     a field is right for ARRIVING — an office of 240 should not press + for
     twenty seconds, or hunt for a preset that happens to be near.

   So the pill is [ − ][ editable number ][ + ] and both drive one value. The
   buttons still scale their step (single people up to fifty, then fives,
   twenty-fives, hundreds) and still repeat when held; that is what makes
   ADJUSTING at 3000 as quick as adjusting at 30.

   TYPING COMMITS AS YOU GO, BUT ONLY WHEN IT IS IN RANGE.
   The draft is a string of its own, separate from the number the rest of the
   page reads. Every keystroke that parses INSIDE the bounds commits at once,
   so the sum moves as you type. One that does not — the "2" on the way to
   "240", which is under the floor of ten — is held in the field and not
   published, because a section that flashed "stay on flasks" at every
   half-typed number would be worse than one that waited a keystroke. Blur
   clamps whatever is left and commits it, so the field can never be left
   showing a number the rest of the section disagrees with.

   Commas appear only when the field is NOT focused. "5,000" is right to read
   and hostile to edit, so the raw digits are what you get while you are in it.

   ARROWS GO THROUGH THE STEP, NOT THROUGH THE BROWSER.
   Up and Down do nothing on a text field by default, and on a number field
   they would move by one — which disagrees with the buttons an inch away at
   every value above fifty. Both are intercepted and routed to onStep, so
   there is exactly one idea of what "next" means.

   type="text" with inputMode="numeric", not type="number": a number input
   reports an empty string for anything it considers invalid mid-edit, which
   makes a controlled draft unreliable, and its spinners would be a third
   control sitting between the two we drew ourselves.

   The button outline is cream/50 rather than the /35 it started at. Inside
   the pill's own cream/6 fill that measured 2.53:1 against a 3.0 floor for
   anything you are meant to identify as a control; /50 is 3.56. The break-
   even is 0.425, so /45 would have passed by 0.18 and /50 leaves room for
   the ground to be a shade lighter than the worst point measured.
   --------------------------------------------------------------- */
function Stepper({
  legend,
  value,
  unit,
  min,
  max,
  onStep,
  onSet,
  hint,
}: {
  legend: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onStep: (dir: number) => void;
  /** a number typed straight in; the caller clamps it to its own bounds */
  onSet: (n: number) => void;
  hint?: string;
}) {
  const id = useId();
  const hold = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const stop = useCallback(() => {
    if (hold.current !== null) {
      window.clearTimeout(hold.current);
      hold.current = null;
    }
  }, []);
  /* a pointer released outside the button, or the component unmounting
     mid-press, must not leave a timer counting */
  useEffect(() => stop, [stop]);

  const begin = (dir: number) => {
    onStep(dir);
    let wait = 400;
    const tick = () => {
      onStep(dir);
      wait = Math.max(40, wait * 0.8);
      hold.current = window.setTimeout(tick, wait);
    };
    hold.current = window.setTimeout(tick, wait);
  };

  const button = (dir: -1 | 1, disabled: boolean, label: string) => (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        begin(dir);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      /* the keyboard never reaches onPointerDown, so Enter and Space get
         their own single step rather than nothing at all */
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStep(dir);
        }
      }}
      className={`grid w-[3.25rem] shrink-0 place-items-center text-cream outline-none transition-colors duration-200 hover:bg-orange hover:text-espresso-deep focus-visible:bg-orange focus-visible:text-espresso-deep disabled:cursor-not-allowed disabled:bg-transparent disabled:text-cream/25 ${
        dir === 1 ? "border-l border-cream/20" : "border-r border-cream/20"
      }`}
    >
      {/* drawn, not typed. A text "+" and "−" are two different glyphs at two
          different optical weights and neither sits on the pill's centre line
          — the minus rides high and the plus reads lighter. Two strokes of
          the same width, centred in the same box, are the same mark twice. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[1.15rem] w-[1.15rem]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      >
        <path d="M5 12h14" />
        {dir === 1 && <path d="M12 5v14" />}
      </svg>
    </button>
  );

  /* raw digits while editing, grouped when at rest — see the note above */
  const shown = focused ? draft : int0(value);

  return (
    <div>
      <p
        id={id}
        className="mb-3 font-sans text-[1.02rem] font-semibold text-cream"
      >
        {legend}
      </p>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* ONE SHAPE, THREE SEGMENTS. It was a pill with a circular button
            sitting inside each end — a box inside a box, and the round
            buttons were small targets besides. The buttons are the ends of
            the pill now, divided by hairlines: no nesting, a 52px hit area
            each, and the hover fill reaches the rounded edge because the pill
            clips it.

            THE FOCUS RING IS ON THE PILL, NOT THE PARTS. overflow-hidden
            would have clipped the global focus outline to a flat edge on
            whichever side it fired. Each part announces focus its own way —
            the buttons fill amber, the field takes a caret — and the pill
            carries the ring for all three. */}
        <span
          role="group"
          aria-labelledby={id}
          className="inline-flex items-stretch overflow-hidden rounded-full border border-cream/45 bg-cream/[0.06] transition-colors duration-200 focus-within:border-orange focus-within:ring-2 focus-within:ring-orange/45"
        >
          {button(-1, value <= min, `Fewer ${unit}`)}
          <span className="flex min-w-[8.5rem] items-baseline justify-center gap-1.5 px-3 py-[0.7rem]">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-labelledby={id}
              value={shown}
              /* sized to its own digits so the number and its unit read as
                 one word rather than a figure adrift in a fixed box; the
                 pill's min-width is what stops the control resizing as you
                 type */
              /* floor of 2, not 1: clearing the field leaves `shown` empty
                 and a 1ch box is a caret with nothing to sit in */
              style={{ width: `${Math.max(2, shown.length)}ch` }}
              onFocus={(e) => {
                const el = e.currentTarget;
                setFocused(true);
                setDraft(String(value));
                /* after the value swaps to the raw draft, not before */
                requestAnimationFrame(() => el.select());
              }}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 5);
                setDraft(d);
                const n = Number(d);
                if (d !== "" && n >= min && n <= max) onSet(n);
              }}
              onBlur={() => {
                setFocused(false);
                if (draft !== "") onSet(Number(draft));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  onStep(1);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  onStep(-1);
                }
              }}
              className="stepper-field bg-transparent text-center font-display text-[1.45rem] font-extrabold tabular-nums leading-none text-cream outline-none"
            />
            <span className="font-sans text-[0.95rem] font-medium text-cream/70">
              {unit}
            </span>
          </span>
          {button(1, value >= max, `More ${unit}`)}
        </span>
        {hint && (
          <span className="font-sans text-[0.8rem] text-cream/60">{hint}</span>
        )}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   One side of the answer — a name, a badge and a photograph.

   IT HAS BEEN EMPTIED TWICE, AND THE PICTURE GOT BOTH ROOMS.
   It began as one side of a SUM: two addends, a rule, a monthly total. The
   money went first, replaced by three plain differences. Those have gone too,
   because with the figures already out the card's job is to SHOW the two
   options rather than describe them — and a 95px photograph of a machine
   shows almost nothing.

   The picture is now the card. Its box went from clamp(80px, 10.5vh, 126px)
   to clamp(140px, 22vh, 230px), which is deliberately close to the height the
   list vacated plus the height the picture already had: about 207px at a
   900px window against the old 234px of card, so the two cards keep their
   proportions and the section stays inside its min-h-svh.

   Nothing was lost that the page does not still say. "Rent it or buy it" is
   in the footnote under the verdict, the twice-a-day round is the hero's own
   promise, and "sized, installed and serviced" is what the See the machines
   link goes to.

   Every behaviour survived both emptyings, because none of them were ever
   about the content: the winner still lifts on an underdamped spring, the
   badge still flies across the gutter on a shared layoutId, and the shine
   still crosses the image on a genuine crossing.
   --------------------------------------------------------------- */
function Sum({
  label,
  best,
  cross,
  image,
}: {
  label: string;
  best: boolean;
  /** how many times the answer has changed sides. 0 = it never has, so the
      one-shot crossover animations below must not fire on first paint. Every
      later increment restarts them, which is why they are KEYED on it: motion
      will not re-run a keyframe whose values it has already played, and the
      values are identical every crossing. Remounting is the restart. */
  cross: number;
  image: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    /* THE WINNER LIFTS. It used to be a border colour and nothing else, which
       is a change you can only notice by comparing the two cards deliberately
       — and the whole point of this section is that the answer changes as you
       type. Fourteen pixels of rise on an underdamped spring, so it
       overshoots and settles; an amber ring and a faint amber ground do the
       rest. The overshoot is the part you catch peripherally.

       IT LIFTS BUT IT DOES NOT SCALE, and that is deliberate on two counts,
       both of which cost more than the extra emphasis was worth. The working
       is 14px type, and a 2% scale spring rasterises small type soft for the
       length of the spring. And the Cheaper badge is a layoutId child in
       flight between the two cards — an ancestor mid-scale is the exact case
       that makes a shared-layout flight wobble. The flare further down
       carries the emphasis instead, and it touches no text at all.

       The loser is NOT dimmed. Fading it would have been the obvious move and
       it takes its type down with it: the working is set in cream/70, which
       is 8.05:1 here and would land near 5.4 behind an opacity of 0.72. The
       losing card keeps every value at full strength and simply stops being
       the one that is raised. */
    <motion.div
      animate={reduced ? undefined : { y: best ? -14 : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="relative isolate rounded-[var(--radius-card)] border border-cream/30 p-[clamp(0.9rem,2vh,1.35rem)]"
    >
      {/* THE ANSWER IS ONE PANEL, AND IT SLIDES.
          Both cards used to carry their own winning styles and `best` decided
          which set was applied — so crossing the line was two colour changes
          happening at once in two different places, which is precisely the
          transition that could not be seen. There is ONE amber panel now,
          shared between the cards by layoutId, and motion tweens it across
          the gutter: the highlight physically leaves flasks and arrives at
          the machine. That is the movement the section was missing.

          -inset-px, not inset-0. An absolutely positioned child is placed
          against its parent's PADDING box, so inset-0 would have drawn a
          second ring just inside the card's own border and read as a double
          outline. One pixel out lands it exactly on the border box. */}
      {best && (
        <motion.span
          layoutId="winner-panel"
          aria-hidden="true"
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 260, damping: 30 }
          }
          className="absolute -inset-px -z-10 rounded-[var(--radius-card)] border border-orange bg-orange/[0.07] shadow-[0_0_0_1px_rgba(242,101,34,0.35),0_18px_44px_-22px_rgba(242,101,34,0.8)]"
        />
      )}

      {/* THE CROSSING IS AN EVENT, NOT JUST A NEW STATE.
          Everything else here is CONTINUOUS — the panel slides, the badge
          flies, the winner rises. All of it is smooth, and smooth is exactly
          why the moment could be missed: drag through 40 and the highlight
          simply glides over, with nothing marking that a line was crossed.
          This is the marker. A ring leaves the card's edge and fades, so the
          card the answer just ARRIVED at visibly reacts.

          It sits OUTSIDE the border box and behind the content on purpose.
          Anything washing across the card would sit behind the working, and
          the working is cream/70 on a two-layer gradient — the file's whole
          contrast budget is built on that number holding. A ring expanding
          into empty space costs it nothing. */}
      {best && !reduced && cross > 0 && (
        <motion.span
          key={`flare-${cross}`}
          aria-hidden="true"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.055 }}
          transition={{ duration: 0.75, ease: EASE }}
          className="pointer-events-none absolute -inset-px -z-10 rounded-[var(--radius-card)]"
          style={{
            boxShadow:
              "0 0 0 2px rgba(242,101,34,0.9), 0 0 46px 8px rgba(242,101,34,0.5)",
          }}
        />
      )}
      <div className="flex min-h-[1.9rem] items-start justify-between gap-3">
        {/* THE NAME OF THE THING, AND IT IS NOT A CAPTION ANY MORE.
            0.74rem was sized as a card eyebrow, back when the card also
            carried a monthly total to be the loudest thing on it. The money
            went, then the bullet list went, and the label was left as the
            only words on a card that is otherwise a photograph — at eleven
            pixels, next to a machine nobody can name by sight.

            clamp(0.85rem, 1.5vw, 1.05rem): 16.8px at a 1236px window against
            the 11.8px it was. "MACHINE · TATA'S" is 16 characters, about
            195px with its tracking, against roughly 405px of room once the
            Recommended badge and the gap are out of the way — and it still
            clears the ~188px a single-column phone card leaves, so it cannot
            wrap into the badge. */}
        <p className="font-sans text-[clamp(0.85rem,1.5vw,1.05rem)] font-bold uppercase tracking-[0.14em] text-cream/85">
          {label}
        </p>
        {/* ONE BADGE, TWO POSSIBLE HOMES.
            layoutId is what makes it TRAVEL. Rendering a separate badge in
            each card and toggling `best` mounted one and unmounted the other
            in the same frame — the label simply blinked from the left card to
            the right one, which is exactly the transition that could not be
            felt. With a shared layoutId motion keeps it as one element and
            tweens it across the gap, so the answer visibly moves from flasks
            to the machine. Neither card clips, so the flight is not cut off
            crossing the gutter between them. */}
        {best && (
          <motion.span
            layoutId="fit-badge"
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 340, damping: 30 }
            }
            className="shrink-0 rounded-full bg-orange px-2.5 py-1 font-sans text-[0.66rem] font-bold uppercase tracking-[0.1em] text-espresso-deep"
          >
            Recommended
          </motion.span>
        )}
      </div>

      <div className="relative mt-3 h-[clamp(140px,22vh,230px)] w-full">
        {image}
        {/* and a highlight travels across the thing itself. Confined to the
            IMAGE box, which is the one region of the card where a cream wash
            has no text under it to darken — the clip is on this layer alone
            rather than on the box, because the machine's halo deliberately
            overflows it and the card must not clip either (the badge flies
            across the gutter between the two). */}
        {best && !reduced && cross > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <motion.span
              key={`shine-${cross}`}
              initial={{ x: "-160%", skewX: -12 }}
              animate={{ x: "160%", skewX: -12 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 block w-1/2"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,247,240,0) 0%, rgba(255,247,240,0.3) 50%, rgba(255,247,240,0) 100%)",
              }}
            />
          </span>
        )}
      </div>

    </motion.div>
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

  /* HOW MANY TIMES THE ANSWER HAS CHANGED SIDES.
     The crossover animations are one-shots and they must fire on the CHANGE,
     not on the state — otherwise every card that happens to be winning would
     flare on arrival in the viewport, and the section would announce a
     crossing that never happened. The ref is seeded with the value it has at
     mount, so the first effect run finds them equal and nothing fires until
     the visitor actually pushes the number over the line themselves. */
  const [cross, setCross] = useState(0);
  const wasWinning = useRef(machineWins);
  useEffect(() => {
    if (wasWinning.current !== machineWins) {
      wasWinning.current = machineWins;
      setCross((n) => n + 1);
    }
  }, [machineWins]);

  /* THE TRACK'S TWO ENDS, IN CUPS. Both move with the rate, because both are
     the steppers' own bounds seen through it — ten people is 10, 20 or 30
     cups, five thousand is 5,000, 10,000 or 15,000. Deriving them from the
     steppers rather than picking a number is the whole fix: the two controls
     can no longer disagree about where the end of the range is. */
  const minCups = MIN_PEOPLE * rate;
  const maxCups = MAX_PEOPLE * rate;

  /* position <-> cups, across the two legs described at LINE_AT.

     THE LOW LEG CAN HAVE NOTHING TO SPAN, AND AT 5 CUPS A HEAD IT DOES.
     The floor is MIN_PEOPLE * rate, so it rises with the rate and at the top
     rate it reaches the threshold itself: 10 x 5 = 50. The leg would run from
     50 to 50. The old guard clamped that span to 1 cup, which is arithmetically
     safe and behaviourally wrong — it mapped the whole first third to 50..51,
     so cupsToPos put 50 at 0% and the next reachable number, 55, at 34%, and
     one click of the headcount threw the handle a third of the track.

     flatLow turns the leg into a SHELF: the first third reads as the floor and
     the floor sits on the mark, so the handle moves continuously and the 50-cup
     label still points at where the answer actually flips. It also covers a
     floor ABOVE the threshold, which no bound reaches today. */
  const lowSpan = THRESHOLD_CUPS - minCups;
  const flatLow = lowSpan <= 0;
  const highRatio = Math.max(1.0001, maxCups / THRESHOLD_CUPS);

  const posToCups = (p: number) =>
    p <= LINE_AT
      ? flatLow
        ? minCups
        : minCups + lowSpan * (p / LINE_AT)
      : THRESHOLD_CUPS * Math.pow(highRatio, (p - LINE_AT) / (1 - LINE_AT));

  const cupsToPos = (c: number) => {
    const p =
      c <= THRESHOLD_CUPS
        ? flatLow
          ? LINE_AT
          : ((c - minCups) / lowSpan) * LINE_AT
        : LINE_AT +
          (1 - LINE_AT) * (Math.log(c / THRESHOLD_CUPS) / Math.log(highRatio));
    return Math.min(1, Math.max(0, p));
  };

  /* A native range thumb travels between thumbW/2 and trackW - thumbW/2,
     but a linear-gradient fill is measured across the WHOLE track — so the
     two only agree at the midpoint. At the top of the range the orange ran
     twelve pixels PAST the handle, which is the overshoot you could see. The
     40-cup mark had the same error and it mattered more: the mark and the
     handle disagreed about where the line was, so the colour flipped before
     the thumb reached it.

     Both are expressed against the thumb's own travel instead. 12px is half
     of the 24px handle in globals.css; the two numbers have to move
     together. */
  const THUMB = 24;
  const along = (frac: number) =>
    `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${frac.toFixed(4)})`;
  const fillAt = cupsToPos(cups);

  /* dragging the line sets the headcount, since people is the value the rest
     of the page (and section 05) reads. Rounding to whole people is what
     stops a drag printing a headcount nobody could have. */
  const onCups = (next: number) =>
    setPeople(clampPeople(Math.round(next / rate)));

  /* see the note on Stepper: the step scales so the 5000 ceiling stays
     reachable now that there is no box to type it into. It is a named
     function because the slider's PageUp/PageDown borrow it. */
  const stepSize = (v: number) =>
    v < 50 ? 1 : v < 200 ? 5 : v < 1000 ? 25 : 100;
  const stepPeople = (dir: number) =>
    setPeople((v) => clampPeople(v + dir * stepSize(v)));
  const stepRate = (dir: number) =>
    setRate((v) => Math.min(MAX_RATE, Math.max(MIN_RATE, v + dir)));
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
              05 — Which one you need
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
            Above {THRESHOLD_CUPS} cups a day, a machine is the better fit.
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
          <Stepper
            legend="How many people?"
            value={people}
            unit="people"
            min={MIN_PEOPLE}
            max={MAX_PEOPLE}
            onStep={stepPeople}
            onSet={(n) => setPeople(clampPeople(n))}
            hint={`Minimum ${MIN_PEOPLE}. Type it, or hold to go faster.`}
          />
          <Stepper
            legend="How many cups does each drink a day?"
            value={rate}
            unit={rate === 1 ? "cup" : "cups"}
            min={MIN_RATE}
            max={MAX_RATE}
            onStep={stepRate}
            onSet={(n) =>
              setRate(Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(n))))
            }
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

          {/* the rule, restated against the visitor's own number — and it
              POPS when the answer changes sides. It used to cross-fade its
              colours over half a second, which is a change slow enough to
              miss while your eye is on the handle you are dragging. The
              spring is deliberately underdamped so it overshoots: the
              overshoot is the part you catch peripherally. */}
          <motion.span
            key={`pill-${cross}`}
            initial={cross === 0 || reduced ? false : { scale: 0.78 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 560, damping: 14 }}
            /* WHITE TYPE, WHICH IS WHY THE FILL WENT DOWN A STEP.
               It was espresso-deep on flat orange: 5.94:1, legal. Cream on
               that same orange measures 2.98:1 (pure white only reaches
               3.15:1), and at 0.7rem this is normal
               text owing 4.5 — so keeping the fill would have been a knowing
               failure at eleven pixels. orange-deep is the token that exists
               for exactly this (see globals.css) and cream on it is 5.18:1.
               It also settles the two states: both read light-on-dark now,
               where before the pill inverted as it crossed. */
            className={`rounded-full px-3 py-1.5 font-sans text-[0.7rem] font-bold uppercase tracking-[0.12em] transition-colors duration-500 ${
              machineWins
                ? "bg-orange-deep text-cream"
                : "border border-cream/40 text-cream/80"
            }`}
          >
            {machineWins ? "Above" : "Under"} the {THRESHOLD_CUPS}-cup line
          </motion.span>
        </motion.div>

        {/* ---------------- the line, and you can drag it ----------------
            This started as a read-only bar. It is the control now, because a
            rule you can only READ about is a rule nobody tests — and the whole
            argument of this section is that the answer flips somewhere. You
            have to be able to push it over the edge yourself.

            A native range input, not a div with pointer handlers: dragging,
            arrow keys, Home/End, touch and screen readers all come free and
            correct, and none of them would have come free from a rebuild. It
            is the same .calc-range the size slider used, which had been left
            styled in globals.css with nothing calling it.

            IT DRIVES CUPS, AND CUPS DRIVE PEOPLE
            The rule is written in cups, so the axis is cups — and it is NAMED
            at the left end of the scale now, because "drag to try it" never
            said what was being dragged. People is derived back out of it, so
            the handle and the left-hand stepper always move together.

            THE INPUT'S OWN VALUE IS A POSITION, NOT A COUNT
            A native range positions its thumb linearly in value space, so a
            non-linear scale cannot be expressed in cups — the input carries
            0..POS_STEPS notches and the mapping does the rest.

            One consequence has to be handled by hand. An arrow key would
            otherwise move a thousandth of the track, which down at the floor
            is a third of a cup and rounds to no change at all — the key would
            look broken. Arrows, Page keys and Home/End are intercepted and
            step PEOPLE instead, on the same scaling step as the buttons, so
            the keyboard gets the same control the pointer has. */}
        <motion.div
          {...reveal(0.68)}
          className="mt-[clamp(0.5rem,1.4vh,0.9rem)] max-w-[46rem]"
        >
          <div className="relative">
            <input
              type="range"
              className="calc-range block"
              min={0}
              max={POS_STEPS}
              step={1}
              value={Math.round(fillAt * POS_STEPS)}
              onChange={(e) =>
                onCups(posToCups(Number(e.target.value) / POS_STEPS))
              }
              onKeyDown={(e) => {
                const k = e.key;
                if (k === "ArrowRight" || k === "ArrowUp") stepPeople(1);
                else if (k === "ArrowLeft" || k === "ArrowDown") stepPeople(-1);
                else if (k === "PageUp")
                  setPeople((v) => clampPeople(v + stepSize(v) * 10));
                else if (k === "PageDown")
                  setPeople((v) => clampPeople(v - stepSize(v) * 10));
                else if (k === "Home") setPeople(MIN_PEOPLE);
                else if (k === "End") setPeople(MAX_PEOPLE);
                else return;
                e.preventDefault();
              }}
              aria-label="Cups a day"
              aria-valuetext={`${int0(cups)} cups a day, ${
                machineWins ? "above" : "under"
              } the ${THRESHOLD_CUPS}-cup line`}
              style={
                {
                  "--fill": along(fillAt),
                  "--fill-col": machineWins
                    ? "var(--color-orange)"
                    : "rgba(255,247,240,0.7)",
                } as React.CSSProperties
              }
            />
            {/* the line itself, over the track and out of the way of the
                pointer so it can never swallow a drag */}
            <motion.span
              aria-hidden="true"
              animate={
                reduced ? undefined : { scaleY: machineWins ? 1.55 : 1 }
              }
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              initial={false}
              className={`pointer-events-none absolute top-1/2 h-4 w-px rounded-full transition-colors duration-300 ${
                machineWins ? "bg-orange" : "bg-cream/60"
              }`}
              style={{ left: along(LINE_AT), x: "-50%", y: "-50%" }}
            />
            {/* THE PLACE WHERE IT HAPPENS SHOWS THAT IT HAPPENED.
                The cards are 300-500px further down the page; while you are
                dragging, your eye is on the handle. Without something here
                the crossing is only ever reported somewhere you are not
                looking. This ring opens out of the 50-cup mark under the
                thumb, at the instant the thumb passes it. */}
            {cross > 0 && !reduced && (
              <motion.span
                key={`tick-${cross}`}
                aria-hidden="true"
                initial={{ opacity: 0.95, scale: 0.3, x: "-50%", y: "-50%" }}
                animate={{ opacity: 0, scale: 1, x: "-50%", y: "-50%" }}
                transition={{ duration: 0.7, ease: EASE }}
                className="pointer-events-none absolute top-1/2 h-11 w-11 rounded-full border-2 border-orange"
                style={{ left: along(LINE_AT) }}
              />
            )}
          </div>
          {/* THREE LABELS, AND THE LEFT ONE IS THE ANSWER TO "what does this
              drag?". The row carried only the 50-cup mark and "drag to try
              it", so nothing on screen said which of the two questions above
              it moved. It moves cups; the headcount follows.

              The 50 mark is centred on LINE_AT = 33%, which at 736px is 243px
              in — clear of "Cups a day" ending near 58px and of the right-hand
              hint, at every width the section reaches. */}
          <p
            aria-hidden="true"
            className="relative mt-1 h-4 font-sans text-[0.72rem] leading-none"
          >
            <span className="absolute left-0 text-cream/45">Cups a day</span>
            <span
              className="absolute -translate-x-1/2 whitespace-nowrap font-semibold text-cream/70"
              style={{ left: along(LINE_AT) }}
            >
              {THRESHOLD_CUPS} cups
            </span>
            <span className="absolute right-0 text-cream/45">
              drag to try it
            </span>
          </p>
        </motion.div>

        {/* ---------------- the sum, both sides ---------------- */}
        <motion.div
          {...reveal(0.75)}
          className="mt-[clamp(0.85rem,2vh,1.4rem)] grid gap-4 md:grid-cols-2 md:gap-5"
        >
          <Sum
            label="Flasks"
            best={!machineWins}
            cross={cross}
            image={
              <Image
                src={FLASK_SRC}
                alt="Hotcups flasks"
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-contain"
              />
            }
          />

          <Sum
            label={`Machine · ${MACHINES[rig].name}`}
            best={machineWins}
            cross={cross}
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
            {/* The verdict SWAPS rather than rewriting itself in place. Both
                sentences occupied the same <p> and React reconciled them
                word by word, so crossing the line changed some text and the
                reader's eye had nothing to follow. mode="wait" takes the old
                one out before the new one arrives, which is a beat you can
                see. */}
            {/* The height is RESERVED so the swap does not shove the footnote and the
                button down the page and back. Sized off the taller of the two
                sentences: the machine verdict carries an inline figure at up to
                1.85rem, and an inline child inherits leading-[1.4] as a number,
                so its line box is 1.4x its OWN size, not the paragraph's. That
                is 41px at 1440, 2.4em of the 20.2px base. Mobile reserves 3.6em
                because both sentences take two lines in a 335px column. */}
            <div className="min-h-[3.6em] sm:min-h-[2.4em]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={machineWins ? "machine" : "flask"}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="font-sans text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.4] text-cream"
                >
                  {machineWins ? (
                    <>
                      <strong className="font-semibold">
                        A machine suits you.
                      </strong>{" "}
                      At{" "}
                      <span className="font-display text-[clamp(1.4rem,2.2vw,1.85rem)] font-extrabold text-orange">
                        <RollValue value={cups} format={int0} duration={320} />
                      </span>{" "}
                      cups a day you are past the {THRESHOLD_CUPS}-cup line.
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">Stay on flasks.</strong>{" "}
                      At {int0(cups)} cups a day a machine is more than you
                      need.
                    </>
                  )}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* NOTHING BUT THE BUTTON, AND IT HOLDS THE RIGHT.
                Two lines have stood here and both are gone. First an
                "indicative, not a quote" disclaimer, which only existed
                because the section quoted figures nobody had confirmed; then
                "Machines can be rented or bought", which was the one new fact
                the client had given us and had nowhere better to live.

                It has somewhere better now — section 06's headline opens
                "Rent or buy." in brand orange, at up to 60px, above the three
                machines themselves. A 0.85rem line at cream/60 under a verdict
                was the weakest possible place to say it.

                justify-end rather than justify-between, because with one child
                left justify-between would have parked the button on the LEFT
                under the verdict's first word. */}
            <div className="mt-1.5 flex flex-wrap justify-end gap-x-6 gap-y-1">
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
