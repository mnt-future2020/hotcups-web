"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { savePostsAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, TextArea, ghostButton } from "../../ui";
import ImageField from "../ImageField";
import ConfirmDelete from "../ConfirmDelete";
import { CloseIcon, DocumentIcon } from "../icons";
import RichText from "../RichText";
import Pager from "../Pager";
import PostPreview from "./PostPreview";
import PagePreview from "../PagePreview";
import type { PostContent } from "@/lib/content/schema";

/**
 * Blog posts: a table of what exists, and one post open at a time.
 *
 * ── WHY A TABLE AND A SHEET RATHER THAN A STACK OF FORMS ──────────────────
 *
 * Every post was a card of five fields in one column — five posts was five
 * pictures and twenty-five inputs, and the question this screen is usually
 * opened with ("what is on the blog strip, and is one of them stale?") needed
 * scrolling past all of it to answer. A table answers that in one look and
 * puts editing behind a click.
 *
 * ── THE BODY, AND WHY IT WAS NOT HERE FIRST ───────────────────────────────
 *
 * This comment used to argue AGAINST an article body: every card linked to
 * /blog, the posts had no pages of their own, and a rich-text editor would
 * have been a well-made box for text the site could not render — filled in
 * once and then silently dropped.
 *
 * The argument was right, so the answer was not to add the field on its own.
 * app/(site)/blog/[slug] was built with it. The editor is here because the
 * page that renders what it writes is here; neither would have been worth
 * shipping alone.
 *
 * A POST WITH NO BODY STILL HAS NO PAGE. That rule survived the change rather
 * than being dropped by it: Blog.tsx leaves such a card unlinked and the route
 * answers 404, so an empty draft cannot cost a reader a click.
 *
 * ── WHAT IS STILL NOT HERE ────────────────────────────────────────────────
 *
 * NO RELEASE DATE — nothing displays one. The reference sorts and filters by
 * it; this list is a few rows in the order they appear on the page, which is
 * the order that matters here. It becomes worth adding the day a post page
 * wants to say when it was written, or Article markup wants a datePublished.
 *
 * NO STATUS TOGGLE. A draft is a post that is not on the site; this list IS
 * the site. Adding "active/inactive" would mean posts that exist in the panel
 * and not on the page, which is a publishing model this content store does not
 * have.
 *
 * NO SEARCH. Pagination is here — it appears at six posts, see PAGE_SIZE — but
 * a filter box is an answer to a list too long to READ rather than too long to
 * fit, and three rows is not that. Past about fifteen it earns its place.
 *
 * ── THE SHEET IS NOT A <dialog> ───────────────────────────────────────────
 *
 * Every other confirm in this panel uses the native one, and this deliberately
 * does not. The fields inside have to POST — the action rebuilds all five
 * posts from one submit, so a post whose inputs were not in the form would
 * come back empty. A native dialog moves its contents to the top layer, which
 * is fine, but only ONE can be open and the other four posts still need to be
 * in the DOM. So all five fieldsets stay mounted and `hidden`, and the sheet is
 * a positioned overlay that reveals one of them. `hidden` is display:none and a
 * display:none input still posts; only a DISABLED one is dropped.
 *
 * THE INPUTS ARE NAMED BARE — "title", "tag" — AND NOT INDEXED. savePostsAction
 * reads PARALLEL ARRAYS: formData.getAll("title") beside getAll("tag"), zipped
 * by position. So every row must contribute exactly one of each field, in
 * document order, and renaming them to row0_title would hand the action five
 * empty columns. It is also why the sheet cannot move a row's nodes around:
 * position in the document IS the row index.
 */
/** Rows per page in the table. Small enough that the control is reachable on
    a laptop without scrolling the header out of view. */
const PAGE_SIZE = 5;

