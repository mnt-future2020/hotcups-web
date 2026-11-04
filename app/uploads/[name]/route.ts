/**
 * Serves /uploads/<hash>.<ext> — every picture uploaded through the panel.
 *
 * WHY A ROUTE AND NOT public/uploads. See the docblock in lib/admin/uploads.ts:
 * `next start` only serves public/ files that existed when the process booted,
 * so a fresh upload 404'd inside Next and next/image rendered it as a broken
 * image. A route is resolved on every request, so it sees an upload the moment
 * the save finishes, whether the bytes are in MongoDB or on disk.
 *
 * A file that WAS in public/uploads at boot is still served by Next's static
 * handler before this route is consulted. Same bytes, same URL, so it does not
 * matter which one answers.
 *
 * CACHED FOREVER, because the filename is a hash of the bytes: different bytes
 * are always a different URL, so nothing behind a given URL can ever change.
 */

import { readUpload } from "@/lib/admin/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const found = await readUpload(name);

  if (!found) {
    return new Response("Not found", {
      status: 404,
      /* Short, so an upload that lands a moment after a miss is not hidden
         behind a cached 404 at the CDN. */
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.type,
      "Content-Length": String(found.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
