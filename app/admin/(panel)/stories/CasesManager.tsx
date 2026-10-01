"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { saveCasesAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Notice, TextArea, Field, ghostButton } from "../../ui";
import ImageField from "../ImageField";
import ConfirmDelete from "../ConfirmDelete";
import RichText from "../RichText";
import Pager from "../Pager";
import CasePreview from "./CasePreview";
import PagePreview from "../PagePreview";
import { CloseIcon, StarIcon } from "../icons";
import type { CaseContent } from "@/lib/content/schema";

/**
 * Case studies: a table of what exists, and one study open at a time.
 *
 * THE SAME SHAPE AS BLOG POSTS, deliberately. They are the same kind of thing
 * to an operator — a list of written pieces with a picture and a headline — and
 * two screens that do the same job should not need learning twice.
 *
 * ── WHERE IT DIFFERS FROM POSTS, AND WHY ──────────────────────────────────
 *
 * NO TAG AND NO READ TIME. Cases.tsx renders neither; the card is a portrait
 * photograph and a headline. Adding them here would be two fields nothing
 * displays.
 *
 * NO PICTURE DESCRIPTION, and this one is a decision the schema already
 * records at length: the whole card is one anchor and the headline inside it
 * is its accessible name, so the photograph is rendered with alt="" on
 * purpose. Describing it as well would read the same card out twice. The study
 * page keeps that treatment — the h1 and the body carry the meaning there too.
 *
 * ── THE SIGN-OFF RULE IS THE REASON THE BODY IS DIFFERENT ─────────────────
 *
 * A headline about what the product does needs nobody's permission. A written
 * study is where a customer gets named, a headcount gets quoted, a price gets
 * mentioned — and the panel has carried a warning about that since before
 * there was anywhere to write one. It is now attached to the field it is
 * about rather than standing at the top of the page.
 *
 * ── PAGING, AND THE TRAP IT CARRIES ───────────────────────────────────────
 *
 * The TABLE is sliced. The FIELDS are not: saveCasesAction reads parallel
 * arrays zipped by position, so a row whose inputs left the document would not
 * be hidden, it would be deleted on the next save — silently, with the save
 * reporting success. Every study's fieldset stays mounted and `hidden`.
 */

/** Rows per page in the table. */
const PAGE_SIZE = 5;

