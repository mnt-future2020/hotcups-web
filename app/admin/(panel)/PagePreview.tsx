"use client";

import { useState } from "react";
import { sanitizeHtml } from "@/lib/content/html";
import { sections } from "@/lib/content/sections";

/**
 * The whole page, as it will be published.
 *
 * ── WHY THE SMALL CARD PREVIEW WAS NOT ENOUGH ─────────────────────────────
 *
 * The card preview answers "what does this look like in the row". It cannot
 * answer the question somebody writing a 600-word article actually has, which
 * is whether the piece READS — whether the headings land in the right places,
 * whether a list is doing work or padding, whether the opening paragraph
 * survives being under a photograph. That needs the page at its real measure,
 * with the real type, in the real order.
 *
 * ── IT SANITISES, AND THAT IS NOT PARANOIA — IT IS THE POINT ──────────────
 *
 * The body in the editor has NOT been through sanitizeHtml yet; cleaning
 * happens on save. So this preview runs the same cleaner the action will and
 * renders the RESULT. Two things follow, and the second is the reason:
 *
 *   1. Nothing pasted into a contentEditable can run script in the operator's
 *      own browser while they are looking at it.
 *   2. The preview is HONEST. Paste from a document and half the formatting is
 *      not in the allowlist — font tags, colours, spans, inline styles.
 *      Showing the raw editor HTML would preview something that is never going
 *      to exist. This shows what will be stored, so the formatting about to be
 *      dropped is visible BEFORE Save rather than after.
 *
 * It is also what makes the split below safe: `sections` splits on <h2> with a
 * regex, which is only sound because the cleaner guarantees the shape of that
 * tag. Cleaning first is not an extra step here, it is the precondition.
 *
 * ── TWO LAYOUTS, AND THEY NOW DIFFER IN ONE THING ─────────────────────────
 *
 * Both pages put the picture beside the headline and both alternate their
 * sections down the page. They part at the HEAD: a post opens on cream, a case
 * study opens on espresso with cream type, carrying through the dark card it
 * was clicked from. That is the whole difference, so it is the whole
 * difference here too — `layout` is not a style choice, it names which
 * published page this is standing in for, and a preview that got this wrong
 * would be worse than no preview because it would be believed.
 *
 * ── THE SHAPE FOLLOWS THE PICTURE, THE WAY THE PAGE DOES ──────────────────
 *
 * The published post page reads the photograph's ratio off the file on the
 * server and gives a tall one a narrower column, because a square beside a
 * headline at equal width turns the head into a picture with a caption. The
 * browser cannot read files, but it has the image — so the ratio is taken on
 * load and the same rule applied. Until it loads the layout is the landscape
 * one, which is the common case and settles without a visible jump.
 *
 * ── WHAT IS REAL AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The order, the type, the measure, the alternation and the body styling are
 * real — .post-body is the same global rule the published page uses, not a
 * copy of it. The site header and footer are not here: they are the same on
 * every page and would cost the preview a third of its height to say nothing.
 *
 * The one honest difference is WIDTH. The page runs to 1480px and the sheet is
 * 58rem, so everything is proportionally narrower here. That is why the
 * columns break at sm rather than the page's md — holding out for md inside a
 * panel would show a stacked column on a laptop and hide the very thing being
 * previewed.
 */
