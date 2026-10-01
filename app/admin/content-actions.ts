"use server";

/**
 * The ten save actions.
 *
 * EVERY ONE OF THEM STARTS WITH requireAdmin(). A "use server" export is an
 * HTTP endpoint that anyone who has read the client bundle can find and POST
 * to — the fact that the only link to it sits behind a login is worth nothing,
 * and neither is proxy.ts, which does not run for a Server Action invocation
 * the way it does for a navigation. The session check has to be in the function
 * that touches the data.
 *
 *   MOST OF THEM GET IT FROM `commit`, which is the only thing here that writes
 *   and which checks before it does. saveHeroAction and saveMenuAction call it
 *   THEMSELVES and first, because both read the stored section before
 *   validating — they need the existing slides and drinks to fall back on — and
 *   a read before the check is a read an unauthenticated POST can cause.
 *   Nothing secret comes back either way, and "the check is the first line" is
 *   worth more as a rule with no exceptions than as a rule with two defensible
 *   ones.
 *
 * EVERY ONE OF THEM ENDS WITH revalidatePath("/", "layout"). The pages that
 * display this content are static: the home page, the four section pages, and
 * Header and Footer inside the root layout. Without a revalidation an edit lands
 * in content.json and the visitor keeps seeing the build-time render — the panel
 * would appear to save and change nothing, which is the worst failure available
 * because it looks like success. "layout" at "/" invalidates the root layout,
 * every nested layout beneath it and every page under those, which is precisely
 * the set that reads this data.
 *
 * WHY WHOLE-SLICE SAVES RATHER THAN FIELD PATCHES. Each form posts its entire
 * section and the action replaces that key outright. It means a save is
 * idempotent and the stored object always has exactly the shape the schema
 * describes, and it means the panel never has to reason about which subset of a
 * form the operator actually touched.
 */

import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/content/html";
import { requireAdmin } from "@/lib/admin/session";
import { getContent, saveContent } from "@/lib/content/store";
import { validateJsonLd } from "@/lib/content/jsonld";
import {
  ACTIVITY_LIMIT,
  DEFAULT_CONTENT,
  parseContent,
  type CaseContent,
  type DrinkContent,
  type HeroButton,
  type HeroGround,
  type PostContent,
  type SiteContent,
  type HeroSlideContent,
  type MachineContent,
  type MilestoneContent,
  type StoryIcon,
  STORY_ICONS,
  type SeoPage,
  type VarietyContent,
  type WorkplaceContent,
  type SocialKey,
} from "@/lib/content/schema";

export type SaveState =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | undefined;

const SOCIAL_KEYS: SocialKey[] = ["instagram", "facebook", "youtube"];

/* ---------------------------------------------------------------
   Shared plumbing. `commit` is the only place that writes, so the session
   check, the revalidation and the one honest error message all live once.
   --------------------------------------------------------------- */

async function commit(
  mutate: (draft: SiteContent) => void,
  message: string,
  /** which editor this came from, for the activity log */
  section: string,
): Promise<SaveState> {
  await requireAdmin();

  const current = await getContent();
  const draft = structuredClone(current);
  mutate(draft);

  /* THE LOG IS WRITTEN HERE AND NOWHERE ELSE, for the same reason the
     revalidation is: this is the only path that writes. An action that
     remembered to log for itself would eventually be an action that forgot. */
  draft.activity = [
    { at: new Date().toISOString(), section, summary: message },
    ...draft.activity,
  ].slice(0, ACTIVITY_LIMIT);

  try {
    /* THROUGH parseContent ON THE WAY OUT, not just on the way in. It is the
       one definition of a valid document, and running it here means a bug in a
       form handler cannot write a shape the readers do not expect. */
    await saveContent(parseContent(draft));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    /* THE READ-ONLY FILESYSTEM CASE, NAMED. On a serverless host this is the
       failure every save will hit, and "Something went wrong" would send an
       operator hunting through their own input for a mistake that is not
       there. See the banner in lib/content/store.ts. */
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      return {
        ok: false,
        message:
          "Could not save — this server's files are read-only. Saving needs a host with a disk it can write to.",
      };
    }
    console.error("[admin] save failed:", err);
    return { ok: false, message: "Could not save. Try again, and tell the developer if it keeps happening." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message };
}

const text = (fd: FormData, name: string): string =>
  String(fd.get(name) ?? "").trim();

/* ---------------------------------------------------------------
   THE HERO

   ONE ACTION FOR ALL THREE SLIDES, because they are one screen. A visitor sees
   them as a single hero that changes its mind twice, so an editor rewriting the
   argument is rewriting all of it — three separate forms would let slide two
   contradict slide three and only find out on the live page.

   THE FIELDS ARE NAMED BY SLIDE, not posted as parallel arrays the way the
   repeaters are. The repeaters' trick works because every row is identical; the
   flask slide has no photograph and no ground, and its accent is one string
   rather than a list, so there are no columns to zip. Explicit names it is.
   --------------------------------------------------------------- */

/** Headline lines arrive as a textarea, one line each — which is exactly what
    they are on screen, and a good deal more obvious than three numbered fields
    for something the operator is reading as a block. */
