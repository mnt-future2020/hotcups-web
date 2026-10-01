"use client";

import { useActionState, useId, useState } from "react";
import { saveWhoWeServeAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import ImageField from "../ImageField";
import { Field, Notice, TextArea, ghostButton } from "../../ui";
import ConfirmDelete from "../ConfirmDelete";
import WorkplacePreview from "./WorkplacePreview";
import {
  workplaceCount,
  type ContactContent,
  type WhoWeServeContent,
  type WorkplaceContent,
} from "@/lib/content/schema";

/**
 * Section 04 and /who-we-serve — the workplaces.
 *
 * ONE LIST, THREE READERS. Section 04 shows them as chips beside one large
 * photograph, /who-we-serve as a grid of cards, and section 09's pricing block
 * reads whichever one a visitor picked to write the email. They used to be
 * three separate declarations plus a fourth copy in lib/workplace.
 *
 * NEITHER COUNT IS ON THIS FORM. The eyebrow ("The seven") and the headline
 * ("Seven kinds of workplace") are both counted off the list below. They were
 * typed before, and the page went live reading "six" over seven cards.
 *
 * THE TWO PHRASES ARE THE PART WORTH SLOWING DOWN FOR. They are not the name
 * and they are not each other: one finishes "Get pricing for ___" on a link, the
 * other goes into a sentence a human reads at the other end of an email. A
 * campus is "a campus" on the button and "a college campus" in the message.
 */

type Row = { uid: string; value: WorkplaceContent };

const BLANK: Omit<WorkplaceContent, "key"> = {
  name: "",
  src: "",
  caption: "",
  fact: "",
  /* TRUE, because a fact nobody has written yet is certainly not the client's
     word. It is the cautious direction and the one that keeps the flag
     meaningful. */
  placeholder: true,
  forPhrase: "",
  askPhrase: "",
};

export default function WorkplacesForm({
  whoWeServe,
  contact,
}: {
  whoWeServe: WhoWeServeContent;
  /* Read-only here, and only for the preview: the enquiry sentence is edited
     on the Contact screen. Passing it rather than importing the store keeps
     this a client component. */
  contact: ContactContent;
}) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveWhoWeServeAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(whoWeServe.places.length);
  const [rows, setRows] = useState<Row[]>(() =>
    whoWeServe.places.map((value, i) => ({ uid: `${idBase}-${i}`, value })),
  );
  /* 0 is the heading; 1..n index `rows`. */
  const [tab, setTab] = useState(0);

  const set = <K extends keyof WorkplaceContent>(
    uid: string,
    field: K,
    v: WorkplaceContent[K],
  ) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, value: { ...r.value, [field]: v } } : r,
      ),
    );

  const add = () => {
    setTab(rows.length + 1);
    setRows((rs) => [
      ...rs,
      { uid: `${idBase}-${seq}`, value: { ...BLANK, key: "" } },
    ]);
    setSeq((n) => n + 1);
  };

  const remove = (uid: string) => {
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));
    setTab((t) => Math.max(0, Math.min(t, rows.length - 1)));
  };

  const count = workplaceCount(rows);

  return (
    <form action={action} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <input type="hidden" name="placeCount" value={rows.length} />

      {/* Add sits top right, above the tabs — see the note in Repeater.tsx. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length} {rows.length === 1 ? "workplace" : "workplaces"}
        </p>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= 12}
          title={rows.length >= 12 ? "Twelve is the ceiling." : undefined}
          className={`${ghostButton} disabled:cursor-not-allowed`}
        >
          Add a workplace
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Workplaces"
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {["Heading", ...rows.map((r, i) => r.value.name || `New ${i + 1}`)].map(
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
          {/* WHAT IT WILL SAY, with both counts filled in from the live rows —
              so adding a workplace on another tab shows here immediately. */}
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-mute">
              {whoWeServe.eyebrowLead} {count.toLowerCase()}
            </p>
            <p className="mt-2 text-[1.25rem] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              {count} {whoWeServe.headlineTail}
            </p>
            <p className="mt-3 text-[0.8rem] leading-snug text-mute">
              Both numbers are counted from the list below. Nothing to type.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Eyebrow, before the number"
              name="w_eyebrowLead"
              defaultValue={whoWeServe.eyebrowLead}
              hint="“The”, giving “The seven”."
            />
            <Field
              label="Headline, after the number"
              name="w_headlineTail"
              defaultValue={whoWeServe.headlineTail}
              hint="“kinds of workplace, one round.”"
            />
          </div>

          <TextArea
            label="Sub-copy"
            name="w_sub"
            rows={2}
            defaultValue={whoWeServe.sub}
            hint="The invitation to everyone not on the list."
          />
        </div>
      </fieldset>

      {/* ── THE WORKPLACES ────────────────────────────────────── */}
      {rows.map((row, i) => (
        <fieldset
          key={row.uid}
          hidden={tab !== i + 1}
          className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
        >
          <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Workplace {i + 1}
          </legend>

          <input type="hidden" name={`place${i}_key`} value={row.value.key} />

          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.85rem] text-mute">
              {i + 1} of {rows.length}
            </p>
            <ConfirmDelete
              label="Remove this workplace"
              title="Remove this workplace?"
              body="Its name, picture, timing line and both pricing phrases go with it — there is no undo on this form. The live site is unchanged until you press Save."
              confirmLabel="Remove the workplace"
              onConfirm={() => remove(row.uid)}
              disabled={rows.length <= 1}
              disabledReason="At least one workplace has to stay."
            />
          </header>

          {/* FIELDS LEFT, THE CARD RIGHT AND STUCK THERE. The same shape the
              hero form uses, and here it earns it twice over: the five fields
              land in three different places on the site, so seeing where each
              one goes is most of what this screen has to teach. */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                name={`place${i}_name`}
                value={row.value.name}
                onChange={(v) => set(row.uid, "name", v)}
                placeholder="IT &amp; offices"
                hint="The chip on the home page, and the card heading."
              />
              <Field
                label="Timing"
                name={`place${i}_caption`}
                value={row.value.caption}
                onChange={(v) => set(row.uid, "caption", v)}
                placeholder="desk-side, twice a day"
                hint="When the flasks are there — “three shifts”, “round the clock”."
              />
            </div>

            {/* ── TWO WORDINGS OF THE SAME PLACE, UNDER ONE HEADING ──
                THEY LOOKED LIKE TWO UNRELATED FIELDS with cryptic names —
                "Pricing link reads for …" and "The message says for …" — so
                filling one in meant working out what the other was for.
                Boxed together with the sentence they complete shown above
                them, the pair explains itself and the labels can drop to two
                words each.

                NEITHER COULD BE DELETED, and it was checked rather than
                assumed: they differ on four of the seven workplaces. The
                button says "a campus" where the message says "a college
                campus", "an event" against "a wedding or function". Merging
                them would either put "a showroom or bank branch" on a button
                or send "Get pricing for a showroom" in an email that could
                have been specific. */}
            <div className="rounded-xl border border-line bg-white p-3.5">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Get pricing for …
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field
                  label="On the button"
                  name={`place${i}_forPhrase`}
                  value={row.value.forPhrase}
                  onChange={(v) => set(row.uid, "forPhrase", v)}
                  placeholder="an office"
                  hint="Short. Include the article."
                />
                <Field
                  label="In the message"
                  name={`place${i}_askPhrase`}
                  value={row.value.askPhrase}
                  onChange={(v) => set(row.uid, "askPhrase", v)}
                  placeholder="a college campus"
                  hint="Can be longer and more specific."
                />
              </div>
            </div>

            {/* THE FACT FIELD WAS HERE. It edited the sentence that appeared
                when a chip was opened on the home page; that sentence has been
                removed from the site, so there is nothing left for this to
                edit. The stored text is kept — see the note in the schema —
                but nothing renders it. */}

            {/* ── THE "NOT CONFIRMED" TICK WAS HERE AND HAS GONE ──────
                A per-workplace flag marking a fact line as written from the
                photograph rather than told to us by the client. Removed at
                the client's direction.

                THE STORED FLAGS STAY AND NOW HAVE NO EDITOR. Nothing on the
                live site ever read them — Industries.tsx and
                /who-we-serve reference `placeholder` in their notes as the
                record of which six lines were invented, which is why the
                field is kept rather than dropped from the schema.

                THE DASHBOARD ITEM AND THE PAGE NOTICE WENT WITH IT, and that
                was not optional. Both counted unticked flags; with no way
                left to tick one, "6 workplace fact lines were written from
                the photographs" would have sat on the dashboard permanently.
                A to-do list that cannot reach zero stops being read — the
                same reason the readiness ring came off that page.

                saveWorkplacesAction KEEPS THE STORED VALUE for the same
                reason every other removed control needed a guard: an absent
                checkbox posts nothing, `formData.get() === "on"` is then
                false, and the first save would have quietly cleared all six.
                Silently marking invented copy as client-confirmed is the one
                failure here that would matter. */}


            <ImageField
              label="Photograph"
              name={`place${i}_src`}
              value={row.value.src}
              onChange={(v) => set(row.uid, "src", v)}
              /* 4:3, WHICH IS THE HOME PAGE'S FRAME. Section 04 draws this in
                 an aspect-[4/3] box with object-cover, so anything outside that
                 ratio is cropped there — centre-weighted, with no say in what
                 goes. Locking the crop box to it means the operator chooses
                 which part survives. /who-we-serve's card is close enough to
                 the same shape that one ratio serves both. */
              aspect={4 / 3}
              previewOnDark={false}
              previewFit="cover"
              hint="A real workplace with people and drinks in it. Keep the subject away from the edges: the picture crops."
            />
            </div>

            <div className="shrink-0 xl:sticky xl:top-[5.5rem] xl:w-[22rem]">
              <WorkplacePreview
                name={row.value.name}
                src={row.value.src}
                caption={row.value.caption}
                forPhrase={row.value.forPhrase}
                askPhrase={row.value.askPhrase}
                contact={contact}
              />
            </div>
          </div>
        </fieldset>
      ))}

      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}