export default function PagePreview({
  eyebrow,
  meta,
  title,
  summary,
  src,
  body,
  emptyBody,
  layout,
}: {
  /** the small label above the headline — "Case study", or the post's tag */
  eyebrow: string;
  /** the line beside the eyebrow, or null — the post's read time */
  meta?: string | null;
  title: string;
  summary: string;
  src: string;
  /** HTML straight from the editor, not yet cleaned */
  body: string;
  /** what to say when nothing has been written */
  emptyBody: string;
  /** which published page this is standing in for */
  layout: "post" | "case";
}) {
  const clean = sanitizeHtml(body);
  const parts = sections(clean);

  /** width ÷ height of the lead picture, once the browser has it */
  const [ratio, setRatio] = useState<number | null>(null);
  const tall = ratio !== null && ratio < 1.3;

  const dark = layout === "case";

  /* The head's type, which is the only part that changes colour. Both pages
     put it beside the picture; only the ground underneath differs. */
  const head = (
    <div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] font-semibold">
        {/* ORANGE ON ESPRESSO, NOT orange-deep. orange-deep is the step mixed
            to pass on CREAM and it goes muddy on a dark ground; plain orange
            is the card's own accent and clears on espresso. The same swap the
            published page makes. */}
        <span
          className={`uppercase tracking-[0.14em] ${
            dark ? "text-orange" : "text-orange-dark"
          }`}
        >
          {eyebrow || "—"}
        </span>
        {meta ? (
          <>
            <span
              aria-hidden
              className={dark ? "text-cream/40" : "text-mute/50"}
            >
              &middot;
            </span>
            <span className={dark ? "text-cream/70" : "text-mute"}>{meta}</span>
          </>
        ) : null}
      </p>

      <h1
        className={`mt-3 max-w-[20ch] font-display text-[clamp(1.4rem,2.6vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] ${
          dark ? "text-cream" : "text-ink"
        }`}
      >
        {title || "No headline yet"}
      </h1>

      {summary ? (
        <p
          className={`mt-4 max-w-[46ch] font-sans text-[0.98rem] leading-[1.6] ${
            dark ? "text-cream/75" : "text-ink-soft"
          }`}
        >
          {summary}
        </p>
      ) : null}
    </div>
  );

  const picture = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onLoad={(e) => {
        const el = e.currentTarget;
        if (el.naturalHeight > 0) setRatio(el.naturalWidth / el.naturalHeight);
      }}
      className="w-full rounded-[var(--radius-media)]"
    />
  ) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-cream">
      {/* A BROWSER CHROME, AND IT IS NOT DECORATION. Without a frame this is
          text on a cream ground inside a white sheet, which reads as more of
          the form. The bar says "this is a page". */}
      <div className="flex items-center gap-1.5 border-b border-line bg-white px-3.5 py-2">
        <span aria-hidden className="size-2 rounded-full bg-line" />
        <span aria-hidden className="size-2 rounded-full bg-line" />
        <span aria-hidden className="size-2 rounded-full bg-line" />
        <span className="ml-2 text-[0.72rem] text-mute">
          How this page will look
        </span>
      </div>

      {/* THE PADDING MOVED OFF THE SCROLLER AND ONTO THE BLOCKS INSIDE IT.
          A case study's head runs edge to edge on the published page, and a
          dark band with cream down either side would read as a banner placed
          on the page rather than the top of it. It cannot be full-bleed while
          its parent carries the gutter. */}
      <div className="max-h-[calc(86vh-9rem)] overflow-y-auto">
        <div
          className={`px-5 pb-7 pt-6 sm:px-7 ${dark ? "bg-espresso" : ""}`}
        >
          <p
            className={`text-[0.8rem] font-semibold ${
              dark ? "text-orange" : "text-orange-deep"
            }`}
          >
            <span aria-hidden>&larr;</span>{" "}
            {dark ? "All stories" : "All posts"}
          </p>

          <div className="mt-6">
            {!src ? (
              head
            ) : (
              <div
                className={`grid gap-x-7 gap-y-6 sm:items-center ${
                  tall
                    ? "sm:grid-cols-[1.35fr_minmax(0,1fr)]"
                    : "sm:grid-cols-[1fr_minmax(0,1.05fr)]"
                }`}
              >
                {head}
                {picture}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-7 sm:px-7">
          {!clean ? (
            <p className="mt-7 rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center text-[0.85rem] leading-snug text-mute">
              {emptyBody}
            </p>
          ) : (
            <ZigZag parts={parts} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The alternating body, at preview scale.
 *
 * IT IS THE SAME ARRANGEMENT AS app/(site)/blog/[slug], not an impression of
 * it: same split, same first-section-left rule, same `order` swap, same
 * numbering that skips the opening paragraph, same 62ch cap on the prose. The
 * sizes are smaller because the sheet is narrower than the page — that is the
 * one difference, and it is the one a preview is allowed.
 */
function ZigZag({
  parts,
}: {
  parts: { heading: string | null; body: string }[];
}) {
  let n = 0;

  return (
    <div className="mt-10 space-y-9">
      {parts.map((part, i) => {
        if (!part.heading) {
          return (
            <div
              key={`lede-${i}`}
              className="post-body max-w-[46rem] font-sans text-[1.02rem] leading-[1.7] text-ink"
              dangerouslySetInnerHTML={{ __html: part.body }}
            />
          );
        }

        n += 1;
        const flipped = n % 2 === 0;

        return (
          <section
            key={`s-${i}`}
            className="grid gap-x-7 gap-y-3 border-t border-line pt-7 sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"
          >
            <div className={flipped ? "sm:order-2 sm:text-right" : ""}>
              <p className="text-[0.66rem] font-extrabold tracking-[0.2em] text-orange-dark">
                {String(n).padStart(2, "0")}
              </p>
              <h2
                className={`mt-1.5 max-w-[16ch] font-display text-[1.05rem] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink ${
                  flipped ? "sm:ml-auto" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: part.heading }}
              />
              <span
                aria-hidden
                className={`mt-3 block h-[3px] w-8 rounded-full bg-orange ${
                  flipped ? "sm:ml-auto" : ""
                }`}
              />
            </div>

            <div
              className={`post-body max-w-[62ch] font-sans text-[0.95rem] leading-[1.7] text-ink-soft ${
                flipped ? "sm:order-1" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: part.body }}
            />
          </section>
        );
      })}
    </div>
  );
}
