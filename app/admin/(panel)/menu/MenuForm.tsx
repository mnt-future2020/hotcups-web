"use client";

import { useActionState, useId, useState } from "react";
import { saveMenuAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import VarietyList from "./VarietyList";
import ImageField from "../ImageField";
import ColorField from "../ColorField";
import { Field, Notice, ghostButton } from "../../ui";
import ConfirmDelete from "../ConfirmDelete";
import MenuPreview, { DrinkCard } from "./MenuPreview";
import {
  drinkCount,
  type DrinkContent,
  type MenuContent,
  type VarietyContent,
} from "@/lib/content/schema";

/**
 * Section 02 — the drinks, and the sentence above them.
 *
 * TABS, FOR THE SAME REASON THE HERO HAS THEM: a drink is eleven fields, and
 * four of them stacked is a long scroll for someone who came to fix one word.
 * "Heading" is first because the sentence is what a visitor reads first and
 * because it is the only part that is not per-drink.
 *
 * AND THE SAME MECHANISM: every panel is rendered and the inactive ones are
 * HIDDEN rather than unmounted. This form posts every drink on every save and
 * the action rebuilds the section from them, so a drink whose inputs were
 * absent would come back as "Drink 3 has no name" on a drink nobody touched.
 * `hidden` is display:none, and a display:none input still posts; only a
 * DISABLED one is dropped from FormData.
 *
 * THE INPUTS ARE CONTROLLED, which uncontrolled ones with defaultValue were
 * not, and the difference matters now that rows can be removed. Deleting the
 * second of four re-runs the reconciler over the survivors; anything that makes
 * React reuse a DOM node for a different drink would show the operator someone
 * else's text. Holding the values in state means what is on screen is what will
 * be posted, always.
 *
 * HOW MANY DRINKS THERE ARE IS POSTED AS A HIDDEN FIELD. The action reads
 * `drink0_*` through `drinkN_*` and needs to know N — it cannot count them off
 * the keys, because the parallel-array trick the blog and case-study repeaters
 * use does not survive a checkbox: an unchecked box posts nothing at all, so
 * the steam column would come back shorter than the others. Indexed names plus
 * a count it is.
 *
 * THE CARD NAME AND THE SENTENCE NAME SIT SIDE BY SIDE, which is the one piece
 * of this form worth designing rather than generating. They are the same drink
 * said twice — "Seasonal" on the card, "buttermilk" in the line above it — and
 * Menu.tsx records them drifting apart repeatedly: that slot "has said 'hot
 * chocolate' and 'sarbath'... both were wrong the moment the photograph under
 * them changed and neither was caught by a type". One row, one panel, the
 * photograph beneath, so the drift is visible while someone is typing rather
 * than afterwards on the live page.
 */

/** What the row looks like at each count — mirrors COLUMNS in Menu.tsx, and is
    advice rather than a rule: every count in here renders, some just read
    better than others. */
const SHAPE: Record<number, string> = {
  1: "one card on its own — the row will look sparse",
  2: "two across",
  3: "three across",
  4: "four across, which is what the row was measured at",
  5: "three then two",
  6: "three then three",
  7: "four then three",
  8: "four then four",
};

/* A new drink starts blank except for the things that have a sensible default
   and no obvious right answer: a comma separator, a mid-warm wash, and the
   three placement numbers at the middle of the frame. All of them are wrong for
   any real photograph — that is the point of the warning on the form. */
const BLANK: Omit<DrinkContent, "key"> = {
  name: "",
  noun: "options",
  /* ONE VARIETY, NOT NONE. A category with an empty list prints "0 options" on
     its card, which is a thing no one means to create — and the action refuses
     it. Starting at one means the count under a new drink reads sensibly from
     the first render. */
  varieties: [{ name: "", img: "", cover: false, tint: "#C98B4B" }],
  img: "",
  alt: "",
  label: "",
  separator: ", ",
  wash: "#C79A6B",
  rim: 45,
  cx: 50,
  mouth: 50,
  steam: true,
};

type Row = { uid: string; value: DrinkContent };

export default function MenuForm({ menu }: { menu: MenuContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveMenuAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(menu.drinks.length);
  const [rows, setRows] = useState<Row[]>(() =>
    menu.drinks.map((value, i) => ({ uid: `${idBase}-${i}`, value })),
  );

  /* 0 is the heading; 1..n index `rows` at 0..n-1. */
  const [tab, setTab] = useState(0);

  const set = <K extends keyof DrinkContent>(
    uid: string,
    field: K,
    v: DrinkContent[K],
  ) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, value: { ...r.value, [field]: v } } : r,
      ),
    );

  const add = () => {
    setRows((rs) => {
      /* THE "AND" MOVES TO THE NEW LAST DRINK. The sentence reads "Tea, filter
         coffee, milk and buttermilk" — adding a fifth drink after buttermilk
         without this gives "...milk and buttermilk, rose milk", which is wrong
         in a way that is easy to miss on a form and obvious on the page. The
         old last drink takes a comma and the new one takes the "and"; both
         fields are still editable if the client writes lists differently. */
      const next = rs.map((r, i) =>
        i === rs.length - 1 && r.value.separator.includes("and")
          ? { ...r, value: { ...r.value, separator: ", " } }
          : r,
      );
      return [
        ...next,
        {
          uid: `${idBase}-${seq}`,
          value: {
            ...BLANK,
            /* NO KEY YET, DELIBERATELY. parseContent derives one from the
               name when this is empty, so a drink the operator calls "Rose
               milk" is stored as `rose-milk` rather than as whatever
               placeholder this form would otherwise have invented before it
               had a name. React keys the panel by `uid`, not by this, so an
               empty one costs nothing here. */
            key: "",
            separator: " and ",
          },
        },
      ];
    });
    setSeq((n) => n + 1);
    /* Open the drink that was just added, or it appears as a tab the operator
       has to find. rows.length is the pre-add length, so +1 is the new tab. */
    setTab(rows.length + 1);
  };

  const remove = (uid: string) => {
    setRows((rs) => {
      if (rs.length <= 1) return rs;
      const kept = rs.filter((r) => r.uid !== uid);
      /* And back the other way: whatever is last now takes the "and". */
      return kept.map((r, i) =>
        i === kept.length - 1 && !r.value.separator.includes("and")
          ? { ...r, value: { ...r.value, separator: " and " } }
          : r,
      );
    });
    /* Step back a tab. Removing the open one would otherwise leave `tab`
       pointing past the end and show nothing at all. */
    setTab((t) => Math.max(0, Math.min(t, rows.length - 1)));
  };

  const shape = SHAPE[rows.length] ?? "more than eight — the cards get small";

  return (
    <form action={action} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <input type="hidden" name="drinkCount" value={rows.length} />

      {/* type="button" on every tab: a <button> inside a <form> defaults to
          type="submit", so without it the first tab click would save. */}
      {/* Add sits above the tabs rather than beside Save — see the note in
          Repeater.tsx. It was at the foot of the form, past the whole of
          whichever panel was open. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length} {rows.length === 1 ? "drink" : "drinks"} — {shape}
        </p>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= 8}
          title={rows.length >= 8 ? "Eight is as many as the row holds." : undefined}
          className={`${ghostButton} disabled:cursor-not-allowed`}
        >
          Add a drink
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Menu section"
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {["Heading", ...rows.map((r, i) => r.value.name || `Drink ${i + 1}`)].map(
          (label, i) => (
            <button
              /* keyed by position rather than by label — two new drinks are
                 both called "Drink n" until they are named, and a duplicate key
                 here would collapse them into one tab. */
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

      {/* ── THE HEADING ─────────────────────────────────────────
          Its own component, below, purely so this one reads as a list of tabs
          rather than a wall. Its four fields are uncontrolled: nothing adds or
          removes them, so defaultValue is enough and state would be ceremony. */}
      <HeadingFields menu={menu} hidden={tab !== 0} rows={rows} />

      {/* ── THE DRINKS ────────────────────────────────────────── */}
      {rows.map((row, i) => (
        <fieldset
          key={row.uid}
          hidden={tab !== i + 1}
          className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
        >
          <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Drink {i + 1}
          </legend>

          <input type="hidden" name={`drink${i}_key`} value={row.value.key} />

          <header className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[0.85rem] text-mute">
              Position {i + 1} of {rows.length} in the row.
            </p>
            <ConfirmDelete
              label="Remove this drink"
              title="Remove this drink?"
              body="Its names, picture, colour, steam placement and every variety inside it go with it — there is no undo on this form. The live site is unchanged until you press Save."
              confirmLabel="Remove the drink"
              onConfirm={() => remove(row.uid)}
              /* THE LAST DRINK CANNOT BE REMOVED, and the button says so rather
                 than vanishing. A control that disappears leaves the operator
                 wondering whether they mis-clicked. The action refuses an empty
                 list too — this is the courtesy, not the guarantee. */
              disabled={rows.length <= 1}
              disabledReason="At least one drink has to stay."
            />
          </header>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name on the card"
                name={`drink${i}_name`}
                value={row.value.name}
                onChange={(v) => set(row.uid, "name", v)}
                placeholder="Tea"
                hint="Capitalised, like Tea."
              />
              <Field
                label="Name in the sentence"
                name={`drink${i}_label`}
                value={row.value.label}
                onChange={(v) => set(row.uid, "label", v)}
                placeholder="tea"
                hint="The same word mid-sentence, so lower case. It lights orange as the glass comes forward."
              />
              <Field
                label="Counted in"
                name={`drink${i}_noun`}
                value={row.value.noun}
                onChange={(v) => set(row.uid, "noun", v)}
                placeholder="blends"
                hint={
                  <>
                    The word the count is said in. Write it{" "}
                    <strong className="font-semibold text-ink-soft">
                      plural
                    </strong>{" "}
                    — the card drops the “s” by itself when there is one drink.
                    The line under the name reads{" "}
                    <strong className="font-semibold text-ink-soft">
                      “{drinkCount(row.value)}”
                    </strong>
                    , counted from the drinks below rather than typed.
                  </>
                }
              />
              <Field
                label="Separator"
                name={`drink${i}_separator`}
                value={row.value.separator}
                onChange={(v) => set(row.uid, "separator", v)}
                hint="What joins this drink to the next — “, ” between, “ and ” before the last. Spaces count."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Photograph"
                name={`drink${i}_img`}
                value={row.value.img}
                onChange={(v) => set(row.uid, "img", v)}
                placeholder="/img/menu-tea.webp"
                /* NO LOCKED SHAPE. These are cut-outs, and the frame each one
                   needs is whatever its glass and garnish occupy — the badam
                   plate is 486px of content where the one before it was 728,
                   and the buttermilk's cucumber wheel sits above the rim. A
                   fixed ratio here would crop a garnish off one and leave empty
                   canvas around another. */
                aspect={null}
                hint="A cut-out picture with a see-through background."
              />

              <div className="space-y-4">
                {/* NO CONTRAST READOUT ON THIS ONE, and that is a decision
                    rather than an omission. The glow is a light bloom behind a
                    photograph on a near-black ground — nothing is set on top
                    of it, so a ratio would be a number about nothing. The
                    strip below is the real check: the colour as the gradient
                    the site actually paints. */}
                <ColorField
                  label="Glow colour"
                  name={`drink${i}_wash`}
                  value={row.value.wash}
                  onChange={(v) => set(row.uid, "wash", v)}
                  placeholder="#E5A863"
                  hint="The glow behind this glass. Take it from the drink’s own colour."
                />
                {/* ── THE GLOW, BEHIND THE ACTUAL GLASS ───────────
                    THIS WAS A FLAT STRIP of the colour on a dark ground. It
                    answered "what colour is it" — which the swatch in the
                    field above already answers — and not the question anybody
                    opens this tab to ask, which is what the glow does to THIS
                    photograph. A wash that looks rich on a bare strip can
                    vanish behind a pale glass or halo a dark one.

                    THE SAME DrinkCard THE ROW PREVIEW DRAWS, so a drink
                    cannot look one way here and another way beside its
                    neighbours. */}
                <div className="@container rounded-xl border border-line bg-espresso-deep p-3">
                  <DrinkCard
                    drink={row.value}
                    className="mx-auto w-[9rem] max-w-full"
                  />
                  <p className="mt-2 text-center text-[0.72rem] leading-snug text-cream/55">
                    The glow, behind this glass.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
                  <input
                    type="checkbox"
                    name={`drink${i}_steam`}
                    checked={row.value.steam}
                    onChange={(e) => set(row.uid, "steam", e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-orange)]"
                  />
                  <span>
                    <span className="block text-[0.9rem] font-semibold text-ink">
                      Steam
                    </span>
                    <span className="mt-0.5 block text-[0.8rem] leading-snug text-mute">
                      Off for anything served cold. A plume rising off an iced
                      drink is not a style choice — it is wrong about the drink.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                Picture description
              </span>
              <textarea
                name={`drink${i}_alt`}
                rows={2}
                value={row.value.alt}
                onChange={(e) => set(row.uid, "alt", e.target.value)}
                className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-ink outline-none transition focus:border-orange focus:ring-4 focus:ring-orange/15"
              />
              <span className="mt-1.5 block text-[0.8rem] leading-snug text-mute">
                Describe what is in the glass rather than naming the drink.
              </span>
            </label>

            {/* ── THE DRINKS INSIDE THIS ONE ────────────────────
                A category is a heading; these are what it pours. On /menu a
                card with more than one of them opens a drawer showing them all,
                which is why Seasonal expands and the other three do not.

                THEIR NUMBER IS THE COUNT ON THE CARD — "2 specials" is the
                length of this list. There is no count to type and nothing to
                keep in step. */}
            <VarietyList
              drinkIndex={i}
              drinkName={row.value.name}
              noun={row.value.noun}
              varieties={row.value.varieties}
              onChange={(v) => set(row.uid, "varieties", v)}
            />

            {/* ── THE STEAM PLACEMENT PANEL WAS HERE AND HAS GONE ────
                Three percentages — rim, centre and mouth — measured off each
                photograph. Removed at the client's direction.

                THE VALUES ARE STILL LIVE AND STILL DO TWO JOBS. CardSteam
                starts the plume at them, and `cx` also positions the pool of
                colour behind the glass — the glow the preview above draws. So
                they are three numbers that still shape the card and no longer
                have an editor. Changing one means editing data/content.json,
                or the default in lib/content/schema.ts.

                IF THE GLOW OR THE PLUME EVER SITS WRONG after a new
                photograph, this is why: they are measured against the old
                picture and nothing on this screen moves them.

                saveMenuAction WAS CHANGED WITH THIS, and the reason is not
                obvious — `Number("")` is 0, not NaN, so an absent field would
                have passed validation and written every drink's placement to
                the corner on the next save. It now keeps the stored value,
                found BY KEY rather than by index. */}
          </div>
        </fieldset>
      ))}

      <SubmitButton>Save the menu</SubmitButton>
    </form>
  );
}

