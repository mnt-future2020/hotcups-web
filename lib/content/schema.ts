/**
 * The shape of everything the admin panel can change, and the values it starts
 * from.
 *
 * WHY THESE EIGHT AND NOT THE WHOLE SITE. The page is twelve sections and about
 * 12,000 lines, and most of that is not content — it is a scroll-driven
 * delivery route, a clip-path curtain, a cups-a-day calculator. Handing those
 * to an editor would mean either exposing animation timings in a form or
 * rebuilding each section around a schema it was not written for. So this is
 * the subset where the words and the numbers are genuinely data:
 *
 *   hero    — the first thing every visitor reads, three slides of it, and the
 *             one place on the site where a line one word too long is visible.
 *             Its copy has already been rewritten by the client twice.
 *   menu    — section 02, the drinks. Its own file records the fourth one being
 *             a hot chocolate, then a sarbath, then buttermilk, with the name
 *             and the photograph going out of step each time. See the note on
 *             DrinkContent for why they are one object here, and why the list
 *             can be added to while the hero's slides cannot.
 *   machines — the three units, which appeared in THREE arrays across two
 *             sections and a page, each with a comment asking the next person
 *             to keep them in step. See the note on MachineContent.
 *   story   — section 08's timeline. Its headline counted the stops out by
 *             hand ("Seven years.") directly above the list of them, and so did
 *             the dateline; both are derived now.
 *   whoWeServe — the workplace segments. They lived in FOUR places: section
 *             04, /who-we-serve, lib/workplace's typed union, and a hardcoded
 *             "Six" in a headline that had been wrong since a seventh segment
 *             was added. See the note on WorkplaceContent.
 *   contact — the highest-value item on the site by a wide margin. lib/contact
 *             opens with a four-line banner in exclamation marks saying the
 *             number, the inbox and the address are PLACEHOLDERS that nobody
 *             has checked with the client, and that they are live tel:, mailto:
 *             and wa.me links which will silently route real enquiries to a
 *             real stranger. Today fixing that is a code change and a deploy.
 *             It should be a form.
 *   posts   — Blog.tsx says outright that the posts "get their own URLs in
 *             phase 2, once the CMS is settled". This is that.
 *   cases   — Cases.tsx says a name or a number on one of these "needs written
 *             sign-off first", which is a workflow, and a workflow needs a
 *             place to type the approved version.
 *
 * `stats` IS IN THIS FILE AND IS NOT IN THE PANEL. The cups-a-day figure and
 * the organisations count are still read from here by the hero badge, the
 * header dock and the proof copy — they simply have no form any more, at the
 * client's direction. Editing them is a change to DEFAULT_CONTENT and a
 * deploy, which is where they were before the panel existed. The type stays
 * because three components read it; a saved content.json that already carries
 * the key is still honoured.
 *
 * WHAT IS STILL NOT HERE, so the boundary is stated rather than discovered: the
 * number and order of the hero's slides, the two hero gradients themselves, and
 * every animation timing. Each is either a claim about what the site argues or a
 * value someone measured; the types below say which, one by one.
 *
 * THE DEFAULTS ARE THE CURRENT HARDCODED VALUES, COPIED EXACTLY — including the
 * comments that explain them, which travelled here from the components they
 * left. That is what makes this change invisible until someone edits something:
 * with no content.json on disk the site renders as it did before the panel
 * existed.
 *
 * NO ZOD. The validators below are hand-written and live in one file with the
 * types they check. A schema library would be shorter to write and would be a
 * ninth dependency; more to the point, `parseContent` has to MERGE rather than
 * reject — a content.json written by an older build is missing whatever was
 * added since, and the right answer to a missing field is the default, not a
 * 500 on the home page.
 */

import { sanitizeHtml } from "./html";
import { jsonLdScript, validateJsonLd } from "./jsonld";

export type SocialKey = "instagram" | "facebook" | "youtube";

export type ContactContent = {
  /**
   * The opening line of every enquiry, as a STEM with no full stop.
   *
   * ONE STRING AND NOT TWO, which is the whole reason it is stored this way.
   * The message exists in two forms — plain, and naming the kind of workplace
   * the visitor asked from — and they are identical up to the last word:
   *
   *   "…a first delivery date."
   *   "…a first delivery date for a college campus."
   *
   * Storing both would be two fields that have to be reworded together, and
   * the one that is edited less often would quietly drift. Storing the stem
   * and assembling " for X." means there is one sentence to write and the
   * variant cannot disagree with it.
   *
   * WHICH IS WHY IT CARRIES NO TRAILING STOP. askFor() adds it, because where
   * the stop goes is the one thing that differs between the two forms.
   */
  ask: string;
  /** spaced, for the eye */
  phoneLabel: string;
  /** E.164, for the tel: href — NOT derived from the label, because a dialler
      wants no spaces and a reader wants them */
  phoneE164: string;
  /** digits only, no plus, because that is what wa.me takes */
  whatsapp: string;
  email: string;
  /** set in a narrow column, so the breaks are chosen rather than left to the
      browser — one string per line */
  addressLines: string[];
  /** null or "" renders nothing at all, which is how an account is removed */
  socials: { key: SocialKey; label: string; href: string | null }[];
};

export type StatsContent = {
  /** cups a day. The label shown on screen is derived from this, never typed
      alongside it — see cupsLabel below. */
  cups: number;
  /** organisations served, as it appears in copy */
  organisations: number;
};

export type PostContent = {
  id: string;
  tag: string;
  /** "4 min" — a string, not a number, because it is a claim rather than a
      measurement and the client may want "under 5 min" */
  read: string;
  title: string;
  src: string;
  alt: string;
  /** one or two sentences on the card and at the top of the post */
  summary: string;
  /**
   * The article, as HTML from the panel's editor.
   *
   * SANITISED ON THE WAY IN, never on the way out — see lib/content/html. A
   * stored document is already safe, so every reader of it is safe without
   * having to remember to clean it.
   *
   * EMPTY IS A REAL STATE and the card has to handle it: a post with no body
   * is a headline with nowhere to go, so the card stops being a link rather
   * than sending a reader to an empty page.
   */
  body: string;
};

export type CaseContent = {
  id: string;
  src: string;
  title: string;
  /* NO ALT FIELD, AND THAT IS NOT AN OMISSION. Cases.tsx renders these
     photographs with alt="" on purpose — the whole card is one anchor and the
     headline inside it is the accessible name, so a description of the image
     would be read out immediately after the headline as a second name for the
     same link. Storing alt text here would mean either ignoring it or undoing
     that decision, and a field in the panel that reaches nothing is worse than
     no field. Posts are different: their images sit inside a card whose text is
     a tag, a read time and a headline, and the photograph is separately
     meaningful there. */

  /** one or two sentences on the card and at the top of the study */
  summary: string;
  /**
   * The study itself, as HTML from the panel's editor. Sanitised on the way
   * in — see lib/content/html, and the same note on PostContent.
   *
   * EMPTY IS A REAL STATE. A case with no body is a claim with nothing behind
   * it, so its card stops being a link rather than sending a reader to an
   * empty page.
   *
   * THE SIGN-OFF RULE APPLIES HERE HARDEST. The panel warns that no customer
   * name, headcount or price goes out without that customer's written
   * permission; a headline can be about the product, but a body is where
   * somebody is named.
   */
  body: string;
};

/* ---------------------------------------------------------------
   THE HERO

   WHAT IS EDITABLE AND WHAT IS EMPHATICALLY NOT.

   Editable: every word, both buttons on each slide, the photographs, which of
   two measured grounds a slide sits on, and whether its plate is mirrored.

   NOT editable, and each for a reason written down in the components:

     SLIDE ONE. It is a WebGL scene rather than a photograph, so it is not
     interchangeable with the others even in principle — it has no image to
     replace and no ground to choose. The slides BELOW it can be added to and
     removed; the dots a visitor counts are always one more than that list.

     Worth keeping in mind while adding one: Hero.tsx argues that the slides are
     three ARGUMENTS — delivery, then the machine, then the menu — and that "a
     carousel whose slides all make the same point is a slideshow of one idea".
     A fourth that repeats one of the three costs seven seconds of a visitor's
     attention for nothing. That is a judgement, though, and it is the client's
     to make rather than a rule the code should enforce.

     THE GRADIENTS THEMSELVES. Each ground was measured against the type that
     sits on it — the peach one is capped at #f5dec6 because the reference ran
     to about #efd2b4, "where the orange-dark accent line drops to 2.85:1" and
     fails. A free-text colour field invites someone to paste a hex that puts
     the headline under contrast. So the choice is between two grounds that
     have both been checked, by name.

     THE ANIMATION. Line gaps, clip reveals, the pour on the accent word, the
     seven-second dwell. None of that is content.
   --------------------------------------------------------------- */

export type HeroButton = { label: string; href: string };

/** Which of the two measured grounds a light slide sits on. */
export type HeroGround = "warm" | "cool";

/**
 * Slide one — the flask.
 *
 * IT HAS TWO PHOTOGRAPHS, AND AN EARLIER VERSION OF THIS FILE SAID IT HAD
 * NONE. The claim was that its picture "is a shader", which is the kind of
 * half-true that hides a field someone needs: the shader RENDERS something, and
 * what it renders is a photograph of the client's own branded flask beside a
 * glass of chai, pulled in as a texture and pushed around by the liquid noise.
 * Saying it had no image meant the one photograph on the site the client
 * supplied directly was the one they could not change.
 *
 *   `subject` is that cut-out — transparent ground, composited into the scene.
 *   `poster` is the whole scene as a still, shown before the canvas has
 *   started and instead of it where WebGL will not run: a phone on save-data,
 *   anyone with reduced motion on, and every first paint.
 *
 * THEY ARE TWO VIEWS OF ONE PICTURE AND THEY HAVE TO BE CHANGED TOGETHER.
 * Replace the subject alone and a visitor sees the new flask once the canvas
 * warms up and the old one for the half-second before it — or permanently, if
 * their browser never runs it. The form says so; nothing in the code can
 * enforce it, because the two files are not comparable.
 */
export type HeroFlaskContent = {
  /** the cut-out composited into the liquid scene — needs a real alpha
      channel, because it is drawn over the shader rather than behind it */
  subject: string;
  /** the same scene as a flat still, for before and instead of the canvas */
  poster: string;
  /** where the steam leaves the glass, in fractions of the frame from the
      top-left. Measured off the subject photograph — the note in
      LiquidSurface records it sitting a notch ABOVE the rim rather than on it,
      because a plume born exactly on the rim spends its first half hidden
      behind the glass. */
  steam: { u: number; v: number };
  /** Three REAL lines, not one string left to wrap. A line cannot clip-reveal
      on its own if the browser decides where it starts, and the entrance
      depends on "Twice a day." being alone on the last one. */
  lines: string[];
  /**
   * The poured words — rendered as an orange outline that fills.
   *
   * AN ARRAY LIKE EVERY OTHER SLIDE'S, and it was a lone string until the
   * client asked for one form across all three. That was the last field whose
   * SHAPE differed rather than its wiring, and the difference showed on the
   * screen: one slide offered a single-line box labelled "Accent line" beside
   * two offering "Accent lines".
   *
   * ONE PourWord PER ENTRY, staggered, exactly as the headline lines above it
   * are. A line cannot clip-reveal on its own if the browser decides where it
   * starts — the same reason `lines` is an array and not one wrapping string.
   */
  accent: string[];
  /**
   * The dark behind the scene. TWO PRESETS AND A COLOUR OF YOUR OWN, the same
   * shape slides 2 and 3 have — but a different pair, and that is the point
   * rather than an inconsistency: their two are pale creams chosen to hold an
   * INK headline, and this slide's headline is cream on a dark ground. Offer
   * warm peach here and the copy disappears.
   */
  ground: FlaskGround;
  groundHex: string;
  /**
   * Which side the scene sits on, above md. The same field every other slide
   * has, and it took a change to SlideFlask to make it mean anything: the
   * scene is flipped, the copy moves to the other half, and the radial scrim
   * that protects the copy's contrast moves with it. Flipping only the
   * picture would have put the flask under the words.
   */
  flip: boolean;
  /**
   * What the scene shows, for a reader who cannot see it.
   *
   * IT WAS NOT HERE AND THE SCENE ANNOUNCED NOTHING. Both the canvas and its
   * still fallback carried a bare `aria-hidden`, which is correct for a
   * decoration and wrong for this: it is the client's own branded flask, the
   * one photograph they supplied directly, and the headline beside it says
   * "Twice a day" rather than describing it. Filled in, it becomes the
   * scene's accessible name; left empty the scene stays hidden, which is the
   * honest state for a slide whose picture really is only atmosphere.
   */
  alt: string;
  sub: string;
  primary: HeroButton;
  secondary: HeroButton;
};