const linesOf = (fd: FormData, name: string): string[] =>
  String(fd.get(name) ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const buttonOf = (
  fd: FormData,
  prefix: string,
  fallback: HeroButton,
): HeroButton => ({
  label: text(fd, `${prefix}_label`) || fallback.label,
  href: text(fd, `${prefix}_href`) || fallback.href,
});

export async function saveHeroAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* FIRST LINE, before the read below — see the note at the top of this file.
     commit() checks again; this one is here because this action touches the
     store before it ever reaches commit. */
  await requireAdmin();

  const current = await getContent();
  const d = current.hero;

  const flaskLines = linesOf(formData, "flask_lines");
  if (flaskLines.length === 0) {
    return { ok: false, message: "The first slide needs at least one headline line." };
  }
  const flaskSubject = text(formData, "flask_subject");
  const flaskPoster = text(formData, "flask_poster");
  if (!flaskSubject.startsWith("/") || !flaskPoster.startsWith("/")) {
    return {
      ok: false,
      message:
        "The first slide needs both of its pictures — the cut-out and the still.",
    };
  }

  /* ── THE STEAM ORIGIN IS NO LONGER ON THE FORM ────────────────────────
     The two fields were removed from HeroForm at the client's direction, but
     the VALUES still drive the page — LiquidSurface starts the plume at them,
     so they are two real numbers that simply have no editor any more.

     WHICH MAKES THIS THE DANGEROUS HALF OF THAT CHANGE. `text()` on an absent
     field returns "", and `Number("")` is 0 — not NaN. Zero passes every
     bound below, so without this fallback the first save after removing the
     fields would quietly write { u: 0, v: 0 } and move the plume to the top
     left corner of the flask on the live home page. Nothing would report an
     error, because nothing was invalid.

     So a missing field now means "keep what is stored" rather than "zero".
     The bounds still run for the case where the fields come back. */
  const hasSteam =
    formData.has("flask_steam_u") && formData.has("flask_steam_v");
  /* Validated here rather than trusted, for the reason the slides' one is:
     a malformed colour is pasted into a style and CSS drops the declaration,
     leaving the slide with no ground at all. */
  const flaskHex = text(formData, "flask_groundHex").trim().toUpperCase();
  if (flaskHex && !/^#[0-9A-F]{6}$/.test(flaskHex)) {
    return {
      ok: false,
      message:
        "Slide 1: the background colour must be six hex digits after a #, like #240A06 — or empty to use one of the two presets.",
    };
  }

  const steamU = hasSteam
    ? Number(text(formData, "flask_steam_u"))
    : d.flask.steam.u * 100;
  const steamV = hasSteam
    ? Number(text(formData, "flask_steam_v"))
    : d.flask.steam.v * 100;
  if (
    !Number.isFinite(steamU) ||
    !Number.isFinite(steamV) ||
    steamU < 0 ||
    steamU > 100 ||
    steamV < 0 ||
    steamV > 100
  ) {
    return {
      ok: false,
      message:
        "The steam origin is two percentages of the picture, each between 0 and 100.",
    };
  }

  const flaskAccent = linesOf(formData, "flask_accent");
  if (flaskAccent.length === 0) {
    return {
      ok: false,
      message:
        "The first slide's poured word cannot be empty. It is the last line of the headline.",
    };
  }

  /* THE SLIDES BELOW THE FIRST ONE. Their count comes from the form, because
     they can be added and removed; slide one is the WebGL scene and is not in
     this list, which is why every message below says `i + 2`. */
  const count = Number(text(formData, "slideCount"));
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    return {
      ok: false,
      message: "Keep between one and six slides after the opening one.",
    };
  }

  const slides: HeroSlideContent[] = [];
  for (let i = 0; i < count; i++) {
    const fallback = d.slides[i] ?? d.slides[0];
    const heads = linesOf(formData, `slide${i}_lines`);
    const accent = linesOf(formData, `slide${i}_accent`);
    const src = text(formData, `slide${i}_src`);
    const alt = text(formData, `slide${i}_alt`);
    const bg = text(formData, `slide${i}_bg`);
    const groundHex = text(formData, `slide${i}_groundHex`).trim().toUpperCase();

    if (heads.length === 0) {
      return { ok: false, message: `Slide ${i + 2} needs at least one headline line.` };
    }
    if (accent.length === 0) {
      return {
        ok: false,
        message: `Slide ${i + 2} needs at least one accent line — the orange half of the headline.`,
      };
    }
    if (!src.startsWith("/")) {
      return {
        ok: false,
        message: `Slide ${i + 2}: the photograph must be a path like /img/hero-slide-machine.webp.`,
      };
    }
    if (!alt) {
      return {
        ok: false,
        message: `Slide ${i + 2} has no picture description. Describe what is in the picture.`,
      };
    }
    /* EMPTY IS ALLOWED AND IS THE NORMAL ANSWER — no background picture means
       the ground gradient alone, which is how both shipped slides look. Only a
       non-empty value has to be a real path. */
    if (bg && !bg.startsWith("/")) {
      return {
        ok: false,
        message: `Slide ${i + 2}: the background must be a path like /img/hero-bg.webp, or empty.`,
      };
    }

    /* EMPTY MEANS "USE THE PRESET" and is the normal answer. Only a non-empty
       value has to be a colour — and it has to be a real one, because it goes
       into a gradient string where CSS discards the entire declaration on a
       malformed stop and the slide would render with no ground at all. */
    if (groundHex && !/^#[0-9A-F]{6}$/.test(groundHex)) {
      return {
        ok: false,
        message: `Slide ${i + 2}: the background colour must be six hex digits after a #, like #F5DEC6 — or empty to use one of the two presets.`,
      };
    }

    const g = text(formData, `slide${i}_ground`);
    const ground: HeroGround =
      g === "warm" || g === "cool" ? g : fallback.ground;

    slides.push({
      id: text(formData, `slide${i}_id`) || fallback.id,
      lines: heads,
      accent,
      sub: text(formData, `slide${i}_sub`) || fallback.sub,
      primary: buttonOf(formData, `slide${i}_primary`, fallback.primary),
      secondary: buttonOf(formData, `slide${i}_secondary`, fallback.secondary),
      ground,
      bg,
      groundHex,
      /* THE CONTROL BECAME A PAIR OF RADIOS and this had to follow. It read
         `=== "on"`, which is what an unchecked CHECKBOX not posting at all
         looks like; a radio always posts one of its two values, so the test
         is now against the value itself. Left is the stored `flip`. */
      flip: text(formData, `slide${i}_flip`) === "left",
      image: { src, alt },
    });
  }

  return commit((draft) => {
    draft.hero = {
      flask: {
        subject: flaskSubject,
        poster: flaskPoster,
        /* TYPED AS A PERCENTAGE, STORED AS A FRACTION — the canvas consumes
           0.27, and "27" is how a person reads a position off a picture. */
        steam: { u: steamU / 100, v: steamV / 100 },
        lines: flaskLines,
        accent: flaskAccent,
        /* The same three the other slides take, read the same way. */
        ground: text(formData, "flask_ground") === "roast" ? "roast" : "deep",
        flip: text(formData, "flask_flip") === "left",
        groundHex: flaskHex,
        alt: text(formData, "flask_alt"),
        sub: text(formData, "flask_sub") || d.flask.sub,
        primary: buttonOf(formData, "flask_primary", d.flask.primary),
        secondary: buttonOf(formData, "flask_secondary", d.flask.secondary),
      },
      slides,
    };
  }, "Hero saved. All three slides now use this copy.", "Hero");
}

