/**
 * The footer.
 *
 * Link columns and the bottom bar, on cream. The closing CTA that used to
 * sit on top of this is now section 07, above the blog — it was numbered
 * content, not site furniture.
 *
 * Every link here points at a real anchor on this page. Nothing is a dead
 * href waiting for a route that does not exist — a footer full of links that
 * go nowhere is worse than a shorter footer.
 */

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Beverages",
    links: [
      { label: "Tea", href: "#menu" },
      { label: "Filter coffee", href: "#menu" },
      { label: "Milk drinks", href: "#menu" },
      { label: "Specialty", href: "#menu" },
    ],
  },
  {
    title: "For Business",
    links: [
      { label: "IT & offices", href: "#industries" },
      { label: "Manufacturing", href: "#industries" },
      { label: "Colleges & schools", href: "#industries" },
      { label: "Hospitals", href: "#industries" },
    ],
  },
  {
    title: "Machines",
    links: [
      { label: "The machines", href: "#machines" },
      { label: "Above 40 cups", href: "#savings" },
      { label: "Custom builds", href: "#machines" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "The service", href: "#service" },
      { label: "Case studies", href: "#cases" },
      { label: "Blog", href: "#blog" },
      { label: "Get pricing", href: "#pricing" },
    ],
  },
];

const ADDRESS = "No 117, Nethaji Road, Madurai 625001";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-line bg-cream pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(2rem,5vw,3.5rem)]">
      <div className="shell">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink">
                {col.title}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="font-sans text-[0.92rem] text-ink-soft underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-300 hover:text-espresso hover:decoration-orange"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-[clamp(2rem,5vw,3.5rem)] border-t border-line pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-display text-[0.95rem] font-extrabold tracking-[-0.01em] text-ink">
              HOTCUPS{" "}
              <span aria-hidden="true" className="mx-1 font-normal text-mute">
                ·
              </span>
              <span className="font-sans text-[0.88rem] font-medium text-ink-soft">
                Recharges you.{" "}
                <span className="text-orange-dark">Twice a day.</span>
              </span>
            </p>

            <p className="font-sans text-[0.82rem] text-mute">
              &copy; {new Date().getFullYear()}
            </p>
          </div>

          <p className="mt-2 font-sans text-[0.82rem] text-ink-soft">
            {ADDRESS}
          </p>
        </div>
      </div>
    </footer>
  );
}