/** Slides two and three — copy beside a photograph. */
export type HeroSlideContent = {
  id: string;
  /** rendered in ink, one clip-revealed line each */
  lines: string[];
  /** the closing lines, in orange-dark. An array because the client's copy does
      not always fit on one. */
  accent: string[];
  sub: string;
  primary: HeroButton;
  secondary: HeroButton;
  ground: HeroGround;
  /** mirror the plate, so a subject facing right reads INTO the copy rather
      than off the edge of the page */
  flip: boolean;
  image: { src: string; alt: string };
  /**
   * A ground colour of the operator's own choosing, as #rrggbb. EMPTY IS THE
   * NORMAL CASE and means `ground` above decides — the two measured presets.
   *
   * IT EXISTS AT THE CLIENT'S REQUEST AND IT IS THE RISKY ONE. The presets are
   * capped where they are because the orange accent half of the headline stops
   * clearing 3:1 on a deeper cream; a free colour here can put an unreadable
   * headline on the page and nothing downstream will object. The panel answers
   * that by measuring the ratio live and saying so while the colour is being
   * chosen — a warning rather than a refusal, which is the client's call to
   * make and not this file's.
   */
  groundHex: string;
  /**
   * A photograph behind the whole slide. EMPTY IS THE NORMAL CASE and means
   * the named `ground` gradient is the entire background, which is what every
   * slide did before this existed.
   *
   * IT DOES NOT REPLACE `ground`, IT SITS ON IT. The headline on these slides
   * is `text-ink` — near-black on a pale gradient measured to hold contrast.
   * Drop an arbitrary photograph in behind that and the contrast becomes
   * whatever the photograph happens to be, which is how a headline goes
   * unreadable on one slide out of three and nobody notices until it is live.
   * So the gradient is painted again OVER the picture as a scrim and the
   * picture reads through it.
   *
   * NO ALT. It is scenery behind text that says the same thing; announcing it
   * would interrupt the headline to describe the wallpaper. `image` is the
   * slide's subject and that one is described.
   */
  bg: string;
};

export type FlaskGround = "deep" | "roast";

export type HeroContent = {
  flask: HeroFlaskContent;
  slides: HeroSlideContent[];
};

/* ---------------------------------------------------------------
   SECTION 02 — THE MENU

   ONE DRINK IS ONE OBJECT, AND THAT IS THE WHOLE DESIGN OF THIS TYPE.

   Menu.tsx keeps the four glasses in one array and the four names in the
   SENTENCE above them in a second, parallel one — and its own comments record
   what that has cost. The fourth name "has said 'hot chocolate' and 'sarbath'
   in front of this same slot; both were wrong the moment the photograph under
   them changed and neither was caught by a type." The name lights orange when
   its glass is hovered, so a stale one lights the wrong two words while a
   different drink comes forward.

   So the sentence label lives HERE, on the drink, beside the card's own name.
   Renaming the fourth drink in the panel moves the label and the card together
   because they are one object, and the bug that file documents twice stops
   being expressible.

   HOW MANY DRINKS THERE ARE IS UP TO THE PANEL. The row's column count is
   derived from the list rather than fixed at four, and CardSteam wraps its
   plume variants with a modulo, so a fifth drink reuses the first one's plume
   instead of reading past the end of the table. Four fills a row exactly and is
   what the layout was measured at; the form says which counts sit well and
   which wrap awkwardly rather than refusing the awkward ones.

   THE FOUR NUMBERS ARE MEASURED OFF THE PHOTOGRAPH, NOT CHOSEN.
   `wash` is the drink's own lit band scaled to luminance 208. `rim` is how far
   down the frame the liquid surface sits. `cx` is where the vessel's centre is.
   `mouth` is how wide the LIQUID is — not the glass: CardSteam spreads the
   plume to mouth * 1.9, and taking the outer glass once pushed wisps 113% of a
   card wide, into its neighbours. Menu.tsx puts it plainly: "rim / cx / mouth
   ARE MEASURED OFF THIS PHOTOGRAPH, and the last set had gone stale — proof
   that they cannot be left alone when the picture changes."

   They are editable anyway, and that is a considered choice rather than a
   shrug. The client has changed these plates three times — hot chocolate, then
   sarbath, then buttermilk — so swapping one is a real workflow, and a panel
   offering the picture but not the numbers would bake in precisely the fault
   that comment is about. They sit behind their own heading on the form, each
   with what it means, under a line saying they have to be re-measured when the
   plate changes. The constraint is real, it cannot be computed from the file,
   and hiding the fields would not remove it — only make it silent.
   --------------------------------------------------------------- */

/**
 * One drink inside a category — what the /menu drawer opens to show.
 *
 * "Seasonal · 2 specials" expands to Buttermilk and Nannari Sarbath; those two
 * are varieties. A category with ONE of them does not expand at all, which is
 * why three of the four currently do not.
 */
export type VarietyContent = {
  name: string;
  /** "" when there is no photograph of this drink yet — the tile then draws a
      tumbler filled with `tint` instead, which is a stand-in that does not
      pretend to be a photograph */
  img: string;
  /** true when `img` is a SCENE photograph that should fill the tile; false for
      a cut-out plate, which is centred inside it instead. One frame has to hold
      both kinds, and they need opposite fits. */
  cover: boolean;
  /** the drink's own colour, for the drawn glass that stands in until there is
      a photograph */
  tint: string;
};

export type DrinkContent = {
  /** stable across renames — the card's React key, and the index CardSteam
      reads to pick its plume */
  key: string;
  /** the card's label: "Tea", "Seasonal" */
  name: string;
  /** the plural noun the count is said in: "blends", "roasts", "specials". The
      COUNT ITSELF IS NOT STORED — see drinkCount below for why. */
  noun: string;
  /** the drinks inside this category. Its LENGTH is the count on the card. */
  varieties: VarietyContent[];
  img: string;
  alt: string;
  /** the same drink's name INSIDE the sentence above the row, where it lights
      orange as its glass comes forward. Lower case unless it is a proper
      noun — it is mid-sentence. */
  label: string;
  /** what follows that label — ", " for all but the last, which takes " and ".
      Stored rather than derived because where the "and" goes is a writing
      decision, and whether there is a comma before it is a house style. */
  separator: string;
  /** the drink's own lit band, scaled to luminance 208 */
  wash: string;
  /** percentages of the FRAME, all three measured off the plate */
  rim: number;
  cx: number;
  mouth: number;
  /** a plume off a cold drink is not a stylistic choice, it is wrong about the
      drink — buttermilk is served cold and has this off */
  steam: boolean;
};

export type MenuContent = {
  eyebrow: string;
  /** two lines; the second is the orange one */
  headline: string;
  headlineAccent: string;
  /** what the sentence ends on, after the last drink */
  tail: string;
  drinks: DrinkContent[];
};

/* ---------------------------------------------------------------
   SECTIONS 05 AND 06 — THE MACHINES

   ONE LIST, THREE READERS, AND THIS IS THE SECOND TIME THIS SITE HAS HAD THAT
   PROBLEM. The three units appeared in three arrays: `RIGS` in MachineRow.tsx
   (section 06), `MACHINES` in Machines.tsx (the section 05 calculator) and a
   third inside MachinesView.tsx. Each held the same capacities. MachineRow's
   own comment asked the next person to keep them together — "KEEP THESE IN STEP
   WITH `MACHINES` IN Machines.tsx (section 05)... The two sections must not
   disagree about what a given office gets" — which is a request, not a
   mechanism, and the drinks row already showed what happens to those.

   So the bands live here once. Section 05 picks a machine by comparing cups
   against `cap`; section 06 prints `from`–`cap` on the card; /machines does
   both. None of them can now be corrected to match another.

   `from` IS NULL ON THE SMALLEST, which is what puts the "<" in front of it.
   Not 0: "0 – 100" is a range nobody writes, and "< 100" is the claim the card
   is actually making.

   THERE IS NO SCREEN RECTANGLE ANY MORE. Each unit used to carry four
   measurements — the centre and size of its display, in fractions of the
   image — positioning a glow that lit that machine's screen on hover. It came
   off at the client's direction, and it is worth recording why it was the right
   thing to lose: it was the only value on this site that made a PHOTOGRAPH
   un-swappable. Replace a machine's picture or crop it and all four were
   silently wrong, with the light landing beside the display rather than on it,
   which reads as a rendering fault rather than as stale data. The ambient
   warm-up that cycles between the three cards is untouched — it never read
   them.

   `aspect` IS THE PICTURE'S OWN RATIO, and it is the one number here nobody
   should have to type: the panel reads it off the file when a picture is
   uploaded. It exists because the three photographs are different shapes and
   the cards reserve the right height for each before the image has loaded.
   --------------------------------------------------------------- */

export type MachineContent = {
  key: string;
  src: string;
  /** null on the smallest unit — that is what prints the "<" */
  from: number | null;
  /** the top of this unit's band, and what section 05 compares cups against */
  cap: number;
  /** the photograph's own width / height */
  aspect: number;
};

export type MachinesContent = {
  eyebrow: string;
  /** the orange half, which leads: "Rent or buy." */
  headlineAccent: string;
  /** the rest, in ink. One span on the page — it wraps on its own. */
  headline: string;
  sub: string;
  machines: MachineContent[];
};

/* ---------------------------------------------------------------
   SECTION 08 — THE STORY

   SEVEN STOPS FROM THE CLIENT'S ANNIVERSARY SHEET, and the words in them are
   close to untouchable: "50+ machines deployed" and the RFID claim go out as
   public statements about the business the moment they ship. They came from the
   client, they are not ours to soften and not ours to invent. Anyone editing
   these is editing what the company says about itself, which is a different act
   from fixing a headline.

   THE YEAR RANGE AND THE COUNT ARE DERIVED, NOT TYPED. The heading says "Seven
   years." over "2019 – 2026", and both of those were written out by hand beside
   a list of seven stops running 2019 to 2026. That is the same shape of
   duplicate the drinks row and the machine bands each had — add a stop and the
   heading is quietly wrong. See storyRange and storyYears below.

   THE ICON IS A NAME, NOT A DRAWING. Each stop picks one of seven glyphs the
   rail knows how to draw; the panel offers that list. A free field would let
   someone type a name nothing renders, and the rail would show a gap under
   that stop with no indication why.

   WHAT A PHOTOGRAPH HERE OWES, because it is a rule the section learned the
   expensive way: the subject of every frame is a PERSON or a DRINK — a pour, a
   cup handed over, an office at tea break, a machine filling a cup. A flask may
   appear in use, never stacked or racked. The first set commissioned for this
   came back as a flask warehouse and read as a company that sells vacuum
   flasks, which is not the business. Boxes crop with object-cover, so a
   replacement need not match a ratio, but it should keep its subject off the
   edges.
   --------------------------------------------------------------- */

/** The glyphs the rail can draw. A stop names one of these. */
export const STORY_ICONS = [
  "shop",
  "cup",
  "people",
  "chart",
  "building",
  "machine",
  "sprout",
] as const;

export type StoryIcon = (typeof STORY_ICONS)[number];