/* ---------------------------------------------------------------
   SECTION 02 — THE MENU

   THE DRINK COUNT COMES FROM THE FORM, unlike the hero's slide count. Drinks
   can be added and removed, so the loop below runs over what was posted rather
   than over what is stored.

   HOW MANY WERE POSTED IS ITS OWN HIDDEN FIELD rather than something counted
   off the keys. The obvious alternative — the parallel-array trick the blog and
   case-study repeaters use, where `getAll("name")` returns one value per row —
   does not survive a CHECKBOX. An unchecked box posts nothing at all, so the
   steam column would come back shorter than the others and every drink after
   the first unchecked one would take its neighbour's values. The repeaters get
   away with it because every field in them is a text input; this form has two
   booleans, so it uses indexed names and is told how many to read.

   THE INDICES ARE ALWAYS CONTIGUOUS because the form renders them from client
   state: removing the second of four re-renders three fields numbered 0, 1, 2.
   Nothing here has to cope with a gap, and nothing here should try — a gap
   would mean the form had a bug worth finding rather than working around.

   THE NUMBERS ARE VALIDATED HERE AND CLAMPED IN THE SCHEMA, which is belt and
   braces on purpose. This gives the operator a message naming the field they
   got wrong; parseContent's clamp is the guarantee that whatever reaches the
   renderer is in range however it got there.
   --------------------------------------------------------------- */

