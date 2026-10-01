"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/layout/Logo";
import { NAV_GROUPS, currentLabel, isActive } from "./nav-items";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExternalIcon,
  MenuIcon,
  SignOutIcon,
} from "./icons";
import AccountMenu from "./AccountMenu";
import SignOutDialog from "./SignOutDialog";

/**
 * The panel's chrome: a fixed sidebar, a top bar, and the page between them.
 *
 * A CLIENT COMPONENT, AND THE LAYOUT AROUND IT IS NOT. Three things here need
 * the browser — the active nav item needs `usePathname`, the collapse needs
 * state, and the mobile drawer needs both — while the two things that must stay
 * on the server are the session check and the sign-out action. So the layout
 * does `requireAdmin()`, then hands this component the email as a string and
 * the action as a prop. Nothing secret crosses the boundary and no check
 * happens on a surface the browser controls.
 *
 * THE COLLAPSE IS REMEMBERED, and it has to survive the one thing that would
 * otherwise undo it: every navigation in this panel is a full server round trip
 * to a dynamic route, so the state would reset on each click if it lived only in
 * React. localStorage carries it across.
 *
 *   IT IS READ IN AN EFFECT, NOT IN THE INITIAL STATE. The server renders this
 *   too, and the server has no localStorage — initialising from it would produce
 *   markup that disagrees with the client's first render, which React reports as
 *   a hydration mismatch. So the first paint is always expanded and the effect
 *   collapses it immediately afterwards if that is what was stored. On a panel
 *   whose pages are server-rendered anyway the flicker is not perceptible, and
 *   the alternative — suppressing hydration warnings — hides real bugs along
 *   with this one.
 *
 * THE MOBILE DRAWER IS SEPARATE STATE FROM THE COLLAPSE. They look related and
 * are not: collapse is a preference about a sidebar that is always present,
 * open/closed is a transient state of one that is normally absent. Conflating
 * them gives you a phone that remembers the drawer was open and a desktop that
 * forgets it was narrow.
 */

const STORAGE_KEY = "hc-admin-sidebar-collapsed";