export type MilestoneContent = {
  key: string;
  /** what the numeral shows, and the rail's label */
  year: string;
  /** a second line under the numeral, only where a stop covers a period */
  span: string;
  title: string;
  /** a paragraph, OR the bullets below — not both. 2026 is the only stop that
      uses bullets, because it is the only one making four claims at once. */
  body: string;
  bullets: string[];
  /** the line under the rail's icon */
  caption: string;
  icon: StoryIcon;
  img: string;
};

export type StoryContent = {
  eyebrow: string;
  /** the word before the orange, on line two — "One" */
  headlineLead: string;
  /** the orange half — "growing journey." */
  headlineAccent: string;
  milestones: MilestoneContent[];
};

/* NO `headline` FIELD, AND THAT IS THE ONE OPINIONATED THING IN THIS TYPE.
   The first line reads "Seven years." and is the count of the list underneath
   it — storyYears computes it. Storing it as well would mean a stop could be
   added and the headline left saying seven, with nothing failing and nobody
   noticing until a visitor counted the dots. The second line stays editable in
   both halves, so the sentence is still the client's; only the number in it is
   the list's. */

/* ---------------------------------------------------------------
   SECTION 04 AND /who-we-serve — THE WORKPLACES

   FOUR COPIES, AND ONE OF THEM WAS ALREADY WRONG ON THE LIVE SITE. The same
   segments were declared in Industries.tsx (section 04), again in
   WhoWeServeView.tsx, and a third time in lib/workplace.ts as two Records
   keyed by a hand-written union. The fourth copy was a NUMBER: /who-we-serve
   says "The six" over "Six kinds of workplace, one round." — and there are
   seven. Events & functions was added to the list and the headline counting it
   was not, which is exactly the failure the drinks count and the story's
   "Seven years." each had. The count is derived here.

   THE KEY IS A PLAIN STRING NOW, where it used to be a seven-member union.
   That union was what made the two Records safe, and it is also what made
   adding a segment a code change in three files. The trade is real and worth
   stating: a typo in a key no longer fails to compile. What replaces it is
   that the key is generated from the name rather than typed, and that nothing
   looks a workplace up by key any more — the phrases travel on the object.

   PLACEHOLDER IS THE ONE FIELD THAT IS NOT CONTENT. /who-we-serve's own page
   note opens with a banner in exclamation marks: five of the six fact lines
   are INVENTED, and only Manufacturing's "2,000 cups a day in Coimbatore" came
   from the client. Marking which is which is what lets the site stop
   publishing the invented ones without anyone having to remember the list.
   --------------------------------------------------------------- */

export type WorkplaceContent = {
  key: string;
  /** the chip and the card: "IT & offices" */
  name: string;
  src: string;
  /** under the photograph — a CADENCE, not a description. Twice a day, three
      shifts, round the clock. It is what makes the six read as one round
      rather than six services. */
  caption: string;
  /** revealed on click in section 04 */
  fact: string;
  /** TRUE means the fact above is invented and has never been confirmed. Only
      Manufacturing's is the client's. */
  placeholder: boolean;
  /** "Get pricing for ___" — the article travels with the noun, because "for a
      office" is the kind of thing that only shows up once it is on screen */
  forPhrase: string;
  /** how the same choice reads inside a sentence to a human at the other end
      of the email or the WhatsApp message */
  askPhrase: string;
};

export type WhoWeServeContent = {
  /** the word BEFORE the count in the eyebrow — "The", giving "The seven". The
      number is counted, for the same reason the headline's is: "The six" over
      seven cards is the fault this section already shipped once, and fixing it
      in one of the two places it appears would have left the other wrong. */
  eyebrowLead: string;
  /** the words after the count — "kinds of workplace, one round." The number is
      counted from the list; see workplaceCount. */
  headlineTail: string;
  sub: string;
  places: WorkplaceContent[];
};

/* ---------------------------------------------------------------
   SEO — THE TITLES AND DESCRIPTIONS SEARCH RESULTS SHOW

   SEVEN PAGES, EACH WITH ITS OWN `export const metadata` typed into the file.
   That is the idiomatic Next way to do it and it is fine — right up until the
   person who needs to change a description is the client rather than whoever
   has the repository open.

   `noindex` IS THE FIELD THAT EARNS THIS WHOLE SLICE. Two pages carry it today
   (/blog and /case-studies, both stubs, both saying so in their own comments:
   "a near-empty page that ranks is a liability, not a placeholder"). It is
   exactly the kind of flag that has to come OFF the day content lands — and
   the day that happens, the person who knows is the one writing the content,
   not the one deploying.

   THE SITE-WIDE SWITCH IS SEPARATE AND IS NOT A CONVENIENCE. Before launch the
   whole site should be closed to crawlers; after launch it must not be. That is
   one decision, it is easy to forget in either direction, and it belongs
   somewhere a person can see its current state rather than buried per page.

   KEYWORDS AND STRUCTURED DATA WERE REFUSED ONCE AND ARE HERE NOW. The
   refusal was on record in SeoForm: keywords because Google has ignored them
   since 2009, JSON-LD because a textarea taking any string is a way to put
   broken markup on the site with nothing to catch it. The client asked for
   both, so both were built with the halves that were missing — the keywords
   field says what the tag is actually worth instead of implying a ranking,
   and the JSON-LD is checked by lib/content/jsonld.ts before it is stored and
   escaped before it is rendered. A field that does nothing is still the thing
   to avoid; the answer was to make them do something.

   WHAT IS STILL NOT HERE: canonical URLs and Open Graph images. Both are real
   things this site will want and neither is a text field — they need a domain
   that is decided and images that are made. Adding an empty box for each would
   look like the job was done.
   --------------------------------------------------------------- */

export type SeoPage = {
  /** the route, for the panel to label the row. Not editable. */
  path: string;
  title: string;
  description: string;
  /** true keeps the page out of search results entirely */
  noindex: boolean;
  /**
   * The focus words for this page, rendered as <meta name="keywords">.
   *
   * WHAT IT IS WORTH, STATED PLAINLY BECAUSE THE FIELD INVITES THE OPPOSITE
   * ASSUMPTION. Google said in 2009 that it ignores this tag and has not
   * changed its mind; Bing reads it and treats stuffing as a negative signal.
   * So the honest account is: it will not lift a ranking, a long list can cost
   * one, and a short accurate list is harmless. The panel says that where the
   * field is, rather than leaving it to look like the two boxes above it.
   *
   * A LIST RATHER THAN A STRING, so the joining rule lives in one place and
   * the panel can show them as removable chips instead of a comma-counting
   * exercise.
   */
  keywords: string[];
  /**
   * Structured data for this page — a JSON-LD block, stored minified.
   *
   * VALIDATED BEFORE IT IS STORED and escaped before it is rendered; both
   * live in lib/content/jsonld.ts and the reasoning is there. Empty is the
   * normal state — most pages do not describe a thing schema.org has a type
   * for, and an invented one is worse than none.
   */
  schema: string;
};

export type SeoContent = {
  /**
   * Where the site lives — "https://hotcups.co.in", no trailing slash.
   *
   * IT IS A SETTING RATHER THAN A CONSTANT because it is the one piece of
   * information the code genuinely cannot work out for itself. A request tells
   * the server which host it came in on, which on a preview deploy, behind a
   * proxy, or on localhost is not the address anyone should be publishing.
   *
   * NOTHING BUT THE SITEMAP AND robots.txt USE IT, and that is deliberate — the
   * pages themselves use relative links, so an empty or wrong value here cannot
   * break navigation. It can only make a sitemap nobody should submit, which is
   * why both files say so when it is blank rather than emitting a guess.
   */
  siteUrl: string;
  /** appended to every page title — " — Hotcups". The home page carries the
      full sentence instead and does not take the suffix. */
  titleSuffix: string;
  /** THE WHOLE SITE, CLOSED. Overrides every page's own setting, which is what
      makes it usable as a pre-launch switch rather than a seventh checkbox. */
  noindexAll: boolean;
  pages: SeoPage[];
};

/* ---------------------------------------------------------------
   THE ACTIVITY LOG

   IT EXISTS SO THE DASHBOARD CAN SHOW SOMETHING TRUE. A panel of recent
   activity is one of the most useful things on an admin screen and one of the
   easiest to fake — a list of plausible-looking events nobody recorded. This
   records them: every successful save appends one entry, so the feed is a fact
   about what happened rather than a decoration.

   WHAT IT CANNOT TELL YOU, stated because the shape invites the assumption:
   WHO did it. There is one account, so the question does not arise today; the
   moment there are two, this needs the session's email on each entry and this
   note stops being true.

   CAPPED AT TWENTY, oldest dropped. It lives inside content.json, which is read
   in full on every request by the site as well as the panel — an unbounded log
   would make the whole document grow forever for the sake of a list nobody
   scrolls past the top of.
   --------------------------------------------------------------- */

export type ActivityEntry = {
  /** ISO 8601, in UTC. Formatted for reading at the point it is displayed, so
      the stored value stays unambiguous. */
  at: string;
  /** which editor — "Menu", "Hero". Used to group and to pick an icon. */
  section: string;
  /** the same sentence the save itself reported */
  summary: string;
};

export const ACTIVITY_LIMIT = 20;

export type SiteContent = {
  activity: ActivityEntry[];
  seo: SeoContent;
  hero: HeroContent;
  menu: MenuContent;
  machines: MachinesContent;
  story: StoryContent;
  whoWeServe: WhoWeServeContent;
  contact: ContactContent;
  stats: StatsContent;
  posts: PostContent[];
  cases: CaseContent[];
};

/**
 * The two grounds, by name.
 *
 * DEFINED HERE RATHER THAN IN THE SLIDE so that a stored slide holds the word
 * "warm" and not 120 characters of gradient — which means re-measuring one of
 * these later is a change in this file, not a migration of every saved
 * document.
 */
export const HERO_GROUNDS: Record<HeroGround, string> = {
  /* The mockup's warm peach: light at the upper left, deepening across to the
     drinks. The outer stop is capped at #f5dec6 — the reference ran to about
     #efd2b4, where the orange-dark accent line drops to 2.85:1 and fails. */
  warm: "radial-gradient(125% 125% at 26% 12%, #fefaf5 0%, #faeadb 45%, #f5dec6 100%)",
  /* The mockup's cool studio greige, with the light off the upper left. */
  cool: "radial-gradient(125% 125% at 30% 20%, #fbf9f5 0%, #f1ece4 48%, #e6e0d7 100%)",
};

/**
 * Slide 1's two, which are flat colours rather than gradients.
 *
 * NO RAMP, UNLIKE THE LIGHT SLIDES. Theirs shade across the frame because
 * there is nothing else behind them; this one is the ground under a shader, a
 * poster and a radial scrim, and a second gradient underneath all that is
 * three gradients arguing. The scene supplies the depth.
 */
export const FLASK_GROUNDS: Record<FlaskGround, string> = {
  deep: "#240a06",
  roast: "#3a140e",
};

export const FLASK_GROUND_LABELS: Record<FlaskGround, string> = {
  deep: "Espresso deep — the darkest",
  roast: "Espresso — a touch warmer",
};

/** Slide 1's ground: its own colour if it has one, its preset otherwise. The
    same rule groundStyle() applies to the other slides. */
export function flaskGroundStyle(f: {
  ground: FlaskGround;
  groundHex: string;
}): string {
  const hex = f.groundHex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : FLASK_GROUNDS[f.ground];
}

export const HERO_GROUND_LABELS: Record<HeroGround, string> = {
  warm: "Warm peach — for the drinks",
  cool: "Cool greige — for the machine",
};

/**
 * The gradient a slide actually paints: its own colour if it has one, the
 * named preset otherwise.
 *
 * A CUSTOM COLOUR IS RAMPED, NOT PAINTED FLAT. The two presets are radial
 * gradients — light at the upper left, deepening across — and a flat fill
 * beside them would not read as the same kind of background. So a chosen
 * colour becomes the OUTER stop of that same ramp and the inner stops are
 * mixed toward white, which keeps the shape the layout was built against.
 *
 * `color-mix` DOES THE MIXING, in CSS rather than here. It means this stays a
 * string builder with no colour maths in it, and the browser interpolates in
 * sRGB exactly as the hand-written presets were measured in.
 *
 * THE CHOSEN COLOUR IS THE DARKEST STOP, which is what makes the panel's
 * contrast readout honest: it measures the worst part of the ground rather
 * than an average nobody's text sits on.
 */
