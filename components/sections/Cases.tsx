"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Section 06 — Case studies.
 *
 * WHAT THIS REPLACES, AND WHY IT MATTERS
 * A two-office split panel either side of the 40-cup line: company names,
 * headcounts, cups-a-day, before/after copy and measured results, for two
 * customers. Every figure in it was invented — it carried a "DO NOT PUBLISH"
 * banner for exactly that reason, and it was the last thing on the page that
 * could not go live. Three headlines and a link assert nothing that needs a
 * customer's sign-off, so this section is publishable as it stands. The only
 * outstanding item is that /case-studies is still a stub.
 *
 * THE CARD IS THE LINK, NOT THE WORDS INSIDE IT
 * "Read the full story" is the affordance a reader looks for, but the whole
 * card is the hit area — a 360x480 target rather than a 142px line of text.
 * The heading lives inside the anchor so a screen reader announces the story,
 * not "read the full story" three times with nothing to tell them apart.
 *
 * NO PANEL. A SCRIM.
 * The first version put the text in a 70%-black rounded box floating over the
 * photograph. It read as a sticker — three grey rectangles pasted on three
 * pictures, with the picture behind them doing nothing. The text sits
 * DIRECTLY on the photograph now, over a gradient that runs from opaque at
 * the base to nothing by two-thirds up, so there is no edge anywhere and the
 * photograph is continuous behind the words.
 *
 * That is only legal because the gradient is deep where the text is. A
 * photograph can be any colour it likes, so the worst case is a white one,
 * and the ramp is cut to the measured height of the text stack rather than
 * chosen by eye — see the note on the element. Against a white photograph the
 * link holds 18.1:1, the headline 15.2:1 and the orange rule 4.1:1. The colour is #0c0604, the
 * espresso near-black, not pure black — pure black over a warm photograph
 * greys it.
 *
 * The link is white rather than orange. Orange over this scrim measures
 * 2.7:1, under the 4.5 a 15px line needs. The rule above the headline carries
 * the brand instead, and it is the thing that moves on hover.
 *
 * THE ENTRANCE IS A CURTAIN, NOT A FADE
 * Each card clips open from its own base — inset(100% 0 0 0) to inset(0) —
 * while the photograph inside counter-scales 1.14 to 1, so the picture
 * settles rather than sliding. Then the rule draws left to right, the
 * headline rises out of its own overflow, and the link fades up last. Four
 * beats per card, three cards 0.12s apart. Under prefers-reduced-motion every
 * one of them is skipped and the cards are simply there.
 *
 * ASPECT, NOT HEIGHT
 * The cards are aspect-[3/4] so the three stay identical whatever the copy
 * does. Two of the three headlines run to two lines at nearly every width;
 * the text block grows upward from a fixed base, so a third line never
 * changes the card's height, only how much photograph is left above it.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

/** the stub route, same as the old section pointed at */
const HREF = "/case-studies";

/**
 * Three stories. Deliberately no category, no headcount, no cups-a-day, no
 * price and no company name — a headline is a claim about what the product
 * does, which needs no customer's permission. The moment a name or a number
 * goes on one of these, it needs written sign-off first.
 */
const STORIES = [
  {
    key: "id",
    src: "/img/case-story-1.webp",
    title: "No QR. Just tap your ID and drink.",
  },
  {
    key: "menu",
    src: "/img/case-story-2.webp",
    title: "One machine. Your office’s favourite drinks.",
  },
  {
    key: "rush",
    src: "/img/case-story-3.webp",
    title: "When the whole office wants chai at once.",
  },
];

