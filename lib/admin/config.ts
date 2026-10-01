/**
 * Where the one admin credential comes from, and what happens when nobody has
 * configured one.
 *
 * THE DEFAULTS BELOW ARE REAL AND THEY WORK. That is the point of them: `npm
 * run dev` and /admin/login accepts admin@hotcups.co.in / hotcups-admin
 * immediately, with no .env file, no seed script and no database. A panel that
 * cannot be opened until someone has generated a secret is a panel nobody
 * opens.
 *
 * THEY ARE ALSO A PUBLISHED PASSWORD IN A GIT REPOSITORY, which is why
 * `assertProductionReady` exists and why it throws rather than warns. The
 * moment NODE_ENV is production, every default in here stops being a
 * convenience and becomes an unlocked door, and a console warning on a server
 * nobody is watching is not a control. Failing the request is.
 *
 * WHY ENV RATHER THAN THE CONTENT STORE. The credential is the thing that
 * guards the store, so it cannot live inside it — an attacker who can write
 * content.json could otherwise write themselves a password. Env vars are also
 * the one piece of configuration every host already knows how to hold.
 */

import { verifyPassword } from "./crypto";

export const SESSION_COOKIE = "hc_admin";

/** Eight hours. Long enough that a morning of editing does not end with a
    surprise login screen, short enough that a laptop left open in a co-working
    space is not an open panel the next day. */
export const SESSION_MAX_AGE = 60 * 60 * 8;

const DEV_EMAIL = "admin@hotcups.co.in";
const DEV_PASSWORD = "hotcups-admin";

/* A FIXED DEV SECRET, NOT A RANDOM ONE. Generating it per boot would be more
   secure and would also log everyone out on every hot reload, which in practice
   means the first thing anyone does is hardcode one anyway. This is that
   hardcoding, done once, in the open, and refused in production. */
const DEV_SECRET = "hotcups-dev-secret-not-for-production";

export const isProduction = process.env.NODE_ENV === "production";

export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEV_EMAIL).trim().toLowerCase();
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET || DEV_SECRET;
}

/**
 * Which of the three credential shapes is in force.
 *
 * `hash` is the one to deploy: ADMIN_PASSWORD_HASH holds a PBKDF2 string from
 * `npm run admin:hash`, so the plaintext exists nowhere on the server.
 * `plain` is the pragmatic middle — ADMIN_PASSWORD set directly, which most
 * hosts' env UIs make the easiest thing to do and which is no weaker in
 * transit, only in what a leaked env dump reveals.
 * `default` is the checked-in credential above, and is what production refuses.
 */
export function credentialSource(): "hash" | "plain" | "default" {
  if (process.env.ADMIN_PASSWORD_HASH) return "hash";
  if (process.env.ADMIN_PASSWORD) return "plain";
  return "default";
}

/**
 * Everything production must not be missing, as a list rather than a throw, so
 * the login screen can show the operator all of it at once instead of one item
 * per deploy.
 */
export function productionGaps(): string[] {
  const gaps: string[] = [];
  if (!process.env.SESSION_SECRET) {
    gaps.push(
      "SESSION_SECRET is unset, so sessions are signed with the checked-in development key.",
    );
  } else if (process.env.SESSION_SECRET.length < 32) {
    gaps.push("SESSION_SECRET is shorter than 32 characters.");
  }
  if (credentialSource() === "default") {
    gaps.push(
      "Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is set, so the password is the one published in lib/admin/config.ts.",
    );
  }
  if (!process.env.ADMIN_EMAIL) {
    gaps.push("ADMIN_EMAIL is unset, so the login is the default address.");
  }
  return gaps;
}

/** Called by the login action before it will look at a password at all. In
    development this is a no-op; in production a gap is a 500, not a login. */
export function assertProductionReady(): void {
  if (!isProduction) return;
  const gaps = productionGaps();
  if (gaps.length === 0) return;
  throw new Error(
    "Refusing to authenticate with development defaults in production:\n- " +
      gaps.join("\n- "),
  );
}

/**
 * Is this the admin?
 *
 * BOTH CHECKS ALWAYS RUN, AND THE EMAIL IS CHECKED SECOND. A wrong email
 * returning before the password derivation would make "is this address the
 * admin's?" answerable in a millisecond and "is this the password?" answerable
 * in a hundred — which is a free username oracle. So the password work happens
 * either way and the two booleans are combined at the end.
 */
export async function verifyAdmin(
  email: string,
  password: string,
): Promise<boolean> {
  const emailOk = email.trim().toLowerCase() === adminEmail();

  const hash = process.env.ADMIN_PASSWORD_HASH;
  let passwordOk: boolean;
  if (hash) {
    passwordOk = await verifyPassword(password, hash);
  } else {
    /* Plaintext on both sides, so compare the derivations rather than the
       strings — same reasoning as above, and it keeps the timing of this
       branch in the same order of magnitude as the hashed one. */
    const expected = process.env.ADMIN_PASSWORD || DEV_PASSWORD;
    passwordOk = await constantTimeText(password, expected);
  }

  return emailOk && passwordOk;
}

async function constantTimeText(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
