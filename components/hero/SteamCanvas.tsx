"use client";

import { useEffect, useRef } from "react";

/**
 * Steam, on its own canvas at half resolution and scaled up.
 *
 * Deliberately NOT part of the liquid shader. Steam is soft, low-frequency
 * and cheap; the liquid is per-pixel and expensive. Putting them together
 * would run the steam at full resolution for no visible gain, and every
 * change to one would risk recompiling the other.
 *
 * Half res is free here — the whole thing is out-of-focus vapour, so the
 * upscale costs nothing anyone can see.
 */

type Puff = {
  x: number;
  y: number;
  r: number;
  life: number;
  age: number;
  drift: number;
  seed: number;
};

export default function SteamCanvas({
  className = "",
  /** where the plume starts, in 0-1 of the canvas */
  origin = [0.78, 0.55],
  /** 0 = off, 1 = full */
  intensity = 1,
  /** rising speed multiplier, pushed up as the hero scrolls away */
  rush = 1,
}: {
  className?: string;
  origin?: [number, number];
  intensity?: number;
  rush?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  /* live values, so changing a prop never restarts the simulation */
  const live = useRef({ origin, intensity, rush, mouse: [-1, -1] as number[] });
  live.current.origin = origin;
  live.current.intensity = intensity;
  live.current.rush = rush;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const HALF = 0.5;
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * HALF));
      h = Math.max(1, Math.round(r.height * HALF));
      cv.width = w;
      cv.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const puffs: Puff[] = [];
    const MAX = window.matchMedia("(min-width: 768px)").matches ? 46 : 26;

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      live.current.mouse = [
        ((e.clientX - r.left) / r.width) * w,
        ((e.clientY - r.top) / r.height) * h,
      ];
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    let running = false;
    let last = performance.now();
    let spawn = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { origin: o, intensity: I, rush: R, mouse } = live.current;

      ctx.clearRect(0, 0, w, h);

      spawn += dt * 17 * I;
      while (spawn > 1 && puffs.length < MAX) {
        spawn -= 1;
        puffs.push({
          x: o[0] * w + (Math.random() - 0.5) * w * 0.045,
          y: o[1] * h,
          r: h * (0.013 + Math.random() * 0.015),
          /* Short-lived on purpose. At 2.6-5.0s these rose 26-50% of the
             screen, so the most visible part of the plume ended up level
             with the flask and read as coming from IT rather than the chai.
             1.6-3.2s was better and still carried the plume 24% of the way up
             the frame — well clear of the glass it is supposed to be leaving.
             1.4-2.8s, against the slower rise below, keeps it on the chai. */
          life: 1.4 + Math.random() * 1.4,
          age: 0,
          drift: (Math.random() - 0.5) * 0.34,
          seed: Math.random() * 100,
        });
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.age += dt;
        if (p.age > p.life) {
          puffs.splice(i, 1);
          continue;
        }
        const k = p.age / p.life;
        /* 0.055, not 0.075. Shortening the life alone thins the plume out;
           slowing the climb keeps the same number of puffs in frame and just
           stops them reaching the top of it. Together: a maximum rise of
           15% of the height instead of 24%. */
        p.y -= dt * h * 0.055 * R;
        /* curl, so it never rises in a straight column */
        p.x += Math.sin(p.age * 1.6 + p.seed) * dt * w * 0.008 + p.drift * dt * w * 0.007;

        /* bend away from the cursor, recovering as the puff ages past it */
        if (mouse[0] >= 0) {
          const dx = p.x - mouse[0];
          const dy = p.y - mouse[1];
          const d2 = dx * dx + dy * dy;
          const reach = (h * 0.22) ** 2;
          if (d2 < reach && d2 > 1) {
            const push = (1 - d2 / reach) * dt * 46;
            const d = Math.sqrt(d2);
            p.x += (dx / d) * push;
            p.y += (dy / d) * push * 0.5;
          }
        }

        const grow = p.r * (1 + k * 2.0);
        /* sin(pi*k) peaks at half-life and leaves a puff at 15% opacity for
           its first tenth — so the plume only became visible well above where
           it started, and read as a gap between the splash and the steam.
           Raising k to 0.65 front-loads the fade-in: 65% opacity at k=0.1
           instead of 15%, with the same soft death at the top.

           0.13, DOWN FROM 0.21. The composite is `lighter`, so overlapping
           puffs SUM rather than blend — forty-six of them over one another
           built a hot core far brighter than any single puff, which is what
           made it read as a glowing blob instead of vapour. Cutting the per-
           puff peak is the right lever: it thins the core without thinning
           the plume, which fewer puffs or a shorter life would both do. */
        const alpha = Math.sin(Math.PI * Math.pow(k, 0.65)) * 0.13 * I;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, grow);
        g.addColorStop(0, `rgba(255,247,240,${alpha})`);
        g.addColorStop(1, "rgba(255,247,240,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, grow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(cv);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
