/** The landing page, in scroll order. Drives the nav and the scroll spy. */
export const SECTIONS = [
  { id: "hero", label: "Home", nav: false },
  { id: "service", label: "The Service", nav: true },
  { id: "menu", label: "The Menu", nav: true },
  { id: "industries", label: "Who We Serve", nav: true },
  { id: "savings", label: "Savings", nav: false },
  { id: "machines", label: "Machines", nav: true },
  { id: "cases", label: "Case Studies", nav: true },
  { id: "pricing", label: "Get Pricing", nav: false },
  { id: "blog", label: "Blog", nav: true },
  { id: "contact", label: "Contact", nav: false },
] as const;

export const NAV = SECTIONS.filter((s) => s.nav);
export type SectionId = (typeof SECTIONS)[number]["id"];
