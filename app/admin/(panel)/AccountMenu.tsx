"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, SignOutIcon, UserIcon } from "./icons";

/**
 * The account button in the top bar, and the panel it opens.
 *
 * WHY THE ADDRESS MOVED INSIDE IT. It used to sit in the bar as plain text,
 * which spent the widest, most-read strip of the screen on a string that never
 * changes and that nobody needs while working — and below `sm` it had to be
 * hidden outright, because it and the breadcrumb were fighting for the same
 * room. Behind a button it is there when asked for and costs nothing when not,
 * at every width.
 *
 * "ADMINISTRATOR" IS NOT A GUESS AT A NAME. There is one account and its role
 * is fixed in `lib/admin/config.ts` — nothing here is inferring a person from an
 * email local-part, which is how "admin@" becomes "Hi, Admin" and then becomes
 * wrong the moment the address is a real one.
 *
 * SIGNING OUT FROM HERE DOES NOT SIGN ANYBODY OUT. The item asks Shell to open
 * the confirm dialog, which is where the form that posts the action lives. Two
 * controls open that dialog — this one and the sidebar's — and they have to
 * open the SAME one: a panel with one confirmed route out and one unconfirmed
 * route out is worse than one with neither, because the confirmation teaches a
 * habit the other path then breaks.
 *
 * ── THE THREE WAYS IT CLOSES ──────────────────────────────────────────────
 *
 *   A POINTER OUTSIDE IT, on `pointerdown` rather than `click`. Click fires
 *   after the button under the pointer has already been pressed, so a menu that
 *   waits for it swallows the first press on whatever is behind it.
 *
 *   ESCAPE, which also returns focus to the trigger. Without that the focus
 *   ring is left on an element that no longer exists and the next Tab starts
 *   from the top of the document.
 *
 *   A NAVIGATION. Every item in this panel is a server round trip, so the menu
 *   would otherwise still be hanging open over the page that was asked for.
 *   `usePathname` in an effect is what notices.
 */
export default function AccountMenu({
  email,
  onSignOut,
}: {
  email: string;
  /** opens the confirm dialog Shell owns */
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-[0.85rem] font-bold text-espresso transition hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
      >
        <span className="hidden sm:inline">Administrator</span>
        <ChevronDownIcon
          className={`hidden size-3.5 text-mute transition-transform duration-200 sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
        <span
          aria-hidden
          className={`grid size-9 shrink-0 place-items-center rounded-full transition ${
            open ? "bg-orange/15 text-orange-deep" : "bg-cream-deep text-ink-soft"
          }`}
        >
          <UserIcon />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          /* RIGHT-ALIGNED AND CLAMPED TO THE VIEWPORT. `right-0` pins it to the
             button's right edge, which is a hair off the window's on a phone —
             so it also gets a max width rather than a fixed one, and the
             address inside it wraps instead of pushing the panel off-screen. */
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[15rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-2)] motion-safe:animate-[menu-in_140ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <div className="px-4 pb-3.5 pt-3.5">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-mute">
              Logged in as
            </p>
            {/* `break-all` and not `truncate`: an address is the one string on
                this screen where the cut-off half is the half that identifies
                it, so it wraps to a second line rather than ending in an
                ellipsis. */}
            <p className="mt-1 break-all text-[0.85rem] font-semibold leading-snug text-ink">
              {email}
            </p>
          </div>

          <div className="border-t border-line">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[0.85rem] font-bold text-red-600 transition hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none"
            >
              <SignOutIcon className="size-[18px]" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
