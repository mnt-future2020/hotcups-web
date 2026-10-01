/**
 * The panel's icons.
 *
 * DRAWN HERE RATHER THAN INSTALLED. The site already draws its own — Footer.tsx
 * carries a phone, an envelope, a WhatsApp mark and a map pin as inline paths —
 * so an icon package would be a ninth dependency duplicating a convention the
 * repository already has. These are the nine the panel needs and no more.
 *
 * ONE GEOMETRY FOR ALL OF THEM: a 24-unit box, 1.75 stroke, round caps and
 * joins, no fills. That is what makes a set look like a set — an icon drawn at
 * a different weight reads as a mistake beside the others long before anyone
 * can say which one is wrong. `currentColor` throughout, so a nav item's active
 * state colours its icon by inheritance rather than by a second prop.
 *
 * aria-hidden on every one. Each sits beside its own label in the sidebar, so
 * announcing them would read every item twice.
 */

type IconProps = { className?: string };

function Svg({
  className = "size-[18px]",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

/** Overview — four panes, the conventional dashboard mark */
export function GridIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

/** Contact details — a handset, matching the one in the footer */
export function PhoneIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.6 3.5h2.2l1.5 3.7-1.8 1.3a11.5 11.5 0 0 0 5 5l1.3-1.8 3.7 1.5v2.2a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" />
    </Svg>
  );
}

/** Figures — a bar chart, because both values are counts */
export function ChartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7.5" y="12" width="3" height="5" rx="1" />
      <rect x="13" y="8.5" width="3" height="8.5" rx="1" />
      <rect x="18" y="5.5" width="3" height="11.5" rx="1" />
    </Svg>
  );
}

/** Blog posts — a sheet with lines of writing on it */
export function DocumentIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5Z" />
      <path d="M13.5 3v4.5a1 1 0 0 0 1 1H19" />
      <path d="M8.75 12.5h6.5M8.75 16h4.5" />
    </Svg>
  );
}

/** Case studies — a star, the conventional mark for a highlighted story */
export function StarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m12 3.6 2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.76l5.9-.86Z" />
    </Svg>
  );
}

/** Organisations — a building, because the figure counts workplaces served.
    It exists so the dashboard's second card does not repeat the star: two
    identical icons in a row of four read as a copy-paste slip long before
    anyone works out which card is mislabelled. */
export function BuildingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v15.5" />
      <path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5v9" />
      <path d="M2.75 20.5h18.5" />
      <path d="M7.25 7.5h3.5M7.25 11.5h3.5M7.25 15.5h3.5M17 14v3" />
    </Svg>
  );
}

/** The hero — a rising spark, for the thing at the top of the page. Not a
    photograph or a slideshow mark: the first slide is a live WebGL scene rather
    than an image, and a picture frame would describe two thirds of it. */
export function SparkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3.25 13.9 8.6a2 2 0 0 0 1.2 1.2l5.35 1.9-5.35 1.9a2 2 0 0 0-1.2 1.2L12 20.15l-1.9-5.35a2 2 0 0 0-1.2-1.2L3.55 11.7l5.35-1.9a2 2 0 0 0 1.2-1.2Z" />
      <path d="M18.75 3.5v3M20.25 5h-3" />
    </Svg>
  );
}

/** The menu — a glass with a drink in it, which is literally what section 02
    is: four glasses on a dark ground. */
export function CupIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.75 4.5h10.5l-1.1 14.2a1.5 1.5 0 0 1-1.5 1.3H9.35a1.5 1.5 0 0 1-1.5-1.3Z" />
      <path d="M6.95 9.5h10.1" />
      <path d="M12 2v1.25M9.25 2.6v.9M14.75 2.6v.9" />
    </Svg>
  );
}

/** The machines — a cabinet with a screen and a spout, which is what the three
    units in section 06 are. */
export function MachineIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4.25" y="2.75" width="15.5" height="18.5" rx="2.5" />
      <rect x="7.5" y="6" width="9" height="5" rx="1.25" />
      <path d="M11 14h2.5" />
      <path d="M9.25 17.75h5.5" />
    </Svg>
  );
}

/** The story — a milestone flag on a line, which is what the timeline's rail
    is: seven dots left to right with a year over each. */
export function TimelineIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 18.5h18" />
      <path d="M7.5 18.5V5.5h8l-1.6 2.4 1.6 2.4h-8" />
      <circle cx="7.5" cy="18.5" r="1.6" />
      <circle cx="16.5" cy="18.5" r="1.6" />
    </Svg>
  );
}

/** Workplaces — two figures, because what separates these segments is who is
    standing there: a desk, a shop floor, a ward, a lecture hall. */
export function PeopleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.25 19.5a5.75 5.75 0 0 1 11.5 0" />
      <path d="M16 5.1a3.25 3.25 0 0 1 0 5.8" />
      <path d="M17.6 14.4a5.75 5.75 0 0 1 3.15 5.1" />
    </Svg>
  );
}

/** SEO — a globe, the conventional mark for the open web. */
export function GlobeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9.25" />
      <path d="M2.75 12h18.5" />
      <path d="M12 2.75c2.4 2.5 3.6 5.6 3.6 9.25S14.4 18.75 12 21.25c-2.4-2.5-3.6-5.6-3.6-9.25S9.6 5.25 12 2.75Z" />
    </Svg>
  );
}

/** System settings — a cog. */
export function CogIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.3 14.7a1.5 1.5 0 0 0 .3 1.65l.05.05a1.85 1.85 0 1 1-2.6 2.6l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37v.13a1.85 1.85 0 0 1-3.7 0v-.07a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.05.05a1.85 1.85 0 1 1-2.6-2.6l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4.3a1.85 1.85 0 1 1 0-3.7h.07a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05a1.85 1.85 0 1 1 2.6-2.6l.05.05a1.5 1.5 0 0 0 1.65.3h.07a1.5 1.5 0 0 0 .9-1.37V4.3a1.85 1.85 0 1 1 3.7 0v.07a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.85 1.85 0 1 1 2.6 2.6l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9h.13a1.85 1.85 0 1 1 0 3.7h-.07a1.5 1.5 0 0 0-1.37.9Z" />
    </Svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  );
}

export function SignOutIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M15 4.5h2.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H15" />
      <path d="M10.5 15.5 14 12l-3.5-3.5" />
      <path d="M14 12H4.5" />
    </Svg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </Svg>
  );
}

export function MenuIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

/** An arrow out of a box — the "view the live page" mark */
export function ExternalIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m20 6-11 11-5-5" />
    </Svg>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 7 8.1 5.4a1.6 1.6 0 0 0 1.8 0L21 7" />
    </Svg>
  );
}

/** WhatsApp, drawn to this set's geometry rather than lifted from the brand
    mark — a filled glyph beside eleven stroked ones reads as a mistake. */
export function ChatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.6-5a8.4 8.4 0 1 1 15.9-4Z" />
    </Svg>
  );
}

export function PinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 10.5c0 5.2-6.4 10.3-7.6 11.2a.7.7 0 0 1-.8 0C10.4 20.8 4 15.7 4 10.5a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10.2" r="2.7" />
    </Svg>
  );
}
