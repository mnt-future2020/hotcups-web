/**
 * Move data/content.json into MongoDB, in the layout lib/content/store-mongo.ts
 * reads.
 *
 *   node scripts/content-to-mongo.mjs <database> [--overwrite]
 *
 * WHY THIS EXISTS. The panel wrote to a JSON file before it wrote to Mongo, and
 * on this project that file already held real work: three blog posts with their
 * bodies, three case studies, the JSON-LD for three SEO pages, two colour
 * corrections and nineteen entries of edit history. Pointing the store at an
 * empty cluster without moving that across would have published a site with a
 * blank blog — and because getContent() falls back to DEFAULT_CONTENT rather
 * than erroring, it would have done it quietly.
 *
 * IT IS NOT PART OF THE BUILD and should not be. It is run by hand, once per
 * database. It is committed because the next person to stand up an environment
 * needs it, and because a migration nobody can read is one nobody can check.
 *
 * THE LAYOUT IS DUPLICATED FROM store-mongo.ts, AND THAT IS THE COST OF THIS
 * BEING A PLAIN .mjs SCRIPT. It cannot import the TypeScript module without a
 * build step, so SINGLETONS, LISTS, CURRENT and the `order` field are repeated
 * below. They are repeated VERBATIM on purpose: if that file's layout changes,
 * this one has to change with it, and keeping the names identical is what makes
 * the mismatch findable with a grep rather than a debugging session.
 *
 * NO SCHEMA VALIDATION HERE, DELIBERATELY. parseContent runs on every read in
 * the store, so a field this script does not understand is normalised the
 * moment the site loads it; validating twice means two copies of the schema to
 * keep in step. The one thing this checks is that the file parses and has the
 * eleven top-level keys, because a truncated file would otherwise overwrite
 * good content with half a site.
 *
 * MONGODB_URI comes from the environment, the same variable the app uses.
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import path from "node:path";

/* ---- must match lib/content/store-mongo.ts ---- */
const SINGLETONS = [
  "hero",
  "seo",
  "menu",
  "machines",
  "story",
  "whoWeServe",
  "contact",
  "stats",
];
const LISTS = ["posts", "cases", "activity"];
const CURRENT = "current";
/* ----------------------------------------------- */

const EXPECTED_KEYS = [...SINGLETONS, ...LISTS];

const [dbName, ...flags] = process.argv.slice(2);
const overwrite = flags.includes("--overwrite");

if (!dbName) {
  console.error(
    "usage: node scripts/content-to-mongo.mjs <database> [--overwrite]\n" +
      "       the database is required rather than defaulted, so that\n" +
      "       production is never written to by forgetting an argument.",
  );
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const file = path.join(process.cwd(), "data", "content.json");
let content;
try {
  content = JSON.parse(readFileSync(file, "utf8"));
} catch (err) {
  console.error(`cannot read ${file}: ${err.message}`);
  process.exit(1);
}

const missing = EXPECTED_KEYS.filter((k) => !(k in content));
if (missing.length) {
  console.error(
    `${file} is missing ${missing.length} top-level key(s): ${missing.join(", ")}\n` +
      "Refusing to write a partial document over whatever is already there.",
  );
  process.exit(1);
}

/** Same rule as store-mongo.ts: the entry's own slug is the _id, suffixed if
    two entries claim the same one, so one duplicate cannot fail the save. */
function uniqueIds(entries, fallbackPrefix) {
  const seen = new Set();
  return entries.map((entry, i) => {
    let id = (typeof entry.id === "string" && entry.id) || `${fallbackPrefix}-${i}`;
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    seen.add(id);
    return id;
  });
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
await client.connect();

try {
  const db = client.db(dbName);

  const already = await db
    .collection("contact")
    .countDocuments({ _id: CURRENT }, { limit: 1 });
  if (already && !overwrite) {
    console.error(
      `${dbName} already holds content. Re-run with --overwrite if replacing it is what you mean.`,
    );
    process.exit(1);
  }

  /* One transaction, for the same reason store-mongo.ts uses one: a migration
     that fails halfway should leave the database as it found it, not holding
     four new sections and seven old ones. */
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const name of SINGLETONS) {
        await db
          .collection(name)
          .replaceOne({ _id: CURRENT }, { ...content[name] }, { upsert: true, session });
      }
      for (const name of LISTS) {
        const entries = content[name] ?? [];
        await db.collection(name).deleteMany({}, { session });
        if (!entries.length) continue;
        const ids = uniqueIds(entries, name);
        await db.collection(name).insertMany(
          entries.map((entry, i) => ({ ...entry, _id: ids[i], order: i })),
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  console.log(`wrote data/content.json -> ${dbName}`);
  for (const name of [...SINGLETONS, ...LISTS]) {
    const n = await db.collection(name).countDocuments();
    console.log(`  ${name.padEnd(12)} ${n} document${n === 1 ? "" : "s"}`);
  }
} finally {
  await client.close();
}
