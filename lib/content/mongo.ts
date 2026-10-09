/**
 * The MongoDB connection, and nothing else.
 *
 * SERVER ONLY. The driver reaches for node:net and node:tls, so this must never
 * be pulled into a "use client" module or into proxy.ts — proxy.ts runs on the
 * Edge runtime and imports only lib/admin/crypto, which is Web Crypto. Nothing
 * here is imported there and nothing here may be.
 *
 * ONE CLIENT PER PROCESS, CACHED ON globalThis. The driver holds a connection
 * pool and opening a second one per request would exhaust an Atlas free tier in
 * minutes. A module-level `let` is not enough in development: Next's hot reload
 * re-evaluates the module on every edit, so each save would leak a pool that
 * nothing closes. globalThis survives that. This is the pattern Atlas documents
 * for Next and the reason it looks odd is the reason it exists.
 *
 * THE PROMISE IS CACHED, NOT THE CLIENT. Caching the client means two requests
 * arriving before the first connect() resolves both start their own. Caching
 * the promise means the second awaits the first.
 *
 * NO CONNECTION IS OPENED AT IMPORT TIME. getDb() is what connects, so a build
 * that never reads content — or a machine with no MONGODB_URI — never dials
 * out, and `next build` does not hang on a firewalled network.
 */

import { MongoClient, type Db } from "mongodb";

/** Unset means "use the JSON file" — see lib/content/store.ts. */
export function mongoUri(): string | undefined {
  const uri = process.env.MONGODB_URI?.trim();
  return uri ? uri : undefined;
}

/**
 * Which database, and why it is not the same one in development.
 *
 * THERE IS ONE CLUSTER AND TWO ENVIRONMENTS, which means the default has to
 * decide whether a laptop edits the live site. It does not: production gets
 * `hotcups`, everything else gets `hotcups_dev`. Pointing dev at the live
 * content is then a deliberate act — set MONGODB_DB=hotcups — rather than the
 * thing that happens by accident at 11pm.
 *
 * A database named in the URI's path wins over both. That is the convention
 * every other Mongo tool follows and breaking it here would be surprising.
 */
export function mongoDbName(): string {
  const explicit = process.env.MONGODB_DB?.trim();
  if (explicit) return explicit;

  const uri = mongoUri();
  if (uri) {
    /* mongodb+srv://user:pass@host/<name>?opts — take <name> if it is there.
       Hand-parsed rather than `new URL()`: the mongodb+srv scheme is not one
       WHATWG URL parses into a usable pathname across runtimes. */
    const afterHost = uri.split("://")[1]?.split("/").slice(1).join("/");
    const name = afterHost?.split("?")[0]?.trim();
    if (name) return name;
  }

  return process.env.NODE_ENV === "production" ? "hotcups" : "hotcups_dev";
}

declare global {
  // eslint-disable-next-line no-var
  var __hotcupsMongo: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  const uri = mongoUri();
  if (!uri) throw new Error("MONGODB_URI is not set");

  if (!globalThis.__hotcupsMongo) {
    globalThis.__hotcupsMongo = new MongoClient(uri, {
      /* Ten seconds, not the default thirty. This runs inside a page render:
         if the cluster is unreachable the right outcome is a fast fall back to
         DEFAULT_CONTENT and a line in the log, not a request that hangs for
         half a minute and then does the same thing. */
      serverSelectionTimeoutMS: 10_000,
      /* One editor and a handful of page renders. The default pool of 100 is
         sized for a service, and an Atlas free tier caps connections. */
      maxPoolSize: 10,
    }).connect();

    /* A rejected promise cached forever would mean one bad boot poisons the
       process until it restarts. Clear it so the next call redials. */
    globalThis.__hotcupsMongo.catch(() => {
      globalThis.__hotcupsMongo = undefined;
    });
  }

  return globalThis.__hotcupsMongo;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(mongoDbName());
}
