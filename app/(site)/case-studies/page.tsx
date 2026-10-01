import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { metadataFor } from "@/lib/content/schema";
import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

/**
 * Case studies, as a stub.
 *
 * It exists so that section 06's two "Read the full story" links are real
 * navigation rather than dead hrefs.
 *
 * noindex, and it says out loud that there is nothing here yet — because the
 * two cases on the landing page are placeholder data. A page that ranked for
 * "hotcups case study" and then showed invented numbers would be worse than
 * no page at all.
 */

/**
 * THE TITLE AND DESCRIPTION COME FROM THE STORE, so the client can change what
 * a search result says without a deploy. `generateMetadata` rather than a
 * `metadata` constant, because a constant is evaluated once at module load and
 * cannot read per-request content. metadataFor holds the suffix rule and the
 * site-wide noindex switch — see lib/content/schema.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContent();
  return metadataFor(seo, "/case-studies");
}

/**
 * TWO STATES, AND THE EMPTY ONE IS KEPT. Stories with a body are listed;
 * stories that are still only a headline are not, which means a page with
 * three planned studies and nothing written still shows the "being written"
 * copy. That is the honest thing and the reason that copy was worth keeping
 * rather than deleting.
 */
export default async function CaseStudiesIndex() {
  const { cases } = await getContent();
  const written = cases.filter((c) => c.body);

  if (written.length > 0) {
    return (
      <main className="bg-cream">
      <JsonLd path="/case-studies" />
        <div
          className="shell"
          style={{
            paddingTop: "calc(var(--header-h) + 3rem)",
            paddingBottom: "5rem",
          }}
        >
          <span className="eyebrow text-ink-soft">Case studies</span>

          <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            What changed on the floor.
          </h1>

          {/* THREE ACROSS AND PORTRAIT, the same frame as the home page's
              row — a reader arriving from a card should recognise what they
              clicked. */}
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {written.map((study) => (
              <li key={study.id}>
                <Link
                  href={`/case-studies/${study.id}`}
                  className="group block h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-1.5 focus-visible:shadow-[var(--shadow-2)]"
                >
                  {study.src ? (
                    <div className="relative aspect-[3/4] overflow-hidden bg-cream-deep">
                      <Image
                        src={study.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    </div>
                  ) : null}

                  <div className="p-5">
                    <h2 className="font-display text-[1.2rem] font-bold leading-[1.3] tracking-[-0.015em] text-ink">
                      {study.title}
                    </h2>
                    {study.summary ? (
                      <p className="mt-2 line-clamp-3 font-sans text-[0.92rem] leading-[1.55] text-ink-soft">
                        {study.summary}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream">
      <JsonLd path="/case-studies" />
      <div
        className="shell flex min-h-svh flex-col justify-center"
        style={{ paddingTop: "calc(var(--header-h) + 3rem)", paddingBottom: "4rem" }}
      >
        <span className="eyebrow text-ink-soft">Case studies</span>

        <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
          The full stories are being written.
        </h1>

        <p className="mt-5 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft">
          We&rsquo;re sitting down with the offices and factories we deliver to
          and writing up what actually changed — what they ran before, what
          they run now, and what it costs them.
        </p>

        <p className="mt-3 max-w-[48ch] font-sans text-[1.05rem] leading-[1.6] text-ink-soft">
          If you want the version for your own floor, that&rsquo;s a quicker
          conversation.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/#pricing"
            className="hero-btn-dark group relative overflow-hidden inline-flex h-[3.25rem] items-center gap-2 rounded-full bg-orange px-7 font-sans text-[0.95rem] font-semibold text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
          >
            <span className="relative z-10">Get pricing</span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>

          <Link
            href="/"
            className="font-sans text-[0.95rem] font-semibold text-espresso underline decoration-orange decoration-2 underline-offset-4 transition-colors duration-300 hover:text-orange-dark"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </main>
  );
}
