"use client";

import { askFor } from "@/lib/content/links";
import type { ContactContent } from "@/lib/content/schema";
import { ChatIcon } from "../icons";

/**
 * One workplace, as it appears in the two places it appears.
 *
 * ── WHY BOTH AND NOT ONE ──────────────────────────────────────────────────
 *
 * The five fields on this form do not all land in the same place, and that is
 * the thing the form could not say on its own:
 *
 *   /who-we-serve  — the CARD: photograph, name, "Get pricing for …", and a
 *                    message button whose link is built from the OTHER phrase.
 *   home, 04       — the LIST: name in orange with the timing line under it,
 *                    beside the photograph.
 *
 * So "Timing" never shows on the card and "In the message" never shows as
 * text anywhere — it is the body of an email and a WhatsApp thread. Filling
 * either one in while looking only at the other is how they end up written for
 * the wrong context. Two small previews cost less than the sentence explaining
 * that.
 *
 * ── WHAT IS REAL AND WHAT IS NOT ──────────────────────────────────────────
 *
 * The arrangement, the order and the words are real. The message link is NOT
 * live — it shows the sentence that would be sent rather than opening a mail
 * client, because a preview that fires a mailto every time it is clicked is a
 * preview nobody clicks twice. The Contact screen is where those links are
 * meant to be tested, and they are clickable there.
 */
export default function WorkplacePreview({
  name,
  src,
  caption,
  forPhrase,
  askPhrase,
  contact,
}: {
  name: string;
  src: string;
  caption: string;
  forPhrase: string;
  askPhrase: string;
  /** for the message line — the sentence is stored, not written here */
  contact: ContactContent;
}) {
  return (
    <div className="space-y-3">
      {/* ── THE CARD ON /who-we-serve ─────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          On /who-we-serve
        </p>
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="relative aspect-[4/3] w-full bg-cream-deep">
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
          <div className="px-4 py-3">
            <p className="text-[0.95rem] font-bold tracking-[-0.015em] text-ink">
              {name || "—"}
            </p>
            {/* The hairline is what makes this read as a card rather than a
                caption: name, rule, actions. Same order as the real one. */}
            <div className="mt-3 flex items-center gap-3 border-t border-line/70 pt-3">
              <span className="text-[0.8rem] font-semibold text-orange-deep">
                Get pricing for {forPhrase || "…"} &rarr;
              </span>
              <span className="ml-auto grid size-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft">
                <ChatIcon className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── THE LINE ON THE HOME PAGE ─────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          On the home page
        </p>
        {/* THE SAME THREE THINGS IN THE SAME ORDER as section 04's panel:
            the name in orange small caps, the timing under it set large, and
            the photograph below both. This was two lines of text in a box,
            which showed the words but not the thing — and the photograph is
            doing most of the work on that panel.

            NO DRINKS LINE, THOUGH THE REAL PANEL HAS ONE. "Tea · Filter
            coffee · Milk · Buttermilk" sits under the photograph there, and
            it comes from the Menu screen rather than this one. Showing it
            would invite somebody to come here to change it. */}
        <div className="overflow-hidden rounded-xl border border-line bg-cream/60">
          <div className="px-4 pb-3 pt-3">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-orange-dark">
              {name || "—"}
            </p>
            <p className="mt-1 text-[0.95rem] font-bold leading-snug tracking-[-0.015em] text-ink">
              {caption || "…"}
            </p>
          </div>
          <div className="relative aspect-[16/10] w-full bg-cream-deep">
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
        </div>
      </div>

      {/* ── WHAT THE MESSAGE SAYS ─────────────────────────────── */}
      <div>
        <p className="mb-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          The email and WhatsApp say
        </p>
        <div className="rounded-xl border border-line bg-cream/60 px-4 py-3">
          {/* BUILT BY askFor(), NOT RETYPED. This was a copy of the sentence
              from lib/content/links.ts with the phrase interpolated — correct
              on the day it was written and a lie the moment anybody reworded
              the original. The opening line is now stored content, editable on
              the Contact screen, so this calls the same function the mailto
              and the WhatsApp link call and cannot disagree with them. */}
          <p className="text-[0.82rem] leading-relaxed text-ink-soft">
            “{askFor(contact, askPhrase || "…")}”
          </p>
        </div>
      </div>
    </div>
  );
}
