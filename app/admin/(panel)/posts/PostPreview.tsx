"use client";

/**
 * One post, as the two places it appears will show it.
 *
 * ── WHY A PREVIEW EARNS ITS PLACE ON THIS FORM ────────────────────────────
 *
 * Seven fields, and they do not all land in the same place:
 *
 *   home page, 11  — the CARD: picture, tag, read time, headline. No summary,
 *                    no body.
 *   /blog/<slug>   — the POST: headline, summary, picture, article.
 *
 * So the summary is written for a page the card never shows, and the tag and
 * read time never appear on the post itself. Filling either in while looking
 * only at the other is how they end up written for the wrong context — the
 * same argument WorkplacePreview makes, and it holds here for the same reason.
 *
 * ── AND IT ANSWERS THE QUESTION THE FORM CANNOT ───────────────────────────
 *
 * A post with no article is not a link. The card stays in the row, looking
 * exactly like the other two, and simply does not take a click. Nothing on
 * the form said so, and nothing on the card can — so the preview says it, and
 * names the address the post will have when there is something to read.
 *
 * ── WHAT IS REAL AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The arrangement, the order, the type and the crop are real. The hover
 * movement, the rotation through the three posts and the orange underline that
 * draws under the headline are not — they are what the card DOES, and a
 * preview that moves while you are typing beside it is a preview people turn
 * away from. The picture is a plain <img> rather than next/image for the same
 * sort of reason: this is a thumbnail of a draft, not a page being served.
 */
export default function PostPreview({
  title,
  tag,
  read,
  src,
  summary,
  body,
  id,
}: {
  title: string;
  tag: string;
  read: string;
  src: string;
  summary: string;
  /** HTML from the editor — only its presence is used, never rendered here */
  body: string;
  /** the stored slug; empty on a post that has never been saved */
  id: string;
}) {
  const written = body.trim() !== "";

  /* The same rule savePostsAction uses, so the address shown is the address
     the post will get. Kept in step by being the same three replacements —
     if that ever grows a fourth, this is the other place it lives. */
  const slug =
    id ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);

  return (
    <div className="space-y-3">
      {/* ── THE CARD ON THE HOME PAGE ─────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          On the home page
        </p>
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow-1)]">
          <div className="relative aspect-[5/4] w-full bg-cream-deep">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-[0.75rem] text-mute">
                No picture yet
              </span>
            )}
          </div>

          <div className="px-4 py-3.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em]">
              <span className="text-orange-dark">{tag || "—"}</span>
              <span aria-hidden className="mx-1.5 text-line">
                &middot;
              </span>
              <span className="font-medium tracking-[0.08em] text-mute">
                {read || "—"}
              </span>
            </p>
            <p className="mt-2 text-[0.98rem] font-bold leading-[1.3] tracking-[-0.01em] text-ink">
              {title || "No headline yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── THE TOP OF THE POST ───────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          At the top of the post
        </p>
        <div className="rounded-xl border border-line bg-cream/50 px-4 py-3.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-orange-dark">
            {tag || "—"}
          </p>
          <p className="mt-1.5 text-[1.05rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            {title || "No headline yet"}
          </p>
          {/* THE ONLY PLACE THE SUMMARY APPEARS IN THIS PANEL. It is not on
              the card, so without this the field is written blind. */}
          <p
            className={`mt-2 text-[0.85rem] leading-[1.5] ${
              summary ? "text-ink-soft" : "text-mute italic"
            }`}
          >
            {summary || "No summary yet — the post opens straight into the article."}
          </p>
        </div>
      </div>

      {/* ── WHERE THE CARD GOES ───────────────────────────────── */}
      <div
        className={`rounded-xl border px-3.5 py-2.5 ${
          written
            ? "border-emerald-500/40 bg-emerald-50/60"
            : "border-amber-600/40 bg-amber-50"
        }`}
      >
        {written ? (
          <p className="text-[0.8rem] leading-snug text-emerald-800">
            The card opens{" "}
            <span className="font-mono text-[0.76rem] font-semibold">
              /blog/{slug || "…"}
            </span>
          </p>
        ) : (
          <p className="text-[0.8rem] leading-snug text-amber-900">
            <strong className="font-bold">No article yet.</strong> The card
            still shows on the home page, but it will not be clickable until
            something is written below.
          </p>
        )}
      </div>
    </div>
  );
}
