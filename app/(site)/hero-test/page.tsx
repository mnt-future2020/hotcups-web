"use client";

import LiquidSurface from "@/components/hero/LiquidSurface";
import { DEFAULT_CONTENT } from "@/lib/content/schema";

/**
 * Phase 1 rig — the shader and nothing else.
 *
 * No copy, no flask, no scrim. A badly tuned liquid shader looks like brown
 * sludge, and finding that out after the hero is assembled is expensive.
 */
export default function HeroTest() {
  /* THE RIG TAKES THE DEFAULTS RATHER THAN THE STORE. This page exists to tune
     the shader against a KNOWN plate — if it followed whatever is saved, a
     change made in the panel would silently change what the rig is testing,
     which is the one thing a rig must not do. */
  const { flask } = DEFAULT_CONTENT.hero;

  return (
    <main className="fixed inset-0 bg-espresso-deep">
      <LiquidSurface
        className="h-full w-full"
        poster={flask.poster}
        subject={flask.subject}
        /* Empty on the rig, deliberately: this page is a shader harness with
           no copy around it, so the scene has nothing to be described in
           relation to. It also keeps the rig on the same code path the site
           uses when the client has not written a description. */
        alt=""
        steam={flask.steam}
      />
    </main>
  );
}
