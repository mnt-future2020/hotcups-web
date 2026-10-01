import type { ComponentType } from "react";
import {
  CogIcon,
  CupIcon,
  GlobeIcon,
  DocumentIcon,
  MachineIcon,
  GridIcon,
  PeopleIcon,
  PhoneIcon,
  SparkIcon,
  StarIcon,
  TimelineIcon,
} from "./icons";

/**
 * The sidebar's contents, as data.
 *
 * ONE LIST, THREE READERS. The sidebar renders it, the top bar derives the
 * breadcrumb's second crumb from it, and the mobile drawer renders the same
 * thing again. A page title typed into each of those separately is a page title
 * that will disagree with itself the first time one is renamed.
 *
 * GROUPED, BECAUSE FIVE ITEMS IN TWO KINDS IS NOT A FLAT LIST. "Contact"
 * and "Figures" are settings — small, structured, one form each, changed rarely
 * and consequentially. "Blog posts" and "Case studies" are collections —
 * repeaters, changed often and reversibly. Those are different enough activities
 * that separating them tells the operator which mode they are in before they
 * click.
 *
 * `EXACT` ON THE OVERVIEW. Every other href is matched as a prefix, so a future
 * /admin/posts/new would keep Blog posts lit. /admin is a prefix of all of them,
 * so without the exception it would be lit on every page and two items would
 * look current at once.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
};

export type NavGroup = {
  /** the small uppercase heading above the group; null runs the items straight
      under the one before with no heading of their own */
  title: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: GridIcon, exact: true },
    ],
  },
  {
    title: "Page sections",
    items: [
      /* THE HERO SITS AT THE TOP OF THIS GROUP because it is at the top of the
         page. The sidebar reads in the order a visitor meets things, which is
         one fewer mapping for an operator to hold than alphabetical would
         be. */
      { href: "/admin/hero", label: "Hero", icon: SparkIcon },
      { href: "/admin/menu", label: "Menu", icon: CupIcon },
      { href: "/admin/machines", label: "Machines", icon: MachineIcon },
      { href: "/admin/workplaces", label: "Services", icon: PeopleIcon },
      { href: "/admin/story", label: "Story", icon: TimelineIcon },
      /* "Contact", not "Contact details". The rail is a list of places and the
         shorter word names the place; the page's own h1 still carries the
         fuller title, which is where a heading belongs. The breadcrumb follows
         this label by design — see currentLabel below. */
      { href: "/admin/contact", label: "Contact", icon: PhoneIcon },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/posts", label: "Blog posts", icon: DocumentIcon },
      { href: "/admin/stories", label: "Case studies", icon: StarIcon },
    ],
  },
  {
    /* LAST, AND SEPARATE FROM THE CONTENT ABOVE IT. Neither of these is a part
       of the page — one is what search engines are told about every page, the
       other is what the deployment itself can do. They are opened rarely and
       for different reasons than everything above, which is what a group is
       for. */
    title: "Configuration",
    items: [
      { href: "/admin/seo", label: "SEO Manager", icon: GlobeIcon },
      { href: "/admin/settings", label: "System Settings", icon: CogIcon },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/** Whether this item should read as the current page. */
export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * The breadcrumb's second crumb.
 *
 * LONGEST MATCH WINS, not first. /admin is a prefix of every other href, so a
 * first-match scan would label every page "Dashboard". Sorting by href length
 * descending means /admin/contact is tested before /admin and the specific
 * answer is the one that is found.
 */
export function currentLabel(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActive(item, pathname));
  return match?.label ?? "Admin";
}
