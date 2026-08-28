"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import white from "@/public/img/logo-h-white.webp";
import dark from "@/public/img/logo-h.webp";

/**
 * The wordmark.
 *
 * TWO ASSETS, NOT ONE AND A FILTER
 * The light variant used to be the maroon lockup under
 * `filter: brightness(0) invert(1)`, which flattens every colour to the same
 * white — so "CUPS" lost its orange and the cup mark lost its shape. This is
 * the real white lockup instead.
 *
 * BOTH ARE MOUNTED AND CROSSFADED
 * Swapping the `src` at the hero's edge would decode a new file mid-scroll and
 * flash. They are stacked and their opacity is traded, so the handover costs
 * nothing and cannot shift the layout. Trimmed of their transparent padding
 * the two lockups are 3.333 and 3.288 wide-to-tall — 0.7px apart at this size,
 * which is why they can share one box.
 *
 * HORIZONTAL, NOT STACKED
 * The old lockup was 900x522. At the width a header wants it stood ~86px tall
 * in a 78px bar, so it overflowed its own header. This one is 3.3:1.
 *
 * CLICKING IT GOES HOME, AND ON HOME IT GOES TO THE TOP
 * It was a permanent <Link href="#hero">, which is wrong in both directions.
 * On /blog and /case-studies it appended a hash to a page that has no #hero
 * and did nothing at all — a logo that does not go home. And on the home page
 * the App Router treats a hash-only Link as a soft navigation to the route it
 * is already on, so whether anything scrolls is up to the router's scroll
 * restoration rather than up to us: sometimes nothing moved.
 *
 * So the destination is decided by where you are. Off home it is a real
 * navigation to "/". On home the default is cancelled and the window is
 * scrolled itself, which is the one version that cannot be second-guessed.
 * scrollTo is left on behavior "auto" deliberately — that defers to the CSS
 * scroll-behavior on <html>, so the smooth scroll and any reduced-motion
 * override both stay in the stylesheet with every other scroll on the page.
 */

/* The header's size. Passed as a prop rather than hard-coded so the footer
   can set its own — two `w-[...]` classes on one element is a specificity tie
   decided by the order Tailwind happened to emit them, which is not a thing
   to depend on. */
const W = "w-[132px] md:w-[148px] xl:w-[164px]";

export default function Logo({
  className = "",
  light = false,
  size = W,
}: {
  className?: string;
  /** over the hero's photograph, where the maroon lockup disappears */
  light?: boolean;
  /** responsive width classes; defaults to the header's */
  size?: string;
}) {
  const onHome = usePathname() === "/";

  return (
    <Link
      href={onHome ? "#hero" : "/"}
      aria-label="Hotcups — home"
      onClick={
        onHome
          ? (e) => {
              e.preventDefault();
              window.scrollTo({ top: 0 });
            }
          : undefined
      }
      className={`relative inline-flex shrink-0 items-center ${className}`}
    >
      {/* loading="eager", NOT priority. `priority` is deprecated in Next 16
          (it split into `preload` and `loading`/`fetchPriority`), and on THIS
          pair it was the wrong half anyway: it put a <link rel=preload> in the
          head for BOTH lockups, and exactly one of them is ever visible — the
          other is the opacity-0 half of the light/dark swap. A preload the
          page never uses is what Chrome logs as "preloaded using link preload
          but not used within a few seconds from the window's load event".

          The docs' own rule is that preload is for the ONE above-the-fold LCP
          image, and explicitly not "when you have multiple images that could
          be considered the LCP element". Two lockups at 28KB and 32KB are
          neither. eager still loads them straight away, which is all the bar
          needed: no lazy threshold, no preload link, no warning. */}
      <Image
        src={dark}
        alt="Hotcups"
        loading="eager"
        sizes="220px"
        className={`h-auto ${size} transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
        style={{ opacity: light ? 0 : 1 }}
      />
      <Image
        src={white}
        alt=""
        aria-hidden="true"
        loading="eager"
        sizes="220px"
        className={`absolute left-0 top-0 h-auto ${size} transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
        style={{ opacity: light ? 1 : 0 }}
      />
    </Link>
  );
}
