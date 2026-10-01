/**
 * proxy.ts — the redirect layer in front of /admin.
 *
 * NOT `middleware.ts`. Next 16 deprecated that convention and renamed it to
 * this one; the export is `proxy` rather than `middleware` and it now defaults
 * to the Node.js runtime rather than Edge. A middleware.ts in this repo would
 * still run and would log a deprecation on every dev boot.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT FOR.
 * It is a NAVIGATION concern: someone without a session who types /admin should
 * land on the login form, and someone with one who lands on /admin/login should
 * be sent on to the panel. Doing that here means neither sees a flash of the
 * wrong screen.
 *
 * IT IS NOT AUTHORIZATION. Next's own guidance is that proxy should not be the
 * only thing between a request and data — it runs before routes, is deployable
 * to a CDN, and is the wrong place to hold a security boundary. So every admin
 * page and every mutating action calls requireAdmin() itself, next to the data
 * it is about to touch. Delete this file and the panel is still closed; it just
 * flashes. That is the correct relationship between the two checks.
 *
 * WHY IT VERIFIES THE SIGNATURE RATHER THAN CHECKING THE COOKIE EXISTS.
 * Checking existence would be enough for the cosmetic job above and would let
 * anyone with `document.cookie` — or curl — reach a page that then redirects
 * them back, which reads as a broken panel rather than a closed one. Verifying
 * is two HMAC operations and needs no I/O, so there is no reason not to.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, sessionSecret } from "@/lib/admin/config";
import { verifySession } from "@/lib/admin/crypto";

const LOGIN = "/admin/login";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
    sessionSecret(),
  );

  const onLogin = pathname === LOGIN;

  if (!session && !onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    /* WHERE THEY WERE GOING, CARRIED THROUGH. A bookmark to /admin/contact
       should survive the login it triggers, otherwise every session starts at
       the dashboard and the operator navigates again. The login action only
       honours values starting with /admin/, so this cannot be used to bounce
       someone off-site. */
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (session && onLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  /* /admin AND EVERYTHING UNDER IT, and nothing else. Without a matcher this
     runs on every request including _next/static and /public, which for an
     auth redirect means the CSS and the photographs on the PUBLIC site start
     bouncing to a login form. The site itself must never reach this file. */
  matcher: ["/admin", "/admin/:path*"],
};
