import Link from "next/link";
import { requireAdmin } from "@/lib/admin/session";
import { canWrite, getContent, hasSaved } from "@/lib/content/store";
import { canUpload } from "@/lib/admin/uploads";
import { DEFAULT_CONTENT, drinkCount } from "@/lib/content/schema";
import { isProduction, productionGaps } from "@/lib/admin/config";
import { Card, Notice } from "../ui";
import BarRows from "./BarRows";
import Greeting from "./Greeting";
import TodayActivity from "./TodayActivity";
import {
  CheckIcon,
  ChevronRightIcon,
  CupIcon,
  DocumentIcon,
  ExternalIcon,
  MachineIcon,
  PeopleIcon,
  SparkIcon,
  StarIcon,
  TimelineIcon,
} from "./icons";

/**
 * The dashboard.
 *
 * ── WHAT THIS IS NOT, AND WHY ─────────────────────────────────────────────
 *
 * The reference it was built against is a SHOP's dashboard: total orders, total
 * revenue, customers, a sales line climbing to the right, top-selling products,
 * a feed of orders arriving. It looks the way an admin panel is expected to
 * look, and almost none of it can exist here. This site takes no orders, has no
 * customers, sells nothing through the page and records no traffic. There is no
 * store behind it to count.
 *
 * So the LAYOUT is that dashboard's and the NUMBERS are this project's. Every
 * figure on this screen is counted from content.json at the moment the page
 * renders. Nothing is sampled, estimated, or carried over from a previous day,
 * because none of those things happen here — and a revenue figure on a site
 * with no revenue is not a placeholder, it is a lie that looks like a feature.
 *
 * TWO THINGS THE REFERENCE HAS THAT ARE DELIBERATELY ABSENT:
 *
 *   TRENDS. "↑ 12% vs. yesterday" under every tile. Nothing here is recorded
 *   over time, so there is no yesterday to compare against. A sparkline would
 *   be a drawing.
 *
 *   TOP SELLING. Nothing sells. The drinks chart below is the honest version of
 *   the same shape — it ranks them by how many drinks are inside each category,
 *   which is a real number and is the one printed on the card.
 *
 * ONE THING WAS BUILT RATHER THAN FAKED: the activity feed. It is the panel
 * most obviously filled with invented events on a mockup, so every save now
 * appends an entry — see ACTIVITY_LIMIT in the schema. It is empty until
 * somebody saves something, which is correct and is what an empty log looks
 * like.
 */
