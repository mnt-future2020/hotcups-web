/**
 * The cups counter, shared by the hero badge and the header dock.
 *
 * One source, so the number cannot disagree with itself when the badge docks
 * into the header on scroll. Ticks +1 on a randomised 4-9s interval — a fixed
 * interval reads as a fake, because real orders do not arrive on a metronome.
 */

let value = 15_000;
const subs = new Set<(n: number) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function schedule() {
  timer = setTimeout(
    () => {
      value += 1;
      subs.forEach((fn) => fn(value));
      schedule();
    },
    4000 + Math.random() * 5000,
  );
}

export function currentCups() {
  return value;
}

export function subscribeCups(fn: (n: number) => void) {
  subs.add(fn);
  if (!timer) schedule();
  return () => {
    subs.delete(fn);
    if (subs.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}
