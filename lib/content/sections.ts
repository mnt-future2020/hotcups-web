/**
 * An article, cut into sections at its headings.
 *
 * ── WHY IT IS SHARED AND NOT LOCAL TO THE PAGE ────────────────────────────
 *
 * It started inside app/(site)/blog/[slug] and moved here the moment the admin
 * panel grew a full-page preview. The preview's whole claim is "this is how
 * the page will look" — so if the page splits the body one way and the preview
 * splits it another, the preview is not a preview, it is a second design that
 * happens to resemble the first. One function, two callers, no drift.
 *
 * ── SPLIT ON <h2> AND NOTHING ELSE ────────────────────────────────────────
 *
 * h3 stays inside its section, where it is a sub-point rather than a turn in
 * the argument. Alternating on those would put two changes of direction inside
 * one thought.
 *
 * ── A REGEX IS SAFE HERE, WHICH IS NOT USUALLY TRUE OF HTML ───────────────
 *
 * The input has already been through sanitizeHtml, so a heading is exactly
 * "<h2>" — no attributes, always closed, never nested. The cleaner guarantees
 * that shape, and it is the only reason this is a handful of lines instead of
 * a parser. Hand it unsanitised markup and the guarantee is gone; both callers
 * clean first, and the panel's preview cleans precisely so that it can.
 */

export type Section = {
  /**
   * The inside of the <h2>, still as HTML so the author's emphasis survives.
   *
   * NULL MEANS THE TEXT BEFORE THE FIRST HEADING — the opening paragraph.
   * Both callers lay that out across the page rather than in a column: an
   * article that starts in the right-hand column looks like it started on the
   * previous page.
   */
  heading: string | null;
  body: string;
};

export function sections(html: string): Section[] {
  const out: Section[] = [];
  const re = /<h2>([\s\S]*?)<\/h2>/g;

  let last = 0;
  let heading: string | null = null;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html)) !== null) {
    const body = html.slice(last, m.index);
    /* Skipped when the article opens straight into a heading: there is no
       opening paragraph, so there is no empty section to render above it. */
    if (body.trim() || heading !== null) out.push({ heading, body });
    heading = m[1];
    last = re.lastIndex;
  }
  out.push({ heading, body: html.slice(last) });

  return out.filter((s) => s.heading !== null || s.body.trim() !== "");
}
