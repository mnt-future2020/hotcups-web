"use client";

import { useState } from "react";
import { validateJsonLd } from "@/lib/content/jsonld";
import type { ContactContent } from "@/lib/content/schema";

/**
 * The structured-data block for a page — JSON-LD.
 *
 * ── THE TEXTAREA WAS REFUSED; THIS IS WHAT IT TOOK TO BUILD IT ────────────
 *
 * The earlier note said a box taking any string "would be a way to put broken
 * markup on the site with nothing to catch it." That was the right objection
 * and this is the answer to it, in three parts:
 *
 *   1. It is CHECKED AS IT IS TYPED — the readout under the box is live, so
 *      a missing brace is visible before Save is pressed.
 *   2. It is CHECKED AGAIN ON SAVE, server-side, and a bad block stops the
 *      whole save rather than being stored. The browser check is a courtesy;
 *      the server check is the rule.
 *   3. It is ESCAPED ON RENDER, so a value containing "</script" + ">" cannot
 *      end the element and turn the rest of it into HTML.
 *
 * ── THE TEMPLATES ARE FILLED IN, NOT BLANK ────────────────────────────────
 *
 * Every template comes out carrying the real phone number, email, address and
 * accounts, read from the Contact screen. A template of YOUR_PHONE_HERE
 * placeholders is a form to fill in twice and a very good way to publish
 * YOUR_PHONE_HERE. Nothing here ships with wording to replace: a template that
 * needs editing before it is true is a template that will be saved before it
 * is edited.
 *
 * AND THERE ARE TWO OF THEM, NOT SEVEN. The list is what is right for the page
 * being edited — see templatesFor, which has the full account of what was cut
 * and what would bring each one back.
 *
 * ── WHAT IS NOT CHECKED ───────────────────────────────────────────────────
 *
 * Whether the @type exists in the schema.org vocabulary, and whether its
 * fields are the right ones for it. That needs the vocabulary itself and a
 * judgement this panel cannot make, so the footer links to the Rich Results
 * Test, which can. Saying so is better than letting the green tick imply more
 * than it means: valid JSON, with a context and a type. No more.
 */

type Ctx = {
  siteUrl: string;
  path: string;
  title: string;
  description: string;
  contact: ContactContent;
};

const BRAND = "Hotcups";

function templatesFor(ctx: Ctx): { label: string; json: string }[] {
  const { siteUrl, path, title, description, contact } = ctx;

  /* AN UNSET SITE URL LEAVES THESE OUT RATHER THAN GUESSING A DOMAIN — the
     same rule the sitemap and robots.txt already follow, and for the same
     reason: a wrong URL in structured data points search engines at pages
     that may not exist. JSON.stringify drops undefined, so the field simply
     is not in the template. */
  const url = siteUrl ? `${siteUrl}${path === "/" ? "" : path}` : undefined;
  const home = siteUrl || undefined;

  /* Only real links. An account the Contact screen has emptied is stored as
     null or "", and sameAs is a list of profile URLs — a blank in it is a
     claim that the business has a profile at nowhere. */
  const sameAs = contact.socials
    .map((s) => s.href)
    .filter((h): h is string => Boolean(h && /^https?:/i.test(h)));

  /* The address is stored as chosen line breaks for a narrow column, not as
     fields, so it has to be taken apart to become a PostalAddress.

     THE LAST LINE IS THE LOCALITY and the rest is the street — right often
     enough to save the typing, and sitting in the box in plain sight for the
     times it is not. The trailing commas come off because they are typography
     for a stacked address, not part of the value, and "Madurai 625001" splits
     because a six-digit PIN at the end of the last line is unambiguous in
     India and belongs in postalCode rather than inside the town name. */
  const address = (() => {
    const lines = contact.addressLines
      .map((l) => l.trim().replace(/,\s*$/, ""))
      .filter(Boolean);
    if (lines.length === 0) return undefined;

    const last = lines[lines.length - 1];
    const pin = last.match(/^(.*?)[\s,]+(\d{6})$/);
    return {
      "@type": "PostalAddress",
      /* Undefined on a one-line address rather than repeating that line as
         both street and locality, which is what a fallback would do. */
      streetAddress:
        lines.length > 1 ? lines.slice(0, -1).join(", ") : undefined,
      addressLocality: pin ? pin[1] : last,
      postalCode: pin ? pin[2] : undefined,
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    };
  })();

  const local = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BRAND,
    description,
    url: home,
    telephone: contact.phoneE164 || undefined,
    email: contact.email || undefined,
    address,
    areaServed: { "@type": "State", name: "Tamil Nadu" },
    sameAs: sameAs.length ? sameAs : undefined,
  };

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: home },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    serviceType: "Workplace tea and coffee delivery",
    areaServed: { "@type": "State", name: "Tamil Nadu" },
    provider: { "@type": "Organization", name: BRAND, url: home },
  };

  /* ── ONE PAGE, ONE ANSWER ────────────────────────────────────────────
     The list offers what is RIGHT FOR THIS PAGE, not everything schema.org
     has. A dropdown of seven types on a page that can only honestly use one
     is a menu of six ways to describe the page wrongly — and wrong markup is
     treated worse by Google than none at all.

     THE HOME PAGE IS THE BUSINESS; everything under it is a service the
     business offers. Those are the only two claims this site can make today.

     WHAT CAME OUT, AND WHAT WOULD BRING IT BACK:

       Organization — LocalBusiness already says everything it says and adds
         the address. Both on one page describes two businesses sharing a
         phone number.
       WebPage — says little the title tag does not. It earns its place when
         there is a page that is genuinely none of the other types, and there
         is not one yet.
       FAQPage — Google requires the questions and answers to be VISIBLE on
         the page. There is no FAQ section anywhere on this site, so this
         template could only ever have described content that does not exist.
         It comes back the day somebody builds one.
       Blog — for the reading list, and the posts are still unpublished and
         the page is still closed to search.

     BREADCRUMB IS CONDITIONAL rather than cut: it is right for every inner
     page and needs only one missing thing, the site URL. It appears by itself
     the moment System Settings has a domain — a trail of links with no links
     in it would be the dead control this panel keeps refusing to ship. */
  if (path === "/") {
    return [
      { label: "This business — name, address, area", json: pretty(local) },
    ];
  }

  const out = [
    { label: "A service — what this page offers", json: pretty(service) },
  ];
  if (siteUrl) {
    out.push({
      label: "Breadcrumb — Home then this page",
      json: pretty(crumbs),
    });
  }
  return out;
}

