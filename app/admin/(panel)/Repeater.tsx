"use client";

import { useActionState, useId, useState } from "react";
import SubmitButton from "../SubmitButton";
import { Notice, ghostButton } from "../ui";
import ImageField from "./ImageField";
import type { SaveState } from "../content-actions";
import ConfirmDelete from "./ConfirmDelete";

/**
 * The add/remove list behind both the blog posts and the case studies.
 *
 * ONE COMPONENT FOR BOTH, because the difference between them is a list of
 * field names and a noun. The logic that is not the difference — holding rows in
 * state, keying them so React does not reuse the wrong input, refusing to delete
 * the last one, posting the whole set — is the part that would rot if it existed
 * twice.
 *
 * HOW THE POST WORKS, AND WHY IT LOOKS ODD. Every row renders inputs with the
 * SAME `name`, so three rows produce three values under each name and
 * `formData.getAll("title")` returns them in DOM order. Row i is the i-th of
 * every column — see `rows()` in content-actions.ts, which zips them back. The
 * alternative, indexed names like `title[0]`, means renumbering every row below
 * a deletion; this means a removed row simply stops rendering.
 *
 *   The invariant that makes it safe: EVERY ROW RENDERS EVERY FIELD. One
 *   conditional input would shift a whole column against the others and quietly
 *   attach row 3's headline to row 2's photograph. There are none, and a field
 *   with nothing in it posts as "".
 *
 * THE INPUTS ARE CONTROLLED, which is the one decision here worth defending.
 * Uncontrolled inputs with stable keys nearly work, and "nearly" is the problem:
 * removing a row re-runs the reconciler over the survivors, and anything that
 * makes React reuse a DOM node for a different row shows the operator someone
 * else's text. Holding the values in state means what is on screen is what will
 * be posted, always, and the cost is a re-render per keystroke on a form nobody
 * types into at speed.
 */

export type RepeaterField = {
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  /** full width rather than half — for headlines and alt text */
  wide?: boolean;
  /** render this as a picture field — preview, upload, crop — rather than as a
      bare path input */
  image?: boolean;
  /** the shape the picture is shown in on the site, so the crop box can lock to
      it. Cards here are fixed ratios, unlike the menu's cut-outs. */
  aspect?: number;
};

type Row = { uid: string; values: Record<string, string> };

