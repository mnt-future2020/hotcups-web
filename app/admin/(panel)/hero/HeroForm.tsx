"use client";

import { useActionState, useId, useState } from "react";
import { saveHeroAction, type SaveState } from "../../content-actions";
import SubmitButton from "../../SubmitButton";
import { Field, Notice, TextArea, ghostButton } from "../../ui";
import ImageField from "../ImageField";
import { CheckIcon } from "../icons";
import ColorField from "../ColorField";
import SlidePreview from "./SlidePreview";
import ConfirmDelete from "../ConfirmDelete";
import {
  HERO_GROUNDS,
  HERO_GROUND_LABELS,
  type HeroContent,
  groundStyle,
  FLASK_GROUNDS,
  FLASK_GROUND_LABELS,
  type FlaskGround,
  type HeroGround,
  type HeroSlideContent,
} from "@/lib/content/schema";

/**
 * The hero, all three slides, one form.
 *
 * ONE FORM BECAUSE IT IS ONE SCREEN. A visitor sees a single hero that changes
 * its mind twice, so an editor rewriting the argument is rewriting all of it.
 * Three separate forms would let slide two contradict slide three and only
 * surface it on the live page.
 *
 * THE TABS ARE A VIEW, NOT THREE FORMS — AND THE DISTINCTION IS LOAD-BEARING.
 * All three slides are stacked in one <form>, which at full height is about
 * 2,000px of scrolling for an operator who came to fix one word. The tabs show
 * one slide at a time. What they must NOT do is stop the other two from being
 * submitted: this form posts every field on every save and the action rebuilds
 * the whole hero from them, so a slide whose inputs were absent would come back
 * as a validation error ("Slide 3 needs at least one headline line") on a slide
 * nobody touched.
 *
 *   SO THE INACTIVE SLIDES ARE HIDDEN, NOT UNMOUNTED. `hidden` is display:none,
 *   and a display:none input still posts — only a DISABLED one is dropped from
 *   FormData. Conditional rendering would have been the obvious way to write
 *   this and would have silently broken every save.
 *
 *   It also means what is typed on one tab survives switching to another and
 *   back, because the inputs were never destroyed. Uncontrolled inputs with
 *   defaultValue would have lost it.
 *
 * THE BANNER STAYS OUTSIDE THE TABS. A rejected save names the slide it objects
 * to, and that message has to be readable from whichever tab is open — putting
 * it inside one would hide the explanation behind the tab the operator is least
 * likely to be looking at.
 *
 * THE HEADLINES ARE TEXTAREAS AND THE LINE BREAKS ARE REAL. On the site each
 * line is its own element that clip-reveals from below, one 90ms behind the one
 * above — SlideFlask's note explains that "a line cannot clip-reveal on its own
 * if the browser decides where it starts". So where the operator presses Enter
 * is where the line breaks, and the field is shaped like the thing it edits
 * rather than like three numbered inputs for one sentence.
 *
 * WHAT IS NOT ON THIS FORM, and why it is worth saying rather than quietly
 * omitting: the number of slides, their order, and the gradients themselves.
 * The first two are claims about what the site argues; the third is a measured
 * value — the peach ground is capped where it is because one step further the
 * orange accent line drops to 2.85:1 and fails contrast. A colour picker here
 * would be an invitation to break that without knowing.
 */
const GROUND_KEYS: HeroGround[] = ["warm", "cool"];
const FLASK_GROUND_KEYS: FlaskGround[] = ["deep", "roast"];

/** What each slide argues, for the tab and the legend. The flask slide is index
    0 and is not in the stored list, so the argument names are read off the id
    for the two that are and hardcoded for the one that is not. */
const ARGUMENT: Record<string, string> = {
  machines: "The machine",
  menu: "The menu",
};

/* A slide that has not been written yet. Cool ground and no mirroring are the
   two answers that are right more often than not: a new photograph is more
   likely to be a machine or a product than a plate of drinks, and mirroring is
   something you turn on after looking at the picture. */
const BLANK: Omit<HeroSlideContent, "id"> = {
  lines: ["", ""],
  accent: [""],
  sub: "",
  primary: { label: "Get pricing", href: "#pricing" },
  secondary: { label: "See the menu", href: "#menu" },
  /* No background picture. A new slide starts on its ground alone — the state
     that needs no decision and cannot be wrong. */
  bg: "",
  /* And on a preset ground, for the same reason. */
  groundHex: "",
  ground: "cool",
  flip: false,
  image: { src: "", alt: "" },
};

type Row = { uid: string; value: HeroSlideContent };