export default function CasesManager({ cases }: { cases: CaseContent[] }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveCasesAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(cases.length);
  const [rows, setRows] = useState(() =>
    cases.map((c, i) => ({ uid: `${idBase}-${i}`, value: c })),
  );
  const [open, setOpen] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const from = page * PAGE_SIZE;
  const shown = rows.slice(from, from + PAGE_SIZE);

  const patch = (uid: string, part: Partial<CaseContent>) =>
    setRows((rs) =>
      rs.map((r) =>
        r.uid === uid ? { ...r, value: { ...r.value, ...part } } : r,
      ),
    );

  const add = () => {
    setRows((rs) => [
      ...rs,
      {
        uid: `${idBase}-${seq}`,
        value: { id: "", src: "", title: "", summary: "", body: "" },
      },
    ]);
    setSeq((n) => n + 1);
    setOpen(rows.length);
    setPage(Math.floor(rows.length / PAGE_SIZE));
  };

  const remove = (uid: string) =>
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <form action={action} className="space-y-4">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-cream/50 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange-deep">
            <StarIcon className="size-[17px]" />
          </span>
          <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
            The stories
          </p>
          <span aria-hidden className="h-5 w-px bg-line" />
          <p className="text-[0.85rem] text-mute">
            {rows.length} {rows.length === 1 ? "story" : "stories"}
            {rows.length > 3 ? " — three fit the row" : null}
          </p>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={add}
              disabled={rows.length >= 12}
              className={`${ghostButton} px-3.5 py-1.5 text-[0.82rem] disabled:cursor-not-allowed`}
            >
              New story
            </button>
            <SubmitButton>Save stories</SubmitButton>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[0.68rem] font-extrabold uppercase tracking-[0.09em] text-mute">
                <th className="px-4 py-2.5 font-extrabold">Story</th>
                <th className="px-4 py-2.5 font-extrabold">Written up</th>
                <th className="px-4 py-2.5 text-right font-extrabold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* `from + n`, not `n`: the slice renumbers from zero and the
                  sheet opens on the full list's index. */}
              {shown.map((row, n) => {
                const i = from + n;
                return (
                  <tr
                    key={row.uid}
                    className="border-b border-line/70 last:border-0 hover:bg-cream/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {/* 3:4 IN THE THUMBNAIL TOO. These are portrait on the
                            site, and a square chip would make a crop look fine
                            here that is wrong there. */}
                        <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-line bg-cream-deep">
                          {row.value.src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.value.src}
                              alt=""
                              className="absolute inset-0 size-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.88rem] font-bold text-ink">
                            {row.value.title || (
                              <em className="font-normal not-italic text-mute">
                                Untitled story
                              </em>
                            )}
                          </span>
                          {!row.value.src ? (
                            <span className="block text-[0.72rem] font-semibold text-amber-800">
                              No picture
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${
                          row.value.body
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-cream-deep text-mute"
                        }`}
                      >
                        {row.value.body ? "Has a study" : "Headline only"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setOpen(i)}
                          className="rounded-full px-3 py-1.5 text-[0.82rem] font-semibold text-orange-deep transition hover:bg-cream"
                        >
                          Edit
                        </button>
                        <ConfirmDelete
                          label="Remove"
                          title="Remove this story?"
                          body="Its headline, picture and whatever has been written go with it — there is no undo on this form. The live site is unchanged until you press Save."
                          confirmLabel="Remove the story"
                          onConfirm={() => remove(row.uid)}
                          disabled={rows.length <= 1}
                          disabledReason="At least one story has to stay."
                          className="rounded-full px-3 py-1.5 text-[0.82rem] font-semibold text-red-800 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-mute disabled:hover:bg-transparent"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pager
          page={page}
          pageCount={pageCount}
          from={from}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPage={setPage}
        />
      </div>

      {open !== null ? (
        <button
          type="button"
          aria-label="Close the editor"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 cursor-default bg-espresso-deep/45 backdrop-blur-[2px]"
        />
      ) : null}

      {rows.map((row, i) => (
        <CaseFields
          key={row.uid}
          index={i}
          value={row.value}
          open={open === i}
          onChange={(part) => patch(row.uid, part)}
          onDone={() => setOpen(null)}
        />
      ))}
    </form>
  );
}

function CaseFields({
  index,
  value,
  open,
  onChange,
  onDone,
}: {
  index: number;
  value: CaseContent;
  open: boolean;
  onChange: (part: Partial<CaseContent>) => void;
  onDone: () => void;
}) {
  /* Same as the posts sheet, and deliberately so — these two screens are
     twins and a difference here would be one to explain. */
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <fieldset
      hidden={!open}
      className={
        open
          ? "fixed left-1/2 top-1/2 z-[51] max-h-[86vh] w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-2)] motion-safe:animate-[menu-in_160ms_cubic-bezier(0.16,1,0.3,1)]"
          : ""
      }
    >
      <legend className="sr-only">Story {index + 1}</legend>

      {/* ── THE ROW'S OWN IDENTITY, TRAVELLING WITH IT ─────────────────
          The id is the slug in this item's public address, and the action
          keeps whatever arrives here rather than re-deriving it from the
          headline — otherwise fixing a typo in a title would move the page to
          a new URL and 404 every link already shared, while the save reported
          success. Empty on a row added in this session, which is how the
          action knows to mint a fresh slug for it.

          POSTED WITH THE ROW rather than looked up by position, because
          position stops meaning anything the moment something is inserted or
          removed above it. See keepIds in content-actions. */}
      <input type="hidden" name="keepid" value={value.id} />

      {open ? (
        <header className="flex items-center gap-3 bg-espresso-deep px-5 py-3.5">
          <StarIcon className="size-[18px] shrink-0 text-orange" />
          <p className="min-w-0 flex-1 truncate text-[0.95rem] font-bold text-cream">
            {value.title || "New story"}
          </p>
          {/* ── EDIT / PREVIEW ────────────────────────────────────────
              A pair of tabs rather than a second panel, because the full page
              wants the sheet's whole width and the fields want it too. */}
          <div className="flex shrink-0 overflow-hidden rounded-full bg-cream/15 p-0.5">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-bold capitalize transition ${
                  tab === t
                    ? "bg-cream text-espresso-deep"
                    : "text-cream/70 hover:text-cream"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onDone}
            aria-label="Close"
            className="rounded-lg p-1.5 text-cream/65 transition hover:bg-cream/10 hover:text-cream"
          >
            <CloseIcon className="size-[18px]" />
          </button>
        </header>
      ) : null}

      <div
        className={
          open ? "max-h-[calc(86vh-3.5rem)] overflow-y-auto p-5" : "space-y-4"
        }
      >
        {/* TWO COLUMNS WHILE THE SHEET IS OPEN, ONE WHEN IT IS NOT — a closed
            fieldset is inputs kept in the document so they still POST, not a
            layout. Stacks below lg, where a 10rem card would be a preview of
            nothing. Same arrangement as the posts sheet, deliberately. */}
        {/* ── HIDDEN, NEVER UNMOUNTED ─────────────────────────────────
            `hidden` is display:none and a display:none input still posts; an
            unmounted one does not. Rendering the preview INSTEAD of the fields
            would mean a save made from the preview tab wrote this row back
            empty — and the save would report success. Every tabbed thing in
            this panel is built this way for exactly that reason. */}
        <div
          hidden={tab === "preview"}
          className={open ? "lg:flex lg:items-start lg:gap-6" : ""}
        >
          <div className="space-y-4 lg:min-w-0 lg:flex-1">
            <Field
              label="Headline"
              name="title"
              value={value.title}
              onChange={(v) => onChange({ title: v })}
              hint="A claim about what the product does — “No QR. Just tap your ID and drink.”"
            />

            <ImageField
              label="Picture"
              name="src"
              value={value.src}
              onChange={(v) => onChange({ src: v })}
              /* 3:4. Cases.tsx says the cards are aspect-[3/4] "so the three stay
             identical whatever the copy does" — the picture is cropped to that
             frame either way, so the crop box is locked to it and the choice of
             what survives is the operator's. */
              aspect={3 / 4}
              previewOnDark={false}
              previewFit="cover"
              placeholder="/img/case-story-1.webp"
              hint="Portrait. Upload one and crop it, or type the path to a picture already on the site."
            />

            <div className="border-t border-line pt-4">
              <p className="mb-3 flex items-center gap-2 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                <StarIcon className="size-4 text-orange-deep" />
                The written study
              </p>

              {/* THE WARNING MOVED HERE FROM THE TOP OF THE PAGE, because this is
              the field it is about. A headline can describe the product; a
              study is where somebody gets named. */}
              <div className="mb-4 rounded-xl border border-amber-600/30 bg-amber-50 px-3.5 py-2.5">
                <p className="text-[0.82rem] leading-relaxed text-amber-950">
                  No customer name, headcount or price without written sign-off
                  from that customer.
                </p>
              </div>

              <div className="space-y-4">
                <TextArea
                  label="Summary"
                  name="summary"
                  rows={2}
                  value={value.summary}
                  onChange={(v) => onChange({ summary: v })}
                  hint="One or two sentences, shown at the top of the story. It is not on the card — the card has room for the headline and nothing else."
                />

                <RichText
                  label="The study"
                  name="body"
                  defaultValue={value.body}
                  onChange={(v) => onChange({ body: v })}
                  hint="Leave it empty and the card stops being a link — a headline is better than a page with nothing on it."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              <p className="mr-auto text-[0.78rem] text-mute">
                Nothing is published until you press Save stories.
              </p>
              <button
                type="button"
                onClick={onDone}
                className="rounded-full bg-espresso px-5 py-2.5 text-[0.85rem] font-bold text-cream transition hover:bg-espresso-deep"
              >
                Done
              </button>
            </div>
          </div>

          {/* Only while the sheet is open: the other stories' fieldsets are in
              the document too, and three previews nobody is looking at is
              three more pictures fetched for nothing. */}
          {open ? (
            <aside className="mt-6 border-t border-line pt-5 lg:mt-0 lg:w-[17rem] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                Preview
              </p>
              <CasePreview
                title={value.title}
                src={value.src}
                summary={value.summary}
                body={value.body}
                id={value.id}
              />
            </aside>
          ) : null}
        </div>

        {tab === "preview" ? (
          <PagePreview
            eyebrow="Case study"
            title={value.title}
            summary={value.summary}
            src={value.src}
            body={value.body}
            emptyBody="Nothing written yet. Until there is, this card will not be a link and this page will not exist."
            layout="case"
          />
        ) : null}
      </div>
    </fieldset>
  );
}
