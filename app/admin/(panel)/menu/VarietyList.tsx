"use client";

import { useEffect, useRef, useState } from "react";
import { Field, ghostButton } from "../../ui";
import ImageField from "../ImageField";
import ColorField from "../ColorField";
import { drinkCount, type VarietyContent } from "@/lib/content/schema";
import ConfirmDelete from "../ConfirmDelete";

/**
 * The drinks inside one category.
 *
 * A NESTED REPEATER, AND THE ONLY ONE IN THIS PANEL. The outer list is
 * categories — Tea, Coffee, Milk, Seasonal — and each of them holds the drinks
 * it actually pours. On /menu a category with more than one opens a drawer
 * showing them all, which is why Seasonal is the only card on that page that
 * expands today and why adding a second drink to Coffee would make that one
 * expand too.
 *
 * ITS FIELD NAMES CARRY BOTH INDICES: `drink2_v1_name` is the second drink
 * inside the third category. One index would collide the moment two categories
 * both had a second drink.
 *
 * ITS OWN COUNT IS POSTED, the same as the outer list's and for the same
 * reason: an unchecked checkbox posts nothing at all, so the parallel-array
 * trick the blog repeater uses would misalign the `cover` column against the
 * others.
 *
 * THE PHOTOGRAPH IS OPTIONAL HERE AND IS NOT ON THE CATEGORY ITSELF. A variety
 * with no picture draws a tumbler filled with its tint instead — visibly a
 * drawing, not something pretending to be a photograph — so a drink can be
 * listed before it has been shot. The category's own plate heads three
 * different pages and has no such fallback.
 *
 * THE COUNT ON THE CARD IS THIS LIST'S LENGTH. There is no count to type and
 * nothing to keep in step; that is the whole reason the stored `count` string
 * was removed.
 */
