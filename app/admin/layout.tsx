import type { Metadata } from "next";

/**
 * Everything /admin shares, which is less than it looks.
 *
 * NO NAVIGATION IN HERE, DELIBERATELY. The login page and the panel both live
 * under /admin and they want opposite chrome — one is a single centred card with
 * nothing to navigate to, the other is a sidebar and a sign-out button. Putting
 * the sidebar here would render it beside the login form, with every link
 * bouncing straight back to the form. So the sidebar lives in the (panel) route
 * group's own layout and login sits outside that group.
 *
 * THE ROBOTS TAG IS THE REAL CONTENT OF THIS FILE. /admin/login answers 200 to
 * anyone, which is exactly what makes it indexable — there is no auth wall for
 * a crawler to bounce off, just a form. `noindex, nofollow` on the whole subtree
 * keeps the client's login page out of search results, where it would be the
 * first thing a stranger finds when they search the brand plus "login".
 *
 * Metadata is inherited by nested routes and merged, so this covers /admin,
 * /admin/login and every editor beneath them from one declaration.
 */
export const metadata: Metadata = {
  title: { default: "Hotcups admin", template: "%s · Hotcups admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* min-h-dvh rather than min-h-screen: the panel is used on a laptop and
     occasionally on a phone, and dvh is the unit that accounts for a mobile
     browser's collapsing toolbar. The site's own sections use clamp()-driven
     padding and never needed a full-height ground; this does, because a short
     form on a tall screen should still sit on the panel's colour rather than on
     white below the fold. */
  return (
    <div className="min-h-dvh bg-cream-deep font-sans text-ink antialiased">
      {children}
    </div>
  );
}
