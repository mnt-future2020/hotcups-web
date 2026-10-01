"use client";

import { useEffect, useRef, useState } from "react";
import { ghostButton, primaryButton } from "../ui";

/**
 * Crop a picture before it is uploaded.
 *
 * ON THE CLIENT, WITH A CANVAS, AND NO LIBRARY. Every cropper worth installing
 * is 40–80KB of someone else's gesture handling, and the whole job here is:
 * draw the image, let a rectangle be dragged over it, then draw the part inside
 * that rectangle into a second canvas. The browser does the hard half. This
 * panel already refuses dependencies it can do without — see the note at the
 * top of lib/admin/crypto — and a cropper is a clearer case than most.
 *
 * IT EXPORTS WEBP, AND THAT IS THE LOAD-BEARING DECISION IN THIS FILE.
 * `canvas.toBlob` defaults to PNG and will happily be asked for JPEG, and JPEG
 * has no alpha channel — it composites transparency onto black. Most pictures
 * on this site are cut-outs standing on a coloured ground: the drink plates sit
 * on section 02's espresso with no box around them, and the hero's machine
 * stands on a cream gradient. Exporting one of those as JPEG puts a hard
 * rectangle behind it. WebP keeps alpha and is smaller than PNG at the same
 * quality; PNG is the fallback for a browser that cannot encode it, which in
 * practice is none of them any more but costs one line to keep.
 *
 * THE CROP BOX IS IN DISPLAY PIXELS AND THE EXPORT IS IN NATURAL ONES. The
 * image is shown at whatever width the panel gives it — usually a good deal
 * smaller than the file — so every rectangle the operator drags has to be
 * scaled by naturalWidth/displayWidth before it means anything to the canvas.
 * Getting that backwards yields a crop that is right on screen and wrong in the
 * file, which is the kind of bug that survives a casual look at the result.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: rotate, straighten, resize to a target
 * width, or touch colour. Those are an image editor, and the client has one.
 * This exists so that a plate arriving with three inches of empty canvas around
 * it can be trimmed without leaving the panel.
 */

export type CropAspect = number | null;