/* ---------------------------------------------------------------
   The heading panel.

   ITS OWN COMPONENT ONLY SO THE FILE READS IN TAB ORDER. It holds no state of
   its own — nothing adds or removes these four fields, so they stay
   uncontrolled and `defaultValue` is enough.
   --------------------------------------------------------------- */

function HeadingFields({
  menu,
  hidden,
  rows,
}: {
  menu: MenuContent;
  hidden: boolean;
  rows: Row[];
}) {
  /* A shadow of the three fields below, so the preview follows them as they
     are typed. They stay uncontrolled — one listener is cheaper than three
     pieces of state, and the same pattern HeroForm uses. The DRINKS need no
     mirroring: `rows` is already their live value. */
  const [peek, setPeek] = useState<Record<string, string>>({});
  const peeked = (name: string, stored: string) => peek[name] ?? stored;

  return (
    <fieldset
      hidden={hidden}
      className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
      /* ON THE FIELDSET RATHER THAN THE FORM, because these three fields are
         the only ones the preview reads and this is the element that holds
         them. A listener on the form would fire for every drink field on
         every other tab as well. */
      onInput={(e) => {
        const t = e.target as HTMLInputElement;
        if (!t.name) return;
        setPeek((p) => (p[t.name] === t.value ? p : { ...p, [t.name]: t.value }));
      }}
    >
      <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
        The heading
      </legend>

      <div className="space-y-4">
        <Field
          label="Eyebrow"
          name="eyebrow"
          defaultValue={menu.eyebrow}
          hint="The small line above the headline."
        />

        <Field
          label="Headline"
          name="headline"
          defaultValue={menu.headline}
          hint="The white line. Check a long one on the live page."
        />

        <Field
          label="Headline, orange line"
          name="headlineAccent"
          defaultValue={menu.headlineAccent}
          hint="The second line, in orange. Keep it short."
        />

        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
            The sentence under it
          </p>
          {/* ASSEMBLED FROM THE LIVE ROWS, not from the saved content. The line
              is built from a field on each drink's own tab plus the ending
              below, so this is the only place the whole sentence exists — and
              reading it off `rows` means adding a drink or fixing a separator
              on another tab shows up here immediately rather than after a
              save. */}
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">
            {rows.map((r, i) => (
              <span key={r.uid}>
                <span className="font-semibold text-orange-deep">
                  {r.value.label || (
                    <em className="font-normal not-italic text-mute">
                      [drink {i + 1}]
                    </em>
                  )}
                </span>
                {r.value.separator}
              </span>
            ))}
            {menu.tail}
          </p>
          <p className="mt-2 text-[0.8rem] leading-snug text-mute">
            Each drink’s word comes from its own tab.
          </p>
        </div>

        {/* UNDER THE HEADING FIELDS AND NOT ON EACH DRINK'S TAB, because what
            it is for is the whole row at once — how the four washes sit beside
            each other. On a drink's own tab it would be showing three cards
            that tab cannot change. */}
        <MenuPreview
          drinks={rows.map((r) => r.value)}
          eyebrow={peeked("eyebrow", menu.eyebrow)}
          headline={peeked("headline", menu.headline)}
          accent={peeked("headlineAccent", menu.headlineAccent)}
        />

        <Field
          label="Ending"
          name="tail"
          defaultValue={menu.tail}
          hint="What follows the last drink, punctuation included."
        />
      </div>
    </fieldset>
  );
}