export async function saveMenuAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* First line, before the read — same reasoning as saveHeroAction. */
  await requireAdmin();

  const d = (await getContent()).menu;

  const headline = text(formData, "headline");
  const headlineAccent = text(formData, "headlineAccent");
  if (!headline || !headlineAccent) {
    return {
      ok: false,
      message:
        "Both headline lines are needed — the second is the orange one.",
    };
  }

  /* Bounded on both sides. The floor is the real rule — a menu section with no
     drinks renders a sentence that names none and a row with nothing in it. The
     ceiling is a sanity bound on a crafted POST rather than a design limit; the
     form does not offer a ninth. */
  const count = Number(text(formData, "drinkCount"));
  if (!Number.isInteger(count) || count < 1 || count > 8) {
    return {
      ok: false,
      message: "Keep between one and eight drinks.",
    };
  }

  const drinks: DrinkContent[] = [];
  for (let i = 0; i < count; i++) {
    /* The i-th stored drink where there is one — a newly added drink has no
       counterpart, so its untouched fields fall back to the first drink's,
       which are a working card rather than nothing. */
    const fallback = d.drinks[i] ?? d.drinks[0];
    const name = text(formData, `drink${i}_name`);
    const noun = text(formData, `drink${i}_noun`);
    const label = text(formData, `drink${i}_label`);
    const img = text(formData, `drink${i}_img`);
    const alt = text(formData, `drink${i}_alt`);
    const wash = text(formData, `drink${i}_wash`).toUpperCase();

    if (!name) {
      return { ok: false, message: `Drink ${i + 1} has no name.` };
    }
    if (!noun) {
      return {
        ok: false,
        message: `${name} has no noun — the word the count is said in, as in "2 specials". Write it plural; the card drops the "s" when there is only one.`,
      };
    }
    if (!label) {
      return {
        ok: false,
        message: `Drink ${i + 1} has no sentence name — the word that lights orange in the line above the row.`,
      };
    }
    if (!img.startsWith("/")) {
      return {
        ok: false,
        message: `Drink ${i + 1}: the photograph must be a path like /img/menu-tea.webp.`,
      };
    }
    if (!alt) {
      return {
        ok: false,
        message: `Drink ${i + 1} has no picture description. Describe what is in the glass rather than naming the drink.`,
      };
    }
    if (!/^#[0-9A-F]{6}$/.test(wash)) {
      return {
        ok: false,
        message: `Drink ${i + 1}: the glow must be a six-digit hex colour, like #E5A863.`,
      };
    }

    /* THE DRINKS INSIDE THIS CATEGORY. Their number is what prints on the card
       — "2 specials" is the length of this list, not a string anyone types — so
       an empty one would render "0 specials" and open an empty drawer. */
    const vCount = Number(text(formData, `drink${i}_varietyCount`));
    if (!Number.isInteger(vCount) || vCount < 1 || vCount > 12) {
      return {
        ok: false,
        message: `${name} needs between one and twelve drinks inside it.`,
      };
    }

    const varieties: VarietyContent[] = [];
    for (let j = 0; j < vCount; j++) {
      const vName = text(formData, `drink${i}_v${j}_name`);
      const vImg = text(formData, `drink${i}_v${j}_img`);
      const vTint = text(formData, `drink${i}_v${j}_tint`).toUpperCase();

      if (!vName) {
        return {
          ok: false,
          message: `${name}: drink ${j + 1} inside it has no name.`,
        };
      }
      /* THE PHOTOGRAPH IS OPTIONAL HERE, unlike the category's own plate. A
         variety with no picture draws a tumbler in its tint instead — a
         stand-in that does not pretend to be a photograph — which is how a
         drink can be listed before it has been shot. It still has to be a
         path if it is anything. */
      if (vImg && !vImg.startsWith("/")) {
        return {
          ok: false,
          message: `${name}: drink ${j + 1}'s photograph must be a path like /img/name.webp, or empty.`,
        };
      }
      if (!/^#[0-9A-F]{6}$/.test(vTint)) {
        return {
          ok: false,
          message: `${name}: drink ${j + 1} needs a six-digit hex colour, like #E5A863.`,
        };
      }

      varieties.push({
        name: vName,
        img: vImg,
        cover: formData.get(`drink${i}_v${j}_cover`) === "on",
        tint: vTint,
      });
    }

    /* ── THE THREE PLACEMENT NUMBERS ARE NO LONGER ON THE FORM ──────────
       rim, cx and mouth position the steam and the glow pool against the
       photograph. The panel that edited them was removed at the client's
       direction; the VALUES still drive the page, so they are three real
       numbers with no editor.

       WHICH MAKES THIS THE DANGEROUS HALF. `text()` on an absent field
       returns "" and `Number("")` is 0 — not NaN — so every bound below
       passes and the first save would quietly write 0/0/0: the glow pool
       pinned to the left edge of every card and the plume off the frame.
       Nothing would report an error, because nothing was invalid.

       MATCHED BY KEY, NOT BY INDEX. `fallback` above is d.drinks[i], and its
       own comment records why that is not safe — after an insert or a delete
       index 2 holds what used to be index 3. Inheriting the wrong drink's
       measurements is exactly the silent failure this fallback exists to
       avoid, so it finds the drink the form says it is. */
    const priorKey = text(formData, `drink${i}_key`);
    const prior = d.drinks.find((x) => x.key && x.key === priorKey);

    const nums: Record<string, number> = {};
    for (const field of ["rim", "cx", "mouth"] as const) {
      if (!formData.has(`drink${i}_${field}`)) {
        nums[field] = prior?.[field] ?? fallback[field];
        continue;
      }
      const n = Number(text(formData, `drink${i}_${field}`));
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return {
          ok: false,
          message: `Drink ${i + 1}: ${field} must be between 0 and 100. It is a percentage of the picture.`,
        };
      }
      nums[field] = n;
    }

    drinks.push({
      /* POSTED, NOT TAKEN FROM THE STORED DRINK AT THIS INDEX — after an
         insert or a delete those no longer line up, and index 2 may now hold
         what was index 3. The form carries each drink's key with it.

         AN EMPTY ONE IS PASSED STRAIGHT THROUGH rather than falling back to
         `fallback.key`, which would hand a newly added drink the key of
         whichever old drink happens to sit at its index. parseContent derives
         the slug from the name when this is blank, and de-duplicates. */
      key: text(formData, `drink${i}_key`),
      name,
      noun,
      varieties,
      img,
      alt,
      label,
      /* NOT trimmed, unlike everything else on this form. The separator is
         mostly whitespace — ", " and " and " — and trimming it would run every
         drink's name straight into the next one. */
      separator: String(formData.get(`drink${i}_separator`) ?? fallback.separator),
      wash,
      rim: nums.rim,
      cx: nums.cx,
      mouth: nums.mouth,
      steam: formData.get(`drink${i}_steam`) === "on",
    });
  }

  return commit((draft) => {
    draft.menu = {
      eyebrow: text(formData, "eyebrow") || d.eyebrow,
      headline,
      headlineAccent,
      tail: text(formData, "tail") || d.tail,
      drinks,
    };
  }, `${drinks.length} drink${drinks.length === 1 ? "" : "s"} saved. Check the row on the home page — the steam sits where the numbers say it does.`, "Menu");
}

/* ---------------------------------------------------------------
   SECTIONS 05 AND 06 — THE MACHINES

   ONE ACTION FOR BOTH SECTIONS, because there is one list and both read it.
   Section 06 prints the bands on its cards, section 05's calculator picks a
   unit by comparing cups against each `cap`, and /machines does both. Editing
   them apart is what the three copies of this list used to allow.

   THE BANDS ARE CHECKED AGAINST EACH OTHER, not only one at a time. A set where
   the second unit's floor is below the first's ceiling is not a validation
   error in any single field and is nonsense on the page — two cards claiming
   the same office, and a calculator that hands it to whichever comes first in
   the array.
   --------------------------------------------------------------- */

