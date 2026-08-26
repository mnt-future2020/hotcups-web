import type { Metadata } from "next";
import Link from "next/link";

/**
 * The blog, as a stub.
 *
 * It exists so that section 08's cards and its "All posts" link are real
 * navigation rather than dead hrefs — a card that goes nowhere is worse than
 * no card. The posts get their own URLs in phase 2, once the CMS is settled.
 *
 * noindex until there is something here: a near-empty page that ranks is a
 * liability, not a placeholder.
 */

export const metadata: Metadata = {
  title: "Reading — Hotcups",
  description:
    "Notes on running a workplace pantry — supply planning, what teams drink, and what recurring delivery changes.",
  robots: { index: false, follow: true },
};

export default function BlogIndex() {
  return (
    <main className="bg-cream">
      <div
        className="shell flex min-h-svh flex-col justify-center"
        style={{ paddingTop: "calc(var(--header-h) + 3rem)", paddingBottom: "4rem" }}
      >
        <span className="eyebrow">Reading</span>

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
