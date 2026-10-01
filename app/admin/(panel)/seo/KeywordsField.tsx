"use client";

import { useState } from "react";

/**
 * The focus words for a page.
 *
 * ── WHAT THIS TAG IS ACTUALLY WORTH, SAID ON THE SCREEN ───────────────────
 *
 * This field was refused once, and the reason was good: "a field for them
 * would look exactly like the two above it and do nothing, which is worse than
 * its absence — it would get filled in, and then trusted." The client asked
 * for it anyway, so the fix is not to hide the fact, it is to print it. The
 * hint below the chips says Google ignores the tag, Bing reads it, and a long
 * list can cost more than it gains. Nobody fills this in expecting a ranking.
 *
 * It is NOT dead, which matters: the words go into Next's metadata and come
 * out as <meta name="keywords"> on the page. A person can view source and find
 * what they typed.
 *
 * ── ONE HIDDEN FIELD, NOT ONE INPUT PER CHIP ──────────────────────────────
 *
 * Chips are state; the form posts a single comma-joined string. With an input
 * per chip, a page whose last keyword was deleted posts nothing — and nothing
 * is exactly what an absent field looks like, so the action could not tell
 * "cleared" from "this form has no such field" and would have to guess. One
 * field that is always there answers both. The same trap has caught four
 * controls in this panel; it is written out in full in content-actions.
 *
 * ── THE COMMA IS A DELIMITER, SO IT CANNOT BE A KEYWORD ───────────────────
 *
 * Typing one commits the chip rather than entering it. A keyword with a comma
 * in it is not a thing, and silently storing one would split on the next read.
 */

/** Past this the list reads as stuffing, which Bing treats as a signal against
    the page. Not enforced — it is advice, and the number is not a cliff. */
const MANY = 10;

export default function KeywordsField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  /* Splits on commas, so a pasted "tea, coffee, flask" becomes three chips
     rather than one. Trimmed, blanks dropped, duplicates dropped — and the
     duplicate check is case-insensitive, because "Tea" and "tea" are the same
     word to a crawler and two chips to a reader. */
  const commit = (raw: string) => {
    const seen = new Set(value.map((w) => w.toLowerCase()));
    const added: string[] = [];
    for (const part of raw.split(",")) {
      const word = part.trim();
      if (!word || seen.has(word.toLowerCase())) continue;
      seen.add(word.toLowerCase());
      added.push(word);
    }
    if (added.length > 0) onChange([...value, ...added]);
    setDraft("");
  };

  const remove = (i: number) => onChange(value.filter((_, n) => n !== i));

  return (
    <div>
      <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Focus keywords
      </span>

      <div className="flex gap-2">
        <input
          id={name}
          type="text"
          value={draft}
          placeholder="Add a word, then press Enter"
          onChange={(e) => {
            /* A comma typed or pasted ends the chip there and then. */
            if (e.target.value.includes(",")) commit(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              /* WITHOUT THIS, ENTER SUBMITS THE FORM. The field is inside the
                 same <form> as Save, and a single text input plus Enter is a
                 browser default — the operator would add their first keyword
                 and get a page reload instead. */
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              /* Backspace on an empty box takes the last chip, the way every
                 tag field behaves. */
              remove(value.length - 1);
            }
          }}
          onBlur={() => commit(draft)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.92rem] text-ink outline-none transition placeholder:text-mute/70 focus:border-orange focus:ring-2 focus:ring-orange/20"
        />
        <button
          type="button"
          onClick={() => commit(draft)}
          disabled={!draft.trim()}
          className="shrink-0 rounded-xl border border-line bg-cream px-4 text-[0.85rem] font-bold text-ink-soft transition hover:border-orange/50 hover:text-orange-deep disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:text-ink-soft"
        >
          + Add
        </button>
      </div>

      {value.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {value.map((word, i) => (
            <li key={word}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream py-1 pl-3 pr-1.5 text-[0.82rem] text-ink">
                {word}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${word}`}
                  className="grid size-5 place-items-center rounded-full text-mute transition hover:bg-white hover:text-ink"
                >
                  <span aria-hidden>×</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-2 text-[0.8rem] leading-snug text-mute">
        Google has ignored this tag since 2009. Bing still reads it, so a few
        accurate words are worth having — but a long list counts against the
        page, and nothing here lifts a ranking on its own.
      </p>

      {value.length > MANY ? (
        <p className="mt-1 text-[0.8rem] font-semibold text-amber-800">
          {value.length} keywords. Past about {MANY} this reads as stuffing —
          keep the ones the page is really about.
        </p>
      ) : null}

      {/* THE FIELD THAT ACTUALLY POSTS. Always present, even when empty. */}
      <input type="hidden" name={name} value={value.join(", ")} />
    </div>
  );
}
