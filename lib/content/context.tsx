"use client";

/**
 * How editable content reaches the client components that display it.
 *
 * THE PROBLEM THIS SOLVES. Every consumer of the content is a "use client"
 * component — Header and Footer in the root layout, Pricing, Cases and Blog on
 * the home page, and the four /service, /menu, /machines, /who-we-serve views.
 * They currently `import { PHONE_LABEL } from "@/lib/contact"`, which is free
 * because it is a constant baked into the bundle. Per-request data cannot be
 * imported, so it has to be passed.
 *
 * WHY A CONTEXT RATHER THAN PROPS. Threading it as props means touching every
 * component between the server boundary and the leaf: Hero takes a cups figure
 * it never reads and forwards it to SlideFlask, the home page takes a contact
 * object and hands it to three of eleven children, and every one of those
 * signatures has to change again the next time a field is added. The leaf is
 * where the data is used and the layout is where it is available, and there is
 * nothing in between that has an opinion — which is the textbook case for
 * context.
 *
 * ONE PROVIDER, IN THE ROOT LAYOUT. The layout is a Server Component, so it
 * calls getContent() and passes the plain object across the boundary as a prop
 * on this provider. That is one serialisation per request of about 1KB of JSON,
 * which is already in the HTML payload anyway because the footer renders it.
 *
 * NO useState AND NO SETTER. This is read-only on the client: the panel writes
 * through a Server Action and revalidates, so a change arrives as a new render
 * with a new value rather than as a client-side mutation. Nothing here needs to
 * be stateful, so nothing here is.
 */

import { createContext, useContext } from "react";
import { DEFAULT_CONTENT, type SiteContent } from "./schema";

/**
 * DEFAULTS AS THE CONTEXT DEFAULT, not null or undefined.
 *
 * It means useSiteContent() never returns nothing and no consumer needs a null
 * check or a "must be used within a provider" throw. The cost is that a
 * component rendered outside the provider silently shows the built-in values
 * instead of failing loudly — and for this content that is the better failure:
 * a stale phone number on a page that renders beats a blank page. The provider
 * is in the ROOT layout, so "outside it" means a test or a Storybook, where
 * defaults are what you want anyway.
 */
const Ctx = createContext<SiteContent>(DEFAULT_CONTENT);

export function SiteContentProvider({
  value,
  children,
}: {
  value: SiteContent;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteContent(): SiteContent {
  return useContext(Ctx);
}

/** The two narrow hooks, because most call sites want one slice and naming it
    at the call site reads better than `useSiteContent().contact` everywhere. */
export function useContact() {
  return useContext(Ctx).contact;
}

export function useStats() {
  return useContext(Ctx).stats;
}
