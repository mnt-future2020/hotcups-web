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
 * One post.
 *
 * ── A POST WITHOUT A BODY DOES NOT HAVE A PAGE ────────────────────────────
 *
 * `notFound()` rather than an empty article, and it is the same judgement the
 * blog index has carried since it was a stub: "a near-empty page that ranks is
 * a liability, not a placeholder." A headline with nothing under it is worse
 * than no page — it wastes the reader's click and the crawler's budget.
 *
 * Blog.tsx handles the other half: a card for a bodyless post is not a link,
 * so nothing on the site points here until there is something to read.
 *
 * ── DYNAMIC, NOT STATIC ───────────────────────────────────────────────────
 *
 * No generateStaticParams. The posts live in content.json and change when the
 * client presses Save; pre-rendering the list at build time would serve
 * yesterday's set until the next deploy, which is the failure every dynamic
 * thing in this project has had to be talked out of.
 *
 * ── THE BODY IS NOT SANITISED HERE ────────────────────────────────────────
 *
 * dangerouslySetInnerHTML with no cleaning at this point is deliberate and is
 * safe for one reason: the markup was cleaned BEFORE it was stored, twice —
 * once by the save action and once by parseContent on the way out of the file.
 * Cleaning again here would be a third place to keep the allowlist right.
 * lib/content/html carries the argument in full.
 */

type Params = { params: Promise<{ slug: string }> };

