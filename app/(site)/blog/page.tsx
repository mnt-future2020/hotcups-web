import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getContent } from "@/lib/content/store";
import { metadataFor } from "@/lib/content/schema";
import JsonLd from "@/components/seo/JsonLd";

/**
 * The blog index.
 *
 * IT WAS A STUB AND IS NOT ANY MORE. Its own note said the posts would get
 * their own URLs "in phase 2, once the CMS is settled" — that is this. The
 * page now lists what has actually been written rather than apologising for
 * what has not.
 *
 * ── TWO STATES, AND THE EMPTY ONE IS KEPT ─────────────────────────────────
 *
 * Posts with a body are listed. Posts without one are not, which means a blog
 * with three planned headlines and nothing written still shows the old
 * "writing is on its way" page — the honest thing, and the reason that copy
 * was worth keeping rather than deleting.
 *
 * THE noindex DECISION STAYS WITH THE CLIENT. /blog is marked noindex in SEO
 * Manager today, from when it was a stub, and nothing here overrides that —
 * metadataFor reads the stored flag. Once there are posts worth finding, that
 * tick is the thing to turn off, and it is a sentence on the dashboard rather
 * than a deploy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContent();
  return metadataFor(seo, "/blog");
}

export default async function BlogIndex() {
  const { posts } = await getContent();
  const written = posts.filter((p) => p.body);

  return (
    <main className="bg-cream">
      <JsonLd path="/blog" />
      <div
        className="shell"
        style={{
          paddingTop: "calc(var(--header-h) + 3rem)",
          paddingBottom: "5rem",
        }}
      >
        <span className="eyebrow">Reading</span>

        {written.length === 0 ? (
          <>
            <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
              The writing is on its way.
            </h1>

            <p className="mt-5 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft">
              We&rsquo;re putting together notes on running a workplace pantry —
              planning supply, what teams actually drink, and what changes when
              delivery becomes a standing order.
            </p>

            <p className="mt-3 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft">
              In the meantime, the fastest answer is a conversation.
            </p>

            <Link
              href="/#pricing"
              className="mt-8 inline-flex w-fit items-center gap-2.5 rounded-full bg-espresso px-7 py-4 font-sans text-[1.02rem] font-semibold text-cream transition-colors duration-300 hover:bg-espresso-deep"
            >
              Get pricing
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
              Notes on the workplace pantry.
            </h1>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {written.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.id}`}
                    className="group block h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-1.5 focus-visible:shadow-[var(--shadow-2)]"
                  >
                    {post.src ? (
                      /* The frame clips the scale, not the card — a card that
                         hides its own overflow clips its focus ring too. */
                      <div className="relative aspect-[5/4] overflow-hidden bg-cream-deep">
                        <Image
                          src={post.src}
                          alt={post.alt}
                          fill
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                        />
                      </div>
                    ) : null}

                    <div className="p-5">
                      <p className="flex flex-wrap items-center gap-x-2.5 font-sans text-[0.8rem] font-semibold">
                        <span className="uppercase tracking-[0.12em] text-orange-dark">
                          {post.tag}
                        </span>
                        <span aria-hidden className="text-mute/50">
                          &middot;
                        </span>
                        <span className="text-mute">{post.read}</span>
                      </p>

                      <h2 className="mt-2 font-display text-[1.2rem] font-bold leading-[1.3] tracking-[-0.015em] text-ink">
                        {post.title}
                      </h2>

                      {post.summary ? (
                        <p className="mt-2 line-clamp-3 font-sans text-[0.92rem] leading-[1.55] text-ink-soft">
                          {post.summary}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
