"use client";

import { useActionState, useState } from "react";
import { saveContactAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, TextArea } from "../../ui";
import {
  ChatIcon,
  ExternalIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from "../icons";
import { askFor, mailHref, mapsHref, telHref, waHref } from "@/lib/content/links";
import type { ContactContent } from "@/lib/content/schema";

/**
 * The contact editor — the form this whole panel was worth building for.
 *
 * lib/contact.ts opens with a banner in exclamation marks: the number, the
 * inbox and the address are placeholders nobody has checked with the client,
 * and they are LIVE — tel: dials, mailto: sends, wa.me opens a chat, the maps
 * link drops a pin. A wrong value there does not look wrong on the page; it
 * silently routes real enquiries to a real stranger.
 *
 * ── WHAT CHANGED HERE, AND THE BUG IT WAS FIXING ──────────────────────────
 *
 * The built links used to live in a SECOND CARD BELOW THIS FORM, rendered on
 * the server. That card could only ever show the SAVED values — so the one
 * moment you need to check a link is the one moment it could not show you:
 * after typing a number and before committing it. You saved, scrolled, looked,
 * and if it was wrong you did it again. Worse, a wrong value is live from the
 * instant of that save.
 *
 * So the links moved UNDER THE FIELDS THAT FEED THEM and are now built from
 * what is in the boxes. Type a WhatsApp number and the wa.me URL assembles a
 * character at a time; click it and the chat opens. The check happens before
 * the save rather than after it.
 *
 * THAT IS ALSO WHY THESE INPUTS ARE CONTROLLED and were not before. Nothing
 * else on this form needed React to know the values — the action reads the
 * FormData. The previews do.
 *
 * THE CHECKS BELOW MIRROR content-actions AND ARE NOT IT. These decide whether
 * to colour a strip amber; the server decides whether to save, and only the
 * server's answer counts. They are three regexes and they are duplicated
 * knowingly: the alternative is a round trip to find out that a plus was left
 * on a WhatsApp number. If the rules there change, change them here.
 *
 * TWO PHONE FIELDS, AND THEY ARE NOT DERIVED FROM EACH OTHER. That is the one
 * thing about this form that will look like a mistake to whoever uses it, so it
 * is labelled rather than cleverly collapsed: a dialler needs +919750497509
 * with no spaces, a reader needs +91 97504 97509 with them, and stripping
 * spaces from the second to make the first would be right for India and wrong
 * the moment a number is written any other way. lib/contact made the same call
 * and said so.
 */
export default function ContactForm({ contact }: { contact: ContactContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveContactAction,
    undefined,
  );

  const [phoneLabel, setPhoneLabel] = useState(contact.phoneLabel);
  const [phoneE164, setPhoneE164] = useState(contact.phoneE164);
  const [whatsapp, setWhatsapp] = useState(contact.whatsapp);
  const [email, setEmail] = useState(contact.email);
  const [ask, setAsk] = useState(contact.ask);
  const [address, setAddress] = useState(contact.addressLines.join("\n"));

  /* The same shape the site is handed, assembled from the boxes rather than
     from the file — so every href below is the one this form would publish. */
  const live: ContactContent = {
    ...contact,
    phoneLabel,
    phoneE164,
    whatsapp,
    email,
    ask,
    addressLines: address.split("\n").filter((l) => l.trim()),
  };

  const okPhone = /^\+[0-9]{6,15}$/.test(phoneE164.trim());
  const okWa = /^[0-9]{6,15}$/.test(whatsapp.trim());
  const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const okAddress = live.addressLines.length > 0;

  return (
    <form action={action} className="space-y-4">
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <Group
        icon={PhoneIcon}
        title="Phone"
        tint="bg-emerald-100 text-emerald-700"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Number, as printed"
            name="phoneLabel"
            value={phoneLabel}
            onChange={setPhoneLabel}
            hint="Shown on the site, exactly as you type it."
            inputMode="tel"
            required
          />
          <Field
            label="Number, for dialling"
            name="phoneE164"
            value={phoneE164}
            onChange={setPhoneE164}
            hint="What the phone actually dials. Start with + and the country code, then digits — no spaces or brackets."
            inputMode="tel"
            required
          />
        </div>
        <Built
          ok={okPhone}
          href={telHref(live)}
          warn="Needs a + and a country code, then digits only."
        />
      </Group>

      <Group
        icon={ChatIcon}
        title="WhatsApp"
        tint="bg-green-100 text-green-700"
      >
        <Field
          label="WhatsApp number"
          name="whatsapp"
          value={whatsapp}
          onChange={setWhatsapp}
          hint="Digits only, no +. Usually the number above without the plus."
          inputMode="numeric"
          required
        />
        <Built
          ok={okWa}
          href={waHref(live)}
          warn={
            whatsapp.trim()
              ? "Digits only — a + or a space here breaks the link."
              : "Empty. The WhatsApp buttons still show on the site, so visitors get a link that goes nowhere."
          }
        />
      </Group>

      <Group icon={MailIcon} title="Email" tint="bg-sky-100 text-sky-700">
        <Field
          label="Enquiry inbox"
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
          hint="Where “Get a quote” messages arrive."
          required
        />
        {/* THE SENTENCE EVERY ENQUIRY OPENS WITH, and it sits in this group
            because this is where the inbox it lands in is set. It goes into
            the email body AND the WhatsApp message — the two channels on this
            screen — so putting it on either one alone would have been half
            true.

            NO FULL STOP. The site adds it, because where the stop falls is the
            only difference between the plain message and the one naming a
            workplace: "…date." against "…date for a college campus." One stem
            means there is one sentence to write and the two cannot drift. A
            stop typed anyway is stripped on save rather than refused. */}
        <TextArea
          label="What the message says"
          name="ask"
          rows={2}
          value={ask}
          onChange={setAsk}
          hint="The first line of every enquiry, by email and by WhatsApp. No full stop at the end — the site adds it, and adds “for an office” before it when the visitor asked from a workplace card."
        />

        <div className="rounded-xl border border-line bg-cream/50 px-3.5 py-2.5">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-mute">
            Which sends
          </p>
          {/* BOTH FORMS, because the second one is assembled and is the one
              that can read wrong — a stem that ends mid-clause is fine on its
              own and clumsy with " for a factory." bolted on. */}
          <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
            “{askFor(live)}”
          </p>
          <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
            “{askFor(live, "a college campus")}”
          </p>
        </div>

        <Built
          ok={okMail}
          href={mailHref(live)}
          warn="That does not look like an email address."
        />
      </Group>

      <Group icon={PinIcon} title="Address" tint="bg-orange-100 text-orange-700">
        <TextArea
          label="Registered address"
          name="address"
          rows={3}
          value={address}
          onChange={setAddress}
          hint="One line per line. Shown in the footer, and used for the map pin."
        />
        <Built
          ok={okAddress}
          href={mapsHref(live)}
          warn="Needs at least one line."
        />
      </Group>

      <Group
        icon={ExternalIcon}
        title="Social accounts"
        tint="bg-violet-100 text-violet-700"
      >
        <p className="text-[0.82rem] leading-relaxed text-mute">
          Leave one empty to take that account off the site. Paste the plain
          profile address from a browser — not the link the phone app’s Share
          button gives you, which carries a code after{" "}
          <code className="font-mono">?</code> and can stop working.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {contact.socials.map((s) => (
            <Field
              key={s.key}
              label={s.label}
              name={`social_${s.key}`}
              type="url"
              defaultValue={s.href ?? ""}
              placeholder={`https://www.${s.key}.com/…`}
            />
          ))}
        </div>
        {/* The labels are not editable in the UI but must still post, or the
            action would rebuild every social with its key as its label — and
            "instagram" is not how it should read in an accessible name. Hidden
            rather than shown, because "Instagram" is not a thing anyone needs to
            rename and a visible field invites it. */}
        {contact.socials.map((s) => (
          <input
            key={`label-${s.key}`}
            type="hidden"
            name={`social_label_${s.key}`}
            value={s.label}
          />
        ))}
      </Group>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <SubmitButton>Save contact details</SubmitButton>
        <p className="text-[0.82rem] text-mute">
          Used by the footer, the pricing band and all four section pages.
        </p>
      </div>
    </form>
  );
}

/** One titled block per channel. The grouping is the point: before this the
    six fields were a flat grid, and "which of these is the WhatsApp one" was a
    question you answered by reading every label. */
function Group({
  icon: Icon,
  title,
  tint,
  children,
}: {
  icon: (p: { className?: string }) => React.ReactElement;
  title: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <header className="flex items-center gap-3 border-b border-line bg-cream/50 px-4 py-3">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tint}`}>
          <Icon className="size-[17px]" />
        </span>
        <h3 className="text-[0.92rem] font-bold tracking-[-0.01em] text-ink">
          {title}
        </h3>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

/**
 * What the fields above currently build, and a way to fire it.
 *
 * THE LINK IS REAL AND IS MEANT TO BE CLICKED. A tel: out of an admin panel
 * dials; a mailto: opens a composer. That is not a side effect to apologise
 * for, it is the entire feature — the only way to know a number is right is to
 * ring it.
 *
 * noreferrer AS WELL AS noopener on every one, so the panel's own URL is not
 * handed to whatever opens.
 */
function Built({
  ok,
  href,
  warn,
}: {
  ok: boolean;
  href: string;
  warn: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3.5 py-2.5 ${
        ok
          ? "border-line bg-cream/50"
          : "border-amber-500/40 bg-amber-50"
      }`}
    >
      <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.09em] text-mute">
        Builds
      </span>

      {ok ? (
        <>
          {/* min-w-0 on a flex child that has to be allowed to shrink — without
              it `break-all` never gets the chance, because the item's base size
              is its full unbroken content. */}
          <code className="min-w-0 flex-1 break-all font-mono text-[0.76rem] leading-snug text-ink-soft">
            {href}
          </code>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[0.76rem] font-bold text-orange-deep transition hover:border-orange/50 hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
          >
            <ExternalIcon className="size-3.5" />
            Try it
          </a>
        </>
      ) : (
        <span className="min-w-0 flex-1 text-[0.79rem] leading-snug text-amber-900">
          {warn}
        </span>
      )}
    </div>
  );
}
