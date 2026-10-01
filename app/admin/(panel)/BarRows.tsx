/**
 * A short horizontal bar chart.
 *
 * ONE MEASURE, ONE HUE. The bars compare a single quantity across named
 * categories, so there is exactly one series and therefore exactly one colour —
 * brand orange-deep, which measures above 3:1 on this card's white and is the
 * token the palette already keeps for marks that are not large text. A ramp
 * would double-encode: the bar's LENGTH is the magnitude, and shading it by the
 * same number says nothing the length has not already said. Colouring each
 * category differently would be worse still — it would imply the hue carries
 * identity, and then a category added in the panel would need a fifth hue.
 *
 * NO LEGEND, BECAUSE ONE SERIES NEEDS NONE. The title names the measure and
 * each row is labelled; a legend box would be a key to a single colour.
 *
 * NO TOOLTIP, AND THAT IS THE EXCEPTION RATHER THAN THE DEFAULT. A chart this
 * size hides nothing behind hover — every bar carries its value as a direct
 * label, so there is no second reading for a tooltip to reveal. The rule
 * against a number on every mark is about dense series; four rows is not one.
 *
 * NO AXIS. With direct labels and a shared track the gridline would be
 * decoration. The track itself shows the scale: every bar is measured against
 * the same full width.
 *
 * HORIZONTAL, NOT VERTICAL. The categories are named things — "Seasonal",
 * "Filter Coffee" — and horizontal rows give a name as much width as it needs
 * without rotating it. Vertical bars would need angled labels at four
 * categories and worse at eight.
 */

export type BarRow = {
  label: string;
  value: number;
  /** shown in muted ink after the value — "opens a drawer", "1 blend" */
  note?: string;
};

export default function BarRows({
  rows,
  max,
  unit,
}: {
  rows: BarRow[];
  /** the scale's top. Passed rather than derived so several charts can share a
      scale — and so a single-bar chart does not draw itself full width. */
  max?: number;
  unit?: string;
}) {
  /* A FLOOR OF 1 ON THE SCALE, so an all-zero set does not divide by zero and
     render every bar full width — which is the shape "no data" would otherwise
     take, and it looks identical to "everything is at maximum". */
  const top = Math.max(1, max ?? Math.max(...rows.map((r) => r.value), 1));

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => {
        const pct = (row.value / top) * 100;
        return (
          <li key={row.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-[0.875rem] font-semibold text-ink">
                {row.label}
              </span>
              <span className="shrink-0 text-[0.8rem] text-mute">
                {/* THE VALUE WEARS TEXT INK, NOT THE BAR'S COLOUR. The mark
                    beside it already carries the identity; colouring the number
                    too makes the figure harder to read and says nothing more. */}
                <strong className="font-bold text-ink tabular-nums">
                  {row.value}
                </strong>
                {unit ? ` ${unit}` : null}
                {row.note ? ` · ${row.note}` : null}
              </span>
            </div>
            <div
              /* The track is the scale. role/aria turn the pair into something
                 a screen reader can read as a value rather than as two divs. */
              role="img"
              aria-label={`${row.label}: ${row.value}${unit ? ` ${unit}` : ""}`}
              className="h-2.5 w-full overflow-hidden rounded-full bg-cream-deep"
            >
              <div
                className="h-full rounded-full bg-[#B8420C] transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                /* A FLOOR OF 3% ON THE DRAWN WIDTH, not on the value. A real
                   count of 1 against a max of 12 is 8% and draws fine; this is
                   for the zero case, where a bar of no width is
                   indistinguishable from a missing row. It is a rounded stub
                   that reads as "none", and the number beside it says so. */
                style={{ width: `${Math.max(row.value === 0 ? 0 : 3, pct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