/** Indented for a person to read. The store keeps it minified; this is only
    ever what sits in the box. */
function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function SchemaField({
  name,
  value,
  onChange,
  ctx,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  ctx: Ctx;
}) {
  const [pick, setPick] = useState("");
  const check = validateJsonLd(value);
  const empty = value.trim() === "";
  const templates = templatesFor(ctx);

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
          Structured data
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* IT REPLACES WHAT IS IN THE BOX, it does not append. Two JSON
              documents in one field is not valid JSON, and the save would
              fail with a message about braces that explains nothing. The
              select resets to its first option so it reads as an action
              rather than a setting — nothing here stays "chosen". */}
          <select
            value={pick}
            onChange={(e) => {
              const t = templates.find((x) => x.label === e.target.value);
              if (t) onChange(t.json);
              setPick("");
            }}
            className="max-w-[15rem] rounded-lg border border-line bg-cream px-2.5 py-1.5 text-[0.78rem] font-bold text-ink-soft outline-none transition hover:border-orange/50 focus:border-orange"
          >
            <option value="">Insert a template…</option>
            {templates.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              if (check.ok && !empty) onChange(pretty(JSON.parse(value)));
            }}
            /* Off while the text cannot be parsed, which is the only time
               tidying could lose work. The readout already says what is
               wrong, so the disabled button is not the explanation. */
            disabled={!check.ok || empty}
            className="shrink-0 rounded-lg border border-line bg-cream px-2.5 py-1.5 text-[0.78rem] font-bold text-ink-soft transition hover:border-orange/50 hover:text-orange-deep disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft"
          >
            Tidy up
          </button>
        </div>
      </div>

      <textarea
        id={name}
        name={name}
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Nothing here yet. Pick a template above, or paste a block of JSON-LD."
        className={`w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 font-mono text-[0.8rem] leading-[1.6] text-ink outline-none transition placeholder:font-sans placeholder:text-mute/70 focus:ring-2 ${
          empty
            ? "border-line focus:border-orange focus:ring-orange/20"
            : check.ok
              ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/15"
              : "border-red-400 focus:border-red-500 focus:ring-red-500/15"
        }`}
      />

      {/* THE READOUT IS HONEST ABOUT ITS OWN SCOPE. A tick means valid JSON
          with a context and a type — not that Google will show a rich result,
          which only Google can say. */}
      {empty ? (
        <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">
          Optional. It tells search engines what the page is — a business, a
          service, a set of questions — and can earn a fuller-looking result.
          Leave it empty unless the page really is one of those.
        </p>
      ) : check.ok ? (
        <p className="mt-1.5 text-[0.8rem] font-semibold leading-snug text-emerald-700">
          Valid JSON with a type search engines can read. Whether Google shows
          a richer result is its own decision.
        </p>
      ) : (
        <p className="mt-1.5 text-[0.8rem] font-semibold leading-snug text-red-700">
          {check.error}
        </p>
      )}

      <p className="mt-1 text-[0.78rem] leading-snug text-mute">
        Once the page is live, check it with Google&rsquo;s{" "}
        <a
          href="https://search.google.com/test/rich-results"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-orange-deep underline underline-offset-2"
        >
          Rich Results Test
        </a>
        {" — "}it reads the real page and says what it found.
      </p>
    </div>
  );
}
