/**
 * An allowlist sanitiser for the one place this site accepts HTML.
 *
 * ── WHY THIS EXISTS AT ALL ────────────────────────────────────────────────
 *
 * Blog bodies are written in a toolbar editor and stored as HTML, and HTML
 * that is stored and later rendered is the oldest hole on the web. The panel
 * is behind a password, so the author is trusted — but "trusted" is doing a
 * lot of work there: a stolen session, a borrowed laptop, or a paste out of
 * Word carrying an onerror attribute all end with markup in content.json that
 * nobody reviewed. Sanitising on the way IN means the stored document is
 * already safe, so every reader of it is safe without having to remember.
 *
 * ── AN ALLOWLIST, NEVER A BLOCKLIST ───────────────────────────────────────
 *
 * Everything not named here is dropped. The opposite approach — stripping
 * <script> and onclick and calling it done — has been defeated for thirty
 * years by things nobody thought of: <svg onload>, javascript: in an href,
 * <iframe srcdoc>, data: URLs, attribute names with a newline in the middle.
 * A list of what is permitted cannot be surprised in the same way.
 *
 * ── NO DEPENDENCY, AND THE LIMIT THAT COMES WITH THAT ─────────────────────
 *
 * This is a regex-and-string sanitiser, not a parser. It is correct for the
 * markup this editor produces, which is the only thing that reaches it: the
 * toolbar emits a small, well-formed set of tags. It is NOT a general-purpose
 * sanitiser for arbitrary hostile input, and the difference matters if this is
 * ever pointed at a public comment box. For that, use a real parser.
 *
 * WHICH IS WHY IT CLOSES WHAT IT OPENS. Rather than trusting the input's own
 * nesting, it tracks open tags and closes them at the end — so a truncated
 * paste cannot leave the page's own markup inside a dangling <strong>.
 */

/** Tags the editor can produce, and nothing else. */
const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
]);

/** Tags that stand alone — never closed, never pushed on the stack. */
const VOID = new Set(["br"]);

/**
 * Hrefs that are allowed through.
 *
 * `javascript:` IS THE OBVIOUS ONE AND NOT THE ONLY ONE. `data:text/html`
 * carries a whole document, and a bare `vbscript:` still runs in some
 * enterprise browsers. An allowlist of four schemes plus same-site paths
 * covers every link a blog post needs and nothing it does not.
 */
function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/[\x00-\x1f\x7f]/g, "");
  if (!href) return null;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  /* Same-site: a path, a fragment, or a query. Not "//evil.com", which a
     browser reads as protocol-relative and would follow off the site. */
  if (/^\/(?!\/)/.test(href) || /^[#?]/.test(href)) return href;
  return null;
}

/**
 * Escape text, WITHOUT double-escaping what is already an entity.
 *
 * `/&/g` WAS WRONG AND THE TEST CAUGHT IT. A body containing "a &lt; b" came
 * back as "a &amp;lt; b", which renders as the literal characters &lt; — so
 * every angle bracket an author had correctly escaped turned into visible
 * noise the first time the post was saved, and again on every save after.
 * The negative lookahead leaves a well-formed entity alone and escapes a bare
 * ampersand, which is what both cases need.
 */
function escapeText(s: string): string {
  return s
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  /* Comments go first and whole. <!-- --> can hide a tag from a naive scanner
     and some old parsers resurrect it. */
  let src = input.replace(/<!--[\s\S]*?-->/g, "");

  /* ── RAW-TEXT ELEMENTS GO WITH THEIR CONTENTS ──────────────────────────
     Dropping the <script> TAG is not enough: its body is not markup, it is
     code, and leaving it behind put "alert(1)" into the page as visible text.
     Harmless — everything here is escaped — but it is the author's post with
     somebody's payload printed in the middle of it.

     The same applies to <style>, whose contents are rules rather than words,
     and to <textarea> and <title>, which browsers parse as raw text and which
     have historically been used to smuggle a tag past a scanner that was
     only looking at the top level. */
  src = src.replace(
    /<(script|style|textarea|title|noscript|template)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  /* And an unclosed one takes the rest of the input with it rather than
     having its tail treated as text. */
  src = src.replace(/<(script|style|textarea|title|noscript|template)\b[\s\S]*$/i, "");

  const out: string[] = [];
  const stack: string[] = [];
  const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = TAG.exec(src))) {
    /* Text between tags is escaped, never passed through. */
    out.push(escapeText(src.slice(last, m.index)));
    last = m.index + m[0].length;

    const name = m[1].toLowerCase();
    const closing = m[0][1] === "/";

    if (!ALLOWED.has(name)) continue;

    if (closing) {
      /* Only close something that is actually open, and unwind anything left
         open inside it — a stray </p> cannot close a <strong> that is still
         standing without this. */
      const at = stack.lastIndexOf(name);
      if (at === -1) continue;
      for (let i = stack.length - 1; i >= at; i--) out.push(`</${stack[i]}>`);
      stack.length = at;
      continue;
    }

    if (name === "a") {
      const href = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[2]);
      const value = href ? (href[2] ?? href[3] ?? href[4] ?? "") : "";
      const safe = safeHref(value);
      if (!safe) {
        /* A link with nowhere safe to go becomes plain text rather than being
           dropped — the words were written on purpose. */
        continue;
      }
      /* rel AND target ARE SET HERE, NOT TAKEN FROM THE INPUT. An external
         link opened with target=_blank and no noopener hands the opener a
         handle on this page; writing them ourselves means every stored link
         has them regardless of what the editor produced. */
      const external = /^https?:/i.test(safe);
      out.push(
        `<a href="${escapeText(safe).replace(/"/g, "&quot;")}"` +
          (external ? ' target="_blank" rel="noopener noreferrer nofollow"' : "") +
          ">",
      );
      stack.push("a");
      continue;
    }

    /* EVERY OTHER TAG LOSES ALL ITS ATTRIBUTES. The editor needs none of them,
       and an attribute allowlist is a second list to keep right — style alone
       can position an element over the page and carry a url(). */
    if (VOID.has(name)) {
      out.push(`<${name}>`);
    } else {
      out.push(`<${name}>`);
      stack.push(name);
    }
  }

  out.push(escapeText(src.slice(last)));

  /* Close anything still open, innermost first. */
  for (let i = stack.length - 1; i >= 0; i--) out.push(`</${stack[i]}>`);

  return out
    .join("")
    /* Empty paragraphs the editor leaves behind when a block is cleared. */
    .replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, "")
    .trim();
}

/**
 * The body as plain words — for a description fallback and for counting.
 *
 * SEPARATE FROM THE SANITISER because it answers a different question. This is
 * never rendered; it is read.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
