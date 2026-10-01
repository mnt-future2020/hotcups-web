import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { getContent } from "@/lib/content/store";
import {
  adminEmail,
  credentialSource,
  isProduction,
  productionGaps,
} from "@/lib/admin/config";
import { addressOneLine } from "@/lib/content/links";
import { Card, Notice, PageHead } from "../../ui";
import SettingsTabs from "./SettingsTabs";
import SiteUrlForm from "./SiteUrlForm";
import ResetForm from "./ResetForm";

export const metadata: Metadata = { title: "System Settings" };

/**
 * System Settings.
 *
 * ── WHAT THE REFERENCE HAD THAT THIS DOES NOT, AND WHY ────────────────────
 *
 * The screen it was modelled on has three tabs: General, Email Configuration,
 * Sitemap & Robots. Two of those survive; one could not.
 *
 *   EMAIL CONFIGURATION IS ABSENT BECAUSE THIS SITE SENDS NO EMAIL. Every ask
 *   on the page is a `mailto:` link, which opens the VISITOR'S own mail client
 *   on their own machine — nothing leaves this server. There is no SMTP host to
 *   point anywhere, no from-address to set and no credentials to store. A tab
 *   of those fields would configure nothing at all while looking exactly like a
 *   tab that did, which is the worst state for a settings screen to be in: an
 *   operator would fill it in, save it, and reasonably believe mail was now
 *   going somewhere.
 *
 *   THE CONTACT AND ADDRESS FIELDS ARE SHOWN BUT NOT EDITABLE HERE. The
 *   reference puts them on this page; they already have a screen of their own,
 *   which also renders the assembled tel:, mailto: and wa.me links so they can
 *   be clicked and checked. Two forms writing one value is the drift this whole
 *   panel has spent its time removing — the drinks count, the machine bands and
 *   the "six kinds of workplace" headline were each a version of it. So this
 *   reads them and links to the one place that writes them.
 *
 * THE DEPLOYMENT FACTS CAME OFF at the client's direction — a table reporting
 * where the content file sits, whether the disk accepts writes and whether
 * anything had been saved. Nothing was lost that matters: the two lines on it
 * that were WARNINGS rather than trivia — a read-only filesystem, uploads
 * refused — are on the dashboard, where they are read before an afternoon of
 * editing rather than after. The rest was reassurance that things were working,
 * which is what the panel working already says.
 *
 * NO SECRETS ON THIS PAGE. It says WHICH credential shape is in force, never
 * the value — this screen is one screenshot away from wherever screenshots go.
 */
export default async function SettingsPage() {
  await requireAdmin();

  const content = await getContent();

  const gaps = isProduction ? productionGaps() : [];
  const source = credentialSource();

  const contact = [
    { label: "Phone", value: content.contact.phoneLabel },
    {
      label: "WhatsApp",
      value: content.contact.whatsapp || "Not set — the WhatsApp buttons will be broken",
    },
    { label: "Enquiry inbox", value: content.contact.email },
    { label: "Address", value: addressOneLine(content.contact) },
  ];

  return (
    <>
      <PageHead
        title="Settings"
        lead="The account, the search files, and starting over."
      />

      {gaps.length > 0 ? (
        <Notice tone="warn">
          This is the live site still using the development password. Signing
          in is refused until these are set:
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <SettingsTabs
        tabs={["General", "Sitemap & robots", "Start over"]}
        panels={[
          /* ── GENERAL ─────────────────────────────────────── */
          /* KEYED HERE AS WELL AS INSIDE SettingsTabs. React checks arrays of
             elements wherever it finds them, including in a prop — the map that
             renders these keys the wrapper, not the element, so without this it
             warns about a list it cannot see the shape of. */
          <div key="general" className="space-y-5">
            <Card
              title="Admin account"
              note="Set on the server, not here. The password that guards this panel cannot be changed from inside it."
            >
              <dl className="divide-y divide-line">
                <Row label="Signs in as" value={adminEmail()} />
                <Row
                  label="Password"
                  value={
                    source === "hash"
                      ? "A hashed password is set"
                      : source === "plain"
                        ? "Set as plain text in the environment"
                        : "The one checked into the repository"
                  }
                  tone={source === "hash" ? "good" : "warn"}
                />
              </dl>

              {source !== "hash" ? (
                <div className="mt-4">
                  <Notice tone="warn">
                    {source === "default" ? (
                      <>
                        The panel is using the password checked into{" "}
                        <code className="font-mono">lib/admin/config.ts</code>.
                        Fine on a laptop, refused outright in production.
                      </>
                    ) : (
                      <>
                        The password is in the environment as plain text. It is
                        no weaker in transit — only in what a leaked environment
                        dump reveals.
                      </>
                    )}{" "}
                    <code className="font-mono">npm run admin:hash</code>{" "}
                    generates a hash for{" "}
                    <code className="font-mono">ADMIN_PASSWORD_HASH</code>.
                  </Notice>
                </div>
              ) : null}
            </Card>

            <Card
              title="Contact details"
              note="Read-only here. Edit them on the Contact details screen, where you can click each link to check it."
            >
              <dl className="divide-y divide-line">
                {contact.map((row) => (
                  <Row key={row.label} label={row.label} value={row.value} />
                ))}
              </dl>
              <Link
                href="/admin/contact"
                className="mt-4 inline-block text-[0.85rem] font-semibold text-orange-deep underline decoration-orange/40 underline-offset-4 transition hover:text-espresso"
              >
                Edit contact details
              </Link>
            </Card>

          </div>,

          /* ── SITEMAP & ROBOTS ────────────────────────────── */
          <Card
            key="sitemap"
            title="Sitemap and robots.txt"
            note="Both files are built from this address and from whatever SEO Manager hides. Nothing to upload."
          >
            <SiteUrlForm seo={content.seo} />
          </Card>,

          /* ── START OVER ──────────────────────────────────── */
          <div
            key="reset"
            className="rounded-[var(--radius-card)] border border-red-600/25 bg-red-50/60 p-5 sm:p-6">
            <h2 className="text-[1.05rem] font-bold tracking-[-0.01em] text-red-900">
              Start over
            </h2>
            <div className="mt-4">
              <ResetForm />
            </div>
          </div>,
        ]}
      />
    </>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-[0.82rem] font-semibold text-ink-soft">{label}</dt>
      <dd
        className={`min-w-0 break-all text-right text-[0.85rem] ${
          tone === "warn"
            ? "font-semibold text-amber-800"
            : tone === "good"
              ? "font-semibold text-emerald-700"
              : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
