import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SiteContentProvider } from "@/lib/content/context";
import { getContent } from "@/lib/content/store";

/**
 * The public site's chrome, and the one place editable content crosses from the
 * server into the client tree.
 *
 * WHY THE FETCH IS HERE AND NOT IN EACH PAGE. Header and Footer both read the
 * content and both are rendered by a layout rather than by a page, so a
 * per-page fetch would still leave the two of them without it. This is the
 * lowest node that has every consumer beneath it: the header at the top, the
 * footer at the bottom, and all eight pages in between.
 *
 * ONE READ PER REQUEST, of a file getContent() already treats as best-effort.
 * It is a single readFile of about a kilobyte — cheaper than any of the
 * next/font work happening one level up — and the result is passed to the
 * client as a prop on the provider rather than re-fetched there.
 *
 * WHAT MAKES AN EDIT APPEAR. These pages are static, so this read happens at
 * build time and its result is baked in. Every save action calls
 * revalidatePath("/", "layout"), which invalidates this layout and everything
 * under it — that call, not this function, is what turns a saved form into a
 * changed page. Removing it would make the panel appear to work and change
 * nothing.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getContent();

  return (
    <SiteContentProvider value={content}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </SiteContentProvider>
  );
}