export function groundStyle(slide: {
  ground: HeroGround;
  groundHex: string;
}): string {
  const hex = slide.groundHex.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return HERO_GROUNDS[slide.ground];
  return (
    `radial-gradient(125% 125% at 28% 14%, ` +
    `color-mix(in srgb, ${hex} 10%, white) 0%, ` +
    `color-mix(in srgb, ${hex} 52%, white) 46%, ` +
    `${hex} 100%)`
  );
}

/* ---------------------------------------------------------------
   DEFAULTS
   --------------------------------------------------------------- */

export const DEFAULT_CONTENT: SiteContent = {
  /* Empty, not seeded. An invented first entry would be the exact thing this
     log exists to avoid. */
  activity: [],
  seo: {
    /* EMPTY UNTIL SOMEONE CONFIRMS IT. A guessed domain in a sitemap is worse
       than no sitemap: it points search engines at pages that may not exist. */
    siteUrl: "",
    titleSuffix: " — Hotcups",
    noindexAll: false,
    /* THE ORDER IS THE NAV'S ORDER, so the panel reads the way the site does.
       The home page is first and is the one title that is a whole sentence
       rather than a name plus a suffix. */
    pages: [
      {
        path: "/",
        keywords: [],
        schema: "",
        title: "Hotcups — Recharges you. Twice a day.",
        description:
          "Flasks of hot tea and coffee delivered to workplaces across Tamil Nadu. Past 40 cups a day, a machine costs less — including one built to your spec.",
        noindex: false,
      },
      {
        path: "/service",
        keywords: [],
        schema: "",
        title: "The Service",
        description:
          "How the round works: flasks filled, delivered at your timings, empties collected. No pantry staff, nothing to install.",
        noindex: false,
      },
      {
        path: "/menu",
        keywords: [],
        schema: "",
        title: "The Menu",
        description:
          "Tea, filter coffee, milk and buttermilk, with the pantry riding along on the same delivery.",
        noindex: false,
      },
      {
        path: "/who-we-serve",
        keywords: [],
        schema: "",
        title: "Who We Serve",
        description:
          "Offices, factories, hospitals, campuses, shops, showrooms and events — one round, wherever people are waiting on a hot drink.",
        noindex: false,
      },
      {
        path: "/machines",
        keywords: [],
        schema: "",
        title: "Machines",
        description:
          "Three sizes, rent or buy, from counter-top to half a desk — each built for a different workplace.",
        noindex: false,
      },
      {
        path: "/blog",
        keywords: [],
        schema: "",
        title: "Reading",
        description:
          "Notes on running a workplace pantry — supply planning, what teams drink, and what recurring delivery changes.",
        /* A STUB TODAY, and its own file says why this is on: "a near-empty
           page that ranks is a liability, not a placeholder." It comes off when
           the posts land. */
        noindex: true,
      },
      {
        path: "/case-studies",
        keywords: [],
        schema: "",
        title: "Case studies",
        description:
          "How workplaces across Tamil Nadu run their tea and coffee — the ones on flasks, and the ones that crossed 40 cups a day.",
        /* Also a stub, and this one is stronger: the page would rank for
           "hotcups case study" and then show invented numbers. */
        noindex: true,
      },
    ],
  },
  hero: {
    flask: {
      /* THE CLIENT'S OWN BRANDED FLASK, cut here rather than supplied cut —
         scripts/cut-im1.js carries the key and every threshold in it was
         measured off the source photograph rather than guessed. */
      subject: "/img/hero-hotcups-chai.webp",
      poster: "/img/hero-poster.webp",
      /* The colour the slide has always had, now named rather than hardcoded
         in SlideFlask's className. */
      ground: "deep",
      groundHex: "",
      /* Flask right, copy left — how the slide shipped. */
      flip: false,
      /* EMPTY, AND THAT IS THE SHIPPED STATE RATHER THAN AN OVERSIGHT. The
         scene has been aria-hidden since it was built; this makes describing
         it possible, and whether it should be described is the client's call
         about their own photograph. */
      alt: "",
      steam: { u: 0.27, v: 0.55 },
      lines: [
        "Hot tea and filter coffee,",
        "delivered to your office",
        "in flasks.",
      ],
      accent: ["Twice a day."],
      /* "No machine to buy." USED TO OPEN THIS LINE AND IT HAD TO GO. It is
         true of the flask service in isolation, and it is the first promise a
         visitor reads on a site whose nav carries a "Machines" link and whose
         section 04 exists to argue that above 40 cups a day a machine is the
         answer. "No pantry staff" survives because it is true either way. */
      sub: "No pantry staff. We deliver at your timings and collect the empties.",
      primary: { label: "Get pricing", href: "#pricing" },
      secondary: { label: "Flasks or a machine?", href: "#savings" },
    },
    slides: [
      {
        id: "machines",
        lines: ["Smart beverage", "machines,"],
        accent: ["built for busy", "workplaces."],
        sub: "Serve hot tea, coffee and more at the touch of a button — quick, convenient and ready whenever your team needs it.",
        primary: { label: "Get pricing", href: "#pricing" },
        secondary: { label: "Explore machines", href: "#machines" },
        ground: "cool",
        flip: true,
        image: {
          src: "/img/hero-slide-machine.webp",
          alt: "A Hotcups vending machine dispensing coffee into a paper cup",
        },
        /* NO BACKGROUND PICTURE, which is how both of these shipped and stays
           the default. The cool greige behind the machine was measured for it;
           a photograph goes here only when there is one worth the contrast it
           costs. */
        bg: "",
        groundHex: "",
      },
      {
        id: "menu",
        /* THE CLIENT'S "SHORT & PREMIUM" WORDING, and short is why it is this
           one rather than the longer draft that came with it. A slide holds for
           seven seconds and then crossfades whether or not it has been read; at
           the long draft's length the back half is words nobody sees. */
        lines: ["One Machine."],
        accent: ["Every Favourite."],
        /* THE FOUR NAMES HAD TO MOVE WITH THE MENU. This read "Badam Milk, and
           Hot Chocolate" — both drinks the menu no longer has, which is worse in
           a hero than anywhere else on the site. "Buttermilk", not "Masala
           Buttermilk", at the client's direction: the drink is plain. */
        sub: "Enjoy freshly prepared Tea, Filter Coffee, Milk, and Buttermilk, all conveniently served from our beverage machine — giving everyone something they love, right at the workplace.",
        primary: { label: "See the menu", href: "#menu" },
        secondary: { label: "Get pricing", href: "#pricing" },
        ground: "warm",
        flip: false,
        image: {
          src: "/img/hero-slide-drinks.webp",
          /* THE PLATE DOES NOT SHOW THE FOUR DRINKS THE SENTENCE NAMES, and the
             alt used to claim it did. In frame: masala chai, a filter coffee
             davara set, badam milk and a mug of hot chocolate — no buttermilk
             and no plain milk. The alt describes what is there instead of
             naming drinks, so it is at least true; the photograph itself still
             needs replacing. */
          alt: "A group of hot drinks with whole spices, nuts and coffee beans",
        },
        bg: "",
        groundHex: "",
      },
    ],
  },
  menu: {
    eyebrow: "02 — On the menu",
    headline: "Everyone drinks something different.",
    headlineAccent: "We pour all of it.",
    tail: "more.",
    drinks: [
      {
        key: "tea",
        name: "Tea",
        noun: "blends",
        /* CUT FROM EIGHT TO ONE, ON INSTRUCTION: plain tea is all this category
           pours. The seven that came out — Masala Chai, Ginger Tea, Green Tea,
           Cardamom, Lemon, Black Tea, Sulaimani, Herbal — were invented names,
           and they are the first of them to be answered rather than filled in.
           THEIR PHOTOGRAPHS STAY ON DISK: public/img/variety-*-tea.webp and
           variety-sulaimani.webp are unreferenced now, not deleted, because
           "one tea" is a client answer and client answers change. Putting a
           name back is a line; re-cropping eight tiles is an afternoon. */
        varieties: [
          {
            name: "Tea",
            img: "/img/menu-tea.webp",
            cover: false,
            tint: "#C98B4B",
          },
        ],
        img: "/img/menu-tea.webp",
        alt: "A glass of masala chai with loose tea leaves",
        /* "Tea", not "Chai" — the client's word, and it matches the card
           directly under it, so the sentence and the row no longer call the
           same glass two different things. */
        label: "Tea",
        separator: ", ",
        wash: "#E5A863",
        rim: 39,
        cx: 66,
        mouth: 52,
        steam: true,
      },
      {
        key: "coffee",
        name: "Coffee",
        /* "roasts" is the site's own noun and it is a slightly odd fit: a roast
           is a bean, and what a workplace orders is a cup. Left alone until
           someone decides, because changing it changes the card on three
           pages. */
        noun: "roasts",
        /* CUT FROM SIX TO ONE, same instruction as Tea. Premium, Black, Milk
           Coffee, Strong Filter and Light Roast are out; their tiles stay on
           disk. Five of those six were the same white mug with a different
           liquid in it. */
        varieties: [
          {
            name: "Filter Coffee",
            img: "/img/variety-filter-coffee.webp",
            cover: true,
            tint: "#C98B4B",
          },
        ],
        img: "/img/menu-coffee.webp",
        alt: "South Indian filter coffee in a brass tumbler and davara",
        label: "filter coffee",
        separator: ", ",
        wash: "#C08A57",
        rim: 39,
        cx: 60,
        mouth: 37,
        steam: true,
      },
      {
        key: "milk",
        name: "Milk",
        noun: "options",
        /* CUT TO PLAIN MILK, same instruction as Tea and Coffee. Badam,
           Turmeric, Rose and Malted are out, tiles kept on disk.

           BADAM MILK LEAVING MATTERS MORE THAN THE OTHER CUTS: it was one of
           the names this site already published, it is in the ticker, and it is
           what the CARD above still shows. This list and the picture over it
           therefore disagree — see the note on `img` below. The photograph here
           is the one that arrived to replace the almond plate: plain white milk
           on a wooden board, no garnish to misread. */
        varieties: [
          {
            name: "Milk",
            img: "/img/variety-hot-milk.webp",
            cover: true,
            tint: "#E8DFC8",
          },
        ],
        /* Saffron badam milk, at the client's direction. rim IS 55, WHICH LOOKS
           LOW AND IS NOT: the glass is squat and shot from a high angle, so the
           surface is a wide open ellipse whose centre — found from the saffron
           rosette floating on it — is 55% down the frame. mouth IS THE LIQUID,
           NOT THE GLASS: 50% against the outer glass's 59. */
        img: "/img/menu-badam.webp",
        alt: "Badam milk in a glass tumbler, topped with saffron, pistachio and almond flakes",
        /* The client cut the Milk category to plain milk, so badam milk is not
           on the menu and the generic word is the specific one. */
        label: "milk",
        separator: ", ",
        wash: "#E8D480",
        rim: 55,
        cx: 50,
        mouth: 50,
        steam: true,
      },
      {
        /* "Seasonal", not "Specialty", at the client's direction — and the
           count under it could then no longer say "seasonal" too. The row's
           pattern is <number> <noun>, so the noun changed rather than being
           dropped. */
        key: "seasonal",
        name: "Seasonal",
        noun: "specials",
        /* THE ONLY CATEGORY THAT IS FULLY GROUNDED, and the only count that was
           ever confirmed. Both names are drinks this site has photographed, and
           it is the only one with more than one variety — so it is the only
           card on /menu that opens a drawer. */
        varieties: [
          {
            name: "Buttermilk",
            img: "/img/menu-buttermilk.webp",
            cover: false,
            tint: "#D1D1C7",
          },
          {
            /* RENAMED FROM "Rose Sarbath" ON INSTRUCTION — the one name on the
               page the client supplied outright rather than confirmed, which
               makes it the best sourced of the five rather than the worst.

               THE PHOTOGRAPH IS UNCHANGED AND MOSTLY SUITS IT: sabja seeds,
               lemon, mint and ice in a tall glass, which is how nannari sarbath
               is served. The liquid is pink-crimson rather than nannari syrup's
               amber-brown; commercial nannari is routinely dyed that red, so it
               is defensible rather than wrong. The true colour needs a new
               photograph, not a recrop. */
            name: "Nannari Sarbath",
            img: "/img/menu-sarbath.webp",
            cover: false,
            tint: "#C85A6B",
          },
        ],
        /* PLAIN BUTTERMILK, NOT MASALA — it ran as "Masala Buttermilk" in five
           places until the client corrected it. THE PHOTOGRAPH STILL SHOWS THE
           SPICED DRINK, so the alt describes what is in the glass rather than
           naming the drink, which keeps it true; the plate itself still needs
           replacing. */
        img: "/img/menu-buttermilk.webp",
        alt: "A glass of buttermilk topped with chopped coriander and cumin, a slice of cucumber on the rim",
        label: "buttermilk",
        separator: " and ",
        /* THE PALEST AND THE ONLY NEUTRAL ONE. Buttermilk is white; its lit band
           means #E8E8DD, and scaled to 208 that is #D1D1C7 — inside the range
           the others occupy, with barely any hue. Honest rather than a mistake:
           inventing a tint to match the other three would be a lie about what
           is in the glass. */
        wash: "#D1D1C7",
        /* recorded but not read while steam is false, so turning the plume on
           is a one-word change rather than a re-measurement */
        rim: 49,
        cx: 50,
        mouth: 59,
        /* NO PLUME. This section is built on steam and buttermilk is served
           cold — a visible plume off it is not a stylistic choice, it is wrong
           about the drink. */
        steam: false,
      },
    ],
  },
  machines: {
    eyebrow: "06 — The machines",
    headlineAccent: "Rent or buy.",
    headline: "Find your right machine.",
    /* THE CLIENT'S OWN WORDS. The line that briefly sat here was driven live
       from the calculator — "At N cups a day, all three of these fit your
       office" — which made the reader carry a number down from the section
       above, and at any realistic office size answered "all three" anyway. This
       one has one job: saying what the three machines are and that they are not
       interchangeable. */
    sub: "Three sizes, from counter-top to half a desk — each built for a different workplace.",
    /* THE CAPACITIES ARE THE CLIENT'S OWN NUMBERS — the first hard figures this
       section has had. Everything before them was read off the photographs and
       guessed.

       THEY ARE RANGES, NOT POINTS: under 100, 100–200, 200–500. A single figure
       reads as a rating a machine is certified to and invites "what happens at
       101?"; a band says which office each unit is FOR.

       NO NAMES ON ANY OF THE THREE, at the client's direction. The brands came
       off the cards, and one of them was wrong anyway — the middle unit carries
       a visible CHACONY mark and had been labelled "Tata's" and "Chai Point"
       before that. With no name there is no claim left to be wrong.

       THE FILENAMES STILL CARRY THE BRANDS, and an image URL is visible to
       anyone who opens the network tab. Renaming them is the fix if the removal
       is meant to reach that far; uploading replacements through the panel
       achieves the same thing, because an uploaded file is named by its
       content hash. */
    machines: [
      {
        key: "small",
        src: "/img/machine-cothas.png",
        /* The set before this capped the smallest at 50, which is exactly the
           line section 05 starts recommending a machine at — so it could only
           ever have served an office that section was telling to stay on
           flasks. At 100 it covers the commonest office that crosses the line
           at all. */
        from: null,
        cap: 100,
        aspect: 900 / 754,
      },
      {
        key: "medium",
        src: "/img/machine-chaipoint.png",
        from: 100,
        cap: 200,
        aspect: 1290 / 1219,
      },
      {
        key: "large",
        /* the brief asks for machine-brewmax.png; that file was renamed to
           -clean when its retouched replacement landed, and this is it */
        src: "/img/machine-brewmax-clean.png",
        from: 200,
        /* 500 rather than the Infinity it once carried, so section 05's
           fallback is what selects this unit above that rather than the band
           claiming to cover everything. */
        cap: 500,
        aspect: 1278 / 1230,
      },
    ],
  },
  story: {
    eyebrow: "08 — Our story",
    headlineLead: "One",
    headlineAccent: "growing journey.",
    /* ONE CORRECTION TO THE CLIENT'S SHEET, AND IT WAS NEEDED. The sheet lists
       "2022 TO 2024" for the growth stretch and then 2024 AGAIN for Trichy. On
       a poster the eye forgives a repeated year; here the numeral would have
       shown 2024, moved on, and come back to it — a story that goes backwards,
       and a rail carrying the same stop twice. The growth stretch is therefore
       2022–2023 and 2024 belongs to Trichy alone. If the client confirms the
       growth ran into 2024, change the span and merge the two.

       THE CAPTIONS ARE THE ONLY WORDS HERE THAT ARE NOT OFF THE SHEET, and they
       are the client's all the same — they come from the timeline reference and
       the background plate they supplied. Each restates the body above it
       rather than making a new claim, and none asserts a number, a date or a
       capability the sheet does not.

       TITLES ARE STORED IN SENTENCE CASE and uppercased in CSS. The sheet sets
       them in caps; caps in the markup is what makes a screen reader spell
       "COVID IMPACT" letter by letter. */
    milestones: [
      {
        key: "start",
        img: "/img/story-2019.webp",
        year: "2019",
        span: "",
        title: "Started in 200 sq. ft.",
        body: "Hotcups began from a humble 200 sq. ft. space.",
        bullets: [],
        caption: "It started small.",
        icon: "shop",
      },
      {
        key: "covid",
        img: "/img/story-2020.webp",
        year: "2020",
        span: "",
        title: "Faced COVID",
        body: "The world stopped. We chose to survive, adapt and keep moving.",
        bullets: [],
        caption: "We kept going.",
        icon: "cup",
      },
      {
        key: "impact",
        img: "/img/story-2021.webp",
        year: "2021",
        span: "",
        title: "COVID impact",
        body: "COVID continued to impact business, but it strengthened our foundation.",
        bullets: [],
        caption: "We adapted.",
        icon: "people",
      },
      {
        key: "growth",
        img: "/img/story-2022.webp",
        year: "2022",
        span: "through 2023",
        title: "30%+ growth YoY",
        body: "Consistent growth, stronger team, happier customers, scalable operations.",
        bullets: [],
        caption: "We grew.",
        icon: "chart",
      },
      {
        key: "trichy",
        img: "/img/story-2024.webp",
        year: "2024",
        span: "",
        title: "Establishment in Trichy & moved to 2,500 sq. ft.",
        body: "Expanded our footprint and upgraded to serve more, better.",
        bullets: [],
        caption: "We expanded.",
        icon: "building",
      },
      {
        key: "tech",
        img: "/img/story-2025.webp",
        year: "2025",
        span: "",
        title: "Stepped into technology",
        body: "Making impact for bigger corporates, other cities and states with our vending solutions.",
        bullets: [],
        caption: "We got smarter.",
        icon: "machine",
      },
      {
        key: "ecosystem",
        img: "/img/story-2026.webp",
        year: "2026",
        span: "",
        title: "Building the beverage ecosystem",
        body: "",
        /* THE TWO HARD NUMBERS THE SITE CLAIMS ABOUT THE BUSINESS, verbatim
           from the client. They go live as public statements. */
        bullets: [
          "50+ machines deployed",
          "RFID technology incorporated for corporate vending machines",
          "In-house pantry services",
          "Moved from a traditional delivery business to beverage ecosystem infrastructure provider",
        ],
        caption: "Building what's next.",
        icon: "sprout",
      },
    ],
  },
  whoWeServe: {
    eyebrowLead: "The",
    headlineTail: "kinds of workplace, one round.",
    sub: "Not on the list? The round goes wherever there are people waiting on a hot drink — tell us where you are.",
    /* SIX REAL SEGMENTS RATHER THAN FIVE AND AN "OTHER". The invitation to
       everyone else lives in the sub-copy above instead of as a seventh chip —
       and Events & functions, which IS the seventh, is not that: it is the only
       entry here that is not a workplace at all. Everything else is somewhere
       people go to work and the round runs to them twice a day; a wedding is a
       single day with a counter in it. */
    places: [
      {
        key: "office",
        name: "IT & offices",
        /* SWAPPED FROM wp-office.webp at the client's direction, for a
           photograph they supplied. THE BRANDING LEFT THE FRAME WITH IT: the
           old plate had HOTCUPS cups on every desk, this one is a bean-to-cup
           machine and plain white cups. The client was asked and chose the
           better photograph over the branded one. */
        src: "/img/wp-office-pantry.webp",
        caption: "desk-side, twice a day",
        fact: "Desk-side delivery, morning and evening.",
        placeholder: true,
        forPhrase: "an office",
        askPhrase: "an office",
      },
      {
        key: "factory",
        name: "Manufacturing",
        src: "/img/wp-factory.webp",
        caption: "three shifts, 2,000 cups a day",
        /* THE ONE LINE ON THIS LIST THAT CAME FROM THE CLIENT. */
        fact: "Three-shift factories, including 2,000 cups a day in Coimbatore.",
        placeholder: false,
        forPhrase: "a factory",
        askPhrase: "a factory",
      },
      {
        key: "hospital",
        name: "Hospitals",
        src: "/img/wp-hospital.webp",
        caption: "round the clock",
        fact: "Round the clock, including night shifts.",
        placeholder: true,
        forPhrase: "a hospital",
        askPhrase: "a hospital",
      },
      {
        key: "college",
        name: "Colleges & schools",
        src: "/img/wp-college.webp",
        caption: "between classes",
        fact: "Campuses served between classes.",
        placeholder: true,
        forPhrase: "a campus",
        askPhrase: "a college campus",
      },
      {
        key: "retail",
        name: "Retail shops",
        src: "/img/wp-retail.webp",
        caption: "through peak hours",
        fact: "Peak hours covered, without leaving the counter.",
        placeholder: true,
        forPhrase: "a shop",
        askPhrase: "a retail shop",
      },
      {
        key: "showroom",
        name: "Showrooms & banks",
        /* STILL A STAND-IN, JUST A BETTER ONE. wp-branch.webp is the client's
           own photograph and is lit and staged far better than the generic
           stock office it replaced, but it is AN OPEN-PLAN OFFICE, not a
           showroom floor or a bank branch: the slot still does not have a
           picture of the thing it names. The showroom photograph is being
           shot. */
        src: "/img/wp-branch.webp",
        /* DELIBERATELY NOT "through peak hours" — that is Retail's line, and
           the two segments would read as the same thing. A shop serves its own
           staff across a busy day; a showroom or a branch serves the customer
           sitting in front of a desk waiting. That difference is the reason
           both are on the list. */
        caption: "for the customers waiting",
        fact: "Showroom floors and bank branches, where customers are served while they wait.",
        placeholder: true,
        forPhrase: "a showroom",
        askPhrase: "a showroom or bank branch",
      },
      {
        key: "event",
        name: "Events & functions",
        src: "/img/wp-event.webp",
        /* EVERY OTHER CAPTION HERE IS A CADENCE — twice a day, three shifts,
           round the clock, between classes, through peak hours, for the
           customers waiting. An event has no cadence; it has a day. */
        caption: "for as long as the hall is full",
        fact: "Weddings and functions, poured at the counter through the day.",
        placeholder: true,
        forPhrase: "an event",
        askPhrase: "a wedding or function",
      },
    ],
  },
  contact: {
    /* NO TRAILING STOP — askFor() adds it, and where it lands is the one
       thing that differs between the plain message and the one naming a
       workplace. */
    ask: "Hi Hotcups — we'd like a price per cup and a first delivery date",
    phoneLabel: "+91 97504 97509",
    phoneE164: "+919750497509",
    whatsapp: "919750497509",
    email: "refresh@hotcups.co.in",
    addressLines: ["No 117, Nethaji Road,", "Madurai 625001"],
    socials: [
      {
        key: "instagram",
        label: "Instagram",
        href: "https://www.instagram.com/hotcupsmadurai",
      },
      {
        key: "facebook",
        label: "Facebook",
        href: "https://www.facebook.com/hotcupsmadurai",
      },
      {
        key: "youtube",
        label: "YouTube",
        href: "https://www.youtube.com/@praneeshafoodandbeverageho6054",
      },
    ],
  },
  stats: {
    cups: 18_000,
    organisations: 500,
  },
  posts: [
    {
      id: "plan-supply",
      tag: "Guide",
      read: "4 min",
      title: "How to plan beverage supply for your workplace",
      src: "/img/need-bulk.jpg",
      alt: "Flasks and cups laid out for a bulk workplace order",
      /* EMPTY, AND DELIBERATELY SO. The three posts shipped as headlines on a
         strip; writing their bodies is the client's job, not a default's. A
         seeded article would be invented copy about the client's own trade,
         which is the one thing this whole file keeps refusing to do. */
      summary: "",
      body: "",
    },
    {
      id: "tea-vs-coffee",
      tag: "Trends",
      read: "5 min",
      title: "Tea vs Coffee: what works best for your team?",
      src: "/img/chai-classroom-wide.jpg",
      alt: "A tray of chai glasses being shared around a room",
      summary: "",
      body: "",
    },
    {
      id: "recurring-supply",
      tag: "Business",
      read: "4 min",
      title: "Why recurring supply improves productivity",
      src: "/img/need-recurring.jpg",
      alt: "A standing weekly delivery of Hotcups flasks",
      summary: "",
      body: "",
    },
  ],
  cases: [
    {
      id: "id",
      src: "/img/case-story-1.webp",
      title: "No QR. Just tap your ID and drink.",
      /* EMPTY. The three shipped as claims about the product; writing them up
         means naming a customer, and that needs their sign-off rather than a
         default. */
      summary: "",
      body: "",
    },
    {
      id: "menu",
      src: "/img/case-story-2.webp",
      title: "One machine. Your office’s favourite drinks.",
      summary: "",
      body: "",
    },
    {
      id: "rush",
      src: "/img/case-story-3.webp",
      title: "When the whole office wants chai at once.",
      summary: "",
      body: "",
    },
  ],
};