export async function saveMachinesAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* First line, before the read — see the note at the top of this file. */
  await requireAdmin();

  const d = (await getContent()).machines;

  const headline = text(formData, "m_headline");
  const headlineAccent = text(formData, "m_headlineAccent");
  if (!headline || !headlineAccent) {
    return {
      ok: false,
      message:
        "Both halves of the headline are needed — the orange one comes first.",
    };
  }

  const count = Number(text(formData, "machineCount"));
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    return { ok: false, message: "Keep between one and six machines." };
  }

  const machines: MachineContent[] = [];
  for (let i = 0; i < count; i++) {
    const fallback = d.machines[i] ?? d.machines[0];
    const src = text(formData, `machine${i}_src`);
    const cap = Number(text(formData, `machine${i}_cap`));
    const rawFrom = text(formData, `machine${i}_from`);

    if (!src.startsWith("/")) {
      return {
        ok: false,
        message: `Machine ${i + 1}: the photograph must be a path like /img/name.webp.`,
      };
    }
    if (!Number.isInteger(cap) || cap < 1) {
      return {
        ok: false,
        message: `Machine ${i + 1}: the most cups a day must be a whole number.`,
      };
    }

    /* EMPTY MEANS NULL MEANS "<". The smallest unit has no floor, and that is
       what prints the "less than" in front of its ceiling — so a blank field is
       a real answer here rather than a missing one. */
    let from: number | null = null;
    if (rawFrom !== "") {
      const n = Number(rawFrom);
      if (!Number.isInteger(n) || n < 0) {
        return {
          ok: false,
          message: `Machine ${i + 1}: the fewest cups a day must be a whole number, or empty on the smallest unit.`,
        };
      }
      from = n;
    }

    if (from !== null && from >= cap) {
      return {
        ok: false,
        message: `Machine ${i + 1} runs from ${from} to ${cap}, which is backwards.`,
      };
    }

    const aspect = Number(text(formData, `machine${i}_aspect`));
    if (!Number.isFinite(aspect) || aspect <= 0) {
      return {
        ok: false,
        message: `Machine ${i + 1}: the picture's shape could not be read. Upload it again.`,
      };
    }

    machines.push({
      key: text(formData, `machine${i}_key`) || fallback.key,
      src,
      from,
      cap,
      aspect,
    });
  }

  /* THE BANDS MUST CLIMB. Read in order, each unit's floor should meet the one
     below it — the cards are a row of increasing capacity and the calculator
     walks them in order, taking the first whose ceiling covers the office. Out
     of order, a bigger machine sitting earlier in the list would swallow
     offices the smaller one was meant to get. */
  for (let i = 1; i < machines.length; i++) {
    if (machines[i].cap <= machines[i - 1].cap) {
      return {
        ok: false,
        message: `Machine ${i + 1} tops out at ${machines[i].cap}, which is not above machine ${i}'s ${machines[i - 1].cap}. Units run smallest to largest.`,
      };
    }
  }

  return commit((draft) => {
    draft.machines = {
      eyebrow: text(formData, "m_eyebrow") || d.eyebrow,
      headlineAccent,
      headline,
      sub: text(formData, "m_sub") || d.sub,
      machines,
    };
  }, `${machines.length} machine${machines.length === 1 ? "" : "s"} saved. The same list feeds section 06, the calculator in section 05 and the machines page.`, "Machines");
}

/* ---------------------------------------------------------------
   SECTION 08 — THE STORY

   WHAT IS NOT ON THIS FORM: the headline's first line and the year range under
   it. Both are counted off the stops — "Seven years." and "2019 – 2026" — and
   both used to be typed out by hand directly above the list that said them.
   There is nothing to validate because there is nothing to type.

   THE BULLETS AND THE BODY ARE ALTERNATIVES. A stop says its piece as a
   paragraph or as a list, never both: 2026 is the only one with bullets, and it
   has them because it makes four claims at once. Accepting both would give a
   stop a paragraph followed by a list saying the same thing.
   --------------------------------------------------------------- */

export async function saveStoryAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* First line, before the read — see the note at the top of this file. */
  await requireAdmin();

  const d = (await getContent()).story;

  const count = Number(text(formData, "stopCount"));
  if (!Number.isInteger(count) || count < 1 || count > 14) {
    return { ok: false, message: "Keep between one and fourteen stops." };
  }

  const milestones: MilestoneContent[] = [];
  for (let i = 0; i < count; i++) {
    const fallback = d.milestones[i] ?? d.milestones[0];
    const year = text(formData, `stop${i}_year`);
    const title = text(formData, `stop${i}_title`);
    const caption = text(formData, `stop${i}_caption`);
    const img = text(formData, `stop${i}_img`);
    const body = text(formData, `stop${i}_body`);
    const bullets = linesOf(formData, `stop${i}_bullets`);

    if (!/^\d{4}$/.test(year)) {
      return {
        ok: false,
        message: `Stop ${i + 1}: the year must be four digits.`,
      };
    }
    if (!title) {
      return { ok: false, message: `Stop ${i + 1} (${year}) has no title.` };
    }
    if (!caption) {
      return {
        ok: false,
        message: `Stop ${i + 1} (${year}) has no caption — the line under its icon on the rail.`,
      };
    }
    if (!img.startsWith("/")) {
      return {
        ok: false,
        message: `Stop ${i + 1} (${year}): the photograph must be a path like /img/name.webp.`,
      };
    }
    if (!body && bullets.length === 0) {
      return {
        ok: false,
        message: `Stop ${i + 1} (${year}) says nothing — give it a paragraph or some bullets.`,
      };
    }
    if (body && bullets.length > 0) {
      return {
        ok: false,
        message: `Stop ${i + 1} (${year}) has both a paragraph and bullets. Clear the one you do not want.`,
      };
    }

    const icon = text(formData, `stop${i}_icon`);

    milestones.push({
      key: text(formData, `stop${i}_key`) || fallback.key,
      year,
      span: text(formData, `stop${i}_span`),
      title,
      body,
      bullets,
      caption,
      /* A NAME THE RAIL CAN DRAW. The form is a select, so this can only be
         wrong if the POST was crafted — and an unknown name would leave a gap
         under that stop with nothing to say why. */
      icon: STORY_ICONS.includes(icon as StoryIcon)
        ? (icon as StoryIcon)
        : fallback.icon,
      img,
    });
  }

  /* THE YEARS MUST CLIMB. The rail is a line left to right and the numeral
     counts up as a visitor scrolls; a stop out of order makes the story go
     backwards. The section's own notes record catching exactly this in the
     client's sheet, which listed 2024 twice. */
  for (let i = 1; i < milestones.length; i++) {
    if (Number(milestones[i].year) <= Number(milestones[i - 1].year)) {
      return {
        ok: false,
        message: `${milestones[i].year} comes after ${milestones[i - 1].year} on the rail but is not a later year. Stops run oldest first, and no year twice.`,
      };
    }
  }

  return commit((draft) => {
    draft.story = {
      eyebrow: text(formData, "s_eyebrow") || d.eyebrow,
      headlineLead: text(formData, "s_headlineLead") || d.headlineLead,
      headlineAccent: text(formData, "s_headlineAccent") || d.headlineAccent,
      milestones,
    };
  }, `${milestones.length} stops saved. The headline and the year range under it are counted from them.`, "Story");
}