export default function PostsManager({ posts }: { posts: PostContent[] }) {
  const [state, action] = useActionState<SaveState, FormData>(
    savePostsAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(posts.length);
  const [rows, setRows] = useState(() =>
    posts.map((p, i) => ({ uid: `${idBase}-${i}`, value: p })),
  );
  /** index of the post the sheet is showing, or null */
  const [open, setOpen] = useState<number | null>(null);

  /* ── PAGINATION, AND WHAT IT MUST NOT TOUCH ──────────────────────────
     It pages the TABLE and nothing else. Every post's fields stay mounted
     below whatever page is showing — savePostsAction reads parallel arrays
     zipped by position, so dropping page two's inputs from the document would
     not hide those posts, it would DELETE them on the next save.

     That is the whole risk here and it is invisible: the screen would look
     right, the save would say "5 posts saved", and five would have become
     three. The table slice below is presentation; the fieldsets are the form. */
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  /* A page that no longer exists — the last post on it was removed — would
     render an empty table with no way back. */
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const from = page * PAGE_SIZE;
  const shown = rows.slice(from, from + PAGE_SIZE);

  const patch = (uid: string, part: Partial<PostContent>) =>
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
        value: {
          id: "",
          tag: "Guide",
          read: "4 min",
          title: "",
          src: "",
          alt: "",
          summary: "",
          body: "",
        } satisfies PostContent,
      },
    ]);
    setSeq((n) => n + 1);
    /* STRAIGHT INTO THE SHEET. A new row appended to a table with every field
       empty is a row that says nothing — the only useful next step is to fill
       it in, so the form opens on it rather than waiting to be asked. */
    setOpen(rows.length);
    /* AND ONTO THE PAGE THAT NOW HOLDS IT, so closing the sheet does not leave
       the operator looking at a table the new post is not on. */
    setPage(Math.floor(rows.length / PAGE_SIZE));
  };

  const remove = (uid: string) =>
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));

  /* Escape closes the sheet. It is not a native dialog, so this is the one
     behaviour that has to be written by hand rather than inherited. */
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

      {/* ── THE TABLE ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-cream/50 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange-deep">
            <DocumentIcon className="size-[17px]" />
          </span>
          <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
            The strip
          </p>
          <span aria-hidden className="h-5 w-px bg-line" />
          <p className="text-[0.85rem] text-mute">
            {rows.length} {rows.length === 1 ? "post" : "posts"}
            {rows.length > 3 ? " — three fit the row" : null}
          </p>
          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={add}
              disabled={rows.length >= 12}
              className={`${ghostButton} px-3.5 py-1.5 text-[0.82rem] disabled:cursor-not-allowed`}
            >
              New post
            </button>
            <SubmitButton>Save posts</SubmitButton>
          </div>
        </header>

        {/* A real <table>: these are rows of one kind of thing with shared
            columns, which is what a table is for. A grid of divs would lose
            the header association every cell gets for free here. */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[0.68rem] font-extrabold uppercase tracking-[0.09em] text-mute">
                <th className="px-4 py-2.5 font-extrabold">Post</th>
                <th className="px-4 py-2.5 font-extrabold">Tag</th>
                <th className="px-4 py-2.5 font-extrabold">Read</th>
                <th className="px-4 py-2.5 text-right font-extrabold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* `from + n` AND NOT `n`. The slice renumbers from zero, and
                  Edit opens `open === i` against the full list — paging to the
                  second page and clicking Edit would otherwise open the first
                  post on page one. */}
              {shown.map((row, n) => {
                const i = from + n;
                return (
                  <tr
                    key={row.uid}
                    className="border-b border-line/70 last:border-0 hover:bg-cream/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-cream-deep">
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
                                Untitled post
                              </em>
                            )}
                          </span>
                          {/* THE FIRST GAP, NOT ALL OF THEM. A row listing three
                            complaints is a row nobody reads; the first one is
                            the next thing to do. */}
                          {!row.value.src ? (
                            <span className="block text-[0.72rem] font-semibold text-amber-800">
                              No picture
                            </span>
                          ) : !row.value.alt ? (
                            <span className="block text-[0.72rem] font-semibold text-amber-800">
                              No picture description
                            </span>
                          ) : !row.value.body ? (
                            <span className="block text-[0.72rem] font-semibold text-mute">
                              Headline only — no article yet
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-cream-deep px-2.5 py-1 text-[0.72rem] font-bold text-ink-soft">
                        {row.value.tag || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[0.82rem] text-ink-soft">
                      {row.value.read || "—"}
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
                          title="Remove this post?"
                          body="Its headline, tag, read time and picture go with it — there is no undo on this form. The live site is unchanged until you press Save."
                          confirmLabel="Remove the post"
                          onConfirm={() => remove(row.uid)}
                          disabled={rows.length <= 1}
                          disabledReason="At least one post has to stay."
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

      {/* ── THE SHEET ─────────────────────────────────────────── */}
      {/* THE BACKDROP ONLY. The sheet itself is the open fieldset below —
          it cannot be rendered in here, because moving a row's inputs into a
          different part of the tree changes their document order and the
          action zips the columns by position. */}
      {open !== null ? (
        <button
          type="button"
          aria-label="Close the editor"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 cursor-default bg-espresso-deep/45 backdrop-blur-[2px]"
        />
      ) : null}

      {/* ── EVERY POST'S FIELDS, ALWAYS MOUNTED ───────────────── */}
      {rows.map((row, i) => (
        <PostFields
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

/**
 * One post's inputs.
 *
 * MOUNTED WHETHER OR NOT IT IS OPEN, and positioned over the page when it is.
 * The alternative — rendering only the open one — would drop the other four
 * from FormData, and savePostsAction rebuilds the whole list from what it
 * receives. Four posts would vanish on the next save with nothing to show that
 * it had happened.
 */
function PostFields({
  index,
  value,
  open,
  onChange,
  onDone,
}: {
  index: number;
  value: PostContent;
  open: boolean;
  onChange: (part: Partial<PostContent>) => void;
  onDone: () => void;
}) {
  /* WHICH HALF OF THE SHEET IS SHOWING. Per row and kept across open/close,
     so somebody checking three posts in a row does not have to press Preview
     three times. */
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
      <legend className="sr-only">Post {index + 1}</legend>

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
          <DocumentIcon className="size-[18px] shrink-0 text-orange" />
          <p className="min-w-0 flex-1 truncate text-[0.95rem] font-bold text-cream">
            {value.title || "New post"}
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
        {/* ── TWO COLUMNS WHILE THE SHEET IS OPEN, ONE WHEN IT IS NOT ──
            A closed fieldset is not a layout — it is a set of inputs kept in
            the document so they still POST, and wrapping those in a flex row
            nobody can see would be arrangement for its own sake. So the split
            only exists when the sheet does.

            IT STACKS BELOW lg. At 58rem the two columns are comfortable; on a
            narrow laptop the preview goes under the fields rather than
            squeezing both, because a 10rem-wide card is not a preview of
            anything. */}
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
              hint="Shown on the card and at the top of the post."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tag"
                name="tag"
                value={value.tag}
                onChange={(v) => onChange({ tag: v })}
                placeholder="Guide"
                hint="One word. Guide, Trends, Business."
              />
              <Field
                label="Read time"
                name="read"
                value={value.read}
                onChange={(v) => onChange({ read: v })}
                placeholder="4 min"
                hint="Text, not a number — “4 min”, or “under 5 min”."
              />
            </div>

            <ImageField
              label="Picture"
              name="src"
              value={value.src}
              onChange={(v) => onChange({ src: v })}
              /* 5:4, WHICH IS THE CARD'S OWN FRAME. Blog.tsx draws the picture in
             an aspect-[5/4] box with object-cover, so anything outside that
             ratio is cropped at render time — centre-weighted, with no say in
             what goes. Locking the crop box to it means the operator chooses
             which part survives instead of finding out afterwards. */
              aspect={5 / 4}
              previewOnDark={false}
              previewFit="cover"
              placeholder="/img/need-bulk.jpg"
              hint="Upload one and crop it, or type the path to a picture already on the site."
            />

            <TextArea
              label="Picture description"
              name="alt"
              rows={2}
              value={value.alt}
              onChange={(v) => onChange({ alt: v })}
              hint="What the picture shows, for a visitor who cannot see it. Not the headline again."
            />

            {/* ── THE ARTICLE ─────────────────────────────────────
            Under its own rule, because everything above describes the CARD and
            everything below is the POST. They are edited at different moments:
            the card is written when a post is planned, the body when it is
            written. */}
            <div className="border-t border-line pt-4">
              <p className="mb-3 flex items-center gap-2 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                <DocumentIcon className="size-4 text-orange-deep" />
                The article
              </p>

              <div className="space-y-4">
                <TextArea
                  label="Summary"
                  name="summary"
                  rows={2}
                  value={value.summary}
                  onChange={(v) => onChange({ summary: v })}
                  hint="One or two sentences, shown at the top of the post. It is not on the card — see the preview."
                />

                <RichText
                  label="Body"
                  name="body"
                  defaultValue={value.body}
                  onChange={(v) => onChange({ body: v })}
                  hint="Leave it empty and the card stops being a link — a headline is better than a page with nothing on it."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              {/* "DONE", NOT "SAVE". Closing this changes nothing on the site —
              the values are already in the form and go out with the Save in
              the table's header. Calling it Save would be the second Save on
              one screen, and the one that did less. */}
              <p className="mr-auto text-[0.78rem] text-mute">
                Nothing is published until you press Save posts.
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

          {/* RENDERED ONLY WHILE THE SHEET IS OPEN. Every other post's
              fieldset is in the document at the same time; drawing three
              previews nobody is looking at would mean three more pictures
              fetched for nothing. */}
          {open ? (
            <aside className="mt-6 border-t border-line pt-5 lg:mt-0 lg:w-[17rem] lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="mb-3 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                Preview
              </p>
              <PostPreview
                title={value.title}
                tag={value.tag}
                read={value.read}
                src={value.src}
                summary={value.summary}
                body={value.body}
                id={value.id}
              />
            </aside>
          ) : null}
        </div>

        {/* ── THE WHOLE PAGE ───────────────────────────────────────────
              Mounted only when it is being looked at — it renders the body,
              and every other post's fieldset is in the document at the same
              time. */}
        {tab === "preview" ? (
          <PagePreview
            eyebrow={value.tag}
            meta={value.read}
            title={value.title}
            summary={value.summary}
            src={value.src}
            body={value.body}
            emptyBody="Nothing written yet. Until there is, this card will not be a link and this page will not exist."
            layout="post"
          />
        ) : null}
      </div>
    </fieldset>
  );
}
