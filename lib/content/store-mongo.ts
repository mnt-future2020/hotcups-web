/**
 * The MongoDB layout: one collection per section, so the database is readable.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT ONE DOCUMENT
 * ──────────────────────────────────────────────────────────────────────────
 *
 * The first version stored the whole site as a single 29KB document,
 * `content/{_id:"site"}`. It was correct and it was unusable: Atlas showed one
 * collection with one row, and every actual value — a post's body, a phone
 * number, a colour — was buried inside a blob you could not browse, query or
 * edit without downloading the lot. "Where is my data?" is a fair question to
 * ask of a database that answers it with one opaque object.
 *
 * So the eleven top-level keys of SiteContent are eleven collections, named
 * after the keys. The three that are lists in the schema are lists here too:
 *
 *     hero  seo  menu  machines  story  whoWeServe  contact  stats
 *         one document each, _id "current", fields spread at the top level
 *
 *     posts  cases      one document per entry, _id is the entry's own slug
 *     activity          one document per entry, newest first
 *
 * FIELDS ARE SPREAD, NOT NESTED UNDER `value`. `{_id:"current", ...contact}`
 * rather than `{_id:"current", value:{...}}`, because the entire point is that
 * someone opening Atlas sees `email` and `phoneLabel`, not one more wrapper to
 * expand. The cost is that a schema key named `_id` would collide; there is
 * none, and if one is ever added this is where it breaks.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * THE ATOMIC SAVE SURVIVED, AND THAT IS THE WHOLE TRICK
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Splitting a document is usually a trade: browsability for consistency. Eight
 * writes with no transaction around them means an interrupted save leaves the
 * site half-updated — new menu, old prices — and the panel has no way to tell.
 *
 * It is not a trade here, because this cluster is a replica set and replica
 * sets have had multi-document transactions since MongoDB 4.0. Verified on
 * this one before the code was written: a two-collection transaction commits.
 * writeAll() runs every delete, insert and replace inside one session, so a
 * reader sees the whole old site or the whole new one, exactly as the single
 * document guaranteed and exactly as the file backend's write-to-temp-and-
 * rename guarantees.
 *
 * IF THE CLUSTER IS EVER MOVED TO SOMETHING STANDALONE, this file is where it
 * breaks, and it will break loudly — a standalone mongod refuses to start a
 * transaction rather than silently running without one.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ORDER IS STORED, NOT INFERRED
 * ──────────────────────────────────────────────────────────────────────────
 *
 * posts, cases and activity are ARRAYS in the schema and arrays have an order
 * the panel controls — the blog lists posts in the sequence the editor put
 * them in, not alphabetically and not by date. A collection has no order at
 * all, so each document carries an `order` integer and every read sorts by it.
 * Dropping that field would reorder the client's blog on the next deploy, from
 * nothing anyone changed.
 */

import type { ClientSession, Collection, Db } from "mongodb";
import { getDb } from "./mongo";
import { parseContent, type SiteContent } from "./schema";

/** The eight sections stored as a single document. */
const SINGLETONS = [
  "hero",
  "seo",
  "menu",
  "machines",
  "story",
  "whoWeServe",
  "contact",
  "stats",
] as const;

/** The three stored one document per entry. */
const LISTS = ["posts", "cases", "activity"] as const;


/** Every singleton collection holds exactly this id. A fixed id means a save is
    an upsert and there is no way to end up with two of a section. */
const CURRENT = "current";

type Doc = Record<string, unknown>;

/** Strip the key Mongo adds so the object handed to parseContent is the object
    the schema describes and nothing else. */
function withoutId(doc: Doc | null): unknown {
  if (!doc) return undefined;
  const { _id, ...rest } = doc;
  void _id;
  return rest;
}

/** Same, plus the ordering field this module adds and the schema knows nothing
    about. */
function withoutMeta(doc: Doc): unknown {
  const { _id, order, ...rest } = doc;
  void _id;
  void order;
  return rest;
}

/* ===============================================================
   READ
   =============================================================== */