/* ---------------------------------------------------------------
   SECTION 04 AND /who-we-serve — THE WORKPLACES

   NEITHER COUNT IS ON THE FORM. "The seven" and "Seven kinds of workplace" are
   both counted off this list; the page shipped saying "six" over seven cards
   because they were typed. There is nothing to validate because there is
   nothing to type.

   `placeholder` IS NOT A STYLE FLAG. It marks a fact line as invented rather
   than confirmed — six of the seven are — and it is what lets the site stop
   publishing the unconfirmed ones without anyone keeping the list in their
   head.
   --------------------------------------------------------------- */

export async function saveWhoWeServeAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* First line, before the read — see the note at the top of this file. */
  await requireAdmin();

  const d = (await getContent()).whoWeServe;

  const count = Number(text(formData, "placeCount"));
  if (!Number.isInteger(count) || count < 1 || count > 12) {
    return { ok: false, message: "Keep between one and twelve workplaces." };
  }

  const places: WorkplaceContent[] = [];
  for (let i = 0; i < count; i++) {
    const fallback = d.places[i] ?? d.places[0];
    const name = text(formData, `place${i}_name`);
    const src = text(formData, `place${i}_src`);
    const caption = text(formData, `place${i}_caption`);
    const fact = text(formData, `place${i}_fact`);
    const forPhrase = text(formData, `place${i}_forPhrase`);
    const askPhrase = text(formData, `place${i}_askPhrase`);

    if (!name) {
      return { ok: false, message: `Workplace ${i + 1} has no name.` };
    }
    if (!src.startsWith("/")) {
      return {
        ok: false,
        message: `${name}: the photograph must be a path like /img/name.webp.`,
      };
    }
    if (!caption) {
      return {
        ok: false,
        message: `${name} has no timing line — the short phrase under the picture.`,
      };
    }
    /* NO LONGER REQUIRED. Nothing renders the fact line any more, so
       refusing a save over an empty one would be this form insisting on
       content the site does not use. It is still carried through below so a
       stored sentence is not thrown away by a save. */
    if (!forPhrase || !askPhrase) {
      return {
        ok: false,
        message: `${name} needs both phrases — one finishes “Get pricing for …”, the other goes into the email and the WhatsApp message.`,
      };
    }

    const key = text(formData, `place${i}_key`) || fallback.key;

    places.push({
      key,
      name,
      src,
      caption,
      fact,
      /* NOT `=== "on"` ANY MORE. The tick was removed from the form, and an
         absent checkbox is indistinguishable from an unticked one — so that
         test would have written `false` for every workplace on the next save,
         silently promoting six invented lines to client-confirmed facts.

         MATCHED BY KEY, NOT BY INDEX, for the reason the drinks' placement
         numbers are: after an insert or a delete, index 3 holds what used to
         be index 4, and inheriting the wrong workplace's flag is the same
         silent failure in a different row. */
      placeholder: formData.has(`place${i}_placeholder`)
        ? formData.get(`place${i}_placeholder`) === "on"
        : (d.places.find((p) => p.key && p.key === key)?.placeholder ??
          fallback.placeholder),
      forPhrase,
      askPhrase,
    });
  }

  return commit((draft) => {
    draft.whoWeServe = {
      eyebrowLead: text(formData, "w_eyebrowLead") || d.eyebrowLead,
      headlineTail: text(formData, "w_headlineTail") || d.headlineTail,
      sub: text(formData, "w_sub") || d.sub,
      places,
    };
  }, `${places.length} workplaces saved. The headline and the eyebrow count them.`, "Services");
}

/* ---------------------------------------------------------------
   SYSTEM SETTINGS — THE ONE FIELD ON THAT PAGE THAT IS A SETTING.

   Everything else on it is a FACT about the deployment, decided by the host and
   by environment variables: where the content file is, whether the disk accepts
   writes, which credential is in force. This is the exception — the site's own
   address, which the code genuinely cannot work out for itself, because the host
   a request arrives on is not the host anyone should publish.
   --------------------------------------------------------------- */

export async function saveSiteUrlAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  const raw = text(formData, "siteUrl").replace(/\/+$/, "");

  /* EMPTY IS ALLOWED AND MEANS "not decided yet" — the sitemap returns nothing
     and robots.txt stops advertising one, which is the honest state before a
     domain is confirmed. */
  if (raw) {
    if (!/^https?:\/\/[^\s/?#]+$/i.test(raw)) {
      return {
        ok: false,
        message:
          "That needs to be a full address and nothing more, like https://hotcups.co.in",
      };
    }
    if (raw.startsWith("http://")) {
      return {
        ok: false,
        message:
          "Use https. An http address makes browsers warn visitors.",
      };
    }
  }

  return commit((draft) => {
    draft.seo.siteUrl = raw;
  }, raw ? `The site is published at ${raw}.` : "The site address was cleared, so no sitemap is offered.", "System");
}

/* ---------------------------------------------------------------
   SYSTEM — THE ONE DESTRUCTIVE ACTION IN THE PANEL.

   IT IS GUARDED BY A TYPED PHRASE RATHER THAN A CONFIRM DIALOG, because a
   dialog is one more click on the way to the same place and this throws away
   every edit anyone has made. Typing the word is the cheapest thing that
   cannot be done by accident.

   IT DOES NOT DELETE THE FILE, it writes the defaults over it. Same outcome for
   the site, and it leaves the store in a state the rest of the panel already
   understands rather than in the "nothing saved yet" one — which would make the
   dashboard claim nobody had ever edited anything.

   UPLOADED PICTURES ARE NOT TOUCHED. They are in public/uploads, they may be
   referenced from somewhere this does not know about, and deleting them is not
   what "reset the content" means to anyone who says it.
   --------------------------------------------------------------- */

