"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A remove button that asks first.
 *
 * ── WHAT IT IS PROTECTING, WHICH IS NOT WHAT IT LOOKS LIKE ────────────────
 *
 * Not the saved content. Every one of these removes a row from a form's local
 * state — the drink, the slide, the stop is gone from the screen and nothing
 * has been written yet. The site changes when Save is pressed.
 *
 * WHAT IS ACTUALLY AT RISK IS THE TYPING. A slide holds a headline, an accent,
 * sub-copy, two button labels, two pictures, a colour and a description. One
 * miss on a button sitting in the row's own header throws all of it away with
 * no undo anywhere in this panel — the state is gone, and reloading the page
 * to get it back also discards every other unsaved change on the form.
 *
 * SO THE DIALOG SAYS BOTH THINGS. That the site is untouched until Save is
 * reassuring and true; that what you typed goes now is the warning. A
 * confirmation that only said "are you sure?" would train people to click
 * through it, which is how a confirmation becomes a speed bump and then
 * becomes nothing.
 *
 * ── A NATIVE <dialog>, FOR THE REASONS SignOutDialog LISTS ────────────────
 *
 * Focus trapped, the rest of the page inert, Escape bound to the harmless
 * half, and the top layer without this file guessing a z-index. The one thing
 * worth repeating here: these live INSIDE a <form>, so every button is
 * `type="button"`. A bare <button> in a form submits it — which on this panel
 * would mean that asking whether to remove a slide saved the hero.
 *
 * `onClose` AS WELL AS THE BUTTONS. Escape closes a dialog without touching
 * either, and a component that only listens to its own buttons is left
 * thinking it is still open and refuses to reopen.
 */
export default function ConfirmDelete({
  label,
  title,
  body,
  confirmLabel = "Remove it",
  onConfirm,
  disabled = false,
  disabledReason,
  className,
}: {
  /** the trigger's text — "Remove this slide" */
  label: string;
  /** the question — "Remove slide 3?" */
  title: string;
  /** what goes, in one or two sentences */
  body: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  /** why it is disabled, as a tooltip — a dead button with no explanation is
      the same bug as a control that does nothing */
  disabledReason?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className={
          className ??
          "rounded-full px-3 py-1.5 text-[0.82rem] font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-mute disabled:hover:bg-transparent"
        }
      >
        {label}
      </button>

      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 text-ink shadow-[var(--shadow-2)] backdrop:bg-espresso-deep/45 backdrop:backdrop-blur-[2px] motion-safe:animate-[menu-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="p-6">
          <span
            aria-hidden
            className="mb-4 grid size-11 place-items-center rounded-xl bg-red-100 text-red-600"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[22px]"
            >
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </span>

          <h2 className="text-[1.1rem] font-extrabold tracking-[-0.01em] text-espresso">
            {title}
          </h2>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
            {body}
          </p>

          <div className="mt-6 flex flex-wrap justify-end gap-2.5">
            {/* KEEP IT IS FIRST IN THE DOM and therefore first in the tab
                order — a modal should open with focus on the way out, not on
                the button that does the thing. */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line px-5 py-2.5 text-[0.85rem] font-bold text-ink-soft transition hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
              className="rounded-full bg-red-600 px-5 py-2.5 text-[0.85rem] font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/25"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