export async function readAll(): Promise<SiteContent> {
  const db = await getDb();

  const singles = await Promise.all(
    SINGLETONS.map((name) =>
      db.collection<Doc>(name).findOne({ _id: CURRENT as never }),
    ),
  );
  const lists = await Promise.all(
    LISTS.map((name) =>
      db
        .collection<Doc>(name)
        .find({})
        .sort({ order: 1 })
        .toArray(),
    ),
  );

  const raw: Record<string, unknown> = {};
  SINGLETONS.forEach((name, i) => {
    const v = withoutId(singles[i]);
    if (v !== undefined) raw[name] = v;
  });
  LISTS.forEach((name, i) => {
    raw[name] = lists[i].map(withoutMeta);
  });

  /* parseContent fills in anything absent from DEFAULT_CONTENT, so a database
     that has only ever had `contact` written to it still renders a whole
     site — the same forgiving behaviour the file backend has always had. */
  return parseContent(raw);
}

/** Has anything been written at all? Asked of `contact` rather than of the
    whole set because every save writes every section, so if one exists they
    all do, and one findOne is cheaper than eleven. */
export async function hasAny(): Promise<boolean> {
  const db = await getDb();
  const n = await db
    .collection("contact")
    .countDocuments({ _id: CURRENT as never }, { limit: 1 });
  return n > 0;
}

/* ===============================================================
   WRITE
   =============================================================== */

/**
 * Give every entry an id that is unique within its collection.
 *
 * posts and cases carry their own slug and that is the right _id — it is
 * stable, meaningful in Atlas, and what the URL uses. But nothing in the panel
 * stops an editor from creating two posts with the same slug, and insertMany
 * would then fail the whole transaction and lose the save. A suffixed
 * duplicate is a worse-looking id and a working save, which is the right way
 * round. The entry's own `id` field is untouched, so reads are unaffected.
 */
function uniqueIds(entries: Doc[], fallbackPrefix: string): string[] {
  const seen = new Set<string>();
  return entries.map((entry, i) => {
    const own = typeof entry.id === "string" && entry.id ? entry.id : "";
    let id = own || `${fallbackPrefix}-${i}`;
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    seen.add(id);
    return id;
  });
}

export async function writeAll(next: SiteContent): Promise<void> {
  const db = await getDb();

  await withTransaction(db, async (session) => {
    for (const name of SINGLETONS) {
      const value = next[name] as unknown as Doc;
      await db
        .collection<Doc>(name)
        .replaceOne({ _id: CURRENT as never }, { ...value }, { upsert: true, session });
    }

    for (const name of LISTS) {
      const entries = (next[name] ?? []) as unknown as Doc[];
      const col: Collection<Doc> = db.collection<Doc>(name);
      /* DELETE THEN INSERT, not a diff. The panel hands over the whole array
         every save, and working out which entries moved, which were renamed
         and which went is strictly more code for the same result. Inside the
         transaction the empty moment between the two is never observable. */
      await col.deleteMany({}, { session });
      if (!entries.length) continue;
      const ids = uniqueIds(entries, name);
      await col.insertMany(
        entries.map((entry, i) => ({ ...entry, _id: ids[i] as never, order: i })),
        { session },
      );
    }
  });
}

/* ===============================================================
   THE SESSION
   =============================================================== */

/**
 * Run a block inside one transaction.
 *
 * THE SESSION IS PASSED, NOT AMBIENT, and it has to be threaded through every
 * single call's options. A write that forgets it silently runs OUTSIDE the
 * transaction and commits on its own — no error, no warning, just one section
 * that survives a rollback the other ten did not. That is the failure mode to
 * watch for when adding a write above.
 *
 * withTransaction retries on the driver's transient errors and aborts on
 * anything else, so a throw inside the block leaves the database untouched.
 */
async function withTransaction(
  db: Db,
  run: (session: ClientSession) => Promise<void>,
): Promise<void> {
  const session = db.client.startSession();
  try {
    await session.withTransaction(() => run(session));
  } finally {
    await session.endSession();
  }
}

/* ===============================================================
   THE WRITE PROBE
   =============================================================== */

/**
 * Can this deployment actually persist an edit?
 *
 * A REAL WRITE, NOT A PING. "Can I reach the cluster?" and "may this user write
 * to this database?" are different questions, and the second is the one an
 * operator needs answered before they spend twenty minutes typing. One small
 * document in `meta`, once per dashboard render.
 */
export async function probeWrite(): Promise<boolean> {
  try {
    const db = await getDb();
    await db
      .collection<{ _id: string; at: Date }>("meta")
      .updateOne({ _id: "probe" }, { $set: { at: new Date() } }, { upsert: true });
    return true;
  } catch (err) {
    console.error("[content] mongo write probe failed:", err);
    return false;
  }
}