export default async function OverviewPage() {
  const session = await requireAdmin();

  const [content, writable, saved, uploadable] = await Promise.all([
    getContent(),
    canWrite(),
    hasSaved(),
    canUpload(),
  ]);

  const gaps = isProduction ? productionGaps() : [];
  const unconfirmed = content.whoWeServe.places.filter((p) => p.placeholder);
  const unphotographed = content.menu.drinks.flatMap((drink) =>
    drink.varieties.filter((v) => !v.img).map((v) => v.name || "unnamed"),
  );
  const hiddenPages = content.seo.pages.filter((p) => p.noindex);

  /* ---------------------------------------------------------------
     THE TILES. Four, not seven — the reference has four and it is right about
     why: a row of tiles is read at a glance, and past four the glance becomes
     a scan. The rest of the counts are a click away in the sidebar.

     NO TREND LINE UNDER ANY OF THEM. See the note above.
     --------------------------------------------------------------- */
  const tiles = [
    {
      href: "/admin/menu",
      label: "Drinks on the menu",
      value: content.menu.drinks.reduce((n, d) => n + d.varieties.length, 0),
      sub: `across ${content.menu.drinks.length} categories`,
      icon: CupIcon,
      tint: "bg-emerald-50 text-emerald-700",
    },
    {
      href: "/admin/workplaces",
      label: "Kinds of workplace",
      value: content.whoWeServe.places.length,
      sub: unconfirmed.length
        ? `${unconfirmed.length} written from photographs`
        : "all confirmed",
      icon: PeopleIcon,
      tint: "bg-orange-soft text-orange-deep",
    },
    {
      href: "/admin/machines",
      label: "Machines",
      value: content.machines.machines.length,
      sub: `up to ${Math.max(
        ...content.machines.machines.map((m) => m.cap),
      )} cups a day`,
      icon: MachineIcon,
      tint: "bg-steel-pale text-steel",
    },
    {
      href: "/admin/story",
      label: "Years of story",
      value: content.story.milestones.length,
      sub: `${content.story.milestones[0]?.year} to ${
        content.story.milestones[content.story.milestones.length - 1]?.year
      }`,
      icon: TimelineIcon,
      tint: "bg-maroon/10 text-maroon",
    },
  ];

  /* ---------------------------------------------------------------
     THE RING. Parts of a whole, and they genuinely sum: every piece of
     content on the site either has been checked or has not.
     --------------------------------------------------------------- */
  const contactUntouched =
    content.contact.phoneE164 === DEFAULT_CONTENT.contact.phoneE164 &&
    content.contact.email === DEFAULT_CONTENT.contact.email;

  const drinkRows = content.menu.drinks.map((drink) => ({
    label: drink.name,
    value: drink.varieties.length,
    note:
      drink.varieties.length > 1
        ? "opens a drawer"
        : drinkCount(drink).replace(/^1 /, ""),
  }));

  const quick = [
    { href: "/admin/hero", label: "Edit the hero", icon: SparkIcon },
    { href: "/admin/menu", label: "Edit the menu", icon: CupIcon },
    { href: "/admin/posts", label: "Add a blog post", icon: DocumentIcon },
    { href: "/admin/stories", label: "Add a case study", icon: StarIcon },
  ];

  /* ---------------------------------------------------------------
     WHAT STILL NEEDS DOING — computed, never ticked. A task list a person
     maintains by hand goes stale the day after it is written.
     --------------------------------------------------------------- */
  /* EACH ONE CARRIES A SHORT NAME AS WELL AS THE SENTENCE. The list used to be
     sentences alone, which reads fine and scans badly — three paragraphs of
     similar length and colour, and finding the one about photographs means
     reading all three. The name is what the eye lands on; the sentence is the
     reason, underneath, for whoever wants it. */
  const todo: { id: string; name: string; text: string; href: string }[] = [];

  if (contactUntouched) {
    todo.push({
      id: "contact",
      href: "/admin/contact",
      name: "Contact details",
      text: "The phone number and enquiry inbox are the ones that came into the build, unchecked. They dial and send for real.",
    });
  }
  /* THE "WORKPLACE FACTS" ITEM WAS HERE AND HAS GONE, with the tick that
     cleared it. The control was removed from the Services form at the client's
     direction, so nothing can mark a line confirmed any more — and an item
     that cannot be completed is worse on this list than no item at all. It
     would have read "6 lines were written from the photographs" on every visit,
     forever, and taught the reader to skip the list it sits in. The same
     argument took the readiness ring off this page. */
  if (unphotographed.length) {
    todo.push({
      id: "photos",
      href: "/admin/menu",
      name: "Drink photographs",
      text: `${unphotographed.length} drink${
        unphotographed.length === 1 ? "" : "s"
      } show a drawn glass instead of a picture.`,
    });
  }
  if (content.seo.noindexAll) {
    todo.push({
      id: "noindex-all",
      href: "/admin/seo",
      name: "Hidden from search",
      text: "The whole site is closed to search engines. Right before launch, wrong after it.",
    });
  } else if (hiddenPages.length) {
    todo.push({
      id: "noindex-pages",
      href: "/admin/seo",
      name: "Two pages held back",
      text: `${hiddenPages.map((p) => p.path).join(" and ")} are kept out of search while they are stubs.`,
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Greeting name={session.sub.split("@")[0]} />
        </div>

        {/* THE ONE PROMOTIONAL-LOOKING THING ON THE PAGE, and it promotes the
            site rather than a product: the reference's top-right card is an
            advert, and the nearest honest equivalent is the way out to look at
            what you just edited. */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2.5 rounded-full bg-espresso px-5 py-2.5 text-[0.9rem] font-semibold text-cream transition hover:bg-espresso-deep"
        >
          <ExternalIcon className="size-4" />
          View the live site
        </Link>
      </header>

      {!writable ? (
        <Notice tone="warn">
          This server cannot save changes — its files are read-only, which is
          normal on Vercel and Netlify. Your edits will be rejected, not lost
          quietly.
        </Notice>
      ) : !saved ? (
        <Notice tone="note">
          Nothing has been saved yet, so the site is showing its built-in
          wording.
        </Notice>
      ) : null}

      {writable && !uploadable ? (
        <Notice tone="warn">
          Pictures cannot be uploaded — this server has nowhere to put them.
        </Notice>
      ) : null}

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

      {/* ── THE TILES ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="group rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-[var(--shadow-1)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-2)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
            >
              <span
                className={`mb-4 grid size-11 place-items-center rounded-xl ${tile.tint}`}
              >
                <Icon className="size-[22px]" />
              </span>
              <span className="block text-[0.85rem] font-semibold text-ink-soft">
                {tile.label}
              </span>
              <span className="mt-1.5 block text-[1.9rem] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
                {tile.value}
              </span>
              <span className="mt-2 block truncate text-[0.8rem] text-mute">
                {tile.sub}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── THE ONE CHART ─────────────────────────────────────
          THERE WAS A SECOND ONE HERE AND IT HAS GONE. A ring splitting the
          site's content into "confirmed" and "still to confirm" — a percentage
          of readiness. It was removed because the person using this panel could
          not tell what it was for after two explanations, which is the only
          test that matters for a chart.

          IT WAS ALSO REDUNDANT, which is the reason it failed that test. "Still
          to do" below lists the same items as sentences, each naming the thing
          and linking to the screen that clears it — strictly more useful than
          a number, because a number cannot be acted on. The ring existed
          because the dashboard it was modelled on had a ring, and that is not
          a reason. */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div>
          <Card
            title="Drinks in each category"
            note="Counted from the list, not typed. More than one drink and the card opens a drawer."
          >
            <BarRows rows={drinkRows} />
          </Card>
        </div>

        {/* BESIDE THE CHART RATHER THAN UNDER THE QUICK ACTIONS, which is where
            it sat when the ring was here. It is the only thing on this page
            that asks for something to be done, so it belongs in the half of the
            screen a reader reaches second rather than at the foot of a
            column. */}
        <div>
          {/* WHOLE ROWS ARE THE LINK, not a "Fix it" at the end of a sentence.
              The old shape put a 5-character target at the end of a wrapping
              paragraph — so its position moved with the text, and on a narrow
              screen it landed alone on its own line away from the thing it
              acted on. A row is the full width of the card, cannot move, and
              is the size of the thing it represents.

              NUMBERED, AND THE NUMBER IS NOT A PRIORITY. The order is the
              order they are pushed above — contact, facts, photographs, search
              — which is roughly how load-bearing each one is, but nothing
              reads it as a ranking and nothing should. It is a count made
              visible: four rows with a 4 on the last is a finite list, which is
              the thing that makes a list get finished. */}
          <Card
            title="Still to do"
            aside={
              todo.length ? (
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-amber-800 tabular-nums">
                  {todo.length} left
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-emerald-800">
                  <CheckIcon className="size-3.5" />
                  All clear
                </span>
              )
            }
            note={
              todo.length === 0
                ? undefined
                : "Each one disappears once it is done."
            }
          >
            {todo.length === 0 ? (
              <p className="text-[0.875rem] leading-relaxed text-ink-soft">
                Nothing outstanding that this panel can see.
              </p>
            ) : (
              <ol className="space-y-2.5">
                {todo.map((item, i) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-line bg-cream/40 py-3 pl-4 pr-3 transition duration-200 hover:border-amber-400/60 hover:bg-white hover:shadow-[var(--shadow-1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange/20"
                    >
                      {/* The stripe is the colour signal and it is also a
                          SHAPE that grows — colour alone is not a signal every
                          reader receives, and a 3px bar going to 4px is felt
                          rather than read. */}
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px] bg-amber-400 transition-[width] duration-200 group-hover:w-[5px]"
                      />
                      <span
                        aria-hidden
                        className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-[0.72rem] font-extrabold tabular-nums text-amber-800 transition group-hover:bg-amber-200"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.85rem] font-bold leading-tight text-ink">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-[0.8rem] leading-snug text-ink-soft">
                          {item.text}
                        </span>
                      </span>
                      <ChevronRightIcon className="size-4 shrink-0 text-mute transition duration-200 group-hover:translate-x-0.5 group-hover:text-orange-deep" />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      {/* ── ACTIVITY, QUICK ACTIONS, TO DO ────────────────────── */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Today"
            note="What has been saved today, newest first."
          >
            {/* THE FILTERING AND THE EMPTY STATE BOTH LIVE IN THE CHILD, and
                they have to: "today" is a question only the reader's clock can
                answer, and this is a server component. The card's own note is
                safe to write here because it names no date. */}
            <TodayActivity entries={content.activity} />
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Quick actions">
            <ul className="space-y-1.5">
              {quick.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-[0.875rem] font-semibold text-ink-soft transition hover:border-orange/40 hover:bg-cream hover:text-espresso"
                    >
                      <Icon className="size-[18px] shrink-0 text-orange-deep" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

        </div>
      </div>
    </div>
  );
}
