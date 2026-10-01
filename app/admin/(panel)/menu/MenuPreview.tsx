"use client";

import { drinkCount, type DrinkContent } from "@/lib/content/schema";

/**
 * The drinks row, roughly, as it is being edited.
 *
 * ── WHAT THIS IS FOR THAT THE FIELDS ARE NOT ──────────────────────────────
 *
 * Every card on this section is a cut-out glass standing on a POOL OF ITS OWN
 * COLOUR, and the colour is set one tab at a time. So the one thing nobody can
 * see while working — and the only thing that can go wrong across the row
 * rather than inside one card — is how the four of them look BESIDE each
 * other: two drinks given neighbouring ambers read as a repeat, and a glow
 * that is right on its own can be the loudest thing in the row.
 *
 * The per-drink colour strip already shows one wash on one ground. This shows
 * all of them at once, which is the comparison the strip cannot make.
 *
 * ── IT BORROWS THE SECTION'S OWN MATHS ────────────────────────────────────
 *
 * THE POOL IS Menu.tsx's POOL: the same radial to transparent at 68%, the same
 * 4:5 stage, positioned from the same `cx`, at the same resting 0.34 opacity.
 * Those numbers are copied and that is a duplication worth naming — if the
 * section's pool is re-tuned this has to follow, or it will confidently show
 * the wrong thing. It is four numbers against a preview that would otherwise
 * be decorative.
 *
 * THE COUNT LINE IS NOT COPIED. `drinkCount` is imported and called, the same
 * function the card, /menu and /service call. That line has already been wrong
 * on three pages at once by being typed three times; a preview retyping it
 * would be a fourth.
 *
 * NO STEAM, NO HOVER. The plume is its own canvas with a rAF loop and the
 * hover state dims every other card — neither answers a question at this size,
 * and the resting row is what a visitor meets.
 */
export default function MenuPreview({
  drinks,
  eyebrow,
  headline,
  accent,
}: {
  drinks: DrinkContent[];
  eyebrow: string;
  headline: string;
  accent: string;
}) {
  return (
    <div>
      <div className="@container overflow-hidden rounded-xl border border-line bg-espresso-deep p-4">
        {eyebrow ? (
          <p className="text-[clamp(0.4rem,1.1cqw,0.6rem)] font-bold uppercase tracking-[0.18em] text-orange">
            {eyebrow}
          </p>
        ) : null}
        <p className="mt-1 text-[clamp(0.75rem,2.4cqw,1.4rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
          {headline}
          {accent ? (
            <span className="block text-orange">{accent}</span>
          ) : null}
        </p>

        {/* The row wraps rather than scrolls. The real section decides its
            column count from the list — four fills a row exactly — and at
            preview width the cards would be unreadable at eight across. */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {drinks.map((d, i) => (
            <DrinkCard key={i} drink={d} className="w-[calc(25%-0.375rem)] min-w-[3.5rem]" />
          ))}
        </div>
      </div>

      <p className="mt-1.5 text-[0.75rem] leading-snug text-mute">
        Roughly how the row will look — the colours, pictures and counts are
        real; the steam and the hover are not.
      </p>
    </div>
  );
}

/**
 * ONE CARD, AND IT IS THE ONLY PLACE A CARD IS DRAWN.
 *
 * The row above and the single preview on each drink's own tab both render
 * this. That is the point of it being a component: a glow that looks one way
 * beside its neighbours and another way on its own tab would make one of the
 * two previews a liar, and there would be no way to tell which.
 *
 * ── THE POOL IS Menu.tsx's POOL ───────────────────────────────────────────
 *
 * Same radial to transparent at 68%, same 4:5 stage, positioned from the same
 * `cx`, at the same resting 0.34 opacity the section uses when nothing is
 * hovered. Those four numbers are COPIED from the section and that is a
 * duplication worth naming here: re-tune the pool there and this has to
 * follow, or it will confidently show the wrong thing.
 *
 * THE BLUR IS THE ONE NUMBER THAT IS DELIBERATELY DIFFERENT. The section uses
 * blur-3xl (64px) against a card several hundred pixels wide; at preview size
 * that much blur washes the pool flat across the whole stage and every drink
 * looks the same. blur-xl keeps the same SHAPE at a tenth of the size, which
 * is what the preview is being asked about.
 */
export function DrinkCard({
  drink: d,
  className = "",
  showName = true,
}: {
  drink: DrinkContent;
  className?: string;
  showName?: boolean;
}) {
  const lit = /^#[0-9a-fA-F]{6}$/.test(d.wash);

  return (
    <div className={className}>
      <div className="relative aspect-[4/5] w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[44%] h-full w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.34] blur-xl"
          style={{
            left: `${d.cx}%`,
            background: lit
              ? `radial-gradient(circle, ${d.wash}, transparent 68%)`
              : "none",
          }}
        />
        {d.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.img}
            alt=""
            className="absolute inset-0 size-full object-contain"
          />
        ) : (
          /* THE SAME THING THE SITE DOES WITH NO PHOTOGRAPH — a drawn glass in
             the drink's own colour — so an unphotographed drink previews as
             what it will actually be rather than as a gap. */
          <div
            aria-hidden
            className="absolute inset-x-[30%] bottom-[8%] top-[22%] rounded-b-[40%] rounded-t-sm border border-white/25"
            style={{
              background: lit ? `${d.wash}66` : "rgba(255,255,255,0.08)",
            }}
          />
        )}
      </div>
      {showName ? (
        <>
          <p className="mt-1 truncate text-center text-[clamp(0.42rem,1.25cqw,0.72rem)] font-extrabold leading-tight text-white">
            {d.name || "—"}
          </p>
          <p className="truncate text-center text-[clamp(0.36rem,0.95cqw,0.58rem)] text-white/70">
            {drinkCount(d)}
          </p>
        </>
      ) : null}
    </div>
  );
}
