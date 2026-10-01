"use client";

import { useEffect, useState } from "react";

/**
 * "Good morning" and today's date.
 *
 * CLIENT-SIDE, AND THAT IS THE WHOLE REASON THIS IS ITS OWN COMPONENT. The
 * server's clock is not the reader's: a panel rendered in one timezone and
 * opened in another would greet someone with "Good evening" over their
 * breakfast, and print yesterday's date under it. The only machine that knows
 * what time it is where the reader is sitting is theirs.
 *
 * IT RENDERS NOTHING UNTIL IT MOUNTS. Computing the hour during the server
 * render would produce markup the client then disagrees with, which React
 * reports as a hydration mismatch — and the fix for that is not to suppress the
 * warning but to admit the value is not knowable until the browser has it. The
 * gap is one frame and the line reflows into space the layout already reserves.
 */
export default function Greeting({ name }: { name: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    /* Re-check on the hour rather than every second. Nothing here counts
       seconds, and a timer that fires 3,600 times more often than the thing it
       updates is a timer that is wrong about what it is for. */
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const hour = now?.getHours() ?? -1;
  const part =
    hour < 0
      ? ""
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

  return (
    <>
      <h1 className="text-[1.6rem] font-extrabold tracking-[-0.02em] text-espresso">
        {/* The non-breaking space holds the line's height before the clock is
            known, so the heading does not jump a row on mount. */}
        {part ? `${part}, ${name}` : " "}
      </h1>
      <p className="mt-1.5 text-[0.925rem] text-ink-soft">
        {now ? (
          <>
            Here is what is on the site today —{" "}
            <time dateTime={now.toISOString().slice(0, 10)}>
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </time>
          </>
        ) : (
          " "
        )}
      </p>
    </>
  );
}
