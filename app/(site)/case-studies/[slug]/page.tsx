import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content/store";
import { htmlToText } from "@/lib/content/html";
import { metadataFor } from "@/lib/content/schema";
import { imageRatio } from "@/lib/content/image-size";
import { sections } from "@/lib/content/sections";
import JsonLd from "@/components/seo/JsonLd";

/**
 * One case study.
 *
 * THE SAME RULES AS A BLOG POST, and the file is deliberately its near-twin:
 * no body means no page, dynamic rather than static, and the HTML is rendered
 * without cleaning because it was cleaned twice before it was stored. The long
 * form of each argument is in app/(site)/blog/[slug]/page.tsx.
 *
 * ── THE BODY ALTERNATES, THE SAME WAY A POST'S DOES ───────────────────────
 *
 * Same `sections` split, same first-section-left rule, same `order` swap, same
 * 62ch cap on the prose. Two long-form pages on one site that structure their
 * argument differently would be two designs rather than one, and a reader
 * crossing from the blog to a case study should recognise where they are.
 *
 * ── THE HEAD IS WHERE THEY PART, AND ON PURPOSE ───────────────────────────
 *
 * A post opens on cream. A case study opens on espresso, cream type over the
 * photograph's own darkness — which is not a new idea, it is the card this
 * page was clicked from. Cases.tsx draws its headline in white over a scrim;
 * landing on a cream page with black type after clicking that reads as having
 * arrived somewhere unrelated. The dark head carries the card through.
 *
 * IT IS ALSO THE DIFFERENCE THAT COSTS LEAST. Changing the BODY would trade
 * readability for variety; changing the first screen costs nothing and is
 * exactly what a reader uses to know which kind of page they are on.
 *
 * ── THE PHOTOGRAPH IS STILL alt="" ────────────────────────────────────────
 *
 * On the card that is because the whole card is one anchor and the headline is
 * its accessible name — the schema records that at length. Here there is no
 * anchor, so the reasoning has to be made again rather than inherited: the h1
 * names the study and the body carries it, the picture is a portrait of a
 * workplace standing beside the words, and CaseContent has no alt field to
 * render even if it should. Decorative is the honest treatment, and it is the
 * one the panel's absence of a field commits to.
 */

type Params = { params: Promise<{ slug: string }> };