export async function resetContentAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  if (text(formData, "confirm").toLowerCase() !== "reset") {
    return {
      ok: false,
      message: "Type reset in the box to confirm. Nothing has been changed.",
    };
  }

  return commit((draft) => {
    /* Every key, not a spread of DEFAULT_CONTENT over the draft — a spread
       would leave anything added to the schema since untouched, which is
       exactly the half-reset nobody wants. */
    Object.assign(draft, structuredClone(DEFAULT_CONTENT));
  }, "Everything is back to the values the site shipped with. Uploaded pictures were left alone.", "System");
}

/* ---------------------------------------------------------------
   SEO

   THE ROWS ARE THE APP'S ROUTES, so there is no count to post and nothing to
   add or remove — a row is only editable, never creatable. The loop runs over
   the STORED pages rather than the form's, and reads each by path.
   --------------------------------------------------------------- */

export async function saveSeoAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  const d = (await getContent()).seo;

  const pages: SeoPage[] = [];
  for (const fallback of d.pages) {
    /* The path is the field name's suffix, sanitised: "/who-we-serve" becomes
       "who-we-serve". The root is "home", because an empty string is not a
       usable form-field name. */
    const slug = fallback.path === "/" ? "home" : fallback.path.slice(1);
    const title = text(formData, `seo_${slug}_title`);
    const description = text(formData, `seo_${slug}_description`);

    if (!title) {
      return {
        ok: false,
        message: `${fallback.path} has no title — the blue line in a search result, and the browser tab.`,
      };
    }
    if (!description) {
      return {
        ok: false,
        message: `${fallback.path} has no description. Without one, search engines write their own.`,
      };
    }

    /* ── KEYWORDS ────────────────────────────────────────────────────
       ONE COMMA-SEPARATED FIELD, NOT ONE INPUT PER CHIP. With an input per
       chip, a page whose last keyword was removed posts nothing at all — and
       nothing at all is exactly what an absent field looks like, so the action
       could not tell "cleared them" from "this form does not have that field"
       and would have to guess. One field that is always present answers both:
       empty means empty.

       SPLIT ON COMMAS, trimmed, blanks dropped, duplicates dropped. The
       trailing comma is the normal way a blank arrives. */
    const keywords = Array.from(
      new Set(
        text(formData, `seo_${slug}_keywords`)
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      ),
    );

    /* ── STRUCTURED DATA ─────────────────────────────────────────────
       THE SAVE STOPS ON BROKEN MARKUP rather than storing it and letting the
       page carry it. This is the field the panel refused to build until it
       could be checked; storing it unchecked would be building the refusal's
       own argument. Nothing is written — the other six pages keep what they
       had — and the message names which page to look at, because the broken
       one may not be the one on screen. */
    const checked = validateJsonLd(text(formData, `seo_${slug}_schema`));
    if (!checked.ok) {
      return {
        ok: false,
        message: `Structured data on ${fallback.path} — ${checked.error} Nothing was saved.`,
      };
    }

    pages.push({
      path: fallback.path,
      title,
      description,
      noindex: formData.get(`seo_${slug}_noindex`) === "on",
      keywords,
      schema: checked.value,
    });
  }

  return commit((draft) => {
    draft.seo = {
      /* NOT ON THE SEO FORM — it is a System Settings field. Carried through
         rather than defaulted, or saving a title would quietly blank the
         domain the sitemap is built from. */
      siteUrl: d.siteUrl,
      titleSuffix: String(formData.get("seo_titleSuffix") ?? d.titleSuffix),
      noindexAll: formData.get("seo_noindexAll") === "on",
      pages,
    };
  }, "Search settings saved.", "SEO");
}

/* ---------------------------------------------------------------
   CONTACT — the section this whole panel was worth building for. lib/contact
   opens by saying the number, the inbox and the address are unverified
   placeholders that dial, send and drop a pin for real.
   --------------------------------------------------------------- */

export async function saveContactAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const phoneLabel = text(formData, "phoneLabel");
  const phoneE164 = text(formData, "phoneE164").replace(/\s+/g, "");
  const whatsapp = text(formData, "whatsapp").replace(/[^\d]/g, "");
  const email = text(formData, "email");
  /* STRIPPED OF ITS TRAILING STOP HERE TOO, not only on the way out of the
     store: the operator types a sentence and will naturally end it with one,
     and askFor() supplies the stop itself. Without this, "…date." becomes
     "…date. for an office." in a real enquiry. */
  const ask = text(formData, "ask").replace(/[.\s]+$/, "");

  /* VALIDATED HERE RATHER THAN IN THE SCHEMA, because these are the rules a
     PERSON needs told about while they are typing. parseContent's job is to
     keep a bad file from breaking the page; this one's is to keep a wrong
     number from being saved in the first place. */
  if (!/^\+[1-9]\d{7,14}$/.test(phoneE164)) {
    return {
      ok: false,
      message:
        "The dialling number must start with + and a country code, then digits only, like +919750497509.",
    };
  }
  if (whatsapp.length < 8) {
    return {
      ok: false,
      message: "The WhatsApp number must be digits only, no +, like 919750497509.",
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: "That does not look like an email address." };
  }
  if (!phoneLabel) {
    return { ok: false, message: "The printed number cannot be empty." };
  }

  const addressLines = String(formData.get("address") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (addressLines.length === 0) {
    return { ok: false, message: "The address needs at least one line." };
  }

  const socials = SOCIAL_KEYS.map((key) => {
    const href = text(formData, `social_${key}`);
    return {
      key,
      label: text(formData, `social_label_${key}`) || key,
      /* EMPTY MEANS REMOVE IT. lib/contact already established that a null href
         renders nothing at all, so clearing the field is how an account comes
         off the site — no checkbox, no delete button. */
      href: href || null,
    };
  });

  return commit((draft) => {
    draft.contact = {
      ask,
      phoneLabel,
      phoneE164,
      whatsapp,
      email,
      addressLines,
      socials,
    };
  }, "Contact details saved. The footer, the pricing band and all four section pages now use them.", "Contact");
}