export default function VarietyList({
  drinkIndex,
  drinkName,
  noun,
  varieties,
  onChange,
}: {
  drinkIndex: number;
  drinkName: string;
  noun: string;
  varieties: VarietyContent[];
  onChange: (next: VarietyContent[]) => void;
}) {
  /* ── GO TO THE ROW THE BUTTON JUST MADE ──────────────────────────────
     Add sits in the header — the note below explains why, and it is the right
     place — but it left the operator at the top of the panel while the new
     row appeared at the bottom of a list that can run to twelve. The row was
     added correctly and was simply somewhere else, which reads as the button
     having done nothing.

     SCROLLED AND THEN FOCUSED, in that order, with preventScroll on the
     focus. Focusing alone jumps the row to whatever edge of the viewport is
     nearest rather than to the middle, and doing both without preventScroll
     makes the browser scroll twice — once smoothly and once instantly.

     KEYED ON A COUNTER, NOT ON varieties.length. A length can go back down
     and up again — add, remove, add — and an effect watching it would not
     fire the second time. A counter only ever increases. */
  const list = useRef<HTMLUListElement>(null);
  const [added, setAdded] = useState(0);

  useEffect(() => {
    if (!added) return;
    const names = list.current?.querySelectorAll<HTMLInputElement>(
      'input[name$="_name"]',
    );
    const last = names?.[names.length - 1];
    last?.scrollIntoView({ block: "center", behavior: "smooth" });
    last?.focus({ preventScroll: true });
  }, [added]);

  const set = <K extends keyof VarietyContent>(
    j: number,
    field: K,
    v: VarietyContent[K],
  ) => onChange(varieties.map((x, k) => (k === j ? { ...x, [field]: v } : x)));

  const named = drinkName || "this category";

  return (
    /* ── IT HAS TO LOOK LIKE IT IS INSIDE SOMETHING ──────────────────────
       This was a white box on a cream fieldset, which is what every other
       block on the drink's tab is — so the list of drinks INSIDE Tea read as
       a sibling of Tea's own fields rather than as a level below them. On a
       form where "Name" appears at both levels that is a real confusion, not
       a polish complaint.

       THREE THINGS SEPARATE IT and they are cheap: a rail down the left edge
       in the brand orange, a tinted ground instead of white, and the rows
       inside going white so the nesting INVERTS — the container is the tinted
       one and its children are the pale ones, the opposite of the level
       above, which reads as a change of depth without anything being said. */
    <div className="overflow-hidden rounded-xl border border-line border-l-[3px] border-l-orange/70 bg-cream-deep/50 p-4">
      {/* ADD IS IN THE HEADER, not under the list — same reasoning as the tab
          forms. Below a list of twelve drinks it was a button you had to scroll
          past all of them to reach, and then scroll back up to the row it
          created. */}
      <header className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-ink-soft">
          {/* A corner glyph — the convention for "this belongs to the thing
              above it". One character, and it does what an indent alone
              cannot near the top of a long form. */}
          <span aria-hidden className="text-orange-deep">&#8627;</span>
          Drinks inside {named}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[0.82rem] text-mute">
            The card will read{" "}
            <strong className="font-semibold text-ink">
              {drinkCount({ noun, varieties })}
            </strong>
          </p>
          <button
            type="button"
            onClick={() => {
              onChange([
                ...varieties,
                { name: "", img: "", cover: false, tint: "#C98B4B" },
              ]);
              setAdded((n) => n + 1);
            }}
            disabled={varieties.length >= 12}
            className={`${ghostButton} px-3.5 py-1.5 text-[0.82rem] disabled:cursor-not-allowed`}
          >
            Add a drink
          </button>
        </div>
      </header>

      <p className="mb-4 max-w-prose text-[0.8rem] leading-relaxed text-mute">
        {varieties.length > 1
          ? "More than one, so this card opens a drawer on the menu page showing them all."
          : "Only one, so this card does not expand on the menu page — add a second and it will."}
      </p>

      <input
        type="hidden"
        name={`drink${drinkIndex}_varietyCount`}
        value={varieties.length}
      />

      <ul ref={list} className="space-y-3">
        {varieties.map((v, j) => (
          <li
            /* KEYED BY POSITION, not by name. Two newly added drinks are both
               nameless until they are typed into, and a duplicate key would
               collapse them into one row. Position is stable here because the
               only reordering available is a delete, which re-renders the
               whole list anyway. */
            key={j}
            className="rounded-xl border border-line bg-white p-3.5"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-mute">
                {j + 1}
              </span>
              <ConfirmDelete
                label="Remove"
                title="Remove this drink?"
                body="Its name, picture and colour go with it — there is no undo on this form. The live site is unchanged until you press Save."
                confirmLabel="Remove it"
                onConfirm={() => onChange(varieties.filter((_, k) => k !== j))}
                /* THE LAST ONE CANNOT GO. A category with nothing in it prints
                   "0 specials" on its card and opens an empty drawer. The
                   action refuses it too; this is the courtesy. */
                disabled={varieties.length <= 1}
                disabledReason="A category has to pour at least one drink."
                /* SMALLER THAN THE DEFAULT: this one sits on a variety row
                   inside a drink, not on the drink's own header, and at the
                   full size it competed with the row it belongs to. */
                className="rounded-full px-2.5 py-1 text-[0.8rem] font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-mute disabled:hover:bg-transparent"
              />
            </div>

            {/* ── ONE GRID, NOT TWO STACKED ───────────────────
                This was two 2-column rows: Name beside the Photograph, then
                Colour beside Fill-the-tile underneath. The photograph's
                preview is several hundred pixels tall and Name is one line,
                so the first row left a hole the height of the picture under
                Name, and pushed Colour and the checkbox well below the row
                they belong to.

                Now the left column holds the three text controls stacked and
                the right holds the picture: the column that is tall is the one
                with a tall thing in it. */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <Field
                  label="Name"
                  name={`drink${drinkIndex}_v${j}_name`}
                  value={v.name}
                  onChange={(next) => set(j, "name", next)}
                  placeholder="Nannari Sarbath"
                />

                {/* THE SEPARATE PREVIEW SQUARE THAT SAT BESIDE THIS IS GONE —
                    ColorField's own swatch is the same thing and is also the
                    picker, so two of them was one square doing half a job. */}
                <ColorField
                  label="Colour"
                  name={`drink${drinkIndex}_v${j}_tint`}
                  value={v.tint}
                  onChange={(next) => set(j, "tint", next)}
                  placeholder="#C98B4B"
                  hint="The colour of the drawn glass when there is no picture."
                />

                <label className="flex items-start gap-3 rounded-xl border border-line bg-cream/60 px-3 py-2.5">
                  <input
                    type="checkbox"
                    name={`drink${drinkIndex}_v${j}_cover`}
                    checked={v.cover}
                    onChange={(e) => set(j, "cover", e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-orange)]"
                  />
                  <span>
                    <span className="block text-[0.85rem] font-semibold text-ink">
                      Fill the tile
                    </span>
                    <span className="mt-0.5 block text-[0.78rem] leading-snug text-mute">
                      On for a scene photographed in place; off for a cut-out
                      plate, which is centred in the tile instead.
                    </span>
                  </span>
                </label>
              </div>

              <ImageField
                label="Photograph"
                name={`drink${drinkIndex}_v${j}_img`}
                value={v.img}
                onChange={(next) => set(j, "img", next)}
                placeholder="/img/menu-sarbath.webp"
                aspect={null}
                /* The tile fits the picture both ways depending on the
                   checkbox beside it, so the preview follows the same setting
                   — "fill the tile" is then something the operator can see
                   rather than a claim they have to trust. */
                previewFit={v.cover ? "cover" : "contain"}
                hint="Optional. Leave empty to draw a glass in the colour beside it."
              />
            </div>

          </li>
        ))}
      </ul>
    </div>
  );
}
