"use client";

import { useRef, useState } from "react";
import { uploadImage } from "../upload-actions";
import { ghostButton } from "../ui";
import Cropper, { type CropAspect } from "./Cropper";

/**
 * A picture: what it is now, a way to replace it, and a crop step in between.
 *
 * IT IS STILL A TEXT FIELD UNDERNEATH, and that is deliberate rather than
 * leftover. Every stored picture on this site is a path — /img/menu-tea.webp —
 * and half of them point at files that were in the repository long before this
 * panel existed. An upload-only control would make those unreachable: no way to
 * point a card back at a plate already on disk, no way to fix a typo, no way to
 * reuse one picture in two places without uploading it twice. So the input
 * holds the path, the upload fills it in, and both remain available.
 *
 * THE UPLOAD IS TWO STEPS AND THE SECOND ONE IS NOT OPTIONAL-FEELING BY
 * ACCIDENT. Choosing a file opens the cropper rather than sending it straight
 * up, because the pictures this site uses are trimmed to their subject — the
 * plates in section 02 are cut-outs scaled so their glasses match across the
 * row, and a plate with three inches of empty canvas around it renders as a
 * small glass in a big gap. Cropping at upload time is the cheapest moment to
 * fix that. "Use as-is" is there for the case where the file is already right.
 *
 * THE FORM IS NOT SUBMITTED BY ANY OF THIS. The upload is its own Server Action
 * call; all it does when it succeeds is put a path in the text input. Nothing
 * is written to the content store until the operator saves the form, so an
 * upload they change their mind about costs one orphaned file rather than a
 * half-applied edit.
 */
export default function ImageField({
  label,
  name,
  value,
  onChange,
  hint,
  placeholder,
  /** the shape this picture is shown in on the site, so the crop box can lock
      to it. null for a cut-out, where the frame is whatever the subject needs */
  aspect = null,
  /** dark, because most of these are cut-outs shown on a dark ground and a
      white preview hides a white fringe */
  previewOnDark = true,
  previewFit = "contain",
  onAspect,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
  placeholder?: string;
  aspect?: CropAspect;
  previewOnDark?: boolean;
  previewFit?: "contain" | "cover";
  /**
   * The picture's own width ÷ height, reported when the preview decodes.
   *
   * IT FIRES FROM THE PREVIEW RATHER THAN FROM THE UPLOAD, which covers one
   * more case for no extra code: a path TYPED into the field reports its shape
   * too, not only a file that came through the cropper. The machine cards need
   * this number to reserve the right height before the image has loaded, and it
   * is the one value on that form nobody should have to measure by hand.
   */
  onAspect?: (aspect: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /* The picture's own shape, learned when it decodes. It is what the preview
     falls back to when the field has no fixed frame to show. */
  const [natural, setNatural] = useState<number | null>(null);

  /* ── THE PREVIEW'S SHAPE ──────────────────────────────────
     THE FIELD'S FRAME WHERE THERE IS ONE, THE PICTURE'S OWN WHERE THERE IS
     NOT. A blog card is 5:4 and a case study 3:4, and for those the useful
     preview is the CROP — what the card will actually show. A drink plate or a
     machine has no fixed frame; it is a cut-out sized to its subject, so the
     useful preview is the whole picture.

     THIS BOX USED TO BE `h-32 w-full`, which is where the problem was. A
     128px-tall band across a 1200px panel is roughly 9:1 — so every photograph
     under object-cover was reduced to a horizontal strip through its middle,
     and the operator could not tell a pantry from a factory floor. The fit was
     never the issue; the shape of the box was. */
  const frame = aspect ?? natural ?? 4 / 3;

  const send = async (file: File) => {
    setBusy(true);
    setStatus("Uploading…");
    try {
      const body = new FormData();
      body.set("file", file);
      const result = await uploadImage(body);
      if (result.ok) {
        onChange(result.url);
        setStatus(`Uploaded — ${(result.bytes / 1024).toFixed(0)}KB`);
      } else {
        setStatus(result.message);
      }
    } catch (err) {
      console.error("[upload] failed:", err);
      setStatus("The upload did not go through.");
    } finally {
      setBusy(false);
      setPicked(null);
      /* CLEAR THE FILE INPUT. Without this, choosing the same file twice in a
         row fires no change event at all — the value has not changed — and the
         cropper silently refuses to reopen. */
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          {label}
        </span>
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition placeholder:text-mute/70 focus:border-orange focus:ring-4 focus:ring-orange/15"
        />
      </label>

      {hint ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">{hint}</p>
      ) : null}

      {/* ── THE PREVIEW ────────────────────────────────────────
          CAPPED IN BOTH DIRECTIONS AND LEFT-ALIGNED. Height so a portrait plate
          cannot push the rest of the form off the screen, width so a landscape
          one does not stretch across the panel — and left rather than centred,
          because everything else in this column starts at the same edge. */}
      {value ? (
        <div
          className={`mt-2 w-full overflow-hidden rounded-xl border border-line ${
            previewOnDark ? "bg-espresso-deep" : "bg-cream-deep"
          }`}
          style={{
            aspectRatio: String(frame),
            maxWidth: "22rem",
            maxHeight: "18rem",
          }}
        >
          {/* A plain <img>: an arbitrary typed path, behind a login, where the
              broken state is the useful one — it is how a wrong path is noticed
              here rather than on the home page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (!w || !h) return;
              setNatural(w / h);
              onAspect?.(w / h);
            }}
            className={`size-full ${
              previewFit === "cover" ? "object-cover" : "object-contain p-2"
            }`}
          />
        </div>
      ) : (
        <p
          className="mt-2 grid w-full place-items-center rounded-xl border border-dashed border-line bg-cream-deep/40 text-[0.82rem] text-mute"
          style={{ aspectRatio: String(frame), maxWidth: "22rem", maxHeight: "18rem" }}
        >
          No picture yet
        </p>
      )}

      {/* SAYING SO, because a cropped preview is indistinguishable from a
          badly-shot photograph unless the reason is on screen. */}
      {value && aspect ? (
        <p className="mt-1.5 text-[0.78rem] text-mute">
          This is the shape the card crops to.
        </p>
      ) : null}

      {/* ── CHOOSE / CROP / UPLOAD ───────────────────────────── */}
      {picked ? (
        <div className="mt-3">
          <Cropper
            file={picked}
            aspect={aspect}
            onCancel={() => {
              setPicked(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            onDone={send}
          />
          <button
            type="button"
            onClick={() => send(picked)}
            className="mt-2 text-[0.85rem] font-semibold text-ink-soft underline decoration-line underline-offset-4 transition hover:text-espresso"
          >
            Use it as it is, without cropping
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {/* THE REAL INPUT IS HIDDEN AND THE BUTTON DRIVES IT. A bare
              <input type="file"> cannot be styled to match anything else on
              this form, and `sr-only` rather than `display:none` keeps it
              reachable by a screen reader and focusable by a keyboard — the
              usual version of this trick breaks both. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="sr-only"
            id={`${name}-file`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPicked(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`${ghostButton} disabled:cursor-not-allowed`}
          >
            {value ? "Replace picture" : "Upload a picture"}
          </button>

          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setStatus(null);
              }}
              className="text-[0.85rem] font-semibold text-ink-soft underline decoration-line underline-offset-4 transition hover:text-espresso"
            >
              Clear
            </button>
          ) : null}

          {status ? (
            <p
              /* polite, not assertive: an upload finishing is worth announcing
                 and is not worth interrupting whatever is being read. */
              role="status"
              className="text-[0.82rem] text-mute"
            >
              {status}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