export default function HeroForm({ hero }: { hero: HeroContent }) {
  const [state, action] = useActionState<SaveState, FormData>(
    saveHeroAction,
    undefined,
  );

  const idBase = useId();
  const [seq, setSeq] = useState(hero.slides.length);
  /* THE ROWS ARE KEYED BY uid AND THE FIELDS INSIDE THEM STAY UNCONTROLLED,
     which is the opposite of what the Repeater does and is safe for the reason
     that one is not: nothing here reorders. A removed row unmounts and the
     survivors keep their own DOM nodes, so the values in them travel with the
     panel they belong to. A row's fields are only ever read at submit. */
  const [rows, setRows] = useState<Row[]>(() =>
    hero.slides.map((value, i) => ({ uid: `${idBase}-${i}`, value })),
  );

  /* 0 is the flask slide; 1..n index `rows`. Opening on 0 rather than
     remembering the last tab: the hero reads top to bottom and the first slide
     is the one an operator means when they say "the hero". */
  const [tab, setTab] = useState(0);

  /* A shadow of the uncontrolled fields, for the previews only — see the note
     on the <form> below. */
  const [peek, setPeek] = useState<Record<string, string>>({});

  /* Slide 1's own colour. Controlled for the same reason the slides' one is:
     the swatch row and the preview both have to follow it as it is typed. */
  const [flaskHex, setFlaskHex] = useState(hero.flask.groundHex);
  const flaskCustom = /^#[0-9a-fA-F]{6}$/.test(flaskHex.trim());
  const peeked = (name: string, stored: string) => peek[name] ?? stored;

  const add = () => {
    setTab(rows.length + 1);
    setRows((rs) => [
      ...rs,
      { uid: `${idBase}-${seq}`, value: { ...BLANK, id: `slide-${seq + 2}` } },
    ]);
    setSeq((n) => n + 1);
  };

  /* THE TWO PICTURE FIELDS ARE CONTROLLED AND THE REST OF THE ROW IS NOT,
     which contradicts the note above and is worth the exception. ImageField
     owns an upload and a crop — it has to be able to WRITE a path back after
     the crop, not just read one at submit — so its value cannot live only in
     the DOM. Everything else in a slide is still read at submit.

     Patching `value` rather than swapping the row keeps the uid, so the
     uncontrolled fields around it are not remounted and do not lose what has
     been typed into them. */
  const patch = (uid: string, part: Partial<Row["value"]>) =>
    setRows((rs) =>
      rs.map((r) => (r.uid === uid ? { ...r, value: { ...r.value, ...part } } : r)),
    );

  const remove = (uid: string) => {
    setRows((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.uid !== uid)));
    setTab((t) => Math.max(0, Math.min(t, rows.length - 1)));
  };

  const tabs = [
    { label: "Slide 1", argument: "Delivery" },
    ...rows.map((row, i) => ({
      label: `Slide ${i + 2}`,
      argument: ARGUMENT[row.value.id] ?? "",
    })),
  ];

  return (
    /* ── onInput ON THE FORM, NOT value ON FORTY INPUTS ──────────────────
       The preview under each slide has to show what is in the boxes RIGHT
       NOW, and the boxes are deliberately uncontrolled — the note at the top
       of this file explains why, and converting every headline, accent, sub
       and button label to controlled state to feed a preview would trade that
       whole design away for a picture.

       So one listener on the form mirrors whatever changed into `peek`,
       keyed by the field's own name. The inputs stay uncontrolled and keep
       owning their values; this is a read-only shadow of them that only the
       preview looks at. `onInput` rather than `onChange` because React's
       onChange on a text input already fires per keystroke but onInput is the
       one that also catches a checkbox and a radio without a second path.

       A NAME THAT IS NOT IN `peek` HAS NOT BEEN TOUCHED, which is why every
       read below falls back to the stored value rather than to "". */
    <form
      action={action}
      className="space-y-5"
      onInput={(e) => {
        const t = e.target as HTMLInputElement;
        if (!t.name) return;
        const v = t.type === "checkbox" ? String(t.checked) : t.value;
        setPeek((p) => (p[t.name] === v ? p : { ...p, [t.name]: v }));
      }}
    >
      {state ? (
        <Notice tone={state.ok ? "good" : "bad"}>{state.message}</Notice>
      ) : null}

      <input type="hidden" name="slideCount" value={rows.length} />

      {/* Add sits top right, above the tabs — see the note in Repeater.tsx. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.82rem] text-mute">
          {rows.length + 1} slides — the opening one plus {rows.length}
        </p>
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= 6}
          title={rows.length >= 6 ? "Six after the opening one is the ceiling." : undefined}
          className={`${ghostButton} disabled:cursor-not-allowed`}
        >
          Add a slide
        </button>
      </div>

      {/* ── THE TABS ──────────────────────────────────────────
          role="tab" and aria-selected rather than a bare row of buttons: without
          them a screen reader announces three unlabelled buttons and gives no
          clue that they switch what is below. type="button" on every one,
          because a <button> inside a <form> defaults to type="submit" — the
          first tab click would otherwise save the hero. */}
      <div
        role="tablist"
        aria-label="Hero slides"
        className="flex gap-1.5 overflow-x-auto rounded-full border border-line bg-cream p-1.5"
      >
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[0.85rem] font-semibold transition ${
              tab === i
                ? "bg-espresso text-cream"
                : "text-ink-soft hover:bg-white hover:text-espresso"
            }`}
          >
            {t.label}
            {/* THE SEPARATOR ONLY EXISTS IF THERE IS SOMETHING AFTER IT. A
                newly added slide has no argument name yet — ARGUMENT maps the
                three the site shipped with — and rendering the "· " regardless
                left every new tab reading "Slide 4 ·" with nothing following
                it. */}
            {t.argument ? (
              <span
                className={`ml-1.5 hidden font-normal sm:inline ${
                  tab === i ? "text-cream/60" : "text-mute"
                }`}
              >
                · {t.argument}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── SLIDE 1 ───────────────────────────────────────────── */}
      <fieldset
        /* hidden, NOT unmounted — see the note at the top of this file. The
           inputs below have to stay in the DOM so they keep posting. */
        hidden={tab !== 0}
        className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
      >
        <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
          Slide 1 · Delivery
        </legend>

        <p className="mb-4 max-w-prose text-[0.82rem] leading-relaxed text-mute">
          The dark opening slide. Its picture moves, so the background has to be
          the same scene as the photograph.
        </p>

        {/* ── THE SAME ORDER AS EVERY OTHER SLIDE ──────────────────
            This block used to open with the pictures and then the copy, while
            slides 2 and 3 open with the copy and then the pictures. Same
            fields, opposite order — so moving between tabs meant re-finding
            each one, and the two forms looked like two different screens.

            THE FIELDS THAT ARE NOT HERE ARE NOT HERE FOR A REASON, and the
            line under the buttons says which and why rather than leaving a
            silent gap. Ground and Mirror are controls for a flat plate on a
            cream gradient; this slide is a WebGL scene on a fixed dark ground
            and neither would do anything. A control that does nothing is worse
            than an absent one — it gets set, and then it gets trusted. */}
        {/* ── FIELDS LEFT, PREVIEW RIGHT AND STUCK THERE ──────────
            The preview used to sit at the bottom of this column, which is the
            one place it could not do its job: to see the effect of a headline
            you had to scroll past every other field to reach it, and by then
            the box you had just typed in was off the screen. A preview you
            cannot see at the same time as the control is a screenshot.

            `sticky` IS THE WHOLE POINT, not a flourish. It holds the slide in
            view while the fields scroll under it, so changing the ground,
            the picture or the mirror shows its result without moving.

            TOP IS 5.5rem BECAUSE THE PANEL'S BAR IS 4rem AND STICKY. Anything
            smaller parks the preview underneath it.

            ONLY AT xl. Below that the column is too narrow to give up 24rem
            without squeezing the two-up field rows into one, so it goes back
            to the foot of the form — visible on a laptop, out of the way on a
            tablet. */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-4">
          <TextArea
            label="Headline"
            name="flask_lines"
            rows={3}
            defaultValue={hero.flask.lines.join("\n")}
            hint="One line per line. Keep them close to this length — the type is sized by the screen, not by the words, so a longer line runs off the edge."
          />

          <TextArea
            label="Accent lines"
            name="flask_accent"
            rows={2}
            defaultValue={hero.flask.accent.join("\n")}
            hint="The orange half, closing the headline. One line per line."
          />

          <TextArea
            label="Sub-copy"
            name="flask_sub"
            rows={3}
            defaultValue={hero.flask.sub}
            hint="One paragraph. Each slide is on screen for seven seconds."
          />

          <FlaskImages flask={hero.flask} />

          {/* ── THE SAME THREE BLOCKS SLIDES 2 AND 3 HAVE ───────
              They were absent here and the line that stood in their place
              said they could not apply. Two of the three could — they were
              just hardcoded rather than unavailable.

              THE GROUND WAS A CLASSNAME. SlideFlask painted `bg-espresso-deep`
              and nothing could change it; it is now a stored colour with the
              same two-presets-plus-your-own control the other slides use.

              THE DESCRIPTION HAD NOWHERE TO GO, and now it does. The scene was
              aria-hidden on both its paths — the canvas and the still — so a
              field would have fed nothing. LiquidSurface now takes the text
              and turns it into role="img" + aria-label, which is how a div
              with a background-image gets announced at all.

              MIRROR IS THE ONE THAT IS STILL NOT HERE, and it is not an
              oversight. On slides 2 and 3 it reorders a plate beside a column
              of copy. Here the scrim is a radial anchored at 12% — it exists
              to hold the copy's contrast against a moving shader — so
              flipping the scene would put the flask under the words and the
              words on open canvas. It needs the scrim and the copy side to
              swap with it, which is a change to the slide rather than a
              checkbox on a form. */}
          <fieldset>
            <legend className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Colour behind the picture
            </legend>
            <div className="flex gap-2.5">
              {FLASK_GROUND_KEYS.map((k) => (
                <label key={k} className="group relative flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="flask_ground"
                    value={k}
                    defaultChecked={hero.flask.ground === k}
                    onChange={() => setFlaskHex("")}
                    className="peer sr-only"
                  />
                  <span
                    className={`block h-14 rounded-xl border border-line transition peer-checked:border-orange peer-checked:ring-2 peer-checked:ring-orange/30 peer-focus-visible:ring-4 peer-focus-visible:ring-orange/40 group-hover:border-orange/50 ${
                      flaskCustom ? "opacity-40" : ""
                    }`}
                    style={{ background: FLASK_GROUNDS[k] }}
                  />
                  <span
                    aria-hidden
                    className={`absolute right-1.5 top-1.5 hidden size-5 place-items-center rounded-full bg-orange text-white shadow ${
                      flaskCustom ? "" : "peer-checked:grid"
                    }`}
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span
                    className={`mt-1.5 block text-[0.78rem] leading-snug transition ${
                      flaskCustom
                        ? "text-mute/60"
                        : "text-mute peer-checked:font-bold peer-checked:text-orange-deep"
                    }`}
                  >
                    {FLASK_GROUND_LABELS[k]}
                  </span>
                </label>
              ))}

              {flaskCustom ? (
                <div className="relative flex-1">
                  <span
                    className="block h-14 rounded-xl border border-orange ring-2 ring-orange/30"
                    style={{ background: flaskHex }}
                  />
                  <span
                    aria-hidden
                    className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-orange text-white shadow"
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                  <span className="mt-1.5 block text-[0.78rem] font-bold leading-snug text-orange-deep">
                    Your colour · {flaskHex.toUpperCase()}
                  </span>
                </div>
              ) : null}
            </div>
            <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">
              {flaskCustom
                ? "Your own colour is in use. Click either of the two above to go back to them."
                : "Two dark options — this slide's headline is cream, so the ground has to stay dark enough to hold it."}
            </p>
          </fieldset>

          <div className="rounded-xl border border-line bg-white p-3.5">
            {/* MEASURED AGAINST CREAM, NOT ORANGE. On slides 2 and 3 the risky
                pairing is the orange accent on a pale ground; here the whole
                headline is cream on a dark one, so that is what the ground has
                to hold. Same control, correct opponent. */}
            <ColorField
              label="Or a colour of your own"
              name="flask_groundHex"
              value={flaskHex}
              onChange={setFlaskHex}
              placeholder="#240A06"
              against="#FFF7F0"
              againstLabel="the cream headline"
              need={4.5}
              hint="Leave empty to use one of the two above. Anything here wins over them."
            />
          </div>

          <PictureSide name="flask_flip" left={hero.flask.flip} />

          <Field
            label="Picture description"
            name="flask_alt"
            defaultValue={hero.flask.alt}
            hint="Describe what is in the picture. Not the headline. Leave empty and the scene stays hidden from screen readers, which is right if it is only atmosphere."
          />

          {/* LAST, AS ON EVERY OTHER SLIDE. They were above the ground here
              and below it there, which is the kind of difference that makes
              two forms feel like two screens even when they hold the same
              fields. */}
          <ButtonPair
            prefix="flask"
            primary={hero.flask.primary}
            secondary={hero.flask.secondary}
          />
          </div>

          <div className="shrink-0 xl:sticky xl:top-[5.5rem] xl:w-[24rem]">
            <SlidePreview
            dark
            flip={
              peek["flask_flip"] !== undefined
                ? peek["flask_flip"] === "left"
                : hero.flask.flip
            }
            darkGround={
              flaskCustom ? flaskHex : FLASK_GROUNDS[hero.flask.ground]
            }
            lines={peeked("flask_lines", hero.flask.lines.join("\n"))}
            accent={peeked("flask_accent", hero.flask.accent.join("\n"))}
            sub={peeked("flask_sub", hero.flask.sub)}
            primary={peeked("flask_primary_label", hero.flask.primary.label)}
            secondary={peeked("flask_secondary_label", hero.flask.secondary.label)}
            /* The CUT-OUT is the plate and the STILL is the background, which
               is the same pairing slides 2 and 3 have. The moving version
               cannot be previewed and does not need to be: what it renders is
               this scene. */
            img={peeked("flask_subject", hero.flask.subject)}
            bg={peeked("flask_poster", hero.flask.poster)}
          />
          </div>
        </div>
      </fieldset>

      {/* ── SLIDES 2 AND 3 ────────────────────────────────────── */}
      {rows.map((row, i) => {
        const slide = row.value;
        /* Whether this slide's own colour is in force. groundStyle() makes the
           same test — a colour that is not six hex digits falls back to the
           preset — so the tiles and the page agree by construction rather than
           by both being kept in step. */
        const custom = /^#[0-9a-fA-F]{6}$/.test(slide.groundHex.trim());
        return (
        <fieldset
          key={row.uid}
          hidden={tab !== i + 1}
          className="rounded-[var(--radius-card)] border border-line bg-cream/60 p-4 sm:p-5"
        >
          <legend className="px-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
            Slide {i + 2}
            {ARGUMENT[slide.id] ? ` · ${ARGUMENT[slide.id]}` : null}
          </legend>

          <input type="hidden" name={`slide${i}_id`} value={slide.id} />

          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.85rem] text-mute">
              Slide {i + 2} of {rows.length + 1} in the carousel.
            </p>
            <ConfirmDelete
              label="Remove this slide"
              title={`Remove slide ${i + 2}?`}
              body="Its headline, accent, sub-copy, both pictures, its colour and its buttons go with it — there is no undo on this form. The live site is unchanged until you press Save."
              confirmLabel="Remove the slide"
              onConfirm={() => remove(row.uid)}
              /* THE LAST ONE CANNOT GO. Removing it would leave the carousel
                 as the WebGL slide alone — a one-slide carousel that still
                 draws a dot and still crossfades to itself every seven
                 seconds. */
              disabled={rows.length <= 1}
              disabledReason="The carousel needs at least one slide after the opening one."
            />
          </header>

          {/* ── FIELDS LEFT, PREVIEW RIGHT AND STUCK THERE ──────────
              The preview used to sit at the bottom of this column, which is the
              one place it could not do its job: to see the effect of a headline
              you had to scroll past every other field to reach it, and by then
              the box you had just typed in was off the screen. A preview you
              cannot see at the same time as the control is a screenshot.

              `sticky` IS THE WHOLE POINT, not a flourish. It holds the slide in
              view while the fields scroll under it, so changing the ground,
              the picture or the mirror shows its result without moving.

              TOP IS 5.5rem BECAUSE THE PANEL'S BAR IS 4rem AND STICKY. Anything
              smaller parks the preview underneath it.

              ONLY AT xl. Below that the column is too narrow to give up 24rem
              without squeezing the two-up field rows into one, so it goes back
              to the foot of the form — visible on a laptop, out of the way on a
              tablet. */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1 space-y-4">
            <TextArea
              label="Headline"
              name={`slide${i}_lines`}
              rows={2}
              defaultValue={slide.lines.join("\n")}
              hint="The dark half of the headline. One line per line."
            />

            <TextArea
              label="Accent lines"
              name={`slide${i}_accent`}
              rows={2}
              defaultValue={slide.accent.join("\n")}
              hint="The orange half, closing the headline. One line per line."
            />

            <TextArea
              label="Sub-copy"
              name={`slide${i}_sub`}
              rows={3}
              defaultValue={slide.sub}
              hint="One paragraph. Each slide is on screen for seven seconds."
            />

            {/* ── THE TWO PICTURES ──────────────────────────────
                THE SAME PAIR SLIDE 1 HAS, and that is the point of them being
                here: a subject that stands on the slide, and a photograph
                behind the whole thing. Slide 1 called them "the flask, cut
                out" and "the whole scene, as a still" because its two are one
                scene split in half; these two are independent, so they are
                named for what they do.

                BOTH ARE ImageField NOW. They were a path box and a thumbnail —
                fine for pointing at a picture already in the repository,
                useless for putting a new one there. Slide 1 could upload and
                crop and slides 2 and 3 could not, which is a difference
                nothing justified. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Photograph"
                name={`slide${i}_src`}
                value={slide.image.src}
                onChange={(v) =>
                  patch(row.uid, { image: { ...slide.image, src: v } })
                }
                aspect={null}
                placeholder="/img/hero-slide-machine.webp"
                hint="The subject that stands on the slide. A cut-out with a see-through background reads best."
              />

              <ImageField
                label="Background picture"
                name={`slide${i}_bg`}
                value={slide.bg}
                onChange={(v) => patch(row.uid, { bg: v })}
                aspect={null}
                previewOnDark={false}
                previewFit="cover"
                placeholder="Optional — leave empty for the ground alone"
                hint="Optional, behind the whole slide. The ground below is painted over it so the headline stays readable, so it shows softly rather than at full strength."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4">
                {/* ── THE SWATCHES ARE THE CONTROL NOW ─────────────
                    THIS WAS A BUG AND IT SHOWED. A <select> carried the value
                    and two painted swatches sat under it marking the chosen
                    one — except the ring was styled off `slide.ground`, the
                    STORED value, while the select was uncontrolled. So picking
                    the other option moved nothing: the dropdown said one thing
                    and the highlight went on saying the other until a save.
                    Two controls for one value that could disagree.

                    Now there is one. The swatches are radios, so the ring is
                    driven by what is actually checked — via peer-checked
                    rather than React state, which keeps this row uncontrolled
                    like the rest of its fields and cannot fall out of step
                    with the DOM the way the old pair did.

                    THE COLOUR IS THE LABEL. A name for a colour is a guess
                    until you see it; these are the real gradients at a size
                    worth looking at, and the name is underneath for the case
                    where two ramps read alike.

                    NOT COLOUR ALONE: the chosen one takes a ring, a tick and
                    bold label text. The two grounds are a warm and a cool
                    cream and they differ by very little — exactly the pair a
                    ring on its own would fail to distinguish. */}
                <fieldset>
                  <legend className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    Colour behind the picture
                  </legend>
                  <div className="flex gap-2.5">
                    {GROUND_KEYS.map((k) => (
                      /* EVERY STYLED PIECE IS A DIRECT SIBLING OF THE INPUT.
                         `peer-checked:` compiles to `.peer:checked ~ .x`, a
                         SIBLING combinator — so a tick nested inside the
                         swatch would never receive it. It is a sibling with
                         absolute positioning instead, which is why the label
                         carries `relative`. */
                      <label
                        key={k}
                        className="group relative flex-1 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`slide${i}_ground`}
                          value={k}
                          defaultChecked={slide.ground === k}
                          /* PICKING A PRESET CLEARS THE CUSTOM COLOUR, because
                             otherwise these two are dead controls whenever one
                             is set: the custom colour wins downstream, so
                             clicking Warm peach would move a ring and change
                             nothing on the page. Clearing makes the three
                             tiles one choice instead of two competing ones. */
                          onChange={() => patch(row.uid, { groundHex: "" })}
                          className="peer sr-only"
                        />
                        <span
                          className={`block h-14 rounded-xl border border-line transition peer-checked:border-orange peer-checked:ring-2 peer-checked:ring-orange/30 peer-focus-visible:ring-4 peer-focus-visible:ring-orange/40 group-hover:border-orange/50 ${
                            custom ? "opacity-40" : ""
                          }`}
                          style={{ background: HERO_GROUNDS[k] }}
                        />
                        {/* THE TICK IS SUPPRESSED WHILE A CUSTOM COLOUR WINS.
                            peer-checked still fires — the radio really is
                            checked — but it is no longer the colour the page
                            paints, and a tick that says otherwise is the
                            precise bug this control already had once. */}
                        <span
                          aria-hidden
                          className={`absolute right-1.5 top-1.5 hidden size-5 place-items-center rounded-full bg-orange text-white shadow ${
                            custom ? "" : "peer-checked:grid"
                          }`}
                        >
                          <CheckIcon className="size-3.5" />
                        </span>
                        <span
                          className={`mt-1.5 block text-[0.78rem] leading-snug transition ${
                            custom
                              ? "text-mute/60"
                              : "text-mute peer-checked:font-bold peer-checked:text-orange-deep"
                          }`}
                        >
                          {HERO_GROUND_LABELS[k]}
                        </span>
                      </label>
                    ))}

                    {/* ── YOUR COLOUR, AS IT WILL LOOK ─────────────
                        NOT A SWATCH OF THE HEX — the real gradient, built by
                        the same groundStyle() the page calls. A chosen colour
                        is ramped from near-white down to itself, so a flat
                        square of it would preview something the site never
                        paints and would read far darker than the result.

                        IT ONLY APPEARS ONCE THERE IS ONE. An empty third tile
                        beside the two presets would read as a third option
                        that does nothing. */}
                    {custom ? (
                      <div className="relative flex-1">
                        <span
                          className="block h-14 rounded-xl border border-orange ring-2 ring-orange/30"
                          style={{ background: groundStyle(slide) }}
                        />
                        <span
                          aria-hidden
                          className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-orange text-white shadow"
                        >
                          <CheckIcon className="size-3.5" />
                        </span>
                        <span className="mt-1.5 block text-[0.78rem] font-bold leading-snug text-orange-deep">
                          Your colour · {slide.groundHex.toUpperCase()}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">
                    {custom
                      ? "Your own colour is in use. Click either of the two above to go back to them."
                      : "Two measured options. Pick your own below if neither suits."}
                  </p>
                </fieldset>

                {/* ── A COLOUR OF YOUR OWN ─────────────────────────
                    ADDED AT THE CLIENT'S REQUEST, over a stated objection, so
                    the objection is built in rather than argued: the two
                    presets stop where they do because the orange half of the
                    headline drops below 3:1 on a deeper cream, and a free
                    colour here can put an unreadable headline on the home
                    page. ColorField measures the ratio against that orange as
                    the colour is chosen and says so.

                    IT WARNS, IT DOES NOT REFUSE. The client asked for the
                    freedom and has it; what they also get is the number, at
                    the moment it can still change their mind.

                    3 AND NOT 4.5 is the right bar here and not a softened one.
                    The accent is display type — 2rem and up — and WCAG puts
                    large text at 3:1. The same orange at caption size would
                    owe 4.5 and the site uses orange-deep for that instead.

                    IT IS MEASURED AGAINST THE DARKEST STOP. groundStyle ramps
                    a chosen colour from near-white to the colour itself, so
                    the colour IS the worst case rather than an average the
                    text never sits on.

                    EMPTY GOES BACK TO THE PRESET. Clearing the box is how you
                    undo this, which is why there is no third radio above —
                    a "custom" option that had to be selected AND filled in is
                    two states for one decision. */}
                <div className="rounded-xl border border-line bg-white p-3.5">
                  <ColorField
                    label="Or a colour of your own"
                    name={`slide${i}_groundHex`}
                    value={slide.groundHex}
                    onChange={(v) => patch(row.uid, { groundHex: v })}
                    placeholder="#F5DEC6"
                    against="#D9500F"
                    againstLabel="the orange headline"
                    need={3}
                    hint="Leave empty to use one of the two above. Anything here wins over them."
                  />
                </div>

                <PictureSide name={`slide${i}_flip`} left={slide.flip} />
              </div>
            </div>

            <Field
              label="Picture description"
              name={`slide${i}_alt`}
              defaultValue={slide.image.alt}
              hint="Describe what is in the picture. Not the headline."
            />

            <ButtonPair
              prefix={`slide${i}`}
              primary={slide.primary}
              secondary={slide.secondary}
            />

            </div>

            <div className="shrink-0 xl:sticky xl:top-[5.5rem] xl:w-[24rem]">
            <SlidePreview
              lines={peeked(`slide${i}_lines`, slide.lines.join("\n"))}
              accent={peeked(`slide${i}_accent`, slide.accent.join("\n"))}
              sub={peeked(`slide${i}_sub`, slide.sub)}
              primary={peeked(`slide${i}_primary_label`, slide.primary.label)}
              secondary={peeked(`slide${i}_secondary_label`, slide.secondary.label)}
              img={slide.image.src}
              bg={slide.bg}
              /* The two pictures and the colour come from the row rather than
                 from `peek`: ImageField and the swatches are already
                 controlled, so `slide` IS the live value for those three. */
              ground={(peek[`slide${i}_ground`] as HeroGround) ?? slide.ground}
              groundHex={slide.groundHex}
              flip={
                peek[`slide${i}_flip`] !== undefined
                  ? peek[`slide${i}_flip`] === "left"
                  : slide.flip
              }
            />
            </div>
          </div>
        </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Save the hero</SubmitButton>
        <p className="text-[0.82rem] text-mute">
          Check it on the live page afterwards.
        </p>
      </div>
    </form>
  );
}

/**
 * THE TWO PICTURES SLIDE ONE IS MADE OF.
 *
 * IT USED TO HAVE NONE ON THIS FORM, and that was a mistake with a tidy-sounding
 * excuse attached: the slide's picture "is a shader". The shader renders
 * something, and what it renders is a photograph of the client's own branded
 * flask — cut out, composited into the liquid, and dragged about by it. Saying
 * it had no image left the one plate the client supplied directly as the one
 * they could not change.
 *
 * TWO FILES, AND THEY ARE THE SAME SCENE TWICE. The CUT-OUT goes into the
 * canvas; the STILL is what shows before the canvas has started and instead of
 * it wherever WebGL will not run — reduced motion, save-data, and the first
 * paint of every visit. Replacing one without the other means a visitor sees
 * the new flask a moment after the old one, or never sees it at all.
 *
 * THE STEAM ORIGIN USED TO BE ON THIS FORM and was removed at the client's
 * direction — see the note where the panel stood. It mattered here because it
 * is measured off the cut-out, so replacing the picture is exactly when it
 * needs moving. It no longer can be, from this screen.
 */
function FlaskImages({ flask }: { flask: HeroContent["flask"] }) {
  const [subject, setSubject] = useState(flask.subject);
  const [poster, setPoster] = useState(flask.poster);

  return (
    /* NO PANEL AROUND THESE ANY MORE. They sat in a bordered box headed "The
       scene", which was the last thing making slide 1 look like a different
       kind of form — slides 2 and 3 put their two pictures straight into the
       column. The warning the box carried was worth keeping and is now on the
       fields themselves, where it is read while filling them in rather than
       above them. */
    <div className="grid gap-4 sm:grid-cols-2">
      <ImageField
        label="Photograph"
        name="flask_subject"
        value={subject}
        onChange={setSubject}
        aspect={null}
        hint="The flask, cut out — a see-through background. Change this and change the background below: they are one scene, and some visitors only ever see the background."
      />
      <ImageField
        label="Background picture"
        name="flask_poster"
        value={poster}
        onChange={setPoster}
        aspect={null}
        previewFit="cover"
        hint="The whole scene as a normal photograph. It stands in before the moving version starts, and instead of it on a phone set to reduce motion."
      />
      {/* ── THE STEAM ORIGIN PANEL WAS HERE AND HAS BEEN REMOVED ────
          Two percentages and a preview dot marking where the plume starts on
          the flask. Taken off at the client's direction.

          THE VALUES ARE STILL LIVE. LiquidSurface reads hero.flask.steam and
          begins the steam there, so the numbers still do their job — they
          simply have no editor now. Changing them is a change to
          data/content.json, or to the default in lib/content/schema.ts.

          IF THE PLUME EVER COMES OUT IN THE WRONG PLACE after a new flask
          photograph, this is why: the origin is measured off the old picture
          and nothing on this screen moves it any more.

          saveHeroAction WAS CHANGED WITH THIS and the reason is not obvious.
          `Number("")` is 0, not NaN, so an absent field would have passed
          validation and written the origin to the corner on the next save.
          It now keeps the stored value when the fields are not posted. */}
    </div>
  );
}


/**
 * THE SLIDE'S PHOTOGRAPH.
 *
 * ITS OWN COMPONENT PURELY TO HOLD ONE PIECE OF STATE. Every other field on
 * this form is uncontrolled — nothing adds or removes slides, so defaultValue
 * is enough — but an upload has to WRITE the path back into the input after the
 * file lands, and an uncontrolled input cannot be written to from React.
 * Lifting the whole form into state to serve one field would mean a re-render
 * on every keystroke of every slide; this is the smaller half.
 *
 * NO LOCKED CROP SHAPE. A hero plate is a cut-out standing on a gradient rather
 * than a photograph filling a frame: the machine is portrait and mirrored, the
 * drinks plate is landscape and bleeds. The slide sizes itself to whatever
 * arrives, so a fixed ratio here would only take a garnish off one of them.
 */
function HeroImage({ index, initial }: { index: number; initial: string }) {
  const [src, setSrc] = useState(initial);
  return (
    <ImageField
      label="Photograph"
      name={`slide${index}_src`}
      value={src}
      onChange={setSrc}
      placeholder="/img/hero-slide-machine.webp"
      aspect={null}
      /* Light, unlike the menu's. These stand on a cream gradient rather than on
         espresso, and a dark preview would flatter a plate with a dark fringe
         that is going to show on the slide. */
      previewOnDark={false}
      hint="A cut-out picture with a see-through background."
    />
  );
}

/**
 * The two buttons a slide carries.
 *
 * THE HREF IS FREE TEXT AND NOT A PICKER, deliberately. The useful values are
 * the page's own anchors — #pricing, #menu, #machines, #savings — but they are
 * also the four section pages and, one day, an outside URL. A select listing
 * today's anchors would be wrong the first time a section moved, and lib/sections
 * already records that #savings is kept as an id precisely because people have
 * the URL. The hint names the ones that exist and the field accepts anything.
 */
function ButtonPair({
  prefix,
  primary,
  secondary,
}: {
  prefix: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-line bg-white p-3.5">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-mute">
          Filled button
        </p>
        <Field label="Label" name={`${prefix}_primary_label`} defaultValue={primary.label} />
        <Field
          label="Link"
          name={`${prefix}_primary_href`}
          defaultValue={primary.href}
          hint="#pricing, #menu, #machines, #savings — or a page like /machines."
        />
      </div>
      <div className="space-y-3 rounded-xl border border-line bg-white p-3.5">
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-mute">
          Outline button
        </p>
        <Field label="Label" name={`${prefix}_secondary_label`} defaultValue={secondary.label} />
        <Field
          label="Link"
          name={`${prefix}_secondary_href`}
          defaultValue={secondary.href}
        />
      </div>
    </div>
  );
}

/**
 * Which half of the slide the picture takes.
 *
 * ONE COMPONENT FOR ALL THREE SLIDES, and that is the point of it existing
 * rather than being written twice. This form's job is that every slide is
 * filled in the same way; two copies of a control is how that stops being
 * true on the first change somebody makes to one of them.
 *
 * IT WAS A CHECKBOX CALLED "MIRROR THE PHOTOGRAPH" and it described the
 * mechanism rather than the outcome. What it decides is which side the
 * picture is on, so it says that and draws it.
 *
 * IT POSTS THE SAME `flip` FIELD every slide already stored — left = flip —
 * because renaming a stored field for the sake of a label is a migration for
 * nothing.
 *
 * A DIAGRAM RATHER THAN A WORD. Two blocks in the order they will appear: the
 * picture as a filled rectangle, the copy as three rules with the accent one
 * in orange. "Left" on its own answers the question; the diagram answers it
 * without being read.
 *
 * ONE HONEST FOOTNOTE ON SLIDES 2 AND 3: the side also changes how the
 * picture is FITTED — contained as a centred portrait plate on one side,
 * cropped to fill where it bleeds off the edge. Two arrangements that need
 * two fits, which is why this is a choice between layouts and not a
 * transform. On slide 1 it mirrors the scene, moves the copy, and takes the
 * scrim with it.
 */
function PictureSide({ name, left }: { name: string; left: boolean }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Picture on the
      </legend>
      <div className="flex gap-2.5">
        {(["left", "right"] as const).map((side) => (
          <label key={side} className="group relative flex-1 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={side}
              defaultChecked={side === (left ? "left" : "right")}
              className="peer sr-only"
            />
            <span className="flex h-14 items-stretch gap-1.5 rounded-xl border border-line bg-cream/50 p-2 transition peer-checked:border-orange peer-checked:ring-2 peer-checked:ring-orange/30 peer-focus-visible:ring-4 peer-focus-visible:ring-orange/40 group-hover:border-orange/50">
              {(side === "left" ? ["pic", "copy"] : ["copy", "pic"]).map((part) =>
                part === "pic" ? (
                  <span
                    key={part}
                    className="w-10 shrink-0 rounded bg-ink-soft/70"
                  />
                ) : (
                  <span
                    key={part}
                    className="flex flex-1 flex-col justify-center gap-1"
                  >
                    <span className="h-1 w-full rounded-full bg-ink-soft/35" />
                    <span className="h-1 w-3/4 rounded-full bg-orange/60" />
                    <span className="h-1 w-1/2 rounded-full bg-ink-soft/20" />
                  </span>
                ),
              )}
            </span>
            <span className="mt-1.5 block text-[0.78rem] leading-snug text-mute transition peer-checked:font-bold peer-checked:text-orange-deep">
              {side === "left" ? "Left" : "Right"}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-[0.8rem] leading-snug text-mute">
        Put it on the side the subject faces, so it looks into the words rather
        than off the edge. Side by side only on a wide screen — on a phone the
        copy always sits above the picture.
      </p>
    </fieldset>
  );
}
