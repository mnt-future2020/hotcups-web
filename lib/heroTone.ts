/**
 * Which way the hero is lit right now.
 *
 * The hero is a carousel whose first slide is a dark WebGL scene and whose
 * other two are cream. The header sits ON TOP of it with no background of its
 * own until it sticks, so its logo, its nav links and its scrim all have to
 * know which of those it is currently floating over — cream links on a cream
 * slide are invisible, and so is the maroon logo on the dark one.
 *
 * A store rather than a prop because the two components are siblings: the
 * header is rendered by the root layout and the hero by the page, so there is
 * no parent to thread this through short of lifting both into a provider that
 * exists only for this one boolean.
 *
 * It defaults to dark, which is slide one — so the header is correct on first
 * paint, before the carousel has mounted and told it anything.
 */

export type HeroTone = "dark" | "light";

let tone: HeroTone = "dark";

const subs = new Set<(t: HeroTone) => void>();

export function currentHeroTone() {
  return tone;
}

export function setHeroTone(next: HeroTone) {
  if (next === tone) return;
  tone = next;
  subs.forEach((fn) => fn(tone));
}

export function subscribeHeroTone(fn: (t: HeroTone) => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}
