/**
 * Where an uploaded picture goes.
 *
 * SERVER ONLY — it reaches for node:fs, so nothing with "use client" may import
 * it. The browser side talks to it through the Server Action in
 * app/admin/upload-actions.ts.
 *
 * INTO MONGODB WHEN MONGODB_URI IS SET, public/uploads OTHERWISE. Either way
 * the URL is /uploads/<hash>.<ext>, served by app/uploads/[name]/route.ts.
 *
 * WHY NOT JUST public/uploads — WHICH IS WHAT THIS USED TO DO. Two failures,
 * both seen on the live Hostinger site:
 *
 *   1. `next start` lists public/ ONCE, at boot (setupFsCheck in
 *      next/dist/server/lib/router-utils/filesystem.js, the !opts.dev branch),
 *      and only serves files that were in that list. A file written after
 *      boot is invisible to Next. The browser could still fetch the raw file
 *      — Hostinger's front server reads the disk directly — but next/image
 *      goes through /_next/image, which fetches the source INSIDE Next, got a
 *      404 page back, and answered 400 "The requested resource isn't a valid
 *      image". Every freshly uploaded picture rendered as a broken image until
 *      the Node process restarted.
 *
 *   2. Hostinger builds each release into a fresh checkout, so anything
 *      written to public/ at runtime is gone after the next push — the same
 *      problem lib/content/store.ts already solved for text.
 *
 * The route fixes (1) for both backends, because a route is resolved per
 * request rather than from a list taken at boot. MongoDB fixes (2). The disk
 * stays as the backend for local development with no MONGODB_URI, and as a
 * read-only fallback in production for files uploaded before this change.
 *
 * THE FILENAME IS A CONTENT HASH, AND THAT IS NOT ONLY ABOUT COLLISIONS.
 * Menu.tsx carries a long note about the time a plate was written straight over
 * an existing filename and never reached the browser: `next dev` caches image
 * optimizer output in memory keyed by url, width, quality and output format,
 * and nothing invalidates that key when the bytes underneath it change. The
 * same request came back as the old picture, reporting a cache HIT, until the
 * server was restarted. A hash means new bytes are always a new URL, so that
 * failure cannot happen here — and re-uploading an identical file costs nothing
 * because it lands on the name it already has.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile, access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { Binary } from "mongodb";
import { getDb, mongoUri } from "@/lib/content/mongo";

const DIR = path.join(process.cwd(), "public", "uploads");

/** One document per picture: _id is the filename, `data` the bytes. 8MB is
    well inside MongoDB's 16MB document limit, so GridFS would be machinery
    for a problem this does not have. */
const COLLECTION = "uploads";

type UploadDoc = {
  _id: string;
  type: string;
  data: Binary;
  bytes: number;
  createdAt: Date;
};

/** Exactly what saveUpload produces: 16 hex characters and a known extension.
    Anything else is refused before it touches the database or the disk, which
    is also what keeps "../" out of the path join below. */
const NAME = /^[0-9a-f]{16}\.(webp|png|jpg)$/;

const MIME: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
};

/** 8MB. Well past any sensibly exported plate — the largest in public/img is
    under 200KB — and small enough that a mis-selected raw photograph is
    refused rather than parked on the disk forever. */
export const MAX_BYTES = 8 * 1024 * 1024;

/**
 * WEBP AND PNG KEEP ALPHA; JPEG IS HERE FOR ORIGINALS ONLY.
 *
 * Most pictures on this site are cut-outs standing on a coloured ground — the
 * drink plates sit on section 02's espresso with no box around them — so a
 * format that flattens transparency onto white would put a white rectangle
 * behind every glass. The cropper exports WebP for that reason. JPEG is
 * accepted on the way IN because a photograph from a camera or a client's email
 * usually is one, and the crop step re-encodes it.
 */
const TYPES: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export type UploadResult =
  | { ok: true; url: string; bytes: number }
  | { ok: false; message: string };

