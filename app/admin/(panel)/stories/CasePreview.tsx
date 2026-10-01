"use client";

/**
 * One story, as the two places it appears will show it.
 *
 * ── THE SAME JOB AS PostPreview, AND ONE DIFFERENCE WORTH SEEING ──────────
 *
 * The card here is NOT a picture with a caption under it. The headline sits
 * ON the photograph, over a dark scrim, in white — which is the whole reason
 * this preview is worth more than the posts' one. A headline that reads
 * perfectly in a black-on-white input can land on the bright part of a
 * photograph and disappear, and the form on its own cannot show that. The
 * scrim here is the real gradient from Cases.tsx, copied stop for stop.
 *
 * THE CROP IS THE OTHER HALF. The row is portrait, 3:4, and these photographs
 * are landscape — so the card shows the middle of the frame and loses the
 * sides. Seeing which middle before choosing the picture is the difference
 * between a face in the card and a shoulder.
 *
 * ── WHAT IS REAL AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The shape, the crop, the scrim, the type and the order are real. The curtain
 * that clips the card open, the counter-scale on the photograph and the amber
 * wipe under the pill are not — they are what the card does on arrival, and a
 * preview that performs while you type beside it is one people stop looking
 * at. The pill is drawn in its resting state, which is what a reader sees for
 * all but the moment the pointer is on it.
 */
export default function CasePreview({
  title,
  src,
  summary,
  body,
  id,
}: {
  title: string;
  src: string;
  summary: string;
  /** HTML from the editor — only its presence is used, never rendered here */
  body: string;
  /** the stored slug; empty on a story that has never been saved */
  id: string;
}) {
  const written = body.trim() !== "";

  /* The same rule saveCasesAction uses, so the address shown is the address
     the story will get. */
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
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[15rem] overflow-hidden rounded-xl bg-espresso-deep">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[0.75rem] text-white/60">
              No picture yet
            </span>
          )}

          {/* THE REAL SCRIM, stop for stop. Its ramp is set by where the text
              block ends rather than by eye — the note in Cases.tsx has the
              measurements. Copying it approximately would defeat the point of
              the preview, which is to show whether the headline is readable. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%]"
            style={{
              background:
                "linear-gradient(to top, rgba(12,6,4,0.95) 0%, rgba(12,6,4,0.90) 30%, rgba(12,6,4,0.66) 52%, rgba(12,6,4,0.24) 74%, rgba(12,6,4,0) 100%)",
            }}
          />

          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <span
              aria-hidden
              className="mb-2.5 block h-[3px] w-6 rounded-full bg-orange"
            />
            <p className="font-display text-[0.92rem] font-bold leading-[1.26] tracking-[-0.01em] text-white">
              {title || "No headline yet"}
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/45 px-3 py-1.5 text-[0.72rem] font-semibold text-white">
              Read the full story <span aria-hidden>&rarr;</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── THE TOP OF THE STORY ──────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          At the top of the story
        </p>
        <div className="rounded-xl border border-line bg-cream/50 px-4 py-3.5">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-mute">
            Case study
          </p>
          <p className="mt-1.5 text-[1.05rem] font-extrabold leading-[1.2] tracking-[-0.02em] text-ink">
            {title || "No headline yet"}
          </p>
          {/* THE SUMMARY IS NOT ON THE CARD — the card has room for a headline
              and nothing else. Without this it would be written blind. */}
          <p
            className={`mt-2 text-[0.85rem] leading-[1.5] ${
              summary ? "text-ink-soft" : "text-mute italic"
            }`}
          >
            {summary ||
              "No summary yet — the story opens straight into the writing."}
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
              /case-studies/{slug || "…"}
            </span>
          </p>
        ) : (
          <p className="text-[0.8rem] leading-snug text-amber-900">
            <strong className="font-bold">Nothing written yet.</strong> The card
            still shows on the home page, but it will not be clickable — and
            the &ldquo;Read the full story&rdquo; pill above will be there with
            nowhere to go.
          </p>
        )}
      </div>
    </div>
  );
}
