"use client";

import { useId } from "react";

/**
 * A colour, three ways to set it: type the code, open the picker, or take one
 * off the palette.
 *
 * WHY ALL THREE AND NOT ONE. They are not the same job. Typing a code is how a
 * value that came from somewhere else gets in — a brand sheet, a screenshot, a
 * colour someone sampled off a photograph. The picker is how you find a colour
 * you do not yet have a name for. The palette is how you reuse one this site
 * already uses, which is the common case and the one the other two make
 * needlessly hard: nobody remembers that the brand orange is #f26522.
 *
 * THE TEXT INPUT IS THE ONE THAT POSTS. The native swatch deliberately has no
 * `name` — two inputs under one name would both land in FormData and the
 * action would read whichever came last. It is a control for the text field
 * beside it, not a second copy of the value.
 *
 * ── THE CONTRAST READOUT ──────────────────────────────────────────────────
 *
 * Given `against`, this measures the chosen colour against it and says what it
 * comes to. It is here because of what these colours actually are: grounds and
 * glows that text is then set on. The hero's two ground presets exist BECAUSE
 * a free colour there can break the headline — the note in schema.ts records
 * the reference ground running to #efd2b4, where the orange accent drops to
 * 2.85:1 and fails — so opening it up without saying so would hand over a way
 * to make a headline unreadable with nothing on screen to show it happened.
 *
 * IT REPORTS, IT DOES NOT REFUSE. A low ratio is a warning and the value still
 * saves. Some of these colours are behind a photograph or under a glow where
 * the ratio is advisory rather than binding, and a control that argued with
 * the person using it would be wrong about that often enough to be ignored.
 *
 * THE MATHS IS WCAG 2.1's, in about ten lines: sRGB to linear, the 0.2126 /
 * 0.7152 / 0.0722 luminance weights, (L1 + 0.05) / (L2 + 0.05). No dependency
 * for ten lines that have not changed since 2008.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

/** The site's own colours, so the common case is one click rather than a
    remembered code. Names are what they are called in globals.css, because
    that is what anyone looking them up will search for. */
const PALETTE: { hex: string; name: string }[] = [
  { hex: "#f26522", name: "Orange" },
  { hex: "#d9500f", name: "Orange dark" },
  { hex: "#b8420c", name: "Orange deep" },
  { hex: "#ffe9dc", name: "Orange soft" },
  { hex: "#fff7f0", name: "Cream" },
  { hex: "#fdefe3", name: "Cream deep" },
  { hex: "#3a140e", name: "Espresso" },
  { hex: "#240a06", name: "Espresso deep" },
  { hex: "#581818", name: "Maroon" },
  { hex: "#17110e", name: "Ink" },
];

function luminance(hex: string): number {
  const v = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

export function contrast(a: string, b: string): number | null {
  if (!HEX.test(a) || !HEX.test(b)) return null;
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export default function ColorField({
  label,
  name,
  value,
  onChange,
  hint,
  placeholder = "#E5A863",
  /** measure the chosen colour against this one and report the ratio */
  against,
  /** what `against` is, for the sentence: "the headline", "the label" */
  againstLabel = "text on it",
  /** 4.5 for normal text, 3 for large text and non-text marks */
  need = 4.5,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
  placeholder?: string;
  against?: string;
  againstLabel?: string;
  need?: number;
}) {
  const id = useId();
  const valid = HEX.test(value);
  const ratio = against ? contrast(value, against) : null;
  const passes = ratio === null || ratio >= need;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft"
      >
        {label}
      </label>

      <div className="flex items-stretch gap-2">
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          /* font-mono because it is a code and not a word: #E5A863 in a
             proportional face is genuinely harder to check a digit in. */
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 font-mono text-[0.9rem] uppercase text-ink outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-mute/70 focus:border-orange focus:ring-4 focus:ring-orange/15"
        />

        {/* THE NATIVE PICKER, wrapped so the swatch can be styled — the
            control itself is unstyleable across browsers, so it is sized to
            fill a box that carries the border and the rounding.

            NO `name`: see the note at the top. It sets the text field. */}
        <label
          title="Open the colour picker"
          className="relative grid size-[2.85rem] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-line transition hover:border-orange/50 focus-within:border-orange focus-within:ring-4 focus-within:ring-orange/15"
          /* LONGHANDS ONLY, NO `background` SHORTHAND. React warns — correctly
             — when a style object mixes the two for the same property: on a
             rerender it cannot know which should win, and the checkerboard
             below is set and unset as the value goes valid and back. The
             shorthand was here first and produced exactly that warning. */
          style={{
            backgroundColor: valid ? value : "#ffffff",
            /* Checkerboard when there is nothing to show, so an empty field
               reads as empty rather than as white. */
            backgroundImage: valid
              ? "none"
              : "linear-gradient(45deg,#e8e0d8 25%,transparent 25%,transparent 75%,#e8e0d8 75%),linear-gradient(45deg,#e8e0d8 25%,transparent 25%,transparent 75%,#e8e0d8 75%)",
            backgroundSize: valid ? "auto" : "10px 10px",
            backgroundPosition: valid ? "0 0" : "0 0, 5px 5px",
          }}
        >
          <span className="sr-only">Pick {label} with the colour picker</span>
          <input
            type="color"
            value={valid ? value : "#ffffff"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      {/* ── THE PALETTE ──────────────────────────────────────────
          Buttons and not swatches-that-look-like-buttons: they are clicked,
          so they are <button type="button"> and reachable by keyboard. The
          `type` matters — a bare <button> inside a form submits it, which
          here would mean picking a colour saved the page. */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PALETTE.map((p) => {
          const on = value.toUpperCase() === p.hex.toUpperCase();
          return (
            <button
              key={p.hex}
              type="button"
              title={`${p.name} · ${p.hex.toUpperCase()}`}
              onClick={() => onChange(p.hex.toUpperCase())}
              className={`size-7 rounded-lg border transition ${
                on
                  ? "border-orange ring-2 ring-orange/30"
                  : "border-line hover:border-orange/50"
              }`}
              style={{ background: p.hex }}
            >
              <span className="sr-only">{p.name}</span>
            </button>
          );
        })}
      </div>

      {hint ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">{hint}</p>
      ) : null}

      {value && !valid ? (
        <p className="mt-1.5 text-[0.8rem] font-semibold leading-snug text-amber-800">
          A colour is six hex digits after a #, like {placeholder}.
        </p>
      ) : null}

      {ratio !== null ? (
        <p
          className={`mt-1.5 text-[0.8rem] leading-snug ${
            passes ? "text-mute" : "font-semibold text-amber-800"
          }`}
        >
          {passes ? "Contrast" : "Low contrast"} — {ratio.toFixed(2)}:1 against{" "}
          {againstLabel}
          {passes
            ? "."
            : `, under the ${need} it needs. It will be hard to read.`}
        </p>
      ) : null}
    </div>
  );
}
