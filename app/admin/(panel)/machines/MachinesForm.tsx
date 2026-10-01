"use client";

import { useActionState, useId, useState } from "react";
import { saveMachinesAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import ImageField from "../ImageField";
import { Field, Notice, TextArea, ghostButton } from "../../ui";
import type { MachineContent, MachinesContent } from "@/lib/content/schema";
import ConfirmDelete from "../ConfirmDelete";

/**
 * Sections 05 and 06 — the machines.
 *
 * ONE FORM FOR BOTH, because there is one list and three pages read it: the
 * row on the home page prints the bands, the calculator above it picks a unit
 * by comparing an office against them, and /machines does both. Splitting the
 * form would be re-creating by hand the drift this list was consolidated to
 * remove.
 *
 * TABS, AND THE SAME MECHANISM AS THE HERO AND THE MENU: every panel renders
 * and the inactive ones are HIDDEN rather than unmounted, because this form
 * posts every machine on every save. `hidden` is display:none and a
 * display:none input still posts; only a DISABLED one is dropped from FormData.
 *
 * THE BAND IS TWO FIELDS AND THE FIRST ONE MAY BE EMPTY. "< 100" on the
 * smallest card is not a range with a zero in it — it is the absence of a
 * floor, so an empty box is the answer rather than a missing one. The hint says
 * so, and the preview beside the fields shows what the card will read.
 *
 * THE SHAPE FILLS ITSELF. `aspect` is the photograph's own width ÷ height and
 * the card reserves space with it before the image loads; ImageField reports it
 * as soon as the preview decodes, so uploading or even just typing a path sets
 * it. It is shown read-only rather than hidden, because a number that drives
 * layout should be visible when someone is wondering why a card is the height
 * it is.
 *
 * NOTHING HERE HAS TO BE MEASURED ANY MORE. Each unit used to carry four
 * numbers locating its display, for a glow that lit the screen on hover; that
 * came off at the client's direction. It was the only thing on this form that
 * made replacing a photograph a two-step job — swap the picture and the four
 * measurements taken off the old one were silently wrong. A machine is now a
 * picture and two numbers.
 */

type Row = { uid: string; value: MachineContent };

const BLANK: Omit<MachineContent, "key"> = {
  src: "",
  from: null,
  cap: 100,
  aspect: 1,
};

export default function MachinesForm({ machines }: { machines: MachinesContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveMachinesAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(machines.machines.length);
  const [rows, setRows] = useState<Row[]>(() =>
    machines.machines.map((value, i) => ({ uid: `${idBase}-${i}`, value })),
  );
  /* 0 is the heading; 1..n index `rows`. */
  const [tab, setTab] = useState(0);

  const set = <K extends keyof MachineContent>(
    uid: string,
    field: K,
    v: MachineContent[K],
  ) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, value: { ...r.value, [field]: v } } : r,
      ),
    );

  const add = () => {
    setRows((rs) => {
      const last = rs[rs.length - 1];
      return [
        ...rs,
        {
          uid: `${idBase}-${seq}`,
          value: {
            ...BLANK,
            key: `machine-${seq + 1}`,
            /* THE NEW UNIT STARTS WHERE THE LAST ONE STOPPED. The bands run
               smallest to largest and the action refuses a set that does not,
               so guessing anything else here would only produce an error the
               operator then has to work out how to clear. */
            from: last ? last.value.cap : null,
            cap: last ? last.value.cap * 2 : 100,
          },
        },
      ];
    });
    setSeq((n) => n + 1);
    setTab(rows.length + 1);
  };

  const remove = (uid: string) => {
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));
    setTab((t) => Math.max(0, Math.min(t, rows.length - 1)));
  };

  return (
    <form action={action} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <input type="hidden" name="machineCount" value={rows.length} />

      {/* Add sits above the tabs rather than beside Save — see the note in
          Repeater.tsx. It was at the foot of the form, past the whole of
          whichever panel was open. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length} {rows.length === 1 ? "machine" : "machines"} — three
          across, so a fourth starts a second row
        </p>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= 6}
          title={rows.length >= 6 ? "Six is as many as this row holds." : undefined}
          className={`${ghostButton} disabled:cursor-not-allowed`}
        >
          Add a machine
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Machines section"
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {["Heading", ...rows.map((r) => band(r.value))].map((label, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[0.85rem] font-semibold transition ${
              tab === i
                ? "bg-espresso text-cream"
                : "text-ink-soft hover:bg-white hover:text-espresso"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── THE HEADING ───────────────────────────────────────── */}
      <fieldset
        hidden={tab !== 0}
        className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
      >
        <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
          The heading
        </legend>

        <div className="space-y-4">
          <Field
            label="Eyebrow"
            name="m_eyebrow"
            defaultValue={machines.eyebrow}
            hint="The small line above the headline."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Headline, orange half"
              name="m_headlineAccent"
              defaultValue={machines.headlineAccent}
              hint="Starts the headline, in orange."
            />
            <Field
              label="Headline, the rest"
              name="m_headline"
              defaultValue={machines.headline}
              hint="Finishes the headline, in ink."
            />
          </div>
          <TextArea
            label="Sub-copy"
            name="m_sub"
            rows={2}
            defaultValue={machines.sub}
            hint="One sentence beside the headline."
          />
        </div>
      </fieldset>

      {/* ── THE MACHINES ──────────────────────────────────────── */}
      {rows.map((row, i) => (
        <fieldset
          key={row.uid}
          hidden={tab !== i + 1}
          className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
        >
          <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Machine {i + 1}
          </legend>

          <input type="hidden" name={`machine${i}_key`} value={row.value.key} />
          <input
            type="hidden"
            name={`machine${i}_aspect`}
            value={row.value.aspect}
          />

          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.85rem] text-mute">
              The card will read{" "}
              <strong className="font-bold text-ink">{band(row.value)}</strong>{" "}
              cups / day
            </p>
            <ConfirmDelete
              label="Remove this machine"
              title="Remove this machine?"
              body="Its name, picture, capacity band and copy go with it — there is no undo on this form. The live site is unchanged until you press Save."
              confirmLabel="Remove the machine"
              onConfirm={() => remove(row.uid)}
              disabled={rows.length <= 1}
              disabledReason="At least one machine has to stay."
            />
          </header>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Photograph"
                name={`machine${i}_src`}
                value={row.value.src}
                onChange={(v) => set(row.uid, "src", v)}
                /* THE SHAPE FOLLOWS THE PICTURE rather than the picture being
                   forced into a shape. The three units are different
                   proportions and each card reserves its own height, so a
                   locked crop ratio would squeeze one of them. */
                aspect={null}
                onAspect={(a) => set(row.uid, "aspect", a)}
                placeholder="/img/machine-cothas.png"
                hint="A cut-out picture with a see-through background. Uploading one sets the card’s shape."
              />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="From"
                    name={`machine${i}_from`}
                    value={row.value.from === null ? "" : String(row.value.from)}
                    onChange={(v) =>
                      set(row.uid, "from", v.trim() === "" ? null : Number(v) || 0)
                    }
                    inputMode="numeric"
                    placeholder="—"
                    hint="Leave empty on the smallest unit — that prints the “<”."
                  />
                  <Field
                    label="Up to"
                    name={`machine${i}_cap`}
                    value={String(row.value.cap)}
                    onChange={(v) => set(row.uid, "cap", Number(v) || 0)}
                    inputMode="numeric"
                    hint="The most cups a day this unit covers."
                  />
                </div>

                <p className="rounded-xl border border-line bg-white px-3.5 py-3 text-[0.82rem] leading-relaxed text-mute">
                  Shape:{" "}
                  <strong className="font-semibold text-ink">
                    {row.value.aspect.toFixed(3)}
                  </strong>{" "}
                  — taken from the picture.
                </p>
              </div>
            </div>

          </div>
        </fieldset>
      ))}

      <SubmitButton>Save the machines</SubmitButton>
    </form>
  );
}

/** What the card prints: "< 100" or "100 – 200". The same shape the page uses,
    so the tab and the preview cannot describe a band the card does not. */
function band(m: { from: number | null; cap: number }): string {
  return m.from == null ? `< ${m.cap}` : `${m.from} – ${m.cap}`;
}

/** Trim floating-point noise off a fraction turned back into a percentage:
    0.505 × 100 is 50.49999999999999 in binary floating point, and that is not
    a thing to put in a text field. */
function round(n: number): string {
  return String(Math.round(n * 100) / 100);
}
