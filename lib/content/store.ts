/**
 * The content store: one document, read by the site and written by the panel.
 *
 * SERVER ONLY. Nothing in here may be imported from a "use client" module — it
 * reaches for node:fs and the MongoDB driver, either of which would break the
 * browser bundle. The client side gets the same data through
 * lib/content/context.tsx, which the root layout hands it after calling
 * getContent() here.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * TWO BACKENDS, CHOSEN BY ONE ENVIRONMENT VARIABLE
 * ──────────────────────────────────────────────────────────────────────────
 *
 *   MONGODB_URI set    → MongoDB. One collection per section — the layout
 *                        and the reasoning live in ./store-mongo.
 *   MONGODB_URI unset  → data/content.json on disk, exactly as before.
 *
 * WHY MONGO ARRIVED. The file store is correct on a box with a persistent
 * filesystem and wrong everywhere else, and the host this deploys to builds
 * each release into a FRESH CHECKOUT — so data/content.json was written inside
 * a directory the next deploy replaced. Every edit the client made would
 * survive until the next push and then revert to DEFAULT_CONTENT. That is the
 * worst failure shape available: not an error, a slow rewind.
 *
 * WHY THE FILE BACKEND STAYED. `git clone && npm run dev` has to work with no
 * accounts and no secrets — the same reason lib/admin/config.ts ships a real
 * working password. A contributor with no Atlas access gets the file store and
 * an identical panel. Deleting it would buy one less branch in this file and
 * cost every new machine a setup step.
 *
 * THE INTERFACE DID NOT CHANGE, and that was the promise the previous version
 * of this docblock made: "Moving to a real database later is a change to THIS
 * FILE ONLY: getContent and saveContent are the entire interface, and both are
 * already async." Twenty-eight call sites import from here; none was touched.
 *
 * WHAT IS STILL ON DISK: UPLOADED IMAGES. lib/admin/uploads.ts writes to
 * public/uploads, and that has the same fresh-checkout problem this change
 * just fixed for text. Moving them needs GridFS or an object store plus a
 * route to serve them, which is a larger change than this one.
 */

import { readFile, writeFile, rename, mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { mongoUri } from "./mongo";
import { hasAny, probeWrite, readAll, writeAll } from "./store-mongo";
import { DEFAULT_CONTENT, parseContent, type SiteContent } from "./schema";

const DIR = path.join(process.cwd(), "data");
const FILE = path.join(DIR, "content.json");

const useMongo = () => mongoUri() !== undefined;

/** Which backend answered, for the dashboard to show. An operator who cannot
    see this has no way to tell a working panel from one quietly editing a file
    the next deploy will delete. */
export function backend(): "mongodb" | "file" {
  return useMongo() ? "mongodb" : "file";
}

/* ===============================================================
   READ
   =============================================================== */

/**
 * Read the stored content, or the defaults.
 *
 * NOTHING MISSING IS AN ERROR, and that is the load-bearing decision here.
 * Before anyone has saved anything there is no document and no file, and the
 * right behaviour then is for the site to render exactly as it did before the
 * panel existed — so absence returns DEFAULT_CONTENT rather than throwing. The
 * same goes for content that will not parse.
 *
 * AND NEITHER IS AN UNREACHABLE DATABASE. A cluster that is down, paused, or
 * refusing this IP must not take the marketing site down with it. It costs a
 * stale page, which is the correct price; the alternative is a 500 on the home
 * page because a phone number could not be fetched.
 */
export async function getContent(): Promise<SiteContent> {
  if (useMongo()) {
    try {
      return await readAll();
    } catch (err) {
      console.error("[content] mongo read failed, using defaults:", err);
      return DEFAULT_CONTENT;
    }
  }

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

/* ===============================================================
   WRITE
   =============================================================== */

/**
 * Write it back.
 *
 * THIS ONE THROWS, AND THE ASYMMETRY WITH getContent IS DELIBERATE. A read that
 * fails can fall back to defaults because a stale page is a tolerable outcome.
 * A write that fails has no tolerable outcome: the caller must tell the
 * operator their edit did not land. content-actions.ts turns the throw into a
 * message on the form.
 *
 * BOTH BACKENDS ARE ATOMIC, by different means. The file writes to a temp name
 * and renames; Mongo runs its eleven writes inside one transaction. Either way
 * a reader sees the whole old site or the whole new one, never a half-applied
 * edit — see the note in ./store-mongo on why that was worth the work.
 *
 * NO LOCKING, on either backend, and it is worth being explicit about what that
 * means: two operators saving different sections in the same second will have
 * one overwrite the other's object. With one editor this cannot happen; with
 * two it costs a re-edit. A lock would be the fix, and it would also be the
 * first thing to leak and wedge the panel shut.
 */
export async function saveContent(next: SiteContent): Promise<void> {
  if (useMongo()) {
    await writeAll(next);
    return;
  }

  await mkdir(DIR, { recursive: true });
  /* WRITE TO A TEMPORARY FILE AND RENAME. A plain writeFile truncates first and
     then fills, so a crash or a concurrent read in between yields half a JSON
     document — and getContent()'s fallback would then quietly swap the whole
     site back to defaults. rename() is atomic within a filesystem.

     pid in the name so two concurrent saves cannot collide on the temp file
     itself — they can still overwrite each other's content, per the note
     above, but neither will read the other's half-written bytes. */
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2) + "\n", "utf8");
  await rename(tmp, FILE);
}

/* ===============================================================
   WHAT THE DASHBOARD ASKS
   =============================================================== */

/**
 * Can this deployment actually persist an edit?
 *
 * ON MONGO this is probeWrite in ./store-mongo, which performs a real write
 * rather than a ping, for the reason recorded there.
 *
 * ON THE FILE BACKEND it checks the DIRECTORY rather than the file, because the
 * file usually does not exist yet and the question is whether one can be
 * created. A missing directory is reported as writable-in-principle: mkdir in
 * saveContent will create it, and on the hosts where that fails the parent is
 * not writable either, which this catches.
 */
export async function canWrite(): Promise<boolean> {
  if (useMongo()) return probeWrite();

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
  if (useMongo()) {
    try {
      return await hasAny();
    } catch {
      return false;
    }
  }

  try {
    await access(FILE, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export { FILE as CONTENT_FILE };
