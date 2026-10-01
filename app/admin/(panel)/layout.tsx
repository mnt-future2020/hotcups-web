import { requireAdmin } from "@/lib/admin/session";
import { logout } from "../auth-actions";
import Shell from "./Shell";

/**
 * The signed-in half of /admin.
 *
 * WHY A ROUTE GROUP. The parentheses keep `(panel)` out of the URL, so the
 * dashboard is still /admin and the editors are /admin/contact and friends —
 * while giving everything inside a layout that /admin/login does not inherit.
 * The alternative was one /admin layout rendering a sidebar and then hiding it
 * on one route, which a Server Component cannot do because it has no pathname.
 *
 * THIS FILE IS DELIBERATELY THIN: check the session, hand the shell the two
 * things it cannot get for itself, render the page. Everything visual is in
 * Shell.tsx, which is a Client Component — and keeping the check out here is the
 * point, because an auth check inside a component the browser hydrates is not a
 * check at all.
 *
 * requireAdmin() HERE COVERS EVERY PAGE BENEATH IT, and every page beneath it
 * calls it again anyway. That is not redundancy for its own sake: a layout does
 * not re-run on every client-side navigation between its children, so a layout
 * check alone can be stale. Next's guidance is that the check belongs as close
 * to the data as possible; this one is here so the shell never renders for a
 * stranger, and the ones in the pages are the real gate.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <Shell email={session.sub} signOut={logout}>
      {children}
    </Shell>
  );
}