export default function Repeater({
  fields,
  initial,
  action,
  noun,
  nounPlural,
  saveLabel,
}: {
  fields: RepeaterField[];
  initial: Record<string, string>[];
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  noun: string;
  nounPlural: string;
  saveLabel: string;
}) {
  const [state, formAction] = useActionState<SaveState, FormData>(
    action,
    undefined,
  );

  /* useId as the uid prefix rather than a counter alone, so keys are unique even
     if two Repeaters ever render on one page, and stable across a re-render
     without reaching for Math.random — which would also be a hydration mismatch
     waiting to happen. */
  const idBase = useId();
  const [seq, setSeq] = useState(initial.length);
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((values, i) => ({ uid: `${idBase}-${i}`, values })),
  );
  /* WHICH ROW IS OPEN. Unlike the hero and the menu there is no heading panel
     in front of these, so tab 0 IS the first row rather than an offset into the
     list. */
  const [tab, setTab] = useState(0);

  const set = (uid: string, name: string, value: string) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, values: { ...r.values, [name]: value } } : r,
      ),
    );

  const add = () => {
    /* Open the row that was just added, or it arrives as a tab the operator has
       to go looking for. rows.length is the pre-add length, which is the new
       row's index. */
    setTab(rows.length);
    setRows((rs) => [
      ...rs,
      {
        uid: `${idBase}-${seq}`,
        values: Object.fromEntries(fields.map((f) => [f.name, ""])),
      },
    ]);
    setSeq((n) => n + 1);
  };

  const remove = (uid: string) => {
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));
    /* Step back rather than off the end. Removing the open tab would otherwise
       leave `tab` pointing past the last row and show nothing at all. */
    setTab((t) => Math.max(0, Math.min(t, rows.length - 2)));
  };

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      {/* ── THE TOOLBAR ───────────────────────────────────────
          ADD SITS TOP RIGHT, ABOVE THE TABS, NOT BESIDE SAVE. It was at the
          foot of the form, which put it past the whole of whichever row was
          open — so adding a post meant scrolling to the bottom of a different
          post to find the button, and then scrolling back up to the tab it
          created. Up here it is next to the thing it changes.

          THE COUNT TAKES THE LEFT AND THE BUTTON THE RIGHT, which is what
          justify-between does with them in this order. Swapping the two lines
          swaps the ends — there is no float or margin holding either in place.

          SAVE STAYS AT THE BOTTOM. It is the end of the task and the
          conventional place for it; these two buttons do unrelated jobs and
          sitting them together was what made the pair confusing. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length} {rows.length === 1 ? noun.toLowerCase() : nounPlural}
        </p>
        <button type="button" onClick={add} className={ghostButton}>
          Add {noun.toLowerCase()}
        </button>
      </div>

      {/* ── THE TABS ──────────────────────────────────────────
          ONE ROW AT A TIME, because a post is six fields and a photograph, and
          three of them stacked is most of a screen of scrolling to reach the
          third. Numbered rather than titled: a headline runs to sixty
          characters and would make a tab wider than the row it opens.

          type="button" on each, because a <button> inside a <form> defaults to
          type="submit" — without it the first tab click would save. */}
      <div
        role="tablist"
        aria-label={nounPlural}
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {rows.map((row, i) => (
          <button
            key={row.uid}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[0.85rem] font-semibold transition ${
              tab === i
                ? "bg-espresso text-cream"
                : "text-ink-soft hover:bg-white hover:text-espresso"
            }`}
          >
            {noun} {i + 1}
          </button>
        ))}
      </div>

      {/* EVERY PANEL RENDERS AND THE INACTIVE ONES ARE HIDDEN, never unmounted.
          This form posts every row on every save — and it posts them as PARALLEL
          ARRAYS, where `getAll("title")` returns one value per row in DOM order
          and row i is the i-th of every column. Unmounting a panel would drop
          that row out of every column at once, silently shortening the list to
          whichever rows happened to be on screen. `hidden` is display:none, and
          a display:none input still submits. */}
      <ol>
        {rows.map((row, i) => (
          <li
            key={row.uid}
            hidden={tab !== i}
            className="rounded-[var(--radius-card)] border border-line bg-white p-4 sm:p-5"
          >
            <header className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.12em] text-mute">
                {noun} {i + 1} of {rows.length}
              </h3>
              <ConfirmDelete
                label="Remove"
                title={`Remove this ${noun.toLowerCase()}?`}
                body="Everything typed into it goes with it — there is no undo on this form. The live site is unchanged until you press Save."
                confirmLabel="Remove it"
                onConfirm={() => remove(row.uid)}
                /* THE LAST ROW CANNOT BE REMOVED, and the button says so rather
                   than vanishing. A control that disappears leaves the operator
                   wondering whether they mis-clicked; a disabled one with a
                   reason does not. The action refuses an empty list too — this is
                   the courtesy, not the guarantee. */
                disabled={rows.length <= 1}
                disabledReason={`At least one ${noun.toLowerCase()} has to stay.`}
              />
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div
                  key={f.name}
                  className={f.wide ? "sm:col-span-2" : undefined}
                >
                  {f.image ? (
                    /* THE WHOLE FIELD, NOT AN INPUT WITH A THUMBNAIL UNDER IT.
                       ImageField carries the path input, the preview, the
                       upload and the crop — and it needs the value written back
                       into it after an upload, which is what the controlled
                       inputs in this repeater already provide. */
                    <ImageField
                      label={f.label}
                      name={f.name}
                      value={row.values[f.name] ?? ""}
                      onChange={(v) => set(row.uid, f.name, v)}
                      placeholder={f.placeholder}
                      aspect={f.aspect ?? null}
                      /* These are photographs filling a card, not cut-outs on a
                         ground, so the preview crops the same way the card does
                         and sits on a light plate. */
                      previewOnDark={false}
                      previewFit="cover"
                      hint={f.hint}
                    />
                  ) : (
                    <>
                      <label className="block">
                        <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                          {f.label}
                        </span>
                        <input
                          name={f.name}
                          value={row.values[f.name] ?? ""}
                          onChange={(e) => set(row.uid, f.name, e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] outline-none transition placeholder:text-mute/70 focus:border-orange focus:ring-4 focus:ring-orange/15"
                        />
                      </label>
                      {f.hint ? (
                        <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">
                          {f.hint}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <SubmitButton>{saveLabel}</SubmitButton>
    </form>
  );
}