export default function Shell({
  email,
  signOut,
  children,
}: {
  email: string;
  /** the server action from auth-actions; passed rather than imported so this
      file never pulls a "use server" module into the client graph */
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* Safari in private mode throws on localStorage rather than returning
         null. A remembered sidebar width is not worth a crashed panel. */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((was) => {
      const next = !was;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  /* THE DRAWER CLOSES ON NAVIGATION. Without this, tapping a link on a phone
     leaves the overlay covering the page it just went to — which reads as a
     link that did nothing. pathname is the dependency because that is what
     actually changed. */
  useEffect(() => setDrawer(false), [pathname]);

  /* Escape closes it too. A full-screen overlay with no keyboard exit is a trap
     for anyone not using a pointer. */
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const width = collapsed ? "lg:w-[76px]" : "lg:w-64";

  return (
    <div className="flex min-h-dvh bg-cream-deep">
      {/* ── SIDEBAR ─────────────────────────────────────────────
          Two behaviours in one element rather than two elements: off-canvas and
          overlaid below lg, in the document flow and sticky at lg and up. A
          second copy for mobile would be a second list of links to keep in step
          with this one, which is the bug the nav-items module exists to
          prevent. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 isolate flex w-64 shrink-0 flex-col overflow-hidden bg-espresso-deep transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${width} ${
          drawer ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* ── THE COFFEE COLUMN ────────────────────────────────
            A CUT-OUT, NOT A PHOTOGRAPH. Only about a sixth of this file is
            opaque — a cup, beans, leaves and a drawn vine running down its
            left edge; everything else is fully transparent. So it is laid
            OVER the espresso rather than instead of it, and the sidebar keeps
            its brand colour with the decoration sitting on top.

            DIMMED, BECAUSE IT LANDS ON THE NAV. The artwork runs down the same
            left edge the icons and labels occupy — at full strength the lit
            rim of the cup at the top sits directly behind the wordmark. Held
            back it reads as texture, which is what a working navigation can
            afford to carry.

            `overflow-hidden` ON THE ASIDE, not a size on this: the rail
            narrows to 76px when collapsed, and a background that is told to
            cover simply re-crops itself. Nothing here needs to know the two
            widths.

            `isolate` + `-z-10` KEEP IT UNDER THE LINKS without giving every
            nav item a z-index of its own — the aside becomes the stacking
            context, so this is the only thing in it that needs a layer. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* HELD BACK FURTHER WHEN THE RAIL IS COLLAPSED, and it is the same
              picture doing something different rather than a taste call. At
              256px the frame covers by height and shows most of the artwork's
              width, black included; at 76px it shows only the leftmost
              quarter — which is the densest part of it, the beans and leaves
              packed against the edge. So the narrow rail gets the busiest
              crop AND has nothing but icons to read it against. */}
          <div
            className={`absolute inset-0 bg-[url('/img/sidebar-bg.webp')] bg-cover bg-left-top bg-no-repeat transition-opacity duration-300 ${
              collapsed ? "lg:opacity-25" : ""
            } opacity-50`}
          />

          {/* THE SCRIM IS AT THE TWO ENDS AND NOWHERE ELSE, because that is
              where the artwork and the controls actually collide. The picture
              opens on a lit coffee cup and closes on a sack of beans — the two
              brightest things in it — and the rail opens on the wordmark and
              closes on View the site, Collapse menu and Sign out. The middle,
              where the nav list runs, is the part of the picture that is a
              thin drawn vine, and that it can carry.

              A FLAT OVERLAY WOULD HAVE COST THE WHOLE IMAGE to fix two ends of
              it. This keeps the decoration where it is doing its job and takes
              it back only where it was making something unreadable. */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-espresso-deep)_0%,transparent_17%,transparent_62%,var(--color-espresso-deep)_88%)]" />
        </div>

        <div
          className={`flex h-16 shrink-0 items-center border-b border-cream/10 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          } px-5`}
        >
          {/* Collapsed, the lockup would be 150px of wordmark in a 76px rail, so
              it becomes the cup mark alone — cropped by the overflow rather than
              swapped for a second asset, because there is no square version of
              this logo and inventing one is a design decision, not a layout
              one. */}
          <div className={collapsed ? "lg:w-9 lg:overflow-hidden" : ""}>
            <Logo size="w-[132px]" light />
          </div>
          <button
            type="button"
            onClick={() => setDrawer(false)}
            className="ml-auto rounded-lg p-1.5 text-cream/85 transition hover:bg-cream/10 hover:text-cream lg:hidden"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* THE BAR IS HIDDEN, THE SCROLLING IS NOT. `no-scrollbar` only takes
            the track off — wheel, trackpad, touch, arrow keys and Page Up all
            still work, and the rail still scrolls when the window is short
            enough to need it. A dark panel with a pale native scrollbar down
            it was the one piece of system chrome left on this screen. */}
        <nav
          aria-label="Admin sections"
          className="no-scrollbar flex-1 overflow-y-auto px-3 py-5"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.title ?? "ungrouped"} className="mb-5 last:mb-0">
              {group.title ? (
                <p
                  className={`mb-2 px-2.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cream/60 [text-shadow:0_1px_3px_var(--color-espresso-deep)] ${
                    collapsed ? "lg:sr-only" : ""
                  }`}
                >
                  {group.title}
                </p>
              ) : null}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const on = isActive(item, pathname);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={on ? "page" : undefined}
                        /* title only when collapsed — a native tooltip is the
                           label's only remaining form once the text is hidden,
                           and on the expanded rail it would just repeat what is
                           already on screen. */
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.9rem] font-semibold transition ${
                          collapsed ? "lg:justify-center lg:px-0" : ""
                        } ${
                          on
                            ? /* THE ACTIVE PILL ON A DARK RAIL. orange-soft
                                 with orange-deep type was right on white and is
                                 wrong here — a pale plate on near-black is the
                                 loudest thing on the screen. This is the brand
                                 orange at 15%, which reads as a lit row rather
                                 than a sticker, with the type in plain orange:
                                 measured on espresso-deep that is 6.4:1, where
                                 orange-deep would have been 2.6 and illegal. */
                              "bg-orange/15 text-orange"
                            : "text-cream/85 [text-shadow:0_1px_3px_var(--color-espresso-deep)] hover:bg-cream/[0.07] hover:text-cream"
                        }`}
                      >
                        <Icon />
                        <span className={collapsed ? "lg:hidden" : ""}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-cream/10 px-3 py-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? "View the site" : undefined}
            className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.88rem] font-semibold text-cream/85 [text-shadow:0_1px_3px_var(--color-espresso-deep)] transition hover:bg-cream/[0.07] hover:text-cream ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <ExternalIcon />
            <span className={collapsed ? "lg:hidden" : ""}>View the site</span>
          </Link>

          {/* Desktop only: there is no collapsed state below lg, where the
              sidebar is an overlay that is either open or gone. */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            className={`hidden w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.88rem] font-semibold text-cream/85 [text-shadow:0_1px_3px_var(--color-espresso-deep)] transition hover:bg-cream/[0.07] hover:text-cream lg:flex ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            <span className={collapsed ? "lg:hidden" : ""}>Collapse menu</span>
          </button>

          {/* IT OPENS THE DIALOG; THE DIALOG HOLDS THE FORM. This used to post
              the action straight from here, and it was the more dangerous of
              the two sign-outs: it sits directly under "Collapse menu", so the
              miss that costs an unsaved form is a two-centimetre one. */}
          <button
            type="button"
            onClick={() => setConfirmOut(true)}
            title={collapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.88rem] font-semibold text-red-300 transition hover:bg-red-400/15 hover:text-red-200 ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <SignOutIcon />
            <span className={collapsed ? "lg:hidden" : ""}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* The scrim. Rendered only while the drawer is open so it cannot
          intercept a click on the page behind it the rest of the time. */}
      {drawer ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="fixed inset-0 z-40 bg-espresso-deep/40 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── TOP BAR ───────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="rounded-lg p-2 text-ink-soft transition hover:bg-cream hover:text-espresso lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-2 text-[0.9rem]">
              <li>
                <Link
                  href="/admin"
                  className="font-semibold text-mute transition hover:text-espresso"
                >
                  Admin
                </Link>
              </li>
              <li aria-hidden className="text-mute/60">
                <ChevronRightIcon className="size-4" />
              </li>
              <li className="truncate font-bold text-espresso">
                {currentLabel(pathname)}
              </li>
            </ol>
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <AccountMenu email={email} onSignOut={() => setConfirmOut(true)} />
          </div>
        </header>

        {/* LEFT-ALIGNED AGAINST THE SIDEBAR, NOT CENTRED IN WHAT IS LEFT OVER.
            This was `mx-auto max-w-5xl`, which on a 1920px screen put a 1024px
            column in the middle of the ~1650px beside the sidebar and left
            ~310px of empty cream between the nav and the first card — a gutter
            wider than the sidebar itself, on a page whose whole job is forms.
            Dropping the centring closes it; the cap stays so that on an
            ultrawide the hint text under a field does not run to a 200-character
            measure. */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="w-full max-w-[1400px]">{children}</div>
        </main>
      </div>

      {/* ONE OF THESE FOR THE WHOLE PANEL. Rendered here rather than beside
          either trigger because a native <dialog> goes to the top layer
          wherever it sits in the tree — so its position in the markup is free
          to be the one that makes the state obvious. */}
      <SignOutDialog
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        signOut={signOut}
      />
    </div>
  );
}
