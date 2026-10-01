"use client";

import { useActionState, useState } from "react";
import { saveSiteUrlAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Field, Notice } from "../../ui";
import type { SeoContent } from "@/lib/content/schema";

/**
 * The site's own address, and a preview of the two files built from it.
 *
 * THE PREVIEW IS THE POINT. robots.txt and sitemap.xml are files nobody looks
 * at until something is wrong with them, and both are assembled from settings
 * spread across two screens — the domain here, the per-page noindex flags in
 * SEO Manager. Showing what they currently come out as means the interaction
 * between those two is visible in one place instead of being something you work
 * out by fetching the files.
 *
 * IT IS BUILT FROM THE LIVE FIELD, not from what is saved, so typing a domain
 * shows the sitemap it would produce before committing to it.
 *
 * THE RULES BELOW MIRROR app/robots.ts AND app/sitemap.ts AND ARE NOT THOSE
 * FILES. That is a duplication and it is the honest kind to flag: the real ones
 * run on the server and cannot be imported into a client component. They are
 * eleven lines each and the rules are simple — if either changes, this changes
 * with it, and the two notes point at each other.
 */
export default function SiteUrlForm({ seo }: { seo: SeoContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveSiteUrlAction,
    undefined,
  );
  const [url, setUrl] = useState(seo.siteUrl);

  const clean = url.trim().replace(/\/+$/, "");
  const open = seo.pages.filter((p) => !p.noindex);
  const blocked = seo.pages.filter((p) => p.noindex).map((p) => p.path);

  const robots = seo.noindexAll
    ? "User-Agent: *\nDisallow: /"
    : [
        "User-Agent: *",
        "Allow: /",
        ...["/admin", ...blocked].map((d) => `Disallow: ${d}`),
        ...(clean ? ["", `Sitemap: ${clean}/sitemap.xml`] : []),
      ].join("\n");

  const urls =
    !clean || seo.noindexAll
      ? []
      : open.map((p) => (p.path === "/" ? clean : `${clean}${p.path}`));

  return (
    <form action={action} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <div className="max-w-lg">
        <Field
          label="Where the site is published"
          name="siteUrl"
          value={url}
          onChange={setUrl}
          placeholder="https://hotcups.co.in"
          hint="The full address and nothing after it. Only the two files below use it."
        />
      </div>

      {!clean ? (
        <Notice tone="note">
          No address set, so there is no sitemap and{" "}
          <code className="font-mono">robots.txt</code> does not point to one.
          That is correct until the domain is confirmed.
        </Notice>
      ) : null}

      {seo.noindexAll ? (
        <Notice tone="warn">
          The whole site is closed to search in SEO Manager, so the sitemap is
          empty. Nothing here takes effect until that is turned off.
        </Notice>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <FilePreview
          name="robots.txt"
          href="/robots.txt"
          body={robots}
          note="Read before a crawl. A path blocked here is never fetched at all."
        />
        <FilePreview
          name="sitemap.xml"
          href="/sitemap.xml"
          body={
            urls.length
              ? urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")
              : "(empty)"
          }
          note={`The ${open.length} pages open to search. Hidden pages are left out.`}
        />
      </div>

      <SubmitButton>Save the address</SubmitButton>
    </form>
  );
}

function FilePreview({
  name,
  href,
  body,
  note,
}: {
  name: string;
  href: string;
  body: string;
  note: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="font-mono text-[0.8rem] font-semibold text-ink">{name}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.78rem] font-semibold text-orange-deep underline decoration-orange/40 underline-offset-4 transition hover:text-espresso"
        >
          Open it
        </a>
      </div>
      {/* The real file, not a rendering of it — so whitespace and line breaks
          are what a crawler will actually receive. */}
      <pre className="max-h-48 overflow-auto bg-cream/60 px-4 py-3 font-mono text-[0.75rem] leading-relaxed text-ink-soft">
        {body}
      </pre>
      <p className="px-4 py-3 text-[0.78rem] leading-snug text-mute">{note}</p>
    </div>
  );
}