/* ---------------------------------------------------------------
   DERIVED — the one place a stored number becomes a string on screen.

   Both the hero badge and the header dock used to call toLocaleString
   themselves, which meant the number and its presentation could be changed in
   one and not the other; the two are never on screen together (exactly one
   renders at any width) so a visitor dragging a window across 1280px was the
   only person who would ever have caught it. lib/cups made it derived for that
   reason and this keeps it derived now that the number is editable.

   THE PLUS IS NOT OPTIONAL AND IS NOT A FIELD. It is what makes the figure an
   approximation rather than a count — "more than eighteen thousand". Without it
   the line claims an exact daily total, which is a stronger and less
   defensible thing to say. Making it a checkbox in the panel would invite
   someone to turn it off.
   --------------------------------------------------------------- */

/**
 * "1 blend", "2 specials" — the line under a drink's name.
 *
 * DERIVED, AND THAT IS THE WHOLE POINT OF THIS FUNCTION. The same four drinks
 * appear in three places on this site: section 02 on the home page, the /menu
 * page, and the row on /service. /menu already computed its count from the
 * length of its own variety list; the other two carried the string typed out by
 * hand. Menu.tsx records what that cost the last time the client changed
 * something: "/menu derives its count from the list of names, so it changed
 * itself; this one and /service are typed by hand and had to be corrected to
 * match." Three copies, one of which updates itself, is a guarantee that the
 * other two will eventually be wrong.
 *
 * So there is no `count` field any more. All three call this.
 *
 * SINGULAR MATTERS, and it is a slice rather than a rule. Every noun here was
 * written as a plural because every count was above one; cutting Tea to a
 * single entry made the card print "1 blends". All four nouns are regular —
 * blends, roasts, options, specials — so dropping the "s" is enough, and a
 * category that reaches zero reads "0 blends", which is correct. A noun with an
 * irregular plural would need a real rule; the panel's hint asks for regular
 * ones, which is the cheap half of that problem.
 */