export async function saveUpload(file: File): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { ok: false, message: "No file arrived." };
  }
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is ${MAX_BYTES / 1024 / 1024}MB — export it smaller rather than uploading a camera original.`,
    };
  }

  const ext = TYPES[file.type];
  if (!ext) {
    return {
      ok: false,
      message: "Only PNG, WebP and JPEG images can be uploaded.",
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  /* THE TYPE IS CHECKED AGAINST THE BYTES, NOT ONLY AGAINST THE HEADER.
     `file.type` is whatever the browser said, and a browser says whatever the
     file extension suggested — so a renamed .exe arrives claiming image/png.
     These three signatures are cheap to check and are what actually decides
     whether the thing is a picture. It is not a security boundary on its own
     (the files are served as static assets, not executed), but writing
     arbitrary uploaded bytes under a name ending in .png is worth one test. */
  if (!looksLikeImage(bytes, ext)) {
    return {
      ok: false,
      message: "That file is not the image type it claims to be.",
    };
  }

  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  const name = `${hash}.${ext}`;
  const dest = path.join(DIR, name);
  const url = `/uploads/${name}`;

  if (mongoUri()) {
    try {
      const db = await getDb();
      /* $setOnInsert, so re-uploading identical bytes is a no-op — the same
         rule as the access() check on the disk path below. */
      await db.collection<UploadDoc>(COLLECTION).updateOne(
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
      return { ok: true, url, bytes: bytes.length };
    } catch (err) {
      console.error("[upload] MongoDB write failed:", err);
      return {
        ok: false,
        message: "Could not save the picture to the database. The server log has details.",
      };
    }
  }

  /* ALREADY THERE MEANS ALREADY DONE. Identical bytes hash to the same name, so
     re-uploading a file someone uploaded last month is a no-op rather than a
     second copy of it. */
  try {
    await access(dest, constants.R_OK);
    return { ok: true, url, bytes: bytes.length };
  } catch {
    /* not there yet — fall through and write it */
  }

  try {
    await mkdir(DIR, { recursive: true });
    /* No temp-file-and-rename here, unlike the content store. The name is
       derived from the bytes, so a half-written file can only ever be a partial
       copy of exactly the thing that is about to be written again; there is no
       previous version for a torn write to destroy. */
    await writeFile(dest, bytes);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      return {
        ok: false,
        message:
          "Could not write to public/uploads — this deployment's filesystem is read-only. Set MONGODB_URI and uploads are stored in the database instead.",
      };
    }
    console.error("[upload] failed:", err);
    return { ok: false, message: "Could not save the file. The server log has details." };
  }

  return { ok: true, url, bytes: bytes.length };
}

/** Magic numbers. PNG's 8-byte signature, JPEG's SOI marker, and WebP's RIFF
    container with a "WEBP" fourcc at offset 8. */
function looksLikeImage(b: Buffer, ext: string): boolean {
  if (ext === "png") {
    return (
      b.length > 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47
    );
  }
  if (ext === "jpg") {
    return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }
  if (ext === "webp") {
    return (
      b.length > 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

/**
 * The bytes behind /uploads/<name>, or null. Used by the route that serves
 * them and by lib/content/image-size.ts.
 *
 * MONGODB FIRST, THEN THE DISK. The disk read is what keeps pictures uploaded
 * before uploads moved to MongoDB working for as long as the file survives on
 * this release — and it is a read at request time, so unlike Next's own
 * public/ handling it sees files written after boot.
 */
export async function readUpload(
  name: string,
): Promise<{ bytes: Buffer; type: string } | null> {
  const match = NAME.exec(name);
  if (!match) return null;
  const type = MIME[match[1]];

  if (mongoUri()) {
    try {
      const db = await getDb();
      const doc = await db.collection<UploadDoc>(COLLECTION).findOne({ _id: name });
      /* value(), not .buffer: a Binary's buffer can have capacity past its
         `position`, and the bytes after it are not the picture. */
      if (doc) return { bytes: Buffer.from(doc.data.value()), type: doc.type || type };
    } catch (err) {
      /* An unreachable cluster is not a reason to skip the disk. */
      console.error("[upload] MongoDB read failed:", err);
    }
  }

  try {
    return { bytes: await readFile(path.join(DIR, name)), type };
  } catch {
    return null;
  }
}

/** Whether uploads can be written at all — the panel says so up front rather
    than letting an operator find out after choosing a file. */
export async function canUpload(): Promise<boolean> {
  /* With MongoDB configured the disk is not where uploads go, so whether
     public/ is writable says nothing. A cluster that is down shows up as a
     failed save with a message, the same as it does for text. */
  if (mongoUri()) return true;
  try {
    await access(DIR, constants.W_OK);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      try {
        await access(path.join(process.cwd(), "public"), constants.W_OK);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
