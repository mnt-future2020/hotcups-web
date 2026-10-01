/**
 * Structured data — the JSON-LD block a page can carry.
 *
 * ── WHY THIS FILE EXISTS RATHER THAN A TEXTAREA ───────────────────────────
 *
 * The panel used to refuse this field, and the refusal was written down: "a
 * textarea accepting any string would be a way to put broken markup on the
 * site with nothing to catch it." That is still true. The field is here now
 * because the client asked for it, so the missing half had to be built with
 * it — a validator that runs before anything is stored, and an escape that
 * runs before anything is rendered.
 *
 * ── WHAT IS CHECKED, AND WHAT DELIBERATELY IS NOT ─────────────────────────
 *
 * CHECKED: it parses as JSON, it is an object or a list of objects, and every
 * object names a @context and a @type. Those four are the difference between
 * markup Google reads and markup Google skips, and all four are decidable here
 * with no network call.
 *
 * NOT CHECKED: whether the @type is a real schema.org type, or whether its
 * properties are the right ones for it. That needs the schema.org vocabulary —
 * about a megabyte of it — and a judgement this panel cannot make. The form
 * says so and links to Google's Rich Results Test, which can.
 *
 * ── THE ESCAPE IS NOT OPTIONAL ────────────────────────────────────────────
 *
 * JSON.stringify leaves "<" alone, so a value containing "</script>" ends the
 * script element early and everything after it is parsed as HTML. That is a
 * stored-XSS hole with the operator's own field as the input. `jsonLdScript`
 * escapes it; nothing should render this content any other way.
 */

export type JsonLdCheck =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Minified and checked, ready to store. Empty in, empty out — a page with no
    structured data is the normal case, not an error. */
export function validateJsonLd(raw: string): JsonLdCheck {
  const text = raw.trim();
  if (!text) return { ok: true, value: "" };

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      /* The parser's own message ("Unexpected token } in JSON at position
         214") names a byte offset in a box with no line numbers, which helps
         nobody. The two mistakes that actually happen are a trailing comma and
         a smart quote pasted from a document. */
      error:
        "This is not valid JSON. The usual causes are a comma after the last item, or curly quotes pasted from a document — JSON needs straight ones.",
    };
  }

  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) {
    return { ok: false, error: "The list is empty. Remove it, or add an item." };
  }

  for (const item of items) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return {
        ok: false,
        error: "Every item has to be an object in { } braces.",
      };
    }
    const o = item as Record<string, unknown>;
    if (typeof o["@context"] !== "string") {
      return {
        ok: false,
        error:
          'Missing "@context": "https://schema.org". Without it search engines skip the whole block.',
      };
    }
    if (typeof o["@type"] !== "string" && !Array.isArray(o["@type"])) {
      return {
        ok: false,
        error:
          'Missing "@type" — the kind of thing being described, like "Organization" or "FAQPage".',
      };
    }
  }

  /* RE-SERIALISED RATHER THAN STORED AS TYPED. Whatever reaches the page is
     then something this file produced from a parsed value, so a comment, a
     stray byte, or anything else the parser tolerated cannot ride along. */
  return { ok: true, value: JSON.stringify(data) };
}

/** The exact string to put inside <script type="application/ld+json">. */
export function jsonLdScript(stored: string): string {
  /* "<" is the only character that can end the element early, and escaping it
     as \u003c is still valid JSON — the parser reading this sees the "<" it
     expects, and the HTML parser never does. */
  return stored.replace(/</g, "\\u003c");
}
