"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Section 08 — Reading.
 *
 * THE QUIETEST SECTION ON THE PAGE, ON PURPOSE
 * It follows the machine row and the pricing band, both of which are loud.
 * A blog grid that competes with them would make the page feel like it has
 * three endings. So: cream ground, white cards, small type, one hover, and
 * an entrance that is a fade and nothing else.
 *
 * THREE CARDS, NOT FOUR
 * Four wraps to 2+2 at most widths, which reads as a broken row rather than
 * a deliberate one, and the fourth post adds nothing that "All posts" does
 * not already cover.
 *
 * NO EXCERPTS
 * An excerpt turns a card into a paragraph of grey text that nobody reads and
 * that pushes the title of the next card below the fold. Tag, read time,
 * title. The whole card is the link, so there is no "Read more" either.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
/** the brief's cadence — one card every 100ms */
const STEP = 0.1;

/* /blog is a real stub route, so none of these are dead links. The posts get
   their own URLs in phase 2, once the CMS is settled. */
const HREF = "/blog";

const POSTS = [
  {
    tag: "Guide",
    read: "4 min",
    title: "How to plan beverage supply for your workplace",
    src: "/img/need-bulk.jpg",
    alt: "Flasks and cups laid out for a bulk workplace order",
  },
  {
    tag: "Trends",
    read: "5 min",
    title: "Tea vs Coffee: what works best for your team?",
    src: "/img/chai-classroom-wide.jpg",
    alt: "A tray of chai glasses being shared around a room",
  },
  {
    tag: "Business",
    read: "4 min",
    title: "Why recurring supply improves productivity",
    src: "/img/need-recurring.jpg",
    alt: "A standing weekly delivery of Hotcups flasks",
  },
];

export default function Blog() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const on = useInView(ref, { amount: 0.2, once: true }) || Boolean(reduced);

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section
      id="blog"
      ref={ref}
      className="relative overflow-x-clip bg-cream"
      style={{ paddingBlock: "clamp(4.5rem, 9vw, 8rem)" }}
    >
      {/* The delivery round, behind the writing about it.

          THE WASH IS SET BY THE DARKEST PATCH, NOT THE AVERAGE
          Everything on this ground is dark text, so a dark patch is the
          failure case. This plate's darkest 2% is rgb(1,1,1) — the road and
          the rider — and its median luminance is 0.150, darker than the one
          it replaced. The binding element is the eyebrow: ink-soft at 0.72rem,
          which needs 4.5:1.

          Swept the whole range against that worst patch: 0.70 is the floor
          (eyebrow 4.53) and anything below it fails. 0.76 sits above the floor
          with real margin — the worst patch composites to rgb(194,188,183),
          keeping the eyebrow at 5.33:1, the heading at 9.94:1 and "All posts"
          at 8.68:1.

          It used to be 0.92, which was legible but had the photo almost
          invisible. 0.76 is the point where it reads as a photograph rather
          than a texture, without putting the small type near the line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url(/img/blog-bg-v3.webp)",
          backgroundSize: "cover",
          /* "top", not "center". The section is far wider than the photo's
             16:9, so cover crops height — and centring split that crop evenly,
             taking the temple's spire off the top. Anchored to the top, the
             whole crop comes off the road at the bottom, which is motion blur
             and has nothing to lose. */
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "rgba(255,247,240,0.76)" }}
      />

      <div className="shell relative z-10">
        <motion.div {...fade(0)} className="flex items-center gap-4">
          {/* mute measured 3.25:1 on the washed photo against 3.88 on plain
              cream. The eyebrow is the smallest text on this ground, so it takes
              the darker ink rather than the palette default. */}
          <span className="eyebrow whitespace-nowrap text-ink-soft">
            08 — Reading
          </span>
          <span className="h-px w-16 bg-line md:w-24" />
        </motion.div>

        <motion.h2
          {...fade(0.08)}
          className="mt-3 max-w-[20ch] font-display text-[clamp(1.7rem,3vw,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink"
        >
          Written for whoever runs the pantry.
        </motion.h2>

        <div className="mt-[clamp(1.75rem,4vw,3rem)] grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post, i) => (
            <motion.div key={post.title} {...fade(0.2 + i * STEP)}>
              <Link
                href={HREF}
                className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-1.5 focus-visible:shadow-[var(--shadow-2)]"
              >
                {/* the frame is what clips the scale — the card itself must not
                    hide overflow or it would clip its own focus ring */}
                <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
                  <Image
                    src={post.src}
                    alt={post.alt}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>

                <div className="p-6">
                  <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.14em]">
                    {/* orange-dark, not orange: 4.11:1 on white against
                        orange's 3.15:1. Still reads as the brand colour. */}
                    <span className="text-orange-dark">{post.tag}</span>
                    <span aria-hidden="true" className="mx-2 text-line">
                      &middot;
                    </span>
                    <span className="font-medium tracking-[0.08em] text-mute">
                      {post.read}
                    </span>
                  </p>

                  <h3 className="mt-2.5 font-display text-[1.18rem] font-bold leading-[1.32] tracking-[-0.01em] text-ink underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-300 group-hover:decoration-orange">
                    {post.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div {...fade(0.2 + POSTS.length * STEP)} className="mt-8 text-right">
          <Link
            href={HREF}
            /* espresso text, so when the amber wipes up it reads 6.02:1 —
               the light-on-amber buttons elsewhere sit at 3.15 */
            className="hero-btn group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-line px-6 py-3 font-sans text-[0.95rem] font-semibold text-espresso transition-colors duration-300 hover:border-orange"
          >
            <span className="relative z-10">All posts</span>
            <span
              aria-hidden="true"
              className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
