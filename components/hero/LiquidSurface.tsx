"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Program, Mesh, Triangle, Texture } from "ogl";
import { FRAG, VERT } from "./liquid.glsl";

/**
 * The liquid surface, on one full-screen triangle, with the flask composited
 * inside it as a texture.
 *
 * WHY THE FLASK IS NOT A DOM IMAGE
 * As a texture the reflection can be dragged by the same noise that moves the
 * surface, the ripple knows where the base is, and the waterline is a step()
 * instead of a CSS mask pretending to be one. One scene, not a canvas with a
 * picture sitting on it. The cost is that the flask carries no alt text — it
 * is decorative, which is correct.
 *
 * CAPABILITY IS DECIDED BEFORE MOUNTING
 * WebGL, reduced-motion and Save-Data are all checked before a canvas exists.
 * A flash of broken canvas is worse than no canvas.
 */

export type LiquidHandle = {
  set: (name: string, value: number | number[]) => void;
  ripple: (x: number, y: number, strength?: number) => void;
  /** where the flask meets the liquid, in UV — for firing the emergence ring */
  base: () => [number, number];
};

/** where the steam should start: the flask's MOUTH, in 0-1 measured from the
    top-left of the hero, which is the coordinate space a 2D canvas uses */
export type FlaskMouth = [number, number];

const POSTER = "/img/hero-poster.webp";
/* The branded flask and a glass of chai mid-splash, composited into ONE
   texture. Two textures would mean two rects, two rises and two reflections
   in the shader; as one image the waterline cut, the mirrored reflection and
   the contact darkening all apply to both for free. */
const SUBJECT = {
  /* Flask and glass side by side. The steam rises off the CHAI, not the
     sealed flask: a closed vacuum flask does not steam, and the glass is the
     thing that is visibly hot. Measured on the trimmed plate: the splash
     centroid is 36.8% across, the crown's top 28.3% down and the chai surface
     about 45% down. v = 0.38 puts the origin between those two — inside the
     splash, not on its rim, so no gap opens up under the plume. */
  wide: { src: "/img/hero-subject-v2.webp", u: 0.368, v: 0.38 },
  /* On a phone the pair clamps to a squat 27% of the height, so the narrow
     screen gets the flask on its own and keeps its full stature. Its spout is
     the only thing left to steam from; measured on the crop. */
  narrow: { src: "/img/hero-flask-v2.webp", u: 0.181, v: 0.134 },
};

