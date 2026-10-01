import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content/store";

/**
 * robots.txt, generated from the search settings.
 *
 * A FILE CONVENTION, NOT A ROUTE HANDLER. Next serves whatever this default
 * export returns at /robots.txt; there is no route file and no headers to set.
 * `dynamic` is forced because it reads the content store — without it this
 * would be evaluated once at build and then never reflect a change made in the
 * panel, which is the failure mode every static thing in this project has had
 * to be talked out of.
 *
 * IT IS THE SAME DECISION THE PAGES ALREADY MAKE, said once more in a file
 * crawlers read. A page marked noindex carries its own meta tag — that is what
 * actually keeps it out of a search result, and it is the mechanism that works
 * whether or not anybody fetched this file. Disallowing those paths here as
 * well is belt and braces, and worth having because the two are read at
 * different moments: robots.txt before the crawl, the meta tag during it.
 *
 *   ONE THING IT DELIBERATELY DOES NOT DO: disallow a page it wants DEindexed.
 *   A path blocked here is never fetched, so its noindex tag is never seen, so
 *   a page already in the index stays there. For a page that has been public
 *   and must come out, the meta tag alone is the correct tool and this file has
 *   to stay out of the way. Every path listed below is a stub that has been
 *   noindex since it shipped, so the distinction does not bite here — but it is
 *   exactly the trap to fall into the first time it does.
 *
 * /admin IS ALWAYS DISALLOWED. It answers 200 to anyone at /admin/login and is
 * therefore perfectly crawlable; the layout already sets noindex on the whole
 * subtree, and this says it again where a crawler looks first.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getContent();

  /* CLOSED MEANS CLOSED. When the site-wide switch is on, nothing is offered
     and no sitemap is advertised — a sitemap pointing at pages the same file
     forbids is a contradiction a crawler has to resolve, and it resolves it
     however it likes. */
  if (seo.noindexAll) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const blocked = seo.pages.filter((p) => p.noindex).map((p) => p.path);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", ...blocked],
    },
    /* Only when the domain is known. A sitemap line pointing at a guessed host
       sends crawlers somewhere nobody confirmed. */
    ...(seo.siteUrl ? { sitemap: `${seo.siteUrl}/sitemap.xml` } : {}),
  };
}
