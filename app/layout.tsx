import type { Metadata } from "next";
import { getContent } from "@/lib/content/store";
import { metadataFor } from "@/lib/content/schema";
import { Caveat, Manrope } from "next/font/google";
import "./globals.css";

/**
 * ONE FAMILY, BOTH ROLES
 * Manrope replaces the Playfair Display / Inter pair. It carries the whole
 * site — headings and body — so the page's hierarchy is now built on size and
 * weight alone rather than on a serif/sans contrast.
 *
 * It is loaded ONCE and pointed at both --font-display and --font-sans in
 * globals.css. The two tokens are kept apart even though they resolve to the
 * same family: every heading in the codebase asks for font-display and every
 * paragraph for font-sans, so putting a second face back is a one-line change
 * here instead of a sweep through forty components.
 *
 * Variable 200-800. The heaviest thing on the site is font-extrabold (800),
 * so nothing has to be synthesised — and nothing uses italics, which Manrope
 * does not ship.
 */
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

/**
 * THE SECOND FACE, AND IT EARNS ITS REQUEST IN ONE PLACE.
 *
 * Section 03's mockup annotates the pantry rail in handwriting — "We prepare"
 * at the top of the route and "We deliver" at the bottom. Manrope cannot do
 * that; it does not even ship italics (see above), so the nearest thing in the
 * one-family setup would have been small caps pretending to be a margin note.
 *
 * FOUR WORDS ON ONE SECTION IS THE WHOLE USAGE. That is deliberately narrow,
 * and it is the reason this is acceptable at all: the marks are the only two
 * places on the site where a human hand is meant to be visible, and a
 * handwriting face is the entire point of them. If a third use ever appears,
 * that is the moment to ask whether the face is doing work or decorating.
 *
 * Latin subset only, self-hosted by next/font like Manrope — no request
 * leaves for Google at runtime. `display: swap` means the marks render in the
 * fallback first; they are aria-hidden decoration sitting in empty cream, so
 * the reflow lands on nothing.
 */
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

/**
 * THE HOME PAGE'S METADATA LIVES HERE, and always has — app/(site)/page.tsx
 * declares none of its own and inherits this. So this is the row the SEO panel
 * labels "/" rather than a separate site-wide default.
 *
 * `generateMetadata` rather than a constant: a constant is evaluated once when
 * the module loads and cannot read content that arrives per request.
 *
 * IT IS ALSO THE FALLBACK FOR ANYTHING WITHOUT ITS OWN — the 404, and /admin
 * before its own layout overrides it. Both are better off inheriting a real
 * title than a placeholder.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getContent();
  return metadataFor(seo, "/");
}

/**
 * THE ROOT LAYOUT IS NOW ONLY THE DOCUMENT.
 *
 * It used to render the skip link, the Header, <main> and the Footer, which was
 * right while every route under app/ was a page of the public site. /admin is
 * not: a panel wearing the site's sticky scroll-spy header and its 630-line
 * footer would be absurd, and there is no way for a Server Component layout to
 * ask which route is below it.
 *
 * So the chrome moved down one level into app/(site)/layout.tsx and this keeps
 * what genuinely belongs to every route in the application — <html>, <body>,
 * the two font variables and globals.css. A route group's parentheses are not
 * part of the URL, so /menu is still /menu and nothing about the public site's
 * addresses changed when its files moved.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${caveat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
