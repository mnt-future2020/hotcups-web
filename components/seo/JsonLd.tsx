import { getContent } from "@/lib/content/store";
import { jsonLdFor } from "@/lib/content/schema";

/**
 * The structured-data script for one route.
 *
 * ── WHY IT IS A COMPONENT AND NOT PART OF generateMetadata ────────────────
 *
 * Next's Metadata object has no slot for JSON-LD; the documented way is to
 * render the <script> from the page itself. So every route that has a row in
 * the SEO panel carries one of these, next to its generateMetadata.
 *
 * ── WHY IT IS PER-PAGE AND NOT IN THE LAYOUT ──────────────────────────────
 *
 * The layout is one node above all seven pages and would be a single edit —
 * but it does not know which route it is wrapping. Getting the path there
 * means a client component calling usePathname, which puts a server-rendered
 * SEO tag behind a client boundary for the sake of saving six lines. Explicit
 * is also legible: open a page, see what it declares.
 *
 * ── IT CAN RENDER NOTHING, AND USUALLY WILL ───────────────────────────────
 *
 * jsonLdFor returns null for an empty field, a page kept out of search, or
 * the site-wide close. Empty is the normal state.
 *
 * THE CONTENT IS ALREADY SAFE TWICE OVER — validated by validateJsonLd before
 * it was stored and again when the file was read — and jsonLdFor escapes "<"
 * on the way out so a value containing "</script>" cannot end the element.
 */
export default async function JsonLd({ path }: { path: string }) {
  const { seo } = await getContent();
  const json = jsonLdFor(seo, path);
  if (!json) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