export function drinkCount(drink: {
  noun: string;
  varieties: unknown[];
}): string {
  const n = drink.varieties.length;
  return `${n} ${n === 1 ? drink.noun.replace(/s$/, "") : drink.noun}`;
}

/**
 * "2019 – 2026", off the stops themselves.
 *
 * DERIVED, because it was typed out by hand directly above a list that already
 * said it. The same fault the drinks count and the machine bands each had: add
 * a stop and the range under the headline is quietly wrong, and nothing fails.
 *
 * AN EN DASH, NOT A HYPHEN, and the spaces are deliberate. An en dash is the
 * mark for a range; the section's own note records that a hyphen at 0.22em of
 * tracking read as "a long low bar between two numbers".
 */
export function storyRange(milestones: { year: string; span: string }[]): string {
  if (milestones.length === 0) return "";
  const first = milestones[0].year;
  const last = milestones[milestones.length - 1];
  /* THE LAST STOP'S SPAN WINS IF IT HAS ONE. A final stop reading "2025 /
     through 2027" ends the story in 2027, not 2025 — the span is where the
     period actually closes. */
  const end = lastYearIn(last.span) ?? last.year;
  return first === end ? first : `${first} – ${end}`;
}

/**
 * "Seven years." — the count, in words.
 *
 * FROM THE FIRST YEAR TO THE LAST rather than from the number of stops. Seven
 * stops happen to span seven years here, and that is a coincidence of this
 * particular list: the 2022 stop covers two years and 2023 has no stop of its
 * own. Counting stops would say "seven" for a list running 2019 to 2030.
 *
 * WORDS UP TO TWELVE, then digits. "Seven years." is the client's headline and
 * a spelled number is what a headline wants; past twelve the convention flips
 * and "Fourteen years." starts to look like a mistake.
 */
const WORDS = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six",
  "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
];

export function storyYears(
  milestones: { year: string; span: string }[],
): string {
  if (milestones.length === 0) return "";
  const first = Number(milestones[0].year);
  const last = milestones[milestones.length - 1];
  const end = Number(lastYearIn(last.span) ?? last.year);
  if (!Number.isFinite(first) || !Number.isFinite(end)) return "";

  /* INCLUSIVE. 2019 to 2026 is seven years of trading, not the six the
     subtraction alone gives — the first year counts. */
  const n = end - first;
  if (n < 1) return "";
  const word = n < WORDS.length ? WORDS[n] : String(n);
  return `${word} ${n === 1 ? "year" : "years"}.`;
}

/** The last four-digit year mentioned in a span like "through 2023". */
function lastYearIn(span: string): string | null {
  const found = span.match(/\d{4}/g);
  return found ? found[found.length - 1] : null;
}

/**
 * "Six" — how many workplaces there are, in words, for the headline.
 *
 * DERIVED, AND IT WAS ALREADY WRONG BEFORE IT WAS. /who-we-serve reads "The
 * six" over "Six kinds of workplace, one round." and there are seven on the
 * page: Events & functions was added to the list and the two places counting
 * it were not. Nothing failed, nothing was flagged, and it went live.
 *
 * Capitalised, because both places it lands are the start of a line.
 */
export function workplaceCount(places: unknown[]): string {
  const n = places.length;
  return n < WORDS.length ? WORDS[n] : String(n);
}

/**
 * The Metadata object for one route.
 *
 * ONE FUNCTION FOR ALL SEVEN PAGES, so the suffix rule and the noindex rule
 * exist once. Each page's `generateMetadata` reads the store and calls this.
 *
 * THE HOME PAGE TAKES NO SUFFIX. Its title is already a whole sentence ending
 * in the brand — "Hotcups — Recharges you. Twice a day." — and appending
 * " — Hotcups" to that gives it the name twice.
 */
export function metadataFor(seo: SeoContent, path: string) {
  const page = seo.pages.find((p) => p.path === path) ?? seo.pages[0];
  const title =
    path === "/" ? page.title : `${page.title}${seo.titleSuffix}`;

  return {
    title,
    description: page.description,
    /* UNDEFINED RATHER THAN AN EMPTY ARRAY when there are none: Next renders
       <meta name="keywords" content=""> for the empty list, which is a tag
       asserting the page has no subject. */
    keywords: page.keywords.length > 0 ? page.keywords : undefined,
    robots: {
      /* THE SITE-WIDE SWITCH WINS. It is the pre-launch close, so a page that
         thinks it is indexable must not be able to overrule it. */
      index: !seo.noindexAll && !page.noindex,
      /* follow STAYS TRUE even when the page is closed. noindex says "do not
         list this page"; nofollow says "do not trust the links on it", which is
         a different and stronger claim — and the stubs' links go to pages that
         SHOULD be indexed. Both stubs already made exactly this distinction. */
      follow: true,
    },
  };
}

/**
 * The structured-data block for one route, ready to render, or null.
 *
 * SEPARATE FROM metadataFor BECAUSE NEXT'S METADATA API HAS NO SLOT FOR IT.
 * JSON-LD goes in a <script> element the page renders itself; every other
 * field on this screen goes through generateMetadata. Two mechanisms, so two
 * functions, rather than one that returns a Metadata object with a stowaway.
 *
 * NOTHING FOR A CLOSED PAGE. A page kept out of search has no use for markup
 * describing it to search engines, and leaving it there would mean the one
 * screen that says "hidden" was not telling the whole truth.
 */
export function jsonLdFor(seo: SeoContent, path: string): string | null {
  if (seo.noindexAll) return null;
  const page = seo.pages.find((p) => p.path === path);
  if (!page || page.noindex || !page.schema) return null;
  return jsonLdScript(page.schema);
}

export function cupsLabel(cups: number): string {
  /* Under 1,000 there is no K to take, and "0.5K+" is not a thing anyone
     writes. Grouped with the Indian locale, matching the rest of the site. */
  if (cups < 1000) return `${cups.toLocaleString("en-IN")}+`;
  /* One decimal only when it is not a round thousand: 18000 -> "18K+" as the
     client asked, 18500 -> "18.5K+" rather than "18.5000000001K+". */
  const k = cups / 1000;
  return `${Number.isInteger(k) ? k : Number(k.toFixed(1))}K+`;
}

/* ---------------------------------------------------------------
   PARSING

   MERGE, DO NOT REJECT. Every field falls back to its default
   INDEPENDENTLY, so a content.json from an older build — or one an operator
   has hand-edited into a partial state — still produces a complete object.
   The failure mode this rules out is the important one: a malformed file
   taking down the home page rather than one stale phone number.
   --------------------------------------------------------------- */

const str = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() !== "" ? v : fallback;

/** Deliberately allows "" through, unlike `str`. An empty href is how the
    panel expresses "we do not have this account", and the renderers treat
    empty and null the same way. */
const href = (v: unknown, fallback: string | null): string | null => {
  if (v === null) return null;
  if (typeof v !== "string") return fallback;
  return v.trim() === "" ? null : v.trim();
};

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;

/** A list of non-empty strings, or the fallback. Headline lines are a list and
    an empty one would render a headline with no words in it.

    NOT called `lines`: parseContent already has a local by that name for the
    address, and the shadowing was a use-before-declaration error rather than a
    silent bug — but `strList` says what it does without needing that luck. */
const strList = (v: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(v)) return fallback;
  const kept = v.filter(
    (l): l is string => typeof l === "string" && l.trim() !== "",
  );
  return kept.length ? kept : fallback;
};

const button = (v: unknown, fallback: HeroButton): HeroButton => {
  const b = (v ?? {}) as Record<string, unknown>;
  return {
    label: str(b.label, fallback.label),
    href: str(b.href, fallback.href),
  };
};

const ground = (v: unknown, fallback: HeroGround): HeroGround =>
  v === "warm" || v === "cool" ? v : fallback;

