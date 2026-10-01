"use client";

import { useState } from "react";

/**
 * The tab strip on System Settings.
 *
 * AN UNDERLINE RATHER THAN THE PILLS THE EDITORS USE, and the difference is
 * doing a job. A pill row on the content forms switches between things of the
 * same kind — slide 2, slide 3, Tea, Coffee — where the tabs are a list. These
 * three are different KINDS of screen: one is read-only facts, one is two
 * generated files, one is a button that throws everything away. An underline
 * reads as "different places", a pill row as "more of the same".
 *
 * EVERY PANEL IS RENDERED AND THE INACTIVE ONES ARE HIDDEN, the same mechanism
 * as everywhere else in this panel — but here for a different reason. Nothing
 * on this page posts as one form, so it is not about keeping inputs in the
 * document; it is so a find-in-page reaches the tab you are not on. Somebody
 * looking for "where is content.json" should find it without knowing which tab
 * it is behind.
 */
export default function SettingsTabs({
  tabs,
  panels,
}: {
  tabs: string[];
  /** one per tab, in the same order */
  panels: React.ReactNode[];
}) {
  const [active, setActive] = useState(0);

  return (
    <>
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex gap-6 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`relative shrink-0 whitespace-nowrap pb-3 text-[0.8rem] font-bold uppercase tracking-[0.08em] transition ${
              active === i
                ? "text-orange-deep"
                : "text-mute hover:text-ink-soft"
            }`}
          >
            {tab}
            {/* THE UNDERLINE SITS ON THE BORDER, not under it — -1px so it
                covers the container's own line rather than doubling it. */}
            <span
              aria-hidden
              className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full transition ${
                active === i ? "bg-orange" : "bg-transparent"
              }`}
            />
          </button>
        ))}
      </div>

      {panels.map((panel, i) => (
        <div key={i} hidden={active !== i} className="space-y-5 pt-5">
          {panel}
        </div>
      ))}
    </>
  );
}
