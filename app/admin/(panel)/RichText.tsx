"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A small formatting editor: bold, italic, a link, lists, two heading levels.
 *
 * ── contentEditable AND execCommand, WITH THE CAVEAT STATED ───────────────
 *
 * `document.execCommand` is deprecated. It is also implemented in every
 * browser, has no replacement that does not involve writing a selection model
 * and an undo stack by hand, and is what every rich-text field on the web
 * still runs on. The alternative here was a dependency — the smallest honest
 * editor is tens of kilobytes — in a project that has none and says so.
 *
 * WHAT THAT COSTS, PLAINLY: browsers emit slightly different markup for the
 * same command. Chrome may produce <b>, Firefox <strong>; one wraps a list
 * item in a <div>, another does not. That variation is exactly why the
 * sanitiser runs on save rather than trusting the editor, and why it ALLOWS
 * both <b> and <strong> rather than insisting on one.
 *
 * ── A HIDDEN INPUT CARRIES THE VALUE ──────────────────────────────────────
 *
 * A contentEditable div is not a form control: it has no name and posts
 * nothing. The HTML is mirrored into a hidden <input> on every edit, which is
 * what the action reads. That also keeps this component working inside the
 * posts form's parallel-array scheme, where position in the document is the
 * row index.
 *
 * ── THE EDITOR IS UNCONTROLLED AFTER MOUNT, ON PURPOSE ────────────────────
 *
 * Writing `dangerouslySetInnerHTML` on every keystroke would reset the
 * caret to the start of the box on each character — the classic
 * contentEditable bug. So the initial HTML is written once and the DOM owns it
 * from then on; React is told what changed, not the other way round.
 */

type Cmd = {
  label: string;
  title: string;
  cmd: string;
  arg?: string;
  /** rendered in the button */
  glyph: React.ReactNode;
};

const COMMANDS: Cmd[] = [
  { label: "Bold", title: "Bold", cmd: "bold", glyph: <strong>B</strong> },
  { label: "Italic", title: "Italic", cmd: "italic", glyph: <em>I</em> },
  {
    label: "Underline",
    title: "Underline",
    cmd: "underline",
    glyph: <span className="underline">U</span>,
  },
  {
    label: "Heading",
    title: "Heading",
    cmd: "formatBlock",
    arg: "h2",
    glyph: <span className="text-[0.82rem] font-extrabold">H</span>,
  },
  {
    label: "Bulleted list",
    title: "Bulleted list",
    cmd: "insertUnorderedList",
    glyph: <ListGlyph ordered={false} />,
  },
  {
    label: "Numbered list",
    title: "Numbered list",
    cmd: "insertOrderedList",
    glyph: <ListGlyph ordered />,
  },
  {
    label: "Quote",
    title: "Quote",
    cmd: "formatBlock",
    arg: "blockquote",
    glyph: <span className="text-[0.95rem] leading-none">&ldquo;</span>,
  },
];

export default function RichText({
  label,
  name,
  defaultValue,
  hint,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: React.ReactNode;
  /** so a preview or a word count can follow along */
  onChange?: (html: string) => void;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  /* ONCE, NOT ON EVERY RENDER — see the note at the top. */
  useEffect(() => {
    if (box.current && box.current.innerHTML !== defaultValue) {
      box.current.innerHTML = defaultValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const next = box.current?.innerHTML ?? "";
    setHtml(next);
    onChange?.(next);
  };

  const run = (c: Cmd) => {
    box.current?.focus();
    /* formatBlock wants the tag in angle brackets in some engines and bare in
       others; the bracketed form is the one both accept. */
    document.execCommand(c.cmd, false, c.arg ? `<${c.arg}>` : undefined);
    sync();
  };

  const link = () => {
    const sel = window.getSelection()?.toString();
    if (!sel) {
      window.alert("Select the words you want to link first.");
      return;
    }
    const href = window.prompt("Link to…", "https://");
    if (!href) return;
    box.current?.focus();
    document.execCommand("createLink", false, href);
    sync();
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft"
      >
        {label}
      </label>

      <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-orange focus-within:ring-4 focus-within:ring-orange/15">
        {/* type="button" ON EVERY ONE. A bare <button> inside a form submits
            it — here that would mean clicking Bold saved the posts. */}
        <div
          role="toolbar"
          aria-label={`${label} formatting`}
          className="flex flex-wrap items-center gap-0.5 border-b border-line bg-cream/50 px-2 py-1.5"
        >
          {COMMANDS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.title}
              aria-label={c.label}
              /* onMouseDown AND preventDefault, NOT onClick. A click moves
                 focus to the button first, which collapses the selection in
                 the editor — so the command would run on nothing. Preventing
                 the default keeps the selection where the author made it. */
              onMouseDown={(e) => {
                e.preventDefault();
                run(c);
              }}
              className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-cream hover:text-espresso"
            >
              {c.glyph}
            </button>
          ))}

          <span aria-hidden className="mx-1 h-5 w-px bg-line" />

          <button
            type="button"
            title="Link"
            aria-label="Link"
            onMouseDown={(e) => {
              e.preventDefault();
              link();
            }}
            className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-cream hover:text-espresso"
          >
            <LinkGlyph />
          </button>

          <button
            type="button"
            title="Clear formatting"
            aria-label="Clear formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              box.current?.focus();
              document.execCommand("removeFormat");
              sync();
            }}
            className="ml-auto rounded-lg px-2 py-1 text-[0.72rem] font-bold text-mute transition hover:bg-cream hover:text-espresso"
          >
            Clear
          </button>
        </div>

        {/* THE EDITOR. `prose`-ish styling is written out rather than
            inherited: this box has to look like the article it is producing,
            or an author formats to what they see here and is surprised by the
            page. */}
        <div
          id={id}
          ref={box}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={sync}
          onBlur={sync}
          className="min-h-[9rem] max-w-none px-3.5 py-3 text-[0.95rem] leading-relaxed text-ink outline-none [&_a]:text-orange-deep [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-orange/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_h2]:mt-3 [&_h2]:text-[1.1rem] [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:list-disc"
        />
      </div>

      {/* WHAT ACTUALLY POSTS. The div above is not a form control. */}
      <input type="hidden" name={name} value={html} readOnly />

      {hint ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">{hint}</p>
      ) : null}
    </div>
  );
}

function ListGlyph({ ordered }: { ordered: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-[17px]"
    >
      <path d="M9 6h11M9 12h11M9 18h11" />
      {ordered ? (
        <path
          d="M4 5.5h1V9M4 14.5h2L4 18h2"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[17px]"
    >
      <path d="M10 13.5a4 4 0 0 0 5.7.3l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.3l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5" />
    </svg>
  );
}
