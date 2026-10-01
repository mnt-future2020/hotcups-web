/**
 * The two pieces of cryptography the admin panel needs, and nothing else.
 *
 * NO NEW DEPENDENCIES, DELIBERATELY. The site ships eight runtime packages and
 * all eight are visible on screen — gsap, lenis, motion, ogl. The Next auth
 * guide reaches for `bcrypt` and `jose`; both are real answers and both would
 * be the first server-only packages in a tree that has none, on a site whose
 * entire server surface is about to be one login form. Web Crypto does both
 * jobs: PBKDF2-SHA256 for the password and HMAC-SHA256 for the session, off
 * `globalThis.crypto` — present in Node 18+ and in the Edge runtime, so this
 * module is safe to import from `proxy.ts` as well as from a Server Action.
 *
 * WHAT PBKDF2 COSTS AGAINST BCRYPT. bcrypt is memory-hard and PBKDF2 is not,
 * so per unit of defender time PBKDF2 buys less resistance to a GPU. That
 * matters when the threat is a leaked table of a million hashes. Here there is
 * ONE credential, it is not a password anyone reuses across sites, and nothing
 * writes a hash anywhere an attacker could read without already owning the
 * box. 210,000 iterations is OWASP's 2023 floor for PBKDF2-SHA256, which is
 * the right shape of answer for that threat.
 *
 * EVERY COMPARISON IN HERE IS CONSTANT TIME. Not because a remote timing
 * attack on a 32-byte MAC over the public internet is realistic, but because
 * the alternative — `a === b` — is shorter and gives a reader no way to tell
 * whether the question was ever asked.
 */

const ITERATIONS = 210_000;
const KEY_BITS = 256;

/* ---------------------------------------------------------------
   base64url, hand-rolled.

   `Buffer` is Node-only and this module has to survive being imported into
   proxy.ts, so it is out. `btoa`/`atob` are in both runtimes but speak
   standard base64 — whose `+`, `/` and `=` are variously reserved or
   meaningful inside a cookie value. So: encode, then swap the alphabet.
   --------------------------------------------------------------- */

export function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  const s = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

const utf8 = new TextEncoder();

/** Length-independent equality. A length mismatch returns early, which leaks
    exactly one bit — that the lengths differ — and that is fine: both callers
    compare against a value whose length is a published constant. */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ---------------------------------------------------------------
   PASSWORD  —  pbkdf2$<iterations>$<salt>$<hash>

   THE ITERATION COUNT LIVES IN THE STRING, not in the constant above. A hash
   generated today has to keep verifying after that constant is raised, which
   is the whole reason this shape is conventional: the number that produced a
   given hash is a property of that hash, not of the current build.
   --------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 1_000) return false;

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = fromBase64Url(parts[2]);
    expected = fromBase64Url(parts[3]);
  } catch {
    return false;
  }

  const actual = await pbkdf2(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

/* ---------------------------------------------------------------
   SESSION  —  <payload>.<signature>, both base64url

   A SIGNED COOKIE, NOT AN ENCRYPTED ONE. The payload is readable by whoever
   holds the cookie, and that is acceptable given what is in it: the admin's
   email and two timestamps, all of which that person already knows. What they
   must not be able to do is CHANGE any of them, and a MAC is exactly that
   guarantee. Encrypting as well would hide the email from the person whose
   email it is.

   NO SERVER-SIDE SESSION TABLE, which has one consequence worth stating
   plainly: a token cannot be revoked before it expires. Rotating
   SESSION_SECRET invalidates every token at once and is the only lever there
   is. For one operator on a marketing site that is the right trade; if this
   panel ever grows a second account, this is the first thing to revisit.
   --------------------------------------------------------------- */

export type SessionPayload = {
  /** the admin's email — the only identity this panel has */
  sub: string;
  /** seconds since epoch, both of them. JSON has no date type, and a number
      compares without being parsed first. */
  iat: number;
  exp: number;
};

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    utf8.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(utf8.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    utf8.encode(body),
  );
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

/**
 * Verify and decode, or null.
 *
 * ONE RETURN VALUE FOR EVERY KIND OF FAILURE, on purpose. A bad signature, a
 * truncated cookie, unparseable JSON and a token that expired an hour ago are
 * four different stories and the caller can act on none of them differently —
 * all four mean "not signed in". Giving them distinct shapes in the return
 * type would only invite a call site to trust one of them.
 */
export async function verifySession(
  token: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  if (!token) return null;

  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let given: Uint8Array;
  try {
    given = fromBase64Url(sig);
  } catch {
    return null;
  }

  const want = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), utf8.encode(body)),
  );
  if (!timingSafeEqual(given, want)) return null;

  /* SIGNATURE FIRST, THEN PARSE. Everything in `body` is attacker-supplied
     right up until the line above returns true, so nothing reads it before. */
  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
  } catch {
    return null;
  }

  if (typeof payload?.sub !== "string" || typeof payload?.exp !== "number") {
    return null;
  }
  if (payload.exp <= now) return null;

  return payload;
}
