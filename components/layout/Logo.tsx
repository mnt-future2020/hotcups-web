import Image from "next/image";
import Link from "next/link";
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
 */

const W = "w-[132px] md:w-[148px] xl:w-[164px]";

export default function Logo({
  className = "",
  light = false,
}: {
  className?: string;
  /** over the hero's photograph, where the maroon lockup disappears */
  light?: boolean;
}) {
  return (
    <Link
      href="#hero"
      aria-label="Hotcups — home"
      className={`relative inline-flex shrink-0 items-center ${className}`}
    >
      <Image
        src={dark}
        alt="Hotcups"
        priority
        sizes="164px"
        className={`h-auto ${W} transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
        style={{ opacity: light ? 0 : 1 }}
      />
      <Image
        src={white}
        alt=""
        aria-hidden="true"
        priority
        sizes="164px"
        className={`absolute left-0 top-0 h-auto ${W} transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
        style={{ opacity: light ? 1 : 0 }}
      />
    </Link>
  );
}
