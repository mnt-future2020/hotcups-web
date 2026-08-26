const RUN = [
  "Masala Chai",
  "Filter Coffee",
  "Badam Milk",
  "Hot Chocolate",
  "Green Tea",
  "Ginger Tea",
  "Premium Coffee",
];

export default function Ticker() {
  return (
    <div className="ticker-mask relative overflow-hidden border-y border-line/70 py-4">
      <div className="ticker-track">
        {/* two identical runs so the -50% loop is seamless */}
        {[0, 1].map((run) => (
          <ul
            key={run}
            aria-hidden={run === 1}
            className="flex shrink-0 items-center"
          >
            {RUN.map((item) => (
              <li
                key={item}
                className="flex shrink-0 items-center gap-6 whitespace-nowrap px-6"
              >
                <span className="font-display text-sm font-semibold tracking-tight text-ink-soft md:text-base">
                  {item}
                </span>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-orange"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