function capable() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  if (conn?.saveData) return false;
  try {
    const c = document.createElement("canvas");
    return Boolean(
      c.getContext("webgl2") ||
        c.getContext("webgl") ||
        c.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

/** the specular band's period */
const AMBIENT_S = 9;

export default function LiquidSurface({
  className = "",
  active = true,
  onReady,
  onMouth,
  onSubject,
}: {
  className?: string;
  /** false while a different carousel slide is showing */
  active?: boolean;
  onReady?: (handle: LiquidHandle) => void;
  onMouth?: (m: FlaskMouth) => void;
  /** the subject texture has decoded and is on screen */
  onSubject?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<boolean | null>(null);

  /* Read inside the scene effect rather than listed in its deps: putting
     `active` in the dependency array would tear down and rebuild the WebGL
     context every time the carousel advances, which is the most expensive
     thing on the page. */
  const wanted = useRef(active);
  const sync = useRef<() => void>(() => {});

  useEffect(() => {
    wanted.current = active;
    sync.current();
  }, [active]);

  useEffect(() => setLive(capable()), []);

  useEffect(() => {
    const el = host.current;
    if (!el || live !== true) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: false,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
        powerPreference: "high-performance",
      });
    } catch {
      setLive(false);
      return;
    }

    const gl = renderer.gl;
    if (!gl) {
      setLive(false);
      return;
    }
    gl.clearColor(0.141, 0.039, 0.024, 1);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const wide = window.matchMedia("(min-width: 1280px)").matches;
    const mid = window.matchMedia("(min-width: 768px)").matches;

    const subject = mid ? SUBJECT.wide : SUBJECT.narrow;

    const flask = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });
    let texAspect = 1;

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uWake: { value: 0 },
      uRim: { value: 0.42 },
      uScroll: { value: 0 },
      uMouse: { value: [0.5, 0.5] },
      uRipples: { value: new Float32Array(8 * 4) },
      uOctaves: { value: mid ? 3 : 2 },
      uSweep: { value: -0.5 },
      uFlask: { value: flask },
      uFlaskRise: { value: 0 },
      uFlaskRect: { value: [0.78, 0.4, 0.4, 0.4] },
      uFlaskReady: { value: 0 },
      uReflect: { value: 0 },
    };

    /* Flask geometry, sized by HEIGHT and not by width.
       The brief asks for ~40% of the viewport width, which only works for a
       roughly square asset: a tall portrait flask at 40% width would stand
       taller than the screen. Height is the dimension that has to behave, so
       it is the one that is fixed and width follows the texture's aspect. */
    const layout = () => {
      const w = uniforms.uResolution.value[0];
      const h = uniforms.uResolution.value[1];
      const aspect = w / Math.max(h, 1);
      /* Raised from 0.55 / 0.46 / 0.42. Checked against both limits at
         1280-2560: the widest the subject gets is a right edge at 0.992 of
         the frame (1280x800) and a top at 0.910, so it still clears the
         window and still clears the copy. */
      let hUV = wide ? 0.62 : mid ? 0.52 : 0.47;
      let wUV = (hUV * texAspect) / aspect;
      /* on a narrow screen a tall flask can still overflow sideways, so width
         gets the final say and height follows it back down */
      if (wUV > 0.6) {
        hUV *= 0.6 / wUV;
        wUV = 0.6;
      }
      /* Where the DOM copy stops, computed from the same three numbers the
         CSS uses: .shell-wide is max-width 1720 with clamp(1.25rem, 4vw, 4rem)
         padding, and the hero's copy column is max-w-[min(58rem,48vw)].
         Duplicating them here is the only way the WebGL layer can know where
         the text ends — if any of the three change in globals.css or
         SlideFlask.tsx, they have to change here too. */
      const shellW = Math.min(1720, w);
      const pad = Math.min(64, Math.max(20, w * 0.04));
      const copyRight = (w - shellW) / 2 + pad + Math.min(928, w * 0.48);
      /** clear air between the last word and the first splash droplet */
      const GUTTER = 24;
      /* Below md the copy column is min(34rem, 90vw), not 48vw — it spans
         nearly the whole screen and the flask is a BACKGROUND the text sits
         on, darkened by the radial scrim in SlideFlask. Feeding that column
         into the floor below would push the subject clean off the right edge,
         so the floor simply does not apply there. */
      const stacked = w < 768;

      /* A flat value cannot do this job. 0.73 looks right at 1766px and
         overlaps the copy at every width from 1280 to about 1750, because the
         copy column and the subject grow at different rates — the column is
         capped at 688px while the subject keeps widening with the viewport.
         So the wish is a floor, not a position. */
      const wantX = wide ? 0.73 : 0.8;
      const baseX = stacked
        ? wantX
        : Math.max(wantX, (copyRight + GUTTER) / w + wUV / 2);
      /* Sat down into the frame rather than floating in the upper half. It was
         lifted to keep dead liquid out of the bottom, but the new plate is
         taller in frame and fills that space on its own. */
      const baseY = mid ? 0.29 : 0.24;
      uniforms.uFlaskRect.value = [baseX, baseY, wUV, hUV];
      /* the steam leaves the flask's spout, which is off-centre inside the
         composite — reported in the 2D canvas's top-down space */
      onMouth?.([
        baseX - wUV / 2 + subject.u * wUV,
        Math.max(0.02, 1 - (baseY + hUV) + subject.v * hUV),
      ]);
    };

    const img = new Image();
    img.crossOrigin = "";
    img.onload = () => {
      flask.image = img;
      texAspect = img.naturalWidth / img.naturalHeight;
      layout();
      uniforms.uFlaskReady.value = 1;
      onSubject?.();
    };
    img.src = subject.src;

    const program = new Program(gl, { vertex: VERT, fragment: FRAG, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value = [w, h];
      layout();
    };
    resize();
    window.addEventListener("resize", resize);

    let slot = 0;
    const ripple = (x: number, y: number, strength = 1) => {
      const i = (slot % 8) * 4;
      const a = uniforms.uRipples.value;
      a[i] = x;
      a[i + 1] = y;
      a[i + 2] = uniforms.uTime.value;
      a[i + 3] = strength;
      slot += 1;
    };

    /* a short trail, so a fast sweep of the pointer leaves a wake rather than
       one lonely ring */
    let lastRipple = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      const prev = uniforms.uMouse.value;
      uniforms.uMouse.value = [x, y];
      const speed = Math.hypot(x - prev[0], y - prev[1]);
      const now = uniforms.uTime.value;
      if (now - lastRipple > 0.05 && speed > 0.004) {
        ripple(x, y, Math.min(0.35 + speed * 14, 1.1));
        lastRipple = now;
      }
    };
    if (mid) window.addEventListener("pointermove", onMove);

    let raf = 0;
    let running = false;
    let last = performance.now();

    const frame = (now: number) => {
      const t = (uniforms.uTime.value += Math.min((now - last) / 1000, 0.05));
      last = now;

      /* one band crossing the surface, about nine seconds a pass */
      uniforms.uSweep.value = ((t / AMBIENT_S) % 1) * 2 - 0.5;

      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    /* The biggest single win available: without this the full-screen shader
       keeps running for the entire length of the page. Two conditions gate it
       now — on screen AND the showing slide — and both funnel through one
       function so they cannot disagree about whether the loop should run. */
    let visible = false;
    const decide = () => (visible && wanted.current ? start() : stop());
    sync.current = decide;

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        decide();
      },
      { threshold: 0 },
    );
    io.observe(el);

    onReady?.({
      set: (name, value) => {
        const u = (uniforms as Record<string, { value: unknown }>)[name];
        if (u) u.value = value;
      },
      ripple,
      base: () => [
        uniforms.uFlaskRect.value[0],
        uniforms.uFlaskRect.value[1],
      ],
    });

    return () => {
      sync.current = () => {};
      stop();
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [live, onReady, onMouth, onSubject]);

  /* the poster is rendered from the shader's own maths, so the fallback and
     the live version cannot drift apart */
  if (live === false) {
    return (
      <div
        className={`${className} hero-poster`}
        aria-hidden="true"
        style={{
          backgroundImage: `url(${POSTER})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <div
      ref={host}
      className={className}
      aria-hidden="true"
      style={{ backgroundImage: `url(${POSTER})`, backgroundSize: "cover" }}
    />
  );
}
