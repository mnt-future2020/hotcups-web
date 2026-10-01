/**
 * The session cookie, read and written.
 *
 * SPLIT FROM crypto.ts BECAUSE OF WHAT IT IMPORTS. `next/headers` is not
 * available in proxy.ts, and proxy.ts is the one place that has to check a
 * session before a route renders. So the signing lives in crypto.ts — which
 * proxy can import — and the cookie handling lives here, which it cannot.
 * Putting them in one file would make the whole module unusable from the guard
 * that needs half of it.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isProduction,
  sessionSecret,
} from "./config";
import { signSession, verifySession, type SessionPayload } from "./crypto";

/**
 * Write a fresh session for this email.
 *
 * MUST BE CALLED FROM A SERVER ACTION OR ROUTE HANDLER, never from rendering —
 * `cookies().set` needs response headers that have not been sent yet, and
 * Next's own docs are explicit that setting a cookie during a Server Component
 * render is not supported. The login action is the only caller.
 */
export async function createSession(email: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = await signSession(
    { sub: email, iat: now, exp: now + SESSION_MAX_AGE },
    sessionSecret(),
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    /* httpOnly: no script on the page has any reason to read this, and the
       panel's own pages get the identity from the server instead. */
    httpOnly: true,
    /* secure only in production, because localhost is http and a secure cookie
       over http is silently dropped — which presents as "the login form works
       and then bounces me back to it", the single most confusing failure this
       code could have. */
    secure: isProduction,
    /* lax rather than strict. strict would mean arriving at /admin from a link
       in an email shows the login screen even though the session is valid,
       because the cookie is withheld on the cross-site navigation. lax sends it
       on top-level GETs and withholds it on cross-site POSTs, which is the
       CSRF-relevant half. */
    sameSite: "lax",
    path: "/",
    /* The cookie's lifetime matches the token's. They are two clocks and either
       can outlive the other harmlessly — an expired token in a live cookie is
       rejected by verifySession, and a dropped cookie holding a live token just
       means logging in again — but there is no reason to make them disagree. */
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** The signed-in admin, or null. Reading only — safe anywhere on the server. */
export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value, sessionSecret());
}

/**
 * The gate every admin page and every mutating action calls first.
 *
 * PROXY.TS IS NOT THIS GATE, and that distinction is the whole reason this
 * function exists. The proxy redirects unauthenticated browsers away from
 * /admin so nobody sees a flash of a panel they cannot use — that is a
 * navigation concern. It is not authorization: Next's own guidance is that
 * proxy should not be the only thing standing between a request and data,
 * because it runs before the route and can be bypassed by anything that
 * reaches the route another way. So the check is repeated HERE, next to the
 * data, in every page and every action. Two checks, one of which is cosmetic
 * and one of which is real.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return session;
}