export default function Cropper({
  file,
  aspect,
  onCancel,
  onDone,
}: {
  file: File;
  /** width / height, or null for a free rectangle */
  aspect: CropAspect;
  onCancel: () => void;
  onDone: (cropped: File) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  /* The box, in FRACTIONS of the image (0–1) rather than in pixels. It survives
     the panel being resized, the image finishing its decode at a different size
     than it started, and the difference between the element's box and the
     file's — all three of which change the pixel numbers and none of which
     should move the crop. */
  const [box, setBox] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });

  /* THE OBJECT URL IS REVOKED. A File turned into a blob: URL stays in memory
     until it is released or the document goes away, and this component mounts
     again every time a different picture is chosen. */
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  /* Snap the starting box to the requested aspect as soon as the real
     dimensions are known — a 3:4 card should not open on a square. */
  useEffect(() => {
    if (!aspect || !natural.w) return;
    setBox(centredBox(natural.w, natural.h, aspect));
  }, [aspect, natural.w, natural.h]);

  /* ---------------------------------------------------------------
     DRAGGING

     ONE POINTER HANDLER FOR THE BOX AND FOR ALL FOUR CORNERS, because the only
     difference between them is which edges move. Pointer events rather than
     mouse events: they cover a finger and a stylus with the same code, and
     setPointerCapture means a drag that leaves the image does not silently stop
     tracking — which is exactly what happens when someone drags a corner past
     the edge of the picture, i.e. constantly.
     --------------------------------------------------------------- */
  const drag = (mode: "move" | "nw" | "ne" | "sw" | "se") =>
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = imgRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const start = { ...box };
      const from = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
      (e.target as Element).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - rect.left) / rect.width - from.x;
        const dy = (ev.clientY - rect.top) / rect.height - from.y;
        setBox(next(start, mode, dx, dy, aspect, rect.width / rect.height));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };

  /* ---------------------------------------------------------------
     EXPORT
     --------------------------------------------------------------- */
  const apply = async () => {
    const el = imgRef.current;
    if (!el || busy) return;
    setBusy(true);
    try {
      const sx = Math.round(box.x * natural.w);
      const sy = Math.round(box.y * natural.h);
      const sw = Math.max(1, Math.round(box.w * natural.w));
      const sh = Math.max(1, Math.round(box.h * natural.h));

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");
      /* NO fillRect FIRST. Painting a white ground before the image is the
         obvious way to "flatten" a crop and it is exactly wrong here — it would
         put a white box behind every cut-out plate. The canvas starts fully
         transparent and drawImage keeps whatever alpha the source had. */
      ctx.drawImage(el, sx, sy, sw, sh, 0, 0, sw, sh);

      const blob = await toBlob(canvas);
      if (!blob) throw new Error("encode failed");

      const ext = blob.type === "image/png" ? "png" : "webp";
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      onDone(new File([blob], `${base}.${ext}`, { type: blob.type }));
    } catch (err) {
      console.error("[crop] failed:", err);
      setBusy(false);
    }
  };

  const ratio = aspect ? `${Math.round(box.w * natural.w)} × ${Math.round(box.h * natural.h)}` : null;

  return (
    <div className="rounded-xl border border-line bg-cream/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-ink-soft">
          Crop
        </p>
        <p className="text-[0.8rem] text-mute">
          {natural.w ? (
            <>
              {natural.w} × {natural.h} original
              {ratio ? ` · ${ratio} selected` : null}
            </>
          ) : (
            "Loading…"
          )}
        </p>
      </div>

      <div className="relative select-none overflow-hidden rounded-lg">
        {/* THE CHEQUERBOARD IS NOT DECORATION. Almost everything cropped here is
            a cut-out on a transparent ground, and against a plain white panel a
            transparent margin looks identical to a white one — so an operator
            cannot see whether they are about to trim into the subject or into
            empty space. This is the conventional way to show "nothing here". */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #e8ded4 25%, transparent 25%), linear-gradient(-45deg, #e8ded4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e8ded4 75%), linear-gradient(-45deg, transparent 75%, #e8ded4 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
            backgroundColor: "#fff",
          }}
        />

        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={(e) =>
              setNatural({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
            className="relative block max-h-[420px] w-full object-contain"
          />
        ) : null}

        {natural.w ? (
          <>
            {/* The dimmed outside. Four panels rather than one box-shadow so it
                cannot be mistaken for a border on the selection itself. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {[
                { top: 0, left: 0, right: 0, height: `${box.y * 100}%` },
                {
                  top: `${(box.y + box.h) * 100}%`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
                {
                  top: `${box.y * 100}%`,
                  left: 0,
                  width: `${box.x * 100}%`,
                  height: `${box.h * 100}%`,
                },
                {
                  top: `${box.y * 100}%`,
                  left: `${(box.x + box.w) * 100}%`,
                  right: 0,
                  height: `${box.h * 100}%`,
                },
              ].map((style, i) => (
                <div
                  key={i}
                  className="absolute bg-espresso-deep/55"
                  style={style as React.CSSProperties}
                />
              ))}
            </div>

            <div
              onPointerDown={drag("move")}
              className="absolute cursor-move border-2 border-white/90 shadow-[0_0_0_1px_rgba(36,10,6,0.45)]"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
                touchAction: "none",
              }}
            >
              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <span
                  key={corner}
                  onPointerDown={drag(corner)}
                  /* 18px, which is bigger than the 10px mark inside it. The
                     handle is what you see; the target is what you hit. */
                  className={`absolute size-[18px] rounded-full border-2 border-espresso bg-white ${
                    corner[0] === "n" ? "-top-[9px]" : "-bottom-[9px]"
                  } ${corner[1] === "w" ? "-left-[9px]" : "-right-[9px]"} ${
                    corner === "nw" || corner === "se"
                      ? "cursor-nwse-resize"
                      : "cursor-nesw-resize"
                  }`}
                  style={{ touchAction: "none" }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={busy || !natural.w}
          className={primaryButton}
        >
          {busy ? "Cropping…" : "Crop and upload"}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            setBox(
              aspect
                ? centredBox(natural.w, natural.h, aspect)
                : { x: 0, y: 0, w: 1, h: 1 },
            )
          }
          className="text-[0.85rem] font-semibold text-ink-soft underline decoration-line underline-offset-4 transition hover:text-espresso"
        >
          Reset
        </button>
        {aspect ? (
          <p className="text-[0.8rem] text-mute">
            Locked to the shape this picture is shown in.
          </p>
        ) : (
          <p className="text-[0.8rem] text-mute">
            Any shape — drag a corner.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Geometry. Pure functions, kept out of the component so the dragging above
   reads as "work out the new box, set it".
   --------------------------------------------------------------- */

/** The largest box of the given aspect that fits, centred. */
function centredBox(w: number, h: number, aspect: number) {
  const imageAspect = w / h;
  if (imageAspect > aspect) {
    /* image is wider than the target — height binds */
    const bw = aspect / imageAspect;
    return { x: (1 - bw) / 2, y: 0, w: bw, h: 1 };
  }
  const bh = imageAspect / aspect;
  return { x: 0, y: (1 - bh) / 2, w: 1, h: bh };
}

type Box = { x: number; y: number; w: number; h: number };

/**
 * Where the box goes after a drag.
 *
 * CLAMPED TO THE PICTURE ON EVERY PATH. A crop that runs off the edge is not an
 * error the canvas reports — drawImage simply returns transparent pixels for
 * the part that was not there, so the result is a picture with a blank strip
 * down one side and nothing anywhere says why.
 */
function next(
  start: Box,
  mode: "move" | "nw" | "ne" | "sw" | "se",
  dx: number,
  dy: number,
  aspect: CropAspect,
  /* the element's own aspect, needed to convert a fractional width into a
     fractional height — the two axes are normalised independently, so a square
     on screen is not w === h in these units */
  elementAspect: number,
): Box {
  const MIN = 0.05;

  if (mode === "move") {
    return {
      ...start,
      x: clamp(start.x + dx, 0, 1 - start.w),
      y: clamp(start.y + dy, 0, 1 - start.h),
    };
  }

  const west = mode[1] === "w";
  const north = mode[0] === "n";

  let x = start.x;
  let y = start.y;
  let w = start.w;
  let h = start.h;

  if (west) {
    const nx = clamp(start.x + dx, 0, start.x + start.w - MIN);
    w = start.x + start.w - nx;
    x = nx;
  } else {
    w = clamp(start.w + dx, MIN, 1 - start.x);
  }

  if (aspect) {
    /* HEIGHT FOLLOWS WIDTH when the shape is locked, rather than the corner
       being free in both axes and then corrected. Correcting afterwards makes
       the box jump away from the pointer; deriving one axis from the other
       keeps the dragged corner under the finger. */
    h = (w * elementAspect) / aspect;
    if (north) {
      y = start.y + start.h - h;
    }
    /* If that pushed it off an edge, pull the WIDTH back instead of letting the
       height go out of ratio. */
    if (y < 0 || y + h > 1) {
      h = north ? start.y + start.h : 1 - start.y;
      w = (h * aspect) / elementAspect;
      y = north ? start.y + start.h - h : start.y;
      if (west) x = start.x + start.w - w;
    }
  } else if (north) {
    const ny = clamp(start.y + dy, 0, start.y + start.h - MIN);
    h = start.y + start.h - ny;
    y = ny;
  } else {
    h = clamp(start.h + dy, MIN, 1 - start.y);
  }

  return {
    x: clamp(x, 0, 1 - MIN),
    y: clamp(y, 0, 1 - MIN),
    w: clamp(w, MIN, 1 - clamp(x, 0, 1)),
    h: clamp(h, MIN, 1 - clamp(y, 0, 1)),
  };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** WebP, or PNG where the browser cannot encode it. Both keep alpha; JPEG would
    not, which is why it is not in this chain at all. */
function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === "image/webp") return resolve(blob);
        canvas.toBlob((png) => resolve(png ?? blob), "image/png");
      },
      "image/webp",
      0.92,
    );
  });
}
