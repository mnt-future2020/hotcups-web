"use client";

import { useActionState, useState } from "react";
import { saveSeoAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, TextArea } from "../../ui";
import { GlobeIcon } from "../icons";
import KeywordsField from "./KeywordsField";
import SchemaField from "./SchemaField";
import type { ContactContent, SeoContent } from "@/lib/content/schema";

/**
 * What a search result says for each page.
 *
 * ── A RAIL AND A PANE, WHICH REPLACED A STACK ─────────────────────────────
 *
 * Every page was a card in one long column: eight result previews, eight
 * titles, eight descriptions, about 2,400px of scrolling. The pages are now a
 * list on the left and one editor on the right.
 *
 * THAT IS A TRADE AND IT IS WORTH NAMING, because the stack had a real
 * argument behind it — comparing pages is most of this screen's job, and you
 * cannot see that two descriptions open the same way if only one is on screen.
 * The RAIL keeps that: it carries each page's title under its name, so the set
 * is still readable at a glance, and it is the comparison that matters
 * (openings and lengths) rather than the full text.
 *
 * NOTHING CAN BE ADDED OR REMOVED. A row is a ROUTE that exists in the app
 * directory. An eighth would describe a page nobody can visit — which is why
 * this rail has no "add" button where every other list in the panel does.
 *
 * EVERY PAGE STAYS IN THE DOM, HIDDEN. The form posts all eight on every save
 * and the action rebuilds the whole block from them, so a page whose inputs
 * were unmounted would come back blank. `hidden` is display:none and a
 * display:none input still posts; only a DISABLED one is dropped. Conditional
 * rendering would have been the obvious way to write this and would have
 * silently wiped seven pages.
 *
 * ── KEYWORDS AND STRUCTURED DATA, REFUSED ONCE ────────────────────────────
 *
 * This comment used to list both as deliberately absent, and the arguments
 * were sound: Google has ignored meta keywords since 2009, and a textarea
 * taking any string is a way to put broken markup on the site with nothing to
 * catch it. The client asked for both. They were not bolted on — each was
 * built with the half that was missing:
 *
 *   KEYWORDS go into Next's metadata and come out as a real <meta> tag, and
 *   the field prints what the tag is actually worth rather than sitting there
 *   looking like the two boxes above it.
 *
 *   STRUCTURED DATA is validated in the browser as it is typed, validated
 *   again on the server before anything is written, escaped on render, and
 *   rendered by a component each route carries — so the field changes what is
 *   on the page rather than filling a box nobody reads.
 *
 * The rule that produced the original refusal is unchanged: nothing on this
 * screen may be a control that does nothing. The answer here was to make them
 * do something.
 *
 * ── WHAT IS STILL NOT HERE ────────────────────────────────────────────────
 *
 * CANONICAL URLS AND OPEN GRAPH IMAGES. Both are real and neither is a text
 * field — they need a domain that is decided and images that are made.
 *
 * THE LENGTH COUNTERS ARE ADVISORY AND SAY SO. Google truncates around 60
 * characters for a title and 155 for a description, but it rewrites both when
 * it thinks it can do better, and the cut-off is measured in pixels rather
 * than characters. So the counter turns amber rather than refusing.
 */

const TITLE_LIMIT = 60;
const DESC_LIMIT = 155;

/** The name a route goes by, derived rather than mapped — a hardcoded list
    would be a ninth place that has to learn about a new page. */
