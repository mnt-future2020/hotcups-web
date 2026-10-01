/**
 * The content store: one JSON file on disk, read by the site and written by the
 * panel.
 *
 * SERVER ONLY. Nothing in here may be imported from a "use client" module — it
 * reaches for node:fs, which would break the browser bundle. The client side
 * gets the same data through lib/content/context.tsx, which the root layout
 * hands it after calling getContent() here.
 *
 * WHY A FILE AND NOT A DATABASE. There is no database. Adding one — Postgres,
 * SQLite, a hosted service — is a dependency, a connection string, a migration
 * story and an operational surface, in exchange for concurrency guarantees that
 * a site with ONE editor and four objects of content does not need. A JSON file
 * is greppable, diffable, copyable to a backup with `cp`, and needs no
 * credentials to inspect at 2am.
 *
 * IT IS GITIGNORED, and that is the other half of the decision. The file is
 * written by a form on a running server, so committing it would mean every
 * deploy's `git pull` either conflicting with the client's edits or reverting
 * them. The versioned copy of these values is DEFAULT_CONTENT in
 * lib/content/schema.ts — which is also what the site renders when this file is
 * absent, so a fresh clone is not a blank site. Backing it up is the host's job,
 * the same as it would be for a database.
 *
 * !! THE ONE THING THIS DOES NOT SURVIVE: A READ-ONLY OR EPHEMERAL FILESYSTEM.
 * !! On Vercel, Netlify Functions, Cloud Run and every other serverless host,
 * !! the application directory is read-only — saveContent() will throw EROFS —
 * !! and even where a write succeeds it is lost on the next cold start and
 * !! invisible to the other instance serving half the traffic.
 * !!
 * !! So this store is correct for: `next start` on a VPS or a container with a
 * !! persistent volume, and local development. It is NOT correct for
 * !! serverless. The panel does not pretend otherwise — canWrite() below is
 * !! what the dashboard calls to say so on screen rather than letting an
 * !! operator find out by losing an afternoon of edits.
 * !!
 * !! Moving to a real database later is a change to THIS FILE ONLY: getContent
 * !! and saveContent are the entire interface, and both are already async.
 */

import { readFile, writeFile, rename, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { DEFAULT_CONTENT, parseContent, type SiteContent } from "./schema";

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "content.json");

/**
 * Read the stored content, or the defaults.
 *
 * A MISSING FILE IS NOT AN ERROR, and that is the load-bearing decision in this
 * function. Before anyone has saved anything there is no content.json, and the
 * right behaviour then is for the site to render exactly as it did before the
 * panel existed — so ENOENT returns DEFAULT_CONTENT rather than throwing. The
 * same goes for a file that will not parse: a truncated write or a bad hand-edit
 * should cost one stale phone number, not the home page.
 */
export async function getContent(): Promise<SiteContent> {
  try {
    const text = await readFile(FILE, "utf8");
    return parseContent(JSON.parse(text));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") {
      /* Worth a line in the server log — a parse failure is silent on the page
         by design, and silence is how a broken file stays broken for weeks. */
      console.error("[content] falling back to defaults:", err);
    }
    return DEFAULT_CONTENT;
  }
}

/**
 * Write it back.
 *
 * WRITE TO A TEMPORARY FILE AND RENAME. A plain writeFile truncates first and
 * then fills, so a crash or a concurrent read in between yields half a JSON
 * document — and getContent()'s fallback would then quietly swap the whole
 * site back to defaults. rename() is atomic within a filesystem, so a reader
 * sees either the old file or the new one and never a partial one.
 *
 * NO LOCKING, and it is worth being explicit about what that means: two
 * operators saving different sections in the same second will have one
 * overwrite the other's object. With one editor this cannot happen; with two it
 * costs a re-edit. A lock file would be the fix, and it would also be the first
 * thing to leak a stale lock and wedge the panel shut.
 */
export async function saveContent(next: SiteContent): Promise<void> {
  await mkdir(DIR, { recursive: true });
  /* pid in the name so two concurrent saves cannot collide on the temp file
     itself — they can still overwrite each other's content, per the note above,
     but neither will read the other's half-written bytes. */
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
  await rename(tmp, FILE);
}

/**
 * Can this deployment actually persist an edit?
 *
 * Checks the DIRECTORY rather than the file, because the file usually does not
 * exist yet and the question is whether one can be created. A missing directory
 * is reported as writable-in-principle: mkdir in saveContent will create it, and
 * on the hosts where that fails the parent is not writable either, which this
 * catches.
 */
export async function canWrite(): Promise<boolean> {
  try {
    await access(DIR, constants.W_OK);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      try {
        await access(process.cwd(), constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/** Whether anything has been saved yet — the dashboard says "showing the
    built-in defaults" until it has, so an operator is never left wondering
    whether the panel is connected to the page they are looking at. */
export async function hasSaved(): Promise<boolean> {
  try {
    await access(FILE, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export { FILE as CONTENT_FILE };