async function findPost(slug: string) {
  const { posts, seo } = await getContent();
  return { post: posts.find((p) => p.id === slug), seo };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { post, seo } = await findPost(slug);
  if (!post?.body) return { title: "Not found", robots: { index: false } };

  /* THE SITE-WIDE SWITCH STILL APPLIES. metadataFor holds the suffix rule and
     the noindex-everything flag, so a post cannot quietly stay indexable while
     the rest of the site is closed. The per-page entries it knows about are
     routes; a post is not one, so its title and description come from the post
     and only the switch is borrowed. */
  const base = metadataFor(seo, "/blog");
  return {
    ...base,
    title: post.title,
    description: post.summary || htmlToText(post.body).slice(0, 155),
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const { post } = await findPost(slug);
  if (!post?.body) notFound();

  const ratio = post.src ? await imageRatio(post.src) : null;
  const parts = sections(post.body);

  /* Numbered across the headed sections only, so an opening paragraph does not
     take 01 and leave the first real section as 02. */
  let n = 0;

  return (
    <main className="bg-cream">
      <JsonLd path="/blog" />

      {/* ── WIDER THAN .shell, AND NOT BY ACCIDENT ────────────────────────
          Every other page on this site sits in .shell: 1240px wide with
          padding-inline up to 3.5rem. On a 1900px screen that leaves about
          330px of empty cream down each side before the padding even starts,
          which is right for a page of placed sections and wrong for this one —
          the zig-zag needs width to zig across, and at 1240 the two columns
          were narrow enough that the alternation stopped reading as a shape
          and started reading as ragged margins.

          SO THE CAP GOES UP AND THE PADDING COMES DOWN: 1480px, and the
          gutter shrinks from a 3.5rem ceiling to 2.5rem. It is NOT .shell-wide
          (1720px) — that exists for the hero's photographs to be placed
          against the window, and prose at 1720 would be a measure nobody can
          read across.

          THE PROSE MEASURE IS UNCHANGED. Every text column below still caps
          at 62ch; the extra width goes to the gap between the heading and its
          paragraphs, which is the part that was cramped. Widening the page
          without that cap would have been the one change this layout must
          never make. */}
      <article
        className="mx-auto w-full"
        style={{
          maxWidth: "1480px",
          paddingInline: "clamp(1rem, 3vw, 2.5rem)",
          paddingTop: "calc(var(--header-h) + 3rem)",
          paddingBottom: "5rem",
        }}
      >
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-sans text-[0.9rem] font-semibold text-orange-deep transition hover:text-espresso"
        >
          <span aria-hidden>&larr;</span> All posts
        </Link>

        {/* ── THE HEAD, ACROSS THE PAGE ─────────────────────────────────
            This was a 46rem column centred inside a 1240px shell while the
            body below ran the full width — so the top of the page had a band
            of empty cream down each side and the article appeared to start
            narrow and then widen for no reason.

            THE PICTURE GOES BESIDE THE HEADLINE, which is what takes the
            width up rather than just stretching the type. A headline has a
            measure it cannot usefully exceed — past about 22 characters a line
            it stops being readable as a headline — so widening the column
            alone would have moved the empty band rather than filled it. Two
            things side by side fill it.

            THE PICTURE STILL KEEPS ITS OWN SHAPE. The box used to be fixed at
            16:9 with object-cover; two of the three posts use square
            photographs, so it threw away 44% of the height — centre-cropped,
            which takes half of that off the top. People lost their heads. The
            ratio now comes from the file (lib/content/image-size), so nothing
            is cropped and the next picture uploaded is right without anybody
            setting anything.

            THE COLUMN RATIO FOLLOWS THE PICTURE. A landscape photograph can
            hold its own half of the page; a square or a portrait at the same
            width would stand taller than the headline beside it and turn the
            head into a picture with a caption. So a tall one takes the
            narrower column and the words keep the rest.

            IT STACKS BELOW md, where two columns would be two narrow strips
            and the headline would break every three words. */}
        <div
          className={`mt-8 grid gap-x-10 gap-y-8 md:items-center ${
            !post.src
              ? ""
              : ratio && ratio < 1.3
                ? "md:grid-cols-[1.35fr_minmax(0,1fr)]"
                : "md:grid-cols-[1fr_minmax(0,1.05fr)]"
          }`}
        >
          <div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.85rem] font-semibold">
              <span className="uppercase tracking-[0.14em] text-orange-dark">
                {post.tag}
              </span>
              <span aria-hidden className="text-mute/50">
                &middot;
              </span>
              <span className="text-mute">{post.read}</span>
            </p>

            <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,4vw,3.1rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
              {post.title}
            </h1>

            {post.summary ? (
              <p className="mt-5 max-w-[46ch] font-sans text-[1.12rem] leading-[1.6] text-ink-soft">
                {post.summary}
              </p>
            ) : null}
          </div>

          {post.src ? (
            <div
              className="relative w-full overflow-hidden rounded-[var(--radius-media)]"
              style={{ aspectRatio: ratio ?? 5 / 4 }}
            >
              <Image
                src={post.src}
                alt={post.alt}
                fill
                sizes="(max-width: 768px) 92vw, 48vw"
                className="object-cover"
                /* The one picture above the fold on this page, which is what
                   priority is for — unlike section 04's, far below it. */
                priority
              />
            </div>
          ) : null}
        </div>

        {/* ── THE ARGUMENT, ALTERNATING ─────────────────────────────────
            Each section is a heading column and a prose column, and the two
            swap sides every time. The zig-zag is in the HEADINGS: they step
            left, right, left down the page, so the shape of the article is
            visible before a word of it is read, and each new section announces
            itself by landing somewhere the last one did not.

            THE PROSE DOES NOT ZIG-ZAG WITH THEM, and that is the part worth
            defending. Alternating the body text as well would move the left
            margin every few paragraphs, and a reader's eye returns to a
            remembered position at the end of every line — moving it is the one
            thing a long read cannot afford. So the measure stays constant and
            only the heading changes side. The page alternates; the reading
            does not.

            ORDER, NOT direction:rtl OR float. The columns are in document
            order heading-then-prose for every section, and only `order` moves
            them visually — so a screen reader and a keyboard meet them in the
            order they are meant to be read whichever side they are drawn on.

            IT COLLAPSES BELOW md. Two columns at 500px would be two narrow
            strips, so the grid becomes one column and the heading sits above
            its prose, every time, which is just an article. */}
        <div className="mt-16 space-y-14">
          {parts.map((part, i) => {
            if (!part.heading) {
              /* The opening paragraph: set a size up, and LEFT-ALIGNED
                 rather than centred. It was centred while the head above it
                 was a centred column; the head is now left-aligned across the
                 page, so a centred lede sat indented under a flush headline
                 and read as a pull-quote. Everything on this page starts at
                 the same left edge. */
              return (
                <div
                  key={`lede-${i}`}
                  className="post-body max-w-[46rem] font-sans text-[1.12rem] leading-[1.7] text-ink"
                  dangerouslySetInnerHTML={{ __html: part.body }}
                />
              );
            }

            n += 1;
            /* The FIRST headed section sits left, so the page starts where
               English reading starts. Everything after it takes its turn. */
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
                  <p
                    className={`font-sans text-[0.72rem] font-extrabold tracking-[0.2em] text-orange-dark ${
                      flipped ? "md:text-right" : ""
                    }`}
                  >
                    {String(n).padStart(2, "0")}
                  </p>
                  <h2
                    className={`mt-2 max-w-[16ch] font-display text-[clamp(1.3rem,2.2vw,1.8rem)] font-extrabold leading-[1.2] tracking-[-0.025em] text-ink ${
                      flipped ? "md:ml-auto" : ""
                    }`}
                    /* Already cleaned before storage — this is the inside of
                       an <h2> the sanitiser produced, which is why it can
                       carry the author's emphasis instead of being flattened
                       to text. */
                    dangerouslySetInnerHTML={{ __html: part.heading }}
                  />
                  {/* The rule is the only thing that moves to the outer edge
                      with the heading, which is what makes the alternation
                      read as deliberate rather than as a layout bug. */}
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

        {/* The piece ends with the ask rather than with nothing — somebody who
            has read to the bottom is exactly the person worth asking. */}
        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-5 rounded-[var(--radius-card)] bg-espresso px-7 py-7 sm:px-9">
          <p className="min-w-0 flex-1 font-display text-[clamp(1.15rem,2vw,1.45rem)] font-bold leading-[1.25] tracking-[-0.02em] text-cream">
            Want this worked out for your floor?
          </p>
          <Link
            href="/#pricing"
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-orange px-6 py-3.5 font-sans text-[0.98rem] font-semibold text-white transition-colors duration-300 hover:bg-orange-dark"
          >
            Get pricing
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </article>
    </main>
  );
}
