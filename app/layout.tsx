import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "Hotcups — Recharges you. Twice a day.",
  description:
    "Flasks of hot tea and coffee delivered to workplaces across Tamil Nadu. Past 40 cups a day, a machine costs less — including one built to your spec.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
