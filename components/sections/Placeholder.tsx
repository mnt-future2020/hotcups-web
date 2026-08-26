import { SECTIONS } from "@/lib/sections";

/**
 * Anchored shell for a section that is not designed yet.
 * Keeps the nav and the scroll spy honest while we build one at a time.
 */
export default function Placeholder({
  id,
  index,
  tone = "white",
}: {
  id: string;
  index: string;
  tone?: "white" | "cream" | "deep";
}) {
  const label = SECTIONS.find((s) => s.id === id)?.label ?? id;
  const bg =
    tone === "cream" ? "bg-cream" : tone === "deep" ? "bg-cream-deep" : "bg-white";

  return (
    <section id={id} className={`section-y ${bg}`}>
      <div className="shell">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-sm font-semibold text-orange">
            {index}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <h2 className="mt-5 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.02em] text-ink">
          {label}
        </h2>
        <p className="mt-4 max-w-[52ch] font-sans text-ink-soft">
          Next up — we design this section&rsquo;s motion before it gets built.
        </p>
      </div>
    </section>
  );
}
