/**
 * Where an uploaded picture goes.
 *
 * SERVER ONLY — it reaches for node:fs, so nothing with "use client" may import
 * it. The browser side talks to it through the Server Action in
 * app/admin/upload-actions.ts.
 *
 * INTO public/uploads, WHICH IS WHY THE PATHS COME BACK AS /uploads/…
 * Next serves everything under public/ from disk at request time, so a file
 * written here is reachable the moment the write finishes — no build step, no
 * restart, no route handler standing in front of it. The stored content already
 * holds paths like /img/menu-tea.webp, so an uploaded plate is the same kind of
 * string from every reader's point of view and nothing downstream had to change
 * to accept one.
 *
 * !! THE SAME FILESYSTEM CAVEAT AS THE CONTENT STORE. On Vercel, Netlify and
 * !! every other serverless host, public/ is read-only at runtime and this will
 * !! throw EROFS — and where a write does succeed, it is lost on the next cold
 * !! start and invisible to the instance serving the other half of the traffic.
 * !! Correct for `next start` on a VPS or a container with a persistent volume.
 * !! Moving to object storage later is a change to THIS FILE only: saveUpload is
 * !! the entire interface and it already returns a URL rather than a path.
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
import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "uploads");

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
          "Could not write to public/uploads — this deployment's filesystem is read-only. Uploads need a host with a persistent disk, or object storage behind lib/admin/uploads.ts.",
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

/** Whether uploads can be written at all — the panel says so up front rather
    than letting an operator find out after choosing a file. */
export async function canUpload(): Promise<boolean> {
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
