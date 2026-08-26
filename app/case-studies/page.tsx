import type { Metadata } from "next";
import Link from "next/link";

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

export const metadata: Metadata = {
  title: "Case studies — Hotcups",
  description:
    "How workplaces across Tamil Nadu run their tea and coffee — the ones on flasks, and the ones that crossed 40 cups a day.",
  robots: { index: false, follow: true },
};

export default function CaseStudiesIndex() {
  return (
    <main className="bg-cream">
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