/**
 * A percentage of the frame.
 *
 * CLAMPED, NOT JUST TYPE-CHECKED. rim, cx and mouth position the steam plume
 * against the photograph, and a value outside 0-100 does not fail — it renders,
 * with the plume somewhere off the card. Menu.tsx records the version of this
 * that shipped: a stale `rim` left "the steam base hanging 6 points ABOVE the
 * rim it was supposed to sit on", which is the kind of wrong that looks like a
 * rendering bug rather than a data one.
 */
const pct = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(100, Math.max(0, v))
    : fallback;

/**
 * The drinks inside a category.
 *
 * EACH ONE FALLS BACK TO THE FIRST OF THE DEFAULTS, not to the one at its own
 * index — a third variety added in the panel has no counterpart to fall back
 * on, and the first is a working tile rather than nothing.
 */
const varietiesOf = (
  v: unknown,
  fallback: VarietyContent[],
): VarietyContent[] => {
  if (!Array.isArray(v) || v.length === 0) return fallback;
  const base = fallback[0];
  return v.map((item) => {
    const x = (item ?? {}) as Record<string, unknown>;
    return {
      name: str(x.name, base.name),
      /* "" IS A REAL VALUE HERE, so this is not `str` — an empty path is how a
         drink says it has no photograph yet, and the tile draws a tumbler in
         its tint instead. */
      img: typeof x.img === "string" ? x.img.trim() : base.img,
      cover: typeof x.cover === "boolean" ? x.cover : base.cover,
      tint: hex(x.tint, base.tint),
    };
  });
};

/**
 * A fraction of the frame — 0 to 1.
 *
 * The steam origin is stored the way the canvas consumes it, and a value
 * outside the frame does not fail: the plume simply rises from somewhere off
 * the picture, which reads as the effect being broken rather than as a number
 * being wrong.
 */
const frac2 = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(1, Math.max(0, v))
    : fallback;

/** A CSS hex colour, or the fallback. The wash is painted straight into a
    gradient, so anything that is not a colour renders as no colour at all —
    which is a drink card with its glow silently missing. */
const hex = (v: unknown, fallback: string): string =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim())
    ? v.trim().toUpperCase()
    : fallback;

