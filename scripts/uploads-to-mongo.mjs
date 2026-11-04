/**
 * Copy uploaded pictures from a folder into MongoDB, in the layout
 * lib/admin/uploads.ts reads.
 *
 *   node --env-file=.env.local scripts/uploads-to-mongo.mjs <database> [folder]
 *
 * The folder defaults to public/uploads. Only files named the way saveUpload
 * names them (16 hex characters + .webp/.png/.jpg) are copied, and the name is
 * checked against the bytes' own hash, so a renamed file cannot end up served
 * under a URL that promises different content. A picture already in the
 * database is left alone — the name is the hash, so it is the same picture.
 *
 * WHY THIS EXISTS. Uploads used to be written to public/uploads on the server,
 * which Hostinger's fresh-checkout deploys delete. Content in MongoDB can still
 * point at /uploads/<name> for a picture that is no longer on any disk. If you
 * have a copy of the file, this puts it where the site now looks for it.
 *
 * The database is required rather than defaulted, for the same reason
 * content-to-mongo.mjs requires it: production (`hotcups`) should never be
 * written to by forgetting an argument.
 */

import { MongoClient, Binary } from "mongodb";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/* ---- must match lib/admin/uploads.ts ---- */
const COLLECTION = "uploads";
const NAME = /^[0-9a-f]{16}\.(webp|png|jpg)$/;
const MIME = { webp: "image/webp", png: "image/png", jpg: "image/jpeg" };
/* ----------------------------------------- */

const [dbName, folderArg] = process.argv.slice(2);
if (!dbName) {
  console.error(
    "usage: node --env-file=.env.local scripts/uploads-to-mongo.mjs <database> [folder]",
  );
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const folder = path.resolve(folderArg ?? path.join("public", "uploads"));
const files = readdirSync(folder).filter((f) => NAME.test(f));
if (!files.length) {
  console.error(`No upload-named files in ${folder}.`);
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
await client.connect();

try {
  const col = client.db(dbName).collection(COLLECTION);
  let added = 0;
  let present = 0;

  for (const name of files) {
    const bytes = readFileSync(path.join(folder, name));
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
    if (!name.startsWith(hash)) {
      console.warn(`skip ${name}: its bytes hash to ${hash}, not to its name`);
      continue;
    }
    const ext = NAME.exec(name)[1];
    const res = await col.updateOne(
      { _id: name },
      {
        $setOnInsert: {
          type: MIME[ext],
          data: new Binary(bytes),
          bytes: bytes.length,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount) {
      added++;
      console.log(`added   ${name}  ${(bytes.length / 1024).toFixed(0)}KB`);
    } else {
      present++;
      console.log(`present ${name}`);
    }
  }

  console.log(`\n${dbName}.${COLLECTION}: ${added} added, ${present} already there.`);
} finally {
  await client.close();
}
