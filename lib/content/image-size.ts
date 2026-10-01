import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The shape of a picture, read from the file itself.
 *
 * ── WHY THIS EXISTS ───────────────────────────────────────────────────────
 *
 * A post's lead photograph sat in a box fixed at 16:9 with object-cover. Two
 * of the three posts use square pictures, so that box threw away 44% of the
 * height — and because object-cover crops from the centre, what it threw away
 * was the top of the frame. People lost their heads. No warning, nothing in
 * the panel to adjust, and it would happen again to the next square image
 * somebody uploaded.
 *
 * The fix is not a better guess at the ratio. It is to stop guessing: the file
 * knows its own shape, so the box takes it.
 *
 * ── WHY NOT STORE IT ALONGSIDE THE PATH ───────────────────────────────────
 *
 * MachineContent does store an `aspect`, and it has a reason to — those
 * pictures are cut-outs whose visual weight is not their bounding box. Here
 * the number is a plain fact about the file, so storing it would be a second
 * copy of something already true on disk: right until somebody swaps the file
 * and does not update the field, at which point the stored figure is a lie
 * with nothing to catch it.
 *
 * ── WHY THE HEADERS ARE PARSED BY HAND ────────────────────────────────────
 *
 * It is forty lines and no dependency. The alternative is an image library in
 * the bundle to learn two numbers that live in the first few dozen bytes of
 * the file.
 *
 * ── THE CACHE ─────────────────────────────────────────────────────────────
 *
 * Keyed by path and never invalidated, which is correct here: /public is
 * immutable at runtime and an upload writes a NEW filename rather than
 * replacing one. The map is bounded by the number of distinct images the site
 * has ever rendered in one process, which is the number of files in a folder.
 */

const cache = new Map<string, number | null>();

/** Width divided by height, or null when it cannot be read — a missing file,
    an unknown format, a truncated header. Callers fall back rather than
    failing: an unknown shape is not a broken page. */
export async function imageRatio(src: string): Promise<number | null> {
  if (!src.startsWith("/") || src.startsWith("//")) return null;

  const hit = cache.get(src);
  if (hit !== undefined) return hit;

  const ratio = await read(src);
  cache.set(src, ratio);
  return ratio;
}

async function read(src: string): Promise<number | null> {
  /* The query string an uploaded file may carry, and the leading slash, both
     come off before this becomes a filesystem path. */
  const clean = src.split(/[?#]/)[0];
  const file = path.join(process.cwd(), "public", clean);

  /* CONTAINMENT CHECK. src comes from the content store, which an operator
     edits by hand, so "/../../etc/passwd" is a string somebody could type
     into the picture field. Resolving first and then checking the prefix
     catches it however it is spelled. */
  const root = path.join(process.cwd(), "public");
  if (!path.resolve(file).startsWith(path.resolve(root))) return null;

  let head: Buffer;
  try {
    /* The first 64KB. Every format below carries its dimensions near the
       front — JPEG's can sit behind a large EXIF block, which is what makes
       64KB the right size rather than 1KB. */
    const whole = await readFile(file);
    head = whole.subarray(0, 65536);
  } catch {
    return null;
  }

  const size = png(head) ?? gif(head) ?? webp(head) ?? jpeg(head);
  if (!size || size.h === 0) return null;
  return size.w / size.h;
}

type Size = { w: number; h: number };

function png(b: Buffer): Size | null {
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function gif(b: Buffer): Size | null {
  if (b.length < 10 || b.toString("ascii", 0, 3) !== "GIF") return null;
  return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
}

function webp(b: Buffer): Size | null {
  if (b.length < 30) return null;
  if (b.toString("ascii", 0, 4) !== "RIFF") return null;
  if (b.toString("ascii", 8, 12) !== "WEBP") return null;

  const kind = b.toString("ascii", 12, 16);
  /* Three encodings, three layouts. VP8X is the extended header an animated
     or alpha file carries; VP8L is lossless, where the two numbers are packed
     into 28 bits; VP8 (with the trailing space) is the plain lossy one. */
  if (kind === "VP8X") {
    return {
      w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)),
      h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)),
    };
  }
  if (kind === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (kind === "VP8 ") {
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

function jpeg(b: Buffer): Size | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;

  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];

    /* Standalone markers carry no length to skip over. */
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    /* Start of scan — the compressed data begins, and the dimensions were
       either already found or are not in the part of the file we hold. */
    if (marker === 0xda || marker === 0xd9) return null;

    /* A start-of-frame of any flavour: height then width, both big-endian,
       five bytes past the marker. */
    const sof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (sof) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }

    const length = b.readUInt16BE(i + 2);
    if (length < 2) return null;
    i += 2 + length;
  }
  return null;
}
