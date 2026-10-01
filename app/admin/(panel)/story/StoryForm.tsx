"use client";

import { useActionState, useId, useState } from "react";
import { saveStoryAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import ImageField from "../ImageField";
import { Field, Notice, TextArea, ghostButton } from "../../ui";
import ConfirmDelete from "../ConfirmDelete";
import {
  STORY_ICONS,
  storyRange,
  storyYears,
  type MilestoneContent,
  type StoryContent,
  type StoryIcon,
} from "@/lib/content/schema";

/**
 * Section 08 — the story.
 *
 * ONE TAB PER STOP, LABELLED BY YEAR, because a year is what an operator is
 * looking for when they open this: they came to fix 2021, not "stop three".
 *
 * THE SAME HIDDEN-NOT-UNMOUNTED MECHANISM as the hero, the menu and the
 * machines. Every stop posts on every save, so a hidden panel has to keep its
 * inputs in the DOM — `hidden` is display:none and a display:none input still
 * submits; only a DISABLED one is dropped.
 *
 * WHAT THIS FORM WILL NOT LET YOU DO, and both refusals are the section's own
 * rules rather than mine:
 *
 *   TWO STOPS IN THE SAME YEAR, or a year earlier than the one before it. The
 *   rail is a line running left to right and the numeral counts up as a visitor
 *   scrolls. The client's own anniversary sheet listed 2024 twice — once for
 *   the growth stretch and once for Trichy — which would have shown 2024, moved
 *   on, and come back to it.
 *
 *   A PARAGRAPH AND BULLETS ON THE SAME STOP. A stop says its piece one way or
 *   the other. 2026 is the only one with bullets, because it is the only one
 *   making four claims at once.
 *
 * THE HEADLINE'S FIRST LINE IS NOT ON THIS FORM. "Seven years." is the count of
 * the stops below and is computed from them, as is the "2019 – 2026" under it.
 * Both are shown read-only at the top so the effect of adding a stop is visible
 * before saving rather than after.
 */

type Row = { uid: string; value: MilestoneContent };

const BLANK: Omit<MilestoneContent, "key" | "year"> = {
  span: "",
  title: "",
  body: "",
  bullets: [],
  caption: "",
  icon: "shop",
  img: "",
};

/** What each glyph is, for the picker. The rail draws these under the dots. */
const ICON_LABEL: Record<StoryIcon, string> = {
  shop: "Shopfront",
  cup: "Cup",
  people: "People",
  chart: "Chart",
  building: "Building",
  machine: "Machine",
  sprout: "Sprout",
};

export default function StoryForm({ story }: { story: StoryContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveStoryAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(story.milestones.length);
  const [rows, setRows] = useState<Row[]>(() =>
    story.milestones.map((value, i) => ({ uid: `${idBase}-${i}`, value })),
  );
  /* 0 is the heading; 1..n index `rows`. */
  const [tab, setTab] = useState(0);

  const set = <K extends keyof MilestoneContent>(
    uid: string,
    field: K,
    v: MilestoneContent[K],
  ) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, value: { ...r.value, [field]: v } } : r,
      ),
    );

  const stops = rows.map((r) => r.value);

  const add = () => {
    setRows((rs) => {
      const last = rs[rs.length - 1];
      /* THE NEXT YEAR, because the stops have to climb and the action refuses a
         set that does not. Guessing anything else would hand the operator an
         error to clear before they had typed a word. */
      const nextYear = last ? String(Number(last.value.year) + 1) : "2019";
      return [
        ...rs,
        {
          uid: `${idBase}-${seq}`,
          value: { ...BLANK, key: `stop-${seq + 1}`, year: nextYear },
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

      <input type="hidden" name="stopCount" value={rows.length} />

      {/* Add sits above the tabs rather than beside Save — see the note in
          Repeater.tsx. It was at the foot of the form, past the whole of
          whichever panel was open. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length} {rows.length === 1 ? "stop" : "stops"} —{" "}
          {storyYears(stops) || "no span yet"}
        </p>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= 14}
          title={rows.length >= 14 ? "Fourteen stops is the ceiling." : undefined}
          className={`${ghostButton} disabled:cursor-not-allowed`}
        >
          Add a stop
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Story stops"
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {["Heading", ...rows.map((r) => r.value.year || "New")].map(
          (label, i) => (
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
          ),
        )}
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
          {/* WHAT THE HEADING WILL SAY, ASSEMBLED FROM THE LIVE ROWS. Two of
              its three lines are counted off the stops, so adding one on
              another tab shows up here immediately rather than after a save. */}
          <div className="rounded-xl border border-line bg-white p-4 text-center">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-mute">
              {story.eyebrow}
            </p>
            <p className="mt-2 text-[1.4rem] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              {storyYears(stops) || "—"}
              <br />
              {story.headlineLead}{" "}
              <span className="text-orange-deep">{story.headlineAccent}</span>
            </p>
            <p className="mt-2 text-[0.85rem] font-bold tracking-[0.2em] text-orange-deep">
              {storyRange(stops)}
            </p>
            <p className="mt-3 text-[0.8rem] leading-snug text-mute">
              Both lines are counted from the stops below. Nothing to type.
            </p>
          </div>

          <Field
            label="Eyebrow"
            name="s_eyebrow"
            defaultValue={story.eyebrow}
            hint="The small line above the headline."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Second line, opening word"
              name="s_headlineLead"
              defaultValue={story.headlineLead}
              hint="In ink, before the orange."
            />
            <Field
              label="Second line, orange half"
              name="s_headlineAccent"
              defaultValue={story.headlineAccent}
              hint="The orange words it ends on."
            />
          </div>
        </div>
      </fieldset>

      {/* ── THE STOPS ─────────────────────────────────────────── */}
      {rows.map((row, i) => (
        <fieldset
          key={row.uid}
          hidden={tab !== i + 1}
          className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
        >
          <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Stop {i + 1}
          </legend>

          <input type="hidden" name={`stop${i}_key`} value={row.value.key} />

          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.85rem] text-mute">
              {i + 1} of {rows.length} on the rail.
            </p>
            <ConfirmDelete
              label="Remove this stop"
              title="Remove this stop?"
              body="Its year, title, caption, picture and whatever it says go with it — there is no undo on this form. The live site is unchanged until you press Save."
              confirmLabel="Remove the stop"
              onConfirm={() => remove(row.uid)}
              disabled={rows.length <= 1}
              disabledReason="At least one stop has to stay."
            />
          </header>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Year"
                name={`stop${i}_year`}
                value={row.value.year}
                onChange={(v) => set(row.uid, "year", v)}
                inputMode="numeric"
                placeholder="2019"
                hint="Four digits. Oldest first, and no year twice."
              />
              <Field
                label="Covers through"
                name={`stop${i}_span`}
                value={row.value.span}
                onChange={(v) => set(row.uid, "span", v)}
                placeholder="—"
                hint="Only if the stop covers a period, like “through 2023”. Leave empty otherwise."
              />
              <label className="block">
                <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                  Icon
                </span>
                <select
                  name={`stop${i}_icon`}
                  value={row.value.icon}
                  onChange={(e) =>
                    set(row.uid, "icon", e.target.value as StoryIcon)
                  }
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition focus:border-orange focus:ring-4 focus:ring-orange/15"
                >
                  {STORY_ICONS.map((name) => (
                    <option key={name} value={name}>
                      {ICON_LABEL[name]}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-[0.8rem] leading-snug text-mute">
                  Drawn under this stop’s dot on the rail. A list rather than a
                  free field — a name nothing can draw would leave a gap.
                </span>
              </label>
            </div>

            <Field
              label="Title"
              name={`stop${i}_title`}
              value={row.value.title}
              onChange={(v) => set(row.uid, "title", v)}
              hint="Sentence case. The page puts it in capitals for you."
            />

            <Field
              label="Caption"
              name={`stop${i}_caption`}
              value={row.value.caption}
              onChange={(v) => set(row.uid, "caption", v)}
              placeholder="It started small."
              hint="The line under the icon on the rail. Say the same thing again, shorter."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <TextArea
                label="Paragraph"
                name={`stop${i}_body`}
                rows={3}
                value={row.value.body}
                onChange={(v) => set(row.uid, "body", v)}
                hint="What this stop says. Use this or the bullets, not both."
              />
              <TextArea
                label="Bullet points"
                name={`stop${i}_bullets`}
                rows={3}
                value={row.value.bullets.join("\n")}
                onChange={(v) =>
                  set(
                    row.uid,
                    "bullets",
                    v.split("\n").map((b) => b.trim()).filter(Boolean),
                  )
                }
                hint="One per line. Use this or the paragraph, not both."
              />
            </div>

            {row.value.body && row.value.bullets.length > 0 ? (
              <Notice tone="bad" label="Pick one">
                This stop has both a paragraph and bullets. Clear the one you
                do not want — the save will be refused until you do.
              </Notice>
            ) : null}

            <ImageField
              label="Photograph"
              name={`stop${i}_img`}
              value={row.value.img}
              onChange={(v) => set(row.uid, "img", v)}
              /* NO LOCKED SHAPE. The boxes crop with object-cover and the
                 desktop one takes whatever the viewport leaves, so there is no
                 single ratio to hold it to — only the advice below. */
              aspect={null}
              previewOnDark={false}
              previewFit="cover"
              hint="A person or a drink — a pour, a cup handed over, an office at tea break. A flask may be in use, never stacked. Keep the subject away from the edges: the picture crops."
            />
          </div>
        </fieldset>
      ))}

      <SubmitButton>Save the story</SubmitButton>
    </form>
  );
}
