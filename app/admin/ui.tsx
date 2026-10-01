/**
 * The panel's controls, in one file.
 *
 * WHY A PRIMITIVES FILE FOR A FOUR-PAGE ADMIN. Because the alternative is the
 * same eleven Tailwind classes on forty inputs, which is how a panel ends up
 * with three subtly different text fields and a focus ring on two of them. The
 * public site does not have a file like this and does not need one — its
 * sections are each a distinct composition — but a form is a form, and every
 * field here should be indistinguishable from every other.
 *
 * NOT "use client". None of these hold state; they are markup with classes on
 * it, so they stay Server Components and cost nothing in the bundle. The two
 * places that DO need interactivity — a pending submit button and a repeater
 * that adds rows — are their own client components.
 *
 * ON THE PALETTE. These reuse the site's tokens (cream, ink, orange, line)
 * rather than introducing an admin theme. It is the same brand and the same
 * person, and a panel in unrelated greys reads as a different product bolted
 * on. What it does NOT reuse is the site's typographic scale: headings here are
 * small and tight, because a form is a tool and nothing in it should announce
 * itself the way a section headline does.
 */

import Link from "next/link";

/* ---------------------------------------------------------------
   FIELDS
   --------------------------------------------------------------- */

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink " +
  "placeholder:text-mute/70 outline-none transition " +
  "focus:border-orange focus:ring-4 focus:ring-orange/15 " +
  "disabled:bg-cream-deep disabled:text-mute";

/**
 * A labelled text input.
 *
 * IT WORKS BOTH CONTROLLED AND UNCONTROLLED, which is not laziness about which
 * to pick — the panel genuinely needs both. A form whose fields are fixed (the
 * contact details, the hero's slides) wants `defaultValue`: there is nothing to
 * synchronise and React state per keystroke would be ceremony. A form whose
 * rows can be ADDED AND REMOVED wants `value` + `onChange`, because deleting a
 * row re-runs the reconciler over the survivors and anything that makes React
 * reuse a DOM node for a different row would show the operator someone else's
 * text.
 *
 * `onChange` HANDS OVER THE STRING, not the event. Every caller wants the value
 * and would otherwise write `e.target.value` forty times; the one place that
 * wants a number converts it itself, because what to do with "" is a decision
 * the field cannot make.
 */
export function Field({
  label,
  name,
  hint,
  defaultValue,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  hint?: React.ReactNode;
  /** uncontrolled — for forms with a fixed set of fields */
  defaultValue?: string | number;
  /** controlled — pass `onChange` with it, for repeaters */
  value?: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  autoComplete?: string;
}) {
  /* The id is the name. Every field in this panel is in a form of its own and
     no name is used twice within one, so there is no collision to guard
     against — and a generated id would break the label/input pairing the
     moment a component was memoised. */
  const controlled = value !== undefined;

  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        /* ONE OR THE OTHER, NEVER BOTH. React warns about an input given both,
           and then ignores defaultValue — which is a silent bug in whichever
           call site passed them by accident. */
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue })}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={inputClass}
      />
      {hint ? (
        <span className="mt-1.5 block text-[0.8rem] leading-snug text-mute">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** Controlled or uncontrolled, for the same reason `Field` is both — see the
    note there. Forms whose rows can be added and removed need the controlled
    form; forms with a fixed set of fields are better off without the state. */
export function TextArea({
  label,
  name,
  hint,
  defaultValue,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  name: string;
  hint?: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  rows?: number;
}) {
  const controlled = value !== undefined;

  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </span>
      <textarea
        id={name}
        name={name}
        rows={rows}
        {...(controlled
          ? { value, onChange: (e) => onChange?.(e.target.value) }
          : { defaultValue })}
        className={`${inputClass} resize-y leading-relaxed`}
      />
      {hint ? (
        <span className="mt-1.5 block text-[0.8rem] leading-snug text-mute">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/* ---------------------------------------------------------------
   STRUCTURE
   --------------------------------------------------------------- */

export function Card({
  title,
  note,
  aside,
  children,
}: {
  title?: string;
  note?: React.ReactNode;
  /** Sits on the title's own line, hard right — a count, a state, a chip.
      NOT a place for a control: the heading row is read as a label, and a
      button there is found by accident rather than looked for. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-[var(--shadow-1)] sm:p-6">
      {title ? (
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-[1.05rem] font-bold tracking-[-0.01em] text-ink">
              {title}
            </h2>
            {aside}
          </div>
          {note ? (
            <p className="mt-1.5 max-w-prose text-[0.875rem] leading-relaxed text-ink-soft">
              {note}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PageHead({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-espresso">
          {title}
        </h1>
        {lead ? (
          <p className="mt-1.5 max-w-[62ch] text-[0.925rem] leading-relaxed text-ink-soft">
            {lead}
          </p>
        ) : null}
      </div>
      {children}
    </header>
  );
}

/**
 * A banner.
 *
 * FOUR TONES AND THEY ARE NOT INTERCHANGEABLE. `warn` is the read-only
 * filesystem and the development-credential notices — things that are true
 * right now and that the operator has to act on outside this panel. `bad` is a
 * rejected save. `good` is a completed one. `note` is orientation. Colour is
 * never the only signal: each carries a word, because the panel will be used by
 * whoever the client puts in front of it.
 */
export function Notice({
  tone = "note",
  label,
  children,
}: {
  tone?: "good" | "bad" | "warn" | "note";
  /** Overrides the tone's default word. The defaults are written for the save
      forms, which is most of the panel; the login form is the exception and
      "Not saved" is plainly wrong there. */
  label?: string;
  children: React.ReactNode;
}) {
  const styles = {
    good: "border-emerald-600/25 bg-emerald-50 text-emerald-900",
    bad: "border-red-600/25 bg-red-50 text-red-900",
    warn: "border-amber-600/30 bg-amber-50 text-amber-950",
    note: "border-line bg-cream text-ink-soft",
  }[tone];
  const word =
    label ??
    { good: "Saved", bad: "Not saved", warn: "Heads up", note: null }[tone];

  return (
    <div
      /* role="alert" is announced immediately and interrupts; role="status" waits
         for a pause. A rejected save is the one case worth interrupting for,
         because the operator is about to navigate away believing it worked. */
      role={tone === "bad" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-[0.875rem] leading-relaxed ${styles}`}
    >
      {word ? <strong className="font-bold">{word} — </strong> : null}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   BUTTONS
   --------------------------------------------------------------- */

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 " +
  "text-[0.9rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/25";

export const primaryButton = `${buttonBase} bg-espresso text-cream hover:bg-espresso-deep`;
export const ghostButton = `${buttonBase} border border-line bg-white text-ink hover:bg-cream`;

export function LinkButton({
  href,
  children,
  tone = "ghost",
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  tone?: "primary" | "ghost";
} & Omit<React.ComponentProps<typeof Link>, "href" | "children">) {
  return (
    <Link
      href={href}
      className={tone === "primary" ? primaryButton : ghostButton}
      {...rest}
    >
      {children}
    </Link>
  );
}