async function findCase(slug: string) {
  const { cases, seo } = await getContent();
  return { study: cases.find((c) => c.id === slug), seo };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { study, seo } = await findCase(slug);
  if (!study?.body) return { title: "Not found", robots: { index: false } };

  const base = metadataFor(seo, "/case-studies");
  return {
    ...base,
    title: study.title,
    description: study.summary || htmlToText(study.body).slice(0, 155),
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const { study } = await findCase(slug);
  if (!study?.body) notFound();

  const ratio = study.src ? await imageRatio(study.src) : null;
  const parts = sections(study.body);

  /* Numbered across the headed sections only, so an opening paragraph does not
     take 01 and leave the first real section as 02. */
  let n = 0;

  return (
    <main className="bg-cream">
      <JsonLd path="/case-studies" />

      {/* ── THE DARK HEAD ─────────────────────────────────────────────────
          FULL-BLEED RATHER THAN A PANEL. A dark block with cream down either
          side of it would read as a banner placed on the page; this is the top
          OF the page. It runs edge to edge while its contents sit on the same
          1480px measure as the body below, so nothing shifts sideways when the
          colour changes. */}
      <div
        className="bg-espresso"
        style={{ paddingTop: "calc(var(--header-h) + 2.5rem)" }}
      >
        <div
          className="mx-auto w-full"
          style={{
            maxWidth: "1480px",
            paddingInline: "clamp(1rem, 3vw, 2.5rem)",
            paddingBottom: "3.5rem",
          }}
        >
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 font-sans text-[0.9rem] font-semibold text-orange transition hover:text-cream"
          >
            <span aria-hidden>&larr;</span> All stories
          </Link>

          {/* THE COLUMN RATIO FOLLOWS THE PICTURE, as on the post page: a
              square or a portrait beside a headline at equal width stands
              taller than the words and turns the head into a picture with a
              caption, so a tall one takes the narrower column. The photograph
              keeps its own shape either way — the ratio is measured off the
              file, never assumed. */}
          <div
            className={`mt-8 grid gap-x-10 gap-y-8 md:items-center ${
              !study.src
                ? ""
                : ratio && ratio < 1.3
                  ? "md:grid-cols-[1.35fr_minmax(0,1fr)]"
                  : "md:grid-cols-[1fr_minmax(0,1.05fr)]"
            }`}
          >
            <div>
              {/* NOT .eyebrow. That class is mixed for a light ground — its
                  mute grey is about 2:1 on espresso and unreadable. Orange on
                  espresso clears 5:1 and is the card's own accent. */}
              <p className="font-sans text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-orange">
                Case study
              </p>

              <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-cream">
                {study.title}
              </h1>

              {study.summary ? (
                /* cream/75, not a muted token, for the same reason as above:
                   every grey on this site is mixed for a light ground and
                   turns to mud on espresso. */
                <p className="mt-5 max-w-[46ch] font-sans text-[1.12rem] leading-[1.6] text-cream/75">
                  {study.summary}
                </p>
              ) : null}
            </div>

            {study.src ? (
              <div
                className="relative w-full overflow-hidden rounded-[var(--radius-media)]"
                style={{ aspectRatio: ratio ?? 3 / 4 }}
              >
                <Image
                  src={study.src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 48vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── THE ARGUMENT, ALTERNATING ─────────────────────────────────────
          The zig-zag is in the HEADINGS: they step left, right, left down the
          page, so the shape of the piece is visible before a word of it is
          read. THE PROSE DOES NOT MOVE WITH THEM — a reader's eye returns to a
          remembered left margin at the end of every line, and moving it is the
          one thing a long read cannot afford. The page alternates; the reading
          does not. The argument in full is in app/(site)/blog/[slug]. */}
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "1480px",
          paddingInline: "clamp(1rem, 3vw, 2.5rem)",
          paddingTop: "3.5rem",
          paddingBottom: "5rem",
        }}
      >
        <div className="space-y-14">
          {parts.map((part, i) => {
            if (!part.heading) {
              return (
                <div
                  key={`lede-${i}`}
                  className="post-body max-w-[46rem] font-sans text-[1.12rem] leading-[1.7] text-ink"
                  dangerouslySetInnerHTML={{ __html: part.body }}
                />
              );
            }

            n += 1;
            const flipped = n % 2 === 0;

            return (
              <section
                key={`s-${i}`}
                className="grid gap-x-10 gap-y-5 border-t border-line pt-10 md:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"
              >
                <div
                  className={`md:sticky md:top-[calc(var(--header-h)+2rem)] md:self-start ${
                    flipped ? "md:order-2 md:text-right" : ""
                  }`}
                >
                  <p className="font-sans text-[0.72rem] font-extrabold tracking-[0.2em] text-orange-dark">
                    {String(n).padStart(2, "0")}
                  </p>
                  <h2
                    className={`mt-2 max-w-[16ch] font-display text-[clamp(1.3rem,2.2vw,1.8rem)] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink ${
                      flipped ? "md:ml-auto" : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: part.heading }}
                  />
                  <span
                    aria-hidden
                    className={`mt-4 block h-[3px] w-10 rounded-full bg-orange ${
                      flipped ? "md:ml-auto" : ""
                    }`}
                  />
                </div>

                <div
                  className={`post-body max-w-[62ch] font-sans text-[1.05rem] leading-[1.75] text-ink-soft ${
                    flipped ? "md:order-1" : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: part.body }}
                />
              </section>
            );
          })}
        </div>

        {/* THE CLOSING BAND IS OUTLINED, NOT FILLED. A post ends on espresso
            because the page above it is cream and the band has to arrive. This
            page OPENED on espresso, and a second dark block at the foot would
            bracket the article like a quotation. Same words, same button, one
            weight down. */}
        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-5 rounded-[var(--radius-card)] border border-line bg-white px-7 py-7 sm:px-9">
          <p className="min-w-0 flex-1 font-display text-[clamp(1.15rem,2vw,1.45rem)] font-bold leading-[1.25] tracking-[-0.02em] text-ink">
            Want the same worked out for your floor?
          </p>
          <Link
            href="/#pricing"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-espresso px-6 py-3.5 font-sans text-[0.98rem] font-semibold text-cream transition-colors duration-300 hover:bg-espresso-deep"
          >
            Get pricing
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
