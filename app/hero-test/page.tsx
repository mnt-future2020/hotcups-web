"use client";

import LiquidSurface from "@/components/hero/LiquidSurface";

/**
 * Phase 1 rig — the shader and nothing else.
 *
 * No copy, no flask, no scrim. A badly tuned liquid shader looks like brown
 * sludge, and finding that out after the hero is assembled is expensive.
 */
export default function HeroTest() {
  return (
    <main className="fixed inset-0 bg-espresso-deep">
      <LiquidSurface className="h-full w-full" />
    </main>
  );
}