export default function Cases() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, once: true });
  const on = inView || Boolean(reduced);

  const reveal = (delay: number, y = 18) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y },
          transition: { duration: 0.7, delay, ease: EASE },
        };

  const clipLine = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { y: "112%" },
          animate: on ? { y: "0%" } : { y: "112%" },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <section
      id="cases"
      ref={ref}
      className="relative overflow-x-clip bg-cream"
      style={{ paddingBlock: "clamp(4.5rem, 8vw, 7.5rem)" }}
    >
      <div className="shell">
        {/* ---------------- heading ---------------- */}
        <motion.div {...reveal(0, 0)} className="flex items-center gap-4">
          {/* ink-soft, not the eyebrow's default mute: mute is 3.88:1 on
              cream and this is the smallest type in the section */}
          <span className="eyebrow whitespace-nowrap text-ink-soft">
            06 — Case studies
          </span>
          <motion.span
            initial={reduced ? undefined : { scaleX: 0 }}
            animate={reduced ? undefined : on ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: "linear" }}
            className="h-px w-16 origin-left bg-line md:w-24"
          />
        </motion.div>

        {/* Two sentences, two lines, the second in orange-dark — the same
            problem/answer shape sections 02 and 04 use. Plain orange is
            2.97:1 on cream and fails even the large-text floor; orange-dark
            is 3.88. Measured in Manrope ExtraBold with its -0.03em tracking,
            the longer line is 11.91 em, so 572px at the 3rem cap against a
            1128px shell. It holds one line at every width down to 375. */}
        <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.7rem,3.7vw,3rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-ink">
          <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span {...clipLine(0.15)} className="block">
              Real workplace problems.
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span {...clipLine(0.24)} className="block text-orange-dark">
              Smarter solutions.
            </motion.span>
          </span>
        </h2>

        {/* ---------------- the three stories ---------------- */}
        <div className="mt-[clamp(2rem,4vw,3.25rem)] grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {STORIES.map((story, i) => {
            /* four beats per card, cards 0.12s apart */
            const at = 0.35 + i * 0.12;

            return (
              <article key={story.key}>
                <Link
                  href={HREF}
                  className="group block rounded-[var(--radius-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
                >
                  {/* the curtain: the card clips open from its own base */}
                  <motion.div
                    className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-espresso-deep"
                    initial={
                      reduced ? false : { clipPath: "inset(100% 0% 0% 0%)" }
                    }
                    animate={
                      on
                        ? { clipPath: "inset(0% 0% 0% 0%)" }
                        : { clipPath: "inset(100% 0% 0% 0%)" }
                    }
                    transition={{ duration: 0.85, delay: at, ease: EASE }}
                  >
                    {/* counter-scale, so the photograph SETTLES as the
                        curtain passes rather than sliding up with it */}
                    <motion.div
                      className="absolute inset-0"
                      initial={reduced ? false : { scale: 1.14 }}
                      animate={on ? { scale: 1 } : { scale: 1.14 }}
                      transition={{ duration: 1.25, delay: at, ease: EASE }}
                    >
                      {/* alt is empty on purpose: the heading inside the
                          anchor is the accessible name, and a second
                          description of the same card would be read twice */}
                      <Image
                        src={story.src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                        className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-[1.07]"
                      />
                    </motion.div>

                    {/* The scrim, and its ramp is set by where the block
                        ends, not by eye. The text stack is 140px tall on a
                        480px card, so its top edge lands at 37% of this
                        element — the 0.90 stop is held to 30% and the fall to
                        0.66 does not begin until 52%, which puts the orange
                        rule on 0.83 of scrim. Over the worst photograph
                        there is (a white one) that is 15.2:1 for the headline
                        and 4.1:1 for the rule. The first ramp I wrote fell to
                        0.62 by 44% and put the rule at 1.84. */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%]"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(12,6,4,0.95) 0%, rgba(12,6,4,0.90) 30%, rgba(12,6,4,0.66) 52%, rgba(12,6,4,0.24) 74%, rgba(12,6,4,0) 100%)",
                      }}
                    />

                    {/* deepens on hover, so the picture recedes and the words
                        come forward — one property, no layout */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(12,6,4,0.5) 0%, rgba(12,6,4,0) 62%)",
                      }}
                    />

                    <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:-translate-y-1.5 lg:p-6">
                      {/* the rule draws in, then grows on hover. It is the
                          only orange on the card, because orange TEXT over
                          this scrim is 2.7:1. */}
                      <motion.span
                        aria-hidden="true"
                        className="mb-4 block h-[3px] w-7 origin-left rounded-full bg-orange transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16"
                        initial={reduced ? false : { scaleX: 0 }}
                        animate={on ? { scaleX: 1 } : { scaleX: 0 }}
                        transition={{ duration: 0.5, delay: at + 0.5, ease: EASE }}
                      />

                      <div className="overflow-hidden">
                        <motion.h3
                          className="font-display text-[clamp(1.15rem,1.5vw,1.5rem)] font-bold leading-[1.26] tracking-[-0.01em] text-white"
                          initial={reduced ? false : { y: "110%" }}
                          animate={on ? { y: "0%" } : { y: "110%" }}
                          transition={{
                            duration: 0.7,
                            delay: at + 0.55,
                            ease: EASE,
                          }}
                        >
                          {story.title}
                        </motion.h3>
                      </div>

                      {/* A pill, and the amber wipes up like every other
                          button on the page — but driven by group-hover, not
                          its own :hover, because the whole CARD is the link
                          and the pointer is rarely over these 150 pixels.
                          .hero-btn keys off :hover so it cannot be used here;
                          this is the same wipe written by hand. */}
                      <motion.span
                        className="relative mt-4 inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/45 px-5 py-2.5 font-sans text-[0.92rem] font-semibold text-white"
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={
                          on ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }
                        }
                        transition={{
                          duration: 0.5,
                          delay: at + 0.72,
                          ease: EASE,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 origin-bottom scale-y-0 bg-orange transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                        />
                        <span className="relative z-10">Read the full story</span>
                        <span
                          aria-hidden="true"
                          className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5"
                        >
                          &rarr;
                        </span>
                      </motion.span>
                    </div>
                  </motion.div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
