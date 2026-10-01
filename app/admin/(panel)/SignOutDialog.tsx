"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { SignOutIcon } from "./icons";

/**
 * The "are you sure" in front of signing out.
 *
 * WHAT IT IS ACTUALLY PROTECTING. Not the sign-out itself — that costs a
 * password to undo, which is an annoyance rather than a loss. It is protecting
 * the FORM you are in the middle of. Nothing in this panel saves as you type;
 * every screen is a form that posts on its own Save button, so an accidental
 * click here throws away however long was spent filling one in, with no draft
 * kept anywhere and no way back. That is the sentence the dialog leads with,
 * because "are you sure?" on its own trains people to click through it.
 *
 * ── A NATIVE <dialog>, AND THE REASONS ARE NOT COSMETIC ───────────────────
 *
 * `showModal()` brings four behaviours that a positioned <div> has to
 * reimplement and usually reimplements incompletely:
 *
 *   FOCUS IS TRAPPED inside it, so Tab cannot wander onto the form behind and
 *   edit a field that is about to be abandoned.
 *   THE REST OF THE PAGE GOES INERT — not merely covered. A screen reader
 *   cannot read through it and a click cannot reach it.
 *   ESCAPE CLOSES IT, which is the correct binding for the harmless half of a
 *   destructive choice and the one every user already knows.
 *   IT RENDERS IN THE TOP LAYER, above the sticky top bar and the sidebar,
 *   without this file having to know or guess a z-index.
 *
 * THE STATE LIVES IN Shell AND NOT HERE. Two separate controls open this — the
 * account menu and the sidebar — and if the dialog owned its own state there
 * would have to be two of it. Two dialogs is how you end up with one of them
 * confirming and the other not.
 *
 * `onClose` IS WIRED AS WELL AS `onCancel`. Escape fires the dialog's own close
 * without going anywhere near the Cancel button, so a component that only
 * listens to its buttons is left believing the dialog is still open and will
 * refuse to reopen it.
 */
export default function SignOutDialog({
  open,
  onClose,
  signOut,
}: {
  open: boolean;
  onClose: () => void;
  signOut: () => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-0 text-ink shadow-[var(--shadow-2)] backdrop:bg-espresso-deep/45 backdrop:backdrop-blur-[2px] motion-safe:animate-[menu-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="p-6">
        <span
          aria-hidden
          className="mb-4 grid size-11 place-items-center rounded-xl bg-red-100 text-red-600"
        >
          <SignOutIcon className="size-[22px]" />
        </span>

        <h2 className="text-[1.1rem] font-extrabold tracking-[-0.01em] text-espresso">
          Sign out of the panel?
        </h2>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
          Anything typed into a form and not yet saved is lost — this panel keeps
          no drafts. Signing back in needs the password again.
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          {/* CANCEL IS FIRST IN THE DOM and therefore first in the tab order,
              which is the point: the focus a modal opens with should land on
              the way out, not on the button that does the thing. */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-5 py-2.5 text-[0.85rem] font-bold text-ink-soft transition hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
          >
            Stay signed in
          </button>

          <form action={signOut}>
            <ConfirmButton />
          </form>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Split out ONLY so it can call `useFormStatus`, which reads the nearest form
 * above it and therefore returns nothing if called in the component that
 * renders that form.
 *
 * The pending state matters more here than on a normal Save: this action
 * deletes the session cookie and redirects, so the window between click and
 * navigation is one where the button still looks clickable and clicking it
 * again posts a second time.
 */
function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-red-600 px-5 py-2.5 text-[0.85rem] font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