export function parseContent(raw: unknown): SiteContent {
  const d = DEFAULT_CONTENT;
  if (typeof raw !== "object" || raw === null) return d;
  const o = raw as Record<string, unknown>;

  /* ---- hero ----
     THE SLIDE COUNT COMES FROM THE FILE. It was pinned to the defaults because
     Hero.tsx carried a literal ["dark", "light", "light"] tone array, so a
     fourth slide would have had no tone and told the header to light itself for
     `undefined`. That array is derived now — one dark for the WebGL scene at
     index 0, one light per stored slide — and there is nothing left that cares
     how many there are.

     THESE ARE THE SLIDES THAT CAN BE ADDED, not the whole carousel. Slide one
     is a shader rather than a photograph and is not in this list at all; the
     dots a visitor sees are always one more than its length. */
  const h = (o.hero ?? {}) as Record<string, unknown>;
  const hf = (h.flask ?? {}) as Record<string, unknown>;
  const storedSlides = Array.isArray(h.slides) ? h.slides : [];

  const hero: HeroContent = {
    flask: {
      subject: str(hf.subject, d.hero.flask.subject),
      poster: str(hf.poster, d.hero.flask.poster),
      steam: {
        u: frac2(
          (hf.steam as Record<string, unknown>)?.u,
          d.hero.flask.steam.u,
        ),
        v: frac2(
          (hf.steam as Record<string, unknown>)?.v,
          d.hero.flask.steam.v,
        ),
      },
      ground: hf.ground === "roast" ? "roast" : "deep",
      flip: typeof hf.flip === "boolean" ? hf.flip : d.hero.flask.flip,
      groundHex: /^#[0-9a-fA-F]{6}$/.test(String(hf.groundHex ?? ""))
        ? String(hf.groundHex).toUpperCase()
        : "",
      alt: str(hf.alt, d.hero.flask.alt),
      lines: strList(hf.lines, d.hero.flask.lines),
      /* strList, not str. A document saved before the accent became an array
         holds a bare string here; strList returns the default for anything
         that is not an array of strings, so an old file falls back to
         ["Twice a day."] rather than to a character-by-character list. */
      accent: strList(hf.accent, d.hero.flask.accent),
      sub: str(hf.sub, d.hero.flask.sub),
      primary: button(hf.primary, d.hero.flask.primary),
      secondary: button(hf.secondary, d.hero.flask.secondary),
    },
    slides: (storedSlides.length ? storedSlides : d.hero.slides).map(
      (item, i) => {
      const k = (item ?? {}) as Record<string, unknown>;
      /* The i-th default where there is one, and the FIRST otherwise — a fourth
         slide has no counterpart, and slide two's values are a working slide
         rather than nothing. */
      const fallback = d.hero.slides[i] ?? d.hero.slides[0];
      const img = (k.image ?? {}) as Record<string, unknown>;
      return {
        id:
          typeof k.id === "string" && k.id.trim()
            ? k.id.trim()
            : `slide-${i + 2}`,
        lines: strList(k.lines, fallback.lines),
        accent: strList(k.accent, fallback.accent),
        sub: str(k.sub, fallback.sub),
        primary: button(k.primary, fallback.primary),
        secondary: button(k.secondary, fallback.secondary),
        ground: ground(k.ground, fallback.ground),
        /* typeof rather than truthiness: `false` is a real stored value here and
           `k.flip || fallback.flip` would quietly refuse to turn mirroring off. */
        flip: typeof k.flip === "boolean" ? k.flip : fallback.flip,
        image: {
          src: str(img.src, fallback.image.src),
          alt: str(img.alt, fallback.image.alt),
        },
        /* Falls back to "" rather than to the fallback slide's own bg. A
           background picture is the one field here where inheriting a
           neighbour's value is worse than having none — an unset slide would
           silently pick up whatever the slide before it was photographed
           against. Empty means "gradient only", which is a valid state and
           the one every slide shipped with. */
        bg: str(k.bg, ""),
        /* hex() rather than str(): a malformed colour here would be pasted
           straight into a gradient, where CSS drops the whole declaration and
           the slide loses its background entirely. Empty on anything that is
           not six hex digits, which falls back to the named preset. */
        groundHex: /^#[0-9a-fA-F]{6}$/.test(String(k.groundHex ?? ""))
          ? String(k.groundHex).toUpperCase()
          : "",
      };
      },
    ),
  };

  /* ---- menu ----
     THE DRINK COUNT COMES FROM THE FILE, unlike the hero's slide count. That is
     a deliberate difference between two sections that otherwise parse the same
     way, so it is worth saying why each is what it is.

     The hero's three slides are three ARGUMENTS in a fixed order, and slide one
     is a WebGL canvas rather than a photograph — a fourth is a decision about
     what the site claims, not a content edit. The menu is a LIST of drinks, and
     the client has already changed what is on it more than once. Adding one is
     the ordinary thing to want.

     WHAT USED TO BLOCK IT, AND WHAT TURNED OUT NOT TO. Menu.tsx says its fourth
     steam variant must stay "because `variant` is the card's index, so deleting
     the entry would shift tea, coffee and milk onto each other's plumes", and
     this parser was written to honour that by fixing the count at four.
     CardSteam actually indexes `VARIANTS[variant % VARIANTS.length]`, so any
     count is safe — a fifth drink reuses the first drink's plume rather than
     reading past the end. The real constraint was the row's `lg:grid-cols-4`,
     which is now derived from the count. See the note in Menu.tsx.

     THE FLOOR IS ONE. An empty list renders a section with a sentence that
     names no drinks and a row with nothing in it, which is not a state anyone
     means to save; the form refuses it too, and this is the backstop. */
  const m = (o.menu ?? {}) as Record<string, unknown>;
  const storedDrinks = Array.isArray(m.drinks) ? m.drinks : [];

  /* KEYS MUST BE UNIQUE, and nothing upstream guarantees it — a drink added in
     the panel is keyed off its name, and two drinks can be called the same
     thing while a rename is half finished. A duplicate key makes React reuse
     one card's DOM for another and makes the sentence light the wrong word, so
     it is resolved here rather than trusted. */
  const usedKeys = new Set<string>();
  const uniqueKey = (raw: unknown, i: number): string => {
    const base =
      (typeof raw === "string" ? raw : "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32) || `drink-${i + 1}`;
    let key = base;
    let n = 2;
    while (usedKeys.has(key)) key = `${base}-${n++}`;
    usedKeys.add(key);
    return key;
  };

  const drinks: DrinkContent[] = (
    storedDrinks.length ? storedDrinks : d.menu.drinks
  ).map((item, i) => {
    const k = (item ?? {}) as Record<string, unknown>;
    /* The i-th default where there is one, and the FIRST otherwise — a fifth
       drink has no counterpart to fall back on, and drink one's values are a
       working card rather than nothing. */
    const fallback = d.menu.drinks[i] ?? d.menu.drinks[0];
    return {
      /* THE STORED KEY WINS, and the name is the fallback — in that order, and
         not `k.key ?? k.name`, which only catches null. A drink added in the
         panel posts an EMPTY key on purpose, so that its slug is derived from
         whatever it ended up being called rather than from a placeholder the
         form invented before it had a name. An existing drink keeps the key it
         has, so renaming "Seasonal" does not silently re-key it. */
      key: uniqueKey(
        typeof k.key === "string" && k.key.trim() ? k.key : k.name,
        i,
      ),
      name: str(k.name, fallback.name),
      noun: str(k.noun, fallback.noun),
      /* THE VARIETY LIST IS THE ONE PLACE A LENGTH IS TAKEN FROM THE FILE
         RATHER THAN FROM THE DEFAULTS, and it has to be: its length IS the
         count printed on the card, so pinning it to the defaults would make
         "2 specials" un-editable. An empty or missing list falls back, because
         a category with no drinks in it prints "0 blends" and opens an empty
         drawer. */
      varieties: varietiesOf(k.varieties, fallback.varieties),
      img: str(k.img, fallback.img),
      alt: str(k.alt, fallback.alt),
      label: str(k.label, fallback.label),
      /* NOT `str`, which rejects whitespace-only strings — and every separator
         here IS mostly whitespace. ", " and " and " would both survive str's
         trim test, but a bare " " would not, and one space is a legitimate
         separator to want. */
      separator:
        typeof k.separator === "string" ? k.separator : fallback.separator,
      wash: hex(k.wash, fallback.wash),
      rim: pct(k.rim, fallback.rim),
      cx: pct(k.cx, fallback.cx),
      mouth: pct(k.mouth, fallback.mouth),
      steam: typeof k.steam === "boolean" ? k.steam : fallback.steam,
    };
  });

  const menu: MenuContent = {
    eyebrow: str(m.eyebrow, d.menu.eyebrow),
    headline: str(m.headline, d.menu.headline),
    headlineAccent: str(m.headlineAccent, d.menu.headlineAccent),
    tail: str(m.tail, d.menu.tail),
    drinks: drinks.length ? drinks : d.menu.drinks,
  };

  /* ---- machines ----
     THE COUNT COMES FROM THE FILE. The row is a three-column grid at lg and
     wraps below it, so a fourth unit is a second row rather than a broken one,
     and section 05 picks by comparing against each `cap` in order — neither
     cares how many there are. The floor is one: an empty list leaves section 06
     a heading over nothing and section 05 with no machine to recommend. */
  const mc = (o.machines ?? {}) as Record<string, unknown>;
  const storedMachines = Array.isArray(mc.machines) ? mc.machines : [];

  const machineKeys = new Set<string>();
  const machines: MachineContent[] = (
    storedMachines.length ? storedMachines : d.machines.machines
  ).map((item, i) => {
    const k = (item ?? {}) as Record<string, unknown>;
    const fallback = d.machines.machines[i] ?? d.machines.machines[0];

    let key =
      typeof k.key === "string" && k.key.trim() ? k.key.trim() : `machine-${i + 1}`;
    while (machineKeys.has(key)) key = `${key}-2`;
    machineKeys.add(key);

    return {
      key,
      src: str(k.src, fallback.src),
      /* NULL IS A REAL VALUE, so this is not `num` — null is what prints the
         "<" on the smallest unit, and coercing it to the fallback's number
         would silently turn "< 100" into "100 – 100". */
      from:
        k.from === null
          ? null
          : typeof k.from === "number" && Number.isFinite(k.from) && k.from >= 0
            ? k.from
            : fallback.from,
      cap: num(k.cap, fallback.cap),
      /* A RATIO, SO IT MUST BE POSITIVE AND FINITE. Zero or NaN would make the
         card reserve a height of zero or of Infinity, and the second of those
         takes the page with it. */
      aspect:
        typeof k.aspect === "number" && Number.isFinite(k.aspect) && k.aspect > 0
          ? k.aspect
          : fallback.aspect,
    };
  });

  const machineSection: MachinesContent = {
    eyebrow: str(mc.eyebrow, d.machines.eyebrow),
    headlineAccent: str(mc.headlineAccent, d.machines.headlineAccent),
    headline: str(mc.headline, d.machines.headline),
    sub: str(mc.sub, d.machines.sub),
    machines: machines.length ? machines : d.machines.machines,
  };

  /* ---- story ----
     The rail draws one dot per stop and the scroll track is the stop count
     times a fixed distance, so any number works — six stops is a shorter pin,
     eight a longer one. The floor is one. */
  const st = (o.story ?? {}) as Record<string, unknown>;
  const storedStops = Array.isArray(st.milestones) ? st.milestones : [];

  const stopKeys = new Set<string>();
  const milestones: MilestoneContent[] = (
    storedStops.length ? storedStops : d.story.milestones
  ).map((item, i) => {
    const k = (item ?? {}) as Record<string, unknown>;
    const fallback = d.story.milestones[i] ?? d.story.milestones[0];

    let key =
      typeof k.key === "string" && k.key.trim() ? k.key.trim() : `stop-${i + 1}`;
    while (stopKeys.has(key)) key = `${key}-2`;
    stopKeys.add(key);

    return {
      key,
      year: str(k.year, fallback.year),
      /* "" IS THE COMMON CASE, so this is not `str` — six of the seven stops
         have no span and an empty one is the answer rather than a missing
         value. */
      span: typeof k.span === "string" ? k.span.trim() : fallback.span,
      title: str(k.title, fallback.title),
      body: typeof k.body === "string" ? k.body.trim() : fallback.body,
      bullets: Array.isArray(k.bullets)
        ? k.bullets.filter(
            (b): b is string => typeof b === "string" && b.trim() !== "",
          )
        : fallback.bullets,
      caption: str(k.caption, fallback.caption),
      /* A NAME THE RAIL KNOWS, or the fallback's. An unknown one would draw
         nothing and leave a gap under that stop with no sign of why. */
      icon: STORY_ICONS.includes(k.icon as StoryIcon)
        ? (k.icon as StoryIcon)
        : fallback.icon,
      img: str(k.img, fallback.img),
    };
  });

  const story: StoryContent = {
    eyebrow: str(st.eyebrow, d.story.eyebrow),
    headlineLead: str(st.headlineLead, d.story.headlineLead),
    headlineAccent: str(st.headlineAccent, d.story.headlineAccent),
    milestones: milestones.length ? milestones : d.story.milestones,
  };

  /* ---- who we serve ---- */
  const ws = (o.whoWeServe ?? {}) as Record<string, unknown>;
  const storedPlaces = Array.isArray(ws.places) ? ws.places : [];

  const placeKeys = new Set<string>();
  const places: WorkplaceContent[] = (
    storedPlaces.length ? storedPlaces : d.whoWeServe.places
  ).map((item, i) => {
    const k = (item ?? {}) as Record<string, unknown>;
    const fallback = d.whoWeServe.places[i] ?? d.whoWeServe.places[0];
    const name = str(k.name, fallback.name);

    /* KEYED OFF THE NAME WHERE THERE IS NO KEY. It is no longer a typed union,
       so nothing upstream guarantees uniqueness — and two places sharing one
       would have React reuse a card's DOM for the other and the chip row light
       the wrong one. */
    let key =
      typeof k.key === "string" && k.key.trim()
        ? k.key.trim()
        : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
          `place-${i + 1}`;
    while (placeKeys.has(key)) key = `${key}-2`;
    placeKeys.add(key);

    return {
      key,
      name,
      src: str(k.src, fallback.src),
      caption: str(k.caption, fallback.caption),
      fact: str(k.fact, fallback.fact),
      /* DEFAULTS TO TRUE WHERE IT IS MISSING, which is the cautious direction:
         an unmarked fact is treated as unconfirmed rather than as the client's
         word. Only one of the seven is actually theirs. */
      placeholder: typeof k.placeholder === "boolean" ? k.placeholder : true,
      forPhrase: str(k.forPhrase, fallback.forPhrase),
      askPhrase: str(k.askPhrase, fallback.askPhrase),
    };
  });

  const whoWeServe: WhoWeServeContent = {
    eyebrowLead: str(ws.eyebrowLead, d.whoWeServe.eyebrowLead),
    headlineTail: str(ws.headlineTail, d.whoWeServe.headlineTail),
    sub: str(ws.sub, d.whoWeServe.sub),
    places: places.length ? places : d.whoWeServe.places,
  };

  /* ---- activity ----
     KEPT AS IT IS FOUND, only bounded and shape-checked. It is a record of
     things that happened; rewriting entries would make it a record of nothing.
     A document with no log yet gets an empty one rather than the defaults'. */
  const activity: ActivityEntry[] = (
    Array.isArray(o.activity) ? o.activity : []
  )
    .map((item) => {
      const a = (item ?? {}) as Record<string, unknown>;
      return {
        at: typeof a.at === "string" ? a.at : "",
        section: typeof a.section === "string" ? a.section : "",
        summary: typeof a.summary === "string" ? a.summary : "",
      };
    })
    .filter((a) => a.at && a.summary)
    .slice(0, ACTIVITY_LIMIT);

  /* ---- seo ----
     THE PAGE LIST IS PINNED TO THE DEFAULTS, unlike every other list in this
     file. These are not content someone adds — each row is a ROUTE that exists
     in the app directory, so a stored document offering an eighth would be
     describing a page nobody can visit, and a document missing one would leave
     a real page with no title. The rows are the app's routes; only what is IN
     them is editable. */
  const se = (o.seo ?? {}) as Record<string, unknown>;
  const storedPages = Array.isArray(se.pages) ? se.pages : [];

  const seo: SeoContent = {
    /* Trailing slash stripped here rather than at every use — every path joined
       to it already starts with one, and "https://x.com//menu" is a different
       URL to a crawler. */
    siteUrl:
      typeof se.siteUrl === "string"
        ? se.siteUrl.trim().replace(/\/+$/, "")
        : d.seo.siteUrl,
    titleSuffix:
      typeof se.titleSuffix === "string"
        ? se.titleSuffix
        : d.seo.titleSuffix,
    noindexAll:
      typeof se.noindexAll === "boolean" ? se.noindexAll : d.seo.noindexAll,
    pages: d.seo.pages.map((fallback) => {
      /* MATCHED BY PATH, NOT BY INDEX. A route added to the defaults in the
         middle of the list would otherwise shift every stored title onto the
         wrong page — silently, and in the one place where being silently wrong
         is a search result. */
      const k = (storedPages.find(
        (x) => (x as Record<string, unknown>)?.path === fallback.path,
      ) ?? {}) as Record<string, unknown>;
      return {
        path: fallback.path,
        title: str(k.title, fallback.title),
        description: str(k.description, fallback.description),
        noindex:
          typeof k.noindex === "boolean" ? k.noindex : fallback.noindex,
        /* Trimmed and de-duplicated on the way IN as well as on the way out of
           the form, because a hand-edited content.json is the other way this
           list arrives. Empty strings dropped — a trailing comma in the field
           is the normal way one appears. */
        keywords: Array.isArray(k.keywords)
          ? Array.from(
              new Set(
                k.keywords
                  .filter((w): w is string => typeof w === "string")
                  .map((w) => w.trim())
                  .filter(Boolean),
              ),
            )
          : fallback.keywords,
        /* CHECKED ON READ, NOT ONLY ON WRITE. The action validates what the
           form posts, which covers the panel; this covers the file. Markup
           that does not parse is dropped rather than carried, because the one
           place it would surface is inside a <script> on a live page. */
        schema: (() => {
          if (typeof k.schema !== "string") return fallback.schema;
          const checked = validateJsonLd(k.schema);
          return checked.ok ? checked.value : "";
        })(),
      };
    }),
  };

  const c = (o.contact ?? {}) as Record<string, unknown>;
  const s = (o.stats ?? {}) as Record<string, unknown>;

  const lines = Array.isArray(c.addressLines)
    ? c.addressLines.filter((l): l is string => typeof l === "string" && l.trim() !== "")
    : [];

  const socials = Array.isArray(c.socials)
    ? c.socials
        .map((item, i) => {
          const s = (item ?? {}) as Record<string, unknown>;
          const fallback = d.contact.socials[i];
          const key = s.key;
          if (key !== "instagram" && key !== "facebook" && key !== "youtube") {
            return null;
          }
          return {
            key,
            label: str(s.label, fallback?.label ?? key),
            href: href(s.href, fallback?.href ?? null),
          };
        })
        .filter((x): x is ContactContent["socials"][number] => x !== null)
    : [];

  const posts = Array.isArray(o.posts)
    ? o.posts.map((item, i) => {
        const p = (item ?? {}) as Record<string, unknown>;
        const fallback = d.posts[i] ?? d.posts[0];
        return {
          id: str(p.id, `post-${i + 1}`),
          tag: str(p.tag, fallback.tag),
          read: str(p.read, fallback.read),
          title: str(p.title, fallback.title),
          src: str(p.src, fallback.src),
          alt: str(p.alt, fallback.alt),
          summary: str(p.summary, ""),
          /* SANITISED ON READ AS WELL AS ON WRITE. The action cleans what the
             panel submits, which covers everything this app stores — but a
             content.json edited by hand, restored from a backup, or written
             by some future import has not been through it. This is the last
             gate before the markup reaches a page. */
          body: sanitizeHtml(str(p.body, "")),
        };
      })
    : [];

  const cases = Array.isArray(o.cases)
    ? o.cases.map((item, i) => {
        const k = (item ?? {}) as Record<string, unknown>;
        const fallback = d.cases[i] ?? d.cases[0];
        return {
          id: str(k.id, `case-${i + 1}`),
          src: str(k.src, fallback.src),
          title: str(k.title, fallback.title),
          summary: str(k.summary, ""),
          /* The last gate before this markup reaches a page — see the same
             note on posts. */
          body: sanitizeHtml(str(k.body, "")),
        };
      })
    : [];

  return {
    activity,
    seo,
    hero,
    menu,
    machines: machineSection,
    story,
    whoWeServe,
    contact: {
      /* Stops and spaces stripped on the way in rather than trusted: a stem
         saved as "…date." would build "…date. for an office." */
      ask: str(c.ask, d.contact.ask).replace(/[.\s]+$/, ""),
      phoneLabel: str(c.phoneLabel, d.contact.phoneLabel),
      phoneE164: str(c.phoneE164, d.contact.phoneE164),
      whatsapp: str(c.whatsapp, d.contact.whatsapp),
      email: str(c.email, d.contact.email),
      addressLines: lines.length ? lines : d.contact.addressLines,
      /* An EMPTY list is honoured — that is "remove every social account" —
         but a MISSING or non-array key falls back, because those mean the
         file predates the field rather than that someone chose none. */
      socials: Array.isArray(c.socials) ? socials : d.contact.socials,
    },
    stats: {
      cups: num(s.cups, d.stats.cups),
      organisations: num(s.organisations, d.stats.organisations),
    },
    posts: posts.length ? posts : d.posts,
    cases: cases.length ? cases : d.cases,
  };
}
