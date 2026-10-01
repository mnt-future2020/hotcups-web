"use client";

/**
 * Page controls for a table.
 *
 * ── IT PAGES THE TABLE, NEVER THE FORM ────────────────────────────────────
 *
 * Both lists that use this post PARALLEL ARRAYS — getAll("title") zipped with
 * getAll("src") by position — so every row's inputs have to stay in the
 * document whichever page is showing. Slicing the form instead of the table
 * would not hide the other rows, it would DELETE them on the next save, and
 * nothing on screen would say so: the save would report success with the right
 * wording and the wrong count.
 *
 * That rule lives with the callers, which slice only what they render. This
 * file is the control; the comment is here because this is where somebody
 * looking for "how does paging work" will land.
 *
 * ── IT RETURNS NOTHING AT ONE PAGE ────────────────────────────────────────
 *
 * A pager reading "1" cannot do anything, and this panel has spent its time
 * removing controls like that. The caller does not have to remember to check.
 */
export default function Pager({
  page,
  pageCount,
  from,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  /** index of the first row on this page, for the range readout */
  from: number;
  pageSize: number;
  total: number;
  onPage: (n: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5">
      <p className="text-[0.78rem] text-mute">
        {from + 1}–{Math.min(from + pageSize, total)} of {total}
      </p>

      <div className="ml-auto flex items-center gap-1">
        <Arrow
          label="Previous"
          glyph="←"
          disabled={page === 0}
          onClick={() => onPage(Math.max(0, page - 1))}
        />
        {Array.from({ length: pageCount }, (_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
            className={`size-8 rounded-lg text-[0.8rem] font-bold tabular-nums transition ${
              n === page
                ? "bg-espresso text-cream"
                : "text-ink-soft hover:bg-cream"
            }`}
          >
            {n + 1}
          </button>
        ))}
        <Arrow
          label="Next"
          glyph="→"
          disabled={page === pageCount - 1}
          onClick={() => onPage(Math.min(pageCount - 1, page + 1))}
        />
      </div>
    </div>
  );
}

/** Disabled rather than hidden at the ends: a control that vanishes moves the
    one beside it under the pointer. */
function Arrow({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-[0.9rem] text-ink-soft transition hover:bg-cream disabled:cursor-not-allowed disabled:text-mute/40 disabled:hover:bg-transparent"
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}