function pageName(path: string): string {
  if (path === "/") return "Home";
  return path
    .slice(1)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * `contact` is read-only here and is not posted by this form — it is what the
 * structured-data templates are filled in from, so a template arrives carrying
 * the real phone number and address instead of placeholders to replace. It is
 * edited on the Contact screen and nowhere else.
 */
export default function SeoForm({
  seo,
  contact,
}: {
  seo: SeoContent;
  contact: ContactContent;
}) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveSeoAction,
    undefined,
  );

  /* The site-wide switch is held in state so the warning can appear the moment
     it is ticked, rather than after a save. */
  const [closed, setClosed] = useState(seo.noindexAll);
  const [suffix, setSuffix] = useState(seo.titleSuffix);
  const [active, setActive] = useState(0);

  /* Lifted out of the rows so the rail can show each page's title and its
     state. A row owning its own title would leave the rail showing whatever
     was last saved while the pane showed what is typed. */
  const [pages, setPages] = useState(seo.pages);
  const patch = (i: number, part: Partial<SeoContent["pages"][number]>) =>
    setPages((ps) => ps.map((p, n) => (n === i ? { ...p, ...part } : p)));

  return (
    <form action={action} className="space-y-5">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      {/* ── SITE-WIDE ─────────────────────────────────────────── */}
      <fieldset className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5">
        <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
          The whole site
        </legend>

        <div className="space-y-4">
          <Field
            label="Title ending"
            name="seo_titleSuffix"
            value={suffix}
            onChange={setSuffix}
            hint="Added to the end of every page title except the home page. Include the spaces and the dash."
          />

          <label
            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition ${
              closed ? "border-amber-600/40 bg-amber-50" : "border-line bg-white"
            }`}
          >
            <input
              type="checkbox"
              name="seo_noindexAll"
              checked={closed}
              onChange={(e) => setClosed(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-orange)]"
            />
            <span>
              <span className="block text-[0.9rem] font-semibold text-ink">
                Keep the whole site out of search
              </span>
              <span className="mt-0.5 block text-[0.8rem] leading-snug text-mute">
                For before launch. It overrides every page, so nothing can be
                indexed while it is on.
              </span>
            </span>
          </label>

          {closed ? (
            <Notice tone="warn">
              The site is closed to search engines. Nothing will appear in
              Google until this is turned off — not even the pages left open
              below.
            </Notice>
          ) : null}
        </div>
      </fieldset>

      {/* ── THE RAIL AND THE PANE ─────────────────────────────── */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        <header className="flex flex-wrap items-center gap-3 border-b border-line bg-cream/50 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange/15 text-orange-deep">
            <GlobeIcon className="size-[17px]" />
          </span>
          <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
            Search result
          </p>
          <span aria-hidden className="h-5 w-px bg-line" />
          <p className="min-w-0 text-[0.85rem] text-mute">
            Editing{" "}
            <strong className="font-bold text-ink">
              {pageName(pages[active].path)}
            </strong>
          </p>
          {/* SAVE IN THE HEADER, not only at the foot. The pane below is tall
              enough that the bottom of the form is off screen while a page is
              being edited, and a save button you have to scroll to find is one
              people stop trusting is there. */}
          <div className="ml-auto">
            <SubmitButton>Save search settings</SubmitButton>
          </div>
        </header>

        <div className="grid lg:grid-cols-[15rem_1fr]">
          {/* ── THE RAIL ──────────────────────────────────────── */}
          <div className="border-b border-line lg:border-b-0 lg:border-r">
            <p className="px-4 pb-2 pt-4 text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
              The pages
            </p>
            <ul className="max-h-[28rem] overflow-y-auto pb-3">
              {pages.map((p, i) => {
                const on = i === active;
                const hidden = closed || p.noindex;
                return (
                  <li key={p.path}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={on}
                      className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${
                        on
                          ? "bg-orange/10"
                          : "hover:bg-cream"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`mt-1 h-8 w-[3px] shrink-0 rounded-full transition ${
                          on ? "bg-orange" : "bg-transparent"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[0.88rem] font-bold ${
                            on ? "text-orange-deep" : "text-ink"
                          }`}
                        >
                          {pageName(p.path)}
                        </span>
                        {/* THE TITLE UNDER THE NAME is what keeps the old
                            stacked layout's one advantage: the set can still
                            be read down the rail, so two pages opening the
                            same way are visible without clicking each. */}
                        <span className="mt-0.5 block truncate text-[0.74rem] text-mute">
                          {p.title || "No title"}
                        </span>
                      </span>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-[0.06em] ${
                          hidden
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {hidden ? "Hidden" : "In search"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── THE PANE ──────────────────────────────────────── */}
          <div className="min-w-0">
            {pages.map((p, i) => (
              <PagePane
                key={p.path}
                page={p}
                hidden={i !== active}
                disabled={closed}
                suffix={suffix}
                siteUrl={seo.siteUrl}
                contact={contact}
                onChange={(part) => patch(i, part)}
              />
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}

function PagePane({
  page,
  hidden,
  disabled,
  suffix,
  siteUrl,
  contact,
  onChange,
}: {
  page: SeoContent["pages"][number];
  hidden: boolean;
  /** the site-wide switch is on, so this page's own setting cannot matter */
  disabled: boolean;
  suffix: string;
  /** for the structured-data templates; blank leaves URLs out of them */
  siteUrl: string;
  contact: ContactContent;
  onChange: (part: Partial<SeoContent["pages"][number]>) => void;
}) {
  const slug = page.path === "/" ? "home" : page.path.slice(1);

  /* The home page takes no suffix — its title is already a whole sentence
     ending in the brand. Same rule as metadataFor, and it has to be, or the
     preview would promise something the page does not render. */
  const shown = page.path === "/" ? page.title : `${page.title}${suffix}`;

  return (
    <fieldset hidden={hidden} className="space-y-5 p-4 sm:p-5">
      <legend className="sr-only">{page.path}</legend>

      {/* WHAT THE RESULT WILL LOOK LIKE. Three fields describing a search
          result, without the result itself in front of them, is three text
          boxes — and the thing being edited is a shape more than a sentence. */}
      <div className="rounded-xl border border-line bg-cream/50 p-3.5">
        <p className="truncate text-[0.72rem] text-mute">
          hotcups.co.in{page.path === "/" ? "" : page.path}
        </p>
        <p className="mt-0.5 truncate text-[1.05rem] font-semibold text-[#1a0dab]">
          {shown || "—"}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[0.82rem] leading-snug text-ink-soft">
          {page.description || "—"}
        </p>
        {disabled || page.noindex ? (
          <p className="mt-2 text-[0.78rem] font-semibold text-amber-800">
            Not shown — this page is kept out of search
            {disabled && !page.noindex ? " by the site-wide setting" : ""}.
          </p>
        ) : null}
      </div>

      <div>
        <Field
          label="Title"
          name={`seo_${slug}_title`}
          value={page.title}
          onChange={(v) => onChange({ title: v })}
        />
        <Counter n={shown.length} limit={TITLE_LIMIT} noun="title" />
      </div>

      <div>
        <TextArea
          label="Description"
          name={`seo_${slug}_description`}
          rows={3}
          value={page.description}
          onChange={(v) => onChange({ description: v })}
        />
        <Counter
          n={page.description.length}
          limit={DESC_LIMIT}
          noun="description"
        />
      </div>

      {/* ── BELOW THE FOLD OF THE RESULT ──────────────────────────────────
          A rule and a label, because what follows does NOT change the preview
          above it. Title and description are that grey box; keywords and
          structured data are tags in the page source that no preview can
          honestly draw. Running all four together under one "Search result"
          heading would imply the last two show up there. */}
      <div className="flex items-center gap-3 pt-1">
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-mute">
          In the page source
        </span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>

      <KeywordsField
        name={`seo_${slug}_keywords`}
        value={page.keywords}
        onChange={(keywords) => onChange({ keywords })}
      />

      <SchemaField
        name={`seo_${slug}_schema`}
        value={page.schema}
        onChange={(schema) => onChange({ schema })}
        ctx={{
          siteUrl,
          path: page.path,
          title: page.title,
          description: page.description,
          contact,
        }}
      />

      {/* A CLOSED PAGE RENDERS NO STRUCTURED DATA — jsonLdFor returns nothing
          for one, because markup describing a page to search engines that the
          same screen tells them to skip is a contradiction on the page.

          THE KEYWORDS TAG IS NOT SUPPRESSED and this note does not claim it
          is. It still renders; it is simply read by nobody while the page is
          closed, which is a waste rather than a contradiction, and inventing a
          second rule for it would be a rule nobody asked for.

          The field stays editable either way: the closed state is temporary
          and the work should outlive it. What would be wrong is letting it
          look live. */}
      {(disabled || page.noindex) && page.schema ? (
        <p className="text-[0.8rem] font-semibold leading-snug text-amber-800">
          The structured data is saved but not on the page — this page is kept
          out of search. It appears the moment that is turned off.
        </p>
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border border-line bg-cream/40 px-3.5 py-3">
        <input
          type="checkbox"
          name={`seo_${slug}_noindex`}
          checked={page.noindex}
          onChange={(e) => onChange({ noindex: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--color-orange)]"
        />
        <span className="text-[0.85rem] leading-snug text-ink-soft">
          Keep this page out of search.{" "}
          <span className="text-mute">
            Links on it are still followed — that is a separate and stronger
            claim, and the pages it links to should be indexed.
          </span>
        </span>
      </label>
    </fieldset>
  );
}

/**
 * How long it is against where search engines usually cut.
 *
 * AMBER, NOT RED, AND NEVER A BLOCK. The limits are approximate — the real
 * cut-off is measured in pixels, and Google rewrites titles and descriptions
 * whenever it thinks it can do better. A hard stop here would be asserting a
 * precision the numbers do not have.
 *
 * THE BAR IS THE SAME NUMBER, DRAWN. A ratio is read faster than a pair of
 * figures, and the question here — "am I near the cut?" — is a proportion
 * rather than a count.
 */
function Counter({
  n,
  limit,
  noun,
}: {
  n: number;
  limit: number;
  noun: string;
}) {
  const over = n > limit;
  const pct = Math.min(100, Math.round((n / limit) * 100));

  return (
    <div className="mt-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[0.76rem] text-mute">
          Around {limit} characters usually shows
        </p>
        <p
          className={`shrink-0 text-[0.76rem] font-semibold tabular-nums ${
            over ? "text-amber-800" : "text-mute"
          }`}
        >
          {n} / {limit}
        </p>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-cream-deep">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${
            over ? "bg-amber-500" : "bg-orange/70"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over ? (
        <p className="mt-1 text-[0.76rem] text-amber-800">
          Longer than a {noun} usually shows. It will be trimmed, so put what
          matters first.
        </p>
      ) : null}
    </div>
  );
}