/* ---------------------------------------------------------------
   POSTS and CASES — repeaters.

   THE FORM POSTS AS PARALLEL ARRAYS. `<input name="title">` repeated three
   times gives formData.getAll("title") three values in DOM order, and the same
   for every other field, so row i is the i-th of each. That is cheaper than
   indexed names (`title[0]`) because adding and removing a row on the client
   needs no renumbering — a removed row simply stops rendering.

   The invariant it rests on is that every row renders every field. A conditional
   input inside a row would silently shift every column below it, so there are
   none: an unused field posts as "".
   --------------------------------------------------------------- */

function rows(formData: FormData, fields: string[]): Record<string, string>[] {
  const columns = fields.map((f) =>
    formData.getAll(f).map((v) => String(v).trim()),
  );
  const count = Math.min(...columns.map((c) => c.length));
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, string> = {};
    fields.forEach((f, c) => {
      row[f] = columns[c][i];
    });
    return row;
  });
}

/** kebab-cased title. It is the React key AND the slug in the item's own URL
    — /blog/how-to-plan-beverage-supply-for-your-workplace is this function's
    output. See keepIds for why it is only ever computed ONCE per item. */
function slug(title: string, fallback: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return s || fallback;
}

/**
 * The id each row keeps, or a new one from its headline.
 *
 * ── WHY THE OLD ID HAS TO WIN ─────────────────────────────────────────────
 *
 * This used to be `slug(title)` on every save, and that was fine for exactly
 * as long as posts had no pages: the id was a React key, and a key may change.
 * It is now the address — /blog/<id> — and an address may not. Left as it was,
 * fixing a typo in a headline would silently move the post to a new URL and
 * 404 every link already sent to anyone, with the save reporting success.
 *
 * ── WHY IT IS A POSTED FIELD AND NOT A LOOKUP BY POSITION ─────────────────
 *
 * Reading the stored list and zipping it to the form by index would work right
 * up to the first insert or delete, after which every row below the change
 * would inherit the wrong neighbour's URL. Posting the id WITH the row means
 * it travels with that row through adds, removes and reordering — the row
 * carries its own identity instead of the action inferring one.
 *
 * ── AND IDS STAY UNIQUE ───────────────────────────────────────────────────
 *
 * Two rows headlined the same would otherwise slug to the same string, giving
 * two cards that open the same page and one item that cannot be reached at
 * all. The second gets a numeric suffix.
 */
function keepIds(
  raw: Record<string, string>[],
  prefix: string,
): string[] {
  const used = new Set<string>();
  return raw.map((r, i) => {
    /* An empty `keepid` is a row added in this session, which has no id yet. */
    const base = r.keepid || slug(r.title, `${prefix}-${i + 1}`);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  });
}

export async function savePostsAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const raw = rows(formData, [
    "keepid",
    "tag",
    "read",
    "title",
    "src",
    "alt",
    "summary",
    "body",
  ]);

  if (raw.length === 0) {
    return { ok: false, message: "Keep at least one post." };
  }
  for (const [i, r] of raw.entries()) {
    if (!r.title) {
      return { ok: false, message: `Post ${i + 1} has no headline.` };
    }
    if (!r.src.startsWith("/")) {
      return {
        ok: false,
        message: `Post ${i + 1}: the image must be a path like /img/need-bulk.jpg.`,
      };
    }
    if (!r.alt) {
      return {
        ok: false,
        message: `Post ${i + 1} has no picture description. Describe what is in the picture.`,
      };
    }
  }

  const ids = keepIds(raw, "post");
  const posts: PostContent[] = raw.map((r, i) => ({
    id: ids[i],
    tag: r.tag || "Guide",
    read: r.read || "4 min",
    title: r.title,
    src: r.src,
    alt: r.alt,
    summary: r.summary,
    /* THE ONLY PLACE HTML ENTERS THIS STORE, and it does not enter as typed —
       see lib/content/html. Cleaning on the way IN means the stored document
       is already safe, so the page that renders it does not have to remember
       to clean it and cannot forget. */
    body: sanitizeHtml(r.body),
  }));

  return commit((draft) => {
    draft.posts = posts;
  }, `${posts.length} post${posts.length === 1 ? "" : "s"} saved.`, "Blog posts");
}

export async function saveCasesAction(
  _state: SaveState,
  formData: FormData,
): Promise<SaveState> {
  /* NO ALT COLUMN — see the note on CaseContent. The card is one anchor and its
     headline is the accessible name, so Cases.tsx renders these photographs with
     alt="" deliberately. */
  const raw = rows(formData, ["keepid", "title", "src", "summary", "body"]);

  if (raw.length === 0) {
    return { ok: false, message: "Keep at least one story." };
  }
  for (const [i, r] of raw.entries()) {
    if (!r.title) {
      return { ok: false, message: `Story ${i + 1} has no headline.` };
    }
    if (!r.src.startsWith("/")) {
      return {
        ok: false,
        message: `Story ${i + 1}: the image must be a path like /img/name.webp.`,
      };
    }
  }

  const ids = keepIds(raw, "case");
  const cases: CaseContent[] = raw.map((r, i) => ({
    id: ids[i],
    src: r.src,
    title: r.title,
    summary: r.summary,
    /* Cleaned on the way in, like the posts' — see lib/content/html. */
    body: sanitizeHtml(r.body),
  }));

  return commit((draft) => {
    draft.cases = cases;
  }, `${cases.length} stor${cases.length === 1 ? "y" : "ies"} saved.`, "Case studies");
}
