"use server";

/**
 * Sign in, sign out.
 *
 * SEPARATE FROM content-actions.ts because of what "use server" means: every
 * export of a file carrying that directive becomes a callable HTTP endpoint the
 * moment any client component imports anything from it. Keeping the two
 * credential-handling functions in their own module means the content editors
 * do not widen the surface that can be reached without a session, and a reader
 * auditing the login path has one 100-line file to read rather than a 400-line
 * one.
 */

import { redirect } from "next/navigation";
import { assertProductionReady, verifyAdmin } from "@/lib/admin/config";
import { createSession, destroySession } from "@/lib/admin/session";

export type LoginState = {
  error?: string;
  /** echoed back so a failed attempt does not clear the address the operator
      just typed — the password field is deliberately NOT echoed */
  email?: string;
} | undefined;

/**
 * WHERE THE REDIRECT IS ALLOWED TO GO.
 *
 * `next` arrives in the query string, which means it arrives from whoever
 * crafted the link. Handing it to redirect() unchecked is an open redirect: a
 * link to /admin/login?next=https://evil.example sends a freshly authenticated
 * operator straight off the site with the site's own login as the referrer.
 *
 * So: it must start with a single "/admin" and must not start with "//" — the
 * protocol-relative form, which browsers read as a host and which "starts with
 * a slash" happily accepts.
 */
function safeNext(next: unknown): string {
  if (typeof next !== "string") return "/admin";
  if (!next.startsWith("/admin")) return "/admin";
  if (next.startsWith("//")) return "/admin";
  return next;
}

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const target = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter both an email address and a password.", email };
  }

  /* BEFORE LOOKING AT THE PASSWORD AT ALL. In production with no
     SESSION_SECRET and no ADMIN_PASSWORD this throws, because the alternative
     is authenticating someone against a credential that is published in this
     repository. In development it is a no-op. */
  assertProductionReady();

  const ok = await verifyAdmin(email, password);

  if (!ok) {
    /* ONE MESSAGE FOR BOTH FAILURES. "No such user" and "wrong password" are
       different facts and telling them apart is how an attacker learns which
       half to keep working on. The operator knows their own email, so the
       combined message costs them nothing. */
    return { error: "That email and password do not match.", email };
  }

  await createSession(email.toLowerCase());

  /* OUTSIDE ANY try/catch, AND LAST. redirect() works by throwing a sentinel
     that Next catches upstream; swallowing it in a catch block here would turn
     a successful login into a form that appears to do nothing. */
  redirect(target);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
