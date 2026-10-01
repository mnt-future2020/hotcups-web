import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";

/**
 * sitemap.xml, generated from the search settings.
 *
 * ONLY THE PAGES THAT ARE ACTUALLY OPEN. A sitemap is a list of URLs the site
 * is ASKING to have indexed, so a page marked noindex has no business in it —
 * listing one is asking for a page and refusing it in the same breath, and the
 * refusal is the half that wins. The result is a crawl budget spent on nothing.
 *
 * EMPTY WITHOUT A DOMAIN, and that is not a degraded mode — it is the correct
 * answer. Every URL in a sitemap must be absolute, so with no confirmed host
 * there is nothing truthful to put in one. Returning an empty sitemap is
 * honest; inventing a host from the request would point crawlers at whatever
 * proxy or preview deploy happened to serve the file.
 *
 * NO lastModified. It looks free — the content file has an mtime — and it would
 * be a lie about every page: one save rewrites the whole document, so every URL
 * would claim to have changed whenever any of them did. A date that moves for
 * the wrong reason is worse than no date, because crawlers act on it.
 *
 * NO priority AND NO changeFrequency EITHER. Google has said for years it
 * ignores both. They exist in the spec, they cost a line each, and a field
 * nobody reads is a field the next person has to decide about.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { seo } = await getContent();

  if (!seo.siteUrl || seo.noindexAll) return [];

  const pages = seo.pages
    .filter((page) => !page.noindex)
    .map((page) => ({
      /* The root is "/" and joining it would give "https://host//". Every other
         path already starts with its own slash. */
      url: page.path === "/" ? seo.siteUrl : `${seo.siteUrl}${page.path}`,
    }));

  /* ── THE POSTS, WHICH ARE NOT IN seo.pages ────────────────────────────
     That list is ROUTES — one entry per file in the app directory — and the
     posts are rows in content.json behind a single [slug] route. So they are
     added here rather than there, and they appear and disappear as the client
     writes and unwrites them without anybody maintaining a list.

     ONLY THE WRITTEN ONES. A post with no body answers 404, and a sitemap
     entry pointing at a 404 is the one thing a sitemap must never contain.

     AND ONLY IF /blog ITSELF IS OPEN. The posts live under it; listing them
     while their own section is marked noindex would be asking for the
     children of a page the same file says to skip. */
  const blogOpen = seo.pages.some((p) => p.path === "/blog" && !p.noindex);
  const posts = blogOpen
    ? (await getContent()).posts
        .filter((p) => p.body)
        .map((p) => ({ url: `${seo.siteUrl}/blog/${p.id}` }))
    : [];

  /* The written studies, on the same terms as the posts: only the ones that
     answer 200, and only while their own section is open to search. */
  const casesOpen = seo.pages.some(
    (p) => p.path === "/case-studies" && !p.noindex,
  );
  const studies = casesOpen
    ? (await getContent()).cases
        .filter((c) => c.body)
        .map((c) => ({ url: `${seo.siteUrl}/case-studies/${c.id}` }))
    : [];

  return [...pages, ...posts, ...studies];
}
