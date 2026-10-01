"use client";

import { useEffect, useState } from "react";
import type { ActivityEntry } from "@/lib/content/schema";

/**
 * What was saved today.
 *
 * ── WHY IT IS TODAY AND NOT THE LAST TWENTY ───────────────────────────────
 *
 * The feed listed everything the store had, newest first, so the top of it was
 * usually three identical "3 posts saved" lines from one afternoon of work and
 * the rest was last week. The question this card is opened with is "what has
 * changed since I last looked", and on a panel one person uses, that means
 * today. Everything older is still in content.json; it is just not the thing
 * being asked about.
 *
 * THE STORE STILL KEEPS TWENTY. This filters the view, not the record — see
 * ACTIVITY_LIMIT. Trimming the log to a day would mean a save at 23:58 erasing
 * the morning's history at midnight, which is a different and much worse
 * thing.
 *
 * ── CLIENT-SIDE, AND THAT IS THE WHOLE REASON THIS IS ITS OWN COMPONENT ───
 *
 * The same argument Greeting.tsx makes, and it bites harder here. "Today" is a
 * question only the reader's clock can answer: the server renders in UTC on a
 * deploy, and for a business in Tamil Nadu that is five and a half hours
 * behind — so between midnight and half past five in the morning the server
 * would still think it was yesterday and this card would quietly show the
 * wrong day's work while the greeting above it showed the right date.
 *
 * IT RENDERS NOTHING UNTIL IT MOUNTS. Computing the day during the server
 * render produces markup the client then disagrees with, and the fix for a
 * hydration mismatch is not to suppress the warning — it is to admit the value
 * is not knowable until the browser has it.
 *
 * ── AND THE ROWS NOW CARRY TIMES ──────────────────────────────────────────
 *
 * The old rows showed a date, which was the only useful thing about them when
 * the list spanned a fortnight. Every row here is the same day, so a repeated
 * "1 Oct" down the right-hand edge is a column of noise. The time is what
 * separates them — and it is only printable at all because this runs on the
 * reader's machine; the previous comment in this file's place said as much
 * when it refused to show one.
 */
export default function TodayActivity({
  entries,
}: {
  entries: ActivityEntry[];
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    /* Re-checked every minute so the list empties itself at midnight on a
       panel that has been left open, rather than showing "today" against
       yesterday's date until somebody reloads. */
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    /* One frame, and the space is already reserved by the card. The same
       choice Greeting makes rather than guessing with the server's clock. */
    return <p className="text-[0.9rem] text-ink-soft">&nbsp;</p>;
  }

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = entries.filter((e) => sameDay(new Date(e.at), now));

  if (today.length === 0) {
    /* NOT JUST "NOTHING TODAY". An empty box invites the question "is this
       broken?", and the answer is in the data: name when the last change
       actually was. Entries are stored newest-first. */
    const last = entries[0];

    return (
      <p className="text-[0.9rem] leading-relaxed text-ink-soft">
        Nothing saved today.{" "}
        {last ? (
          <>
            The last change was{" "}
            <time dateTime={last.at} className="font-semibold text-ink">
              {new Date(last.at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
              })}
            </time>
            {" — "}
            {last.section.toLowerCase()}.
          </>
        ) : (
          <>Every save is recorded here.</>
        )}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {today.map((entry, i) => (
        <li
          key={`${entry.at}-${i}`}
          className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
        >
          <span
            aria-hidden
            className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-cream-deep text-[0.65rem] font-bold uppercase text-ink-soft"
          >
            {entry.section.slice(0, 2)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.85rem] font-semibold text-ink">
              {entry.section}
            </span>
            <span className="block text-[0.82rem] leading-snug text-ink-soft">
              {entry.summary}
            </span>
          </span>
          <time
            dateTime={entry.at}
            className="shrink-0 text-[0.75rem] tabular-nums text-mute"
          >
            {/* hour12 IS FORCED, and it is the one place this component
                overrules the reader's machine. Left to the locale, a browser
                set to en-GB prints 13:08 — correct for the locale and wrong
                for everyone who will actually read this screen. India writes
                the clock as 1:08 pm, in speech and on every receipt. */}
            {new Date(entry.at).toLocaleTimeString("en-IN", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </time>
        </li>
      ))}
    </ul>
  );
}
