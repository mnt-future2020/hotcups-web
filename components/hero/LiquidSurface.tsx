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
/* Flask and glass side by side. The steam rises off the CHAI, not the sealed
   flask: a closed vacuum flask does not steam, and the glass is the thing that
   is visibly hot.

   THE ORIGIN IS THE GLASS RIM, NOT THE SPLASH. v was 0.38, picked off a
   measurement of the splash crown — and 0.38 is up in the crown itself, a
   clear third of the plate ABOVE anything hot. Puffs then climb another 15%
   of the frame from there, so the brightest part of the plume ended up level
   with the flask's shoulder: a soft bright blob hanging in mid-air with a gap
   between it and the chai. Re-measured against guides drawn on the plate, the
   tumbler's rim sits at v = 0.555 and its centre line at u = 0.35.

   v = 0.5, which is a notch ABOVE the rim rather than on it. Sitting exactly
   on 0.555 the first half of every puff's life was spent behind the glass and
   the splash, so the plume only became visible well up the frame — the same
   complaint as the old 0.38, from the opposite direction. 0.5 is the base of
   the splash: the plume leaves the chai, rises through the crown, and is
   visible from its first frame.

   ONE PLATE NOW, NOT TWO.
   A phone used to get hero-flask-v2.webp, a portrait crop of this same
   photograph, on the reasoning that the pair "clamps to a squat 27% of the
   height" on a narrow screen. That reasoning belonged to a layout where the
   flask stood in the right-hand margin beside the copy. It does not stand
   there any more — below md it sits in a wide, short band across the bottom,
   which is exactly the shape this landscape plate wants.

   And the crop was cutting the glass. Its left edge runs straight through the
   chai tumbler, so the phone was being shown a severed glass while every
   other width got the whole composition. A wide band and a landscape plate
   fix the shape and the crop in the same move. */
const SUBJECT = { src: "/img/hero-subject-v2.webp", u: 0.35, v: 0.5 };

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

    /* LIVE, NOT CAPTURED.
       These were read once at mount and never again. Everything downstream —
       which subject texture is loaded, how many noise octaves run, and every
       number in layout() — was therefore frozen at whatever the window
       happened to be when the effect first ran. Load the page on a desktop,
       narrow it to a phone, and you kept the wide flask-and-glass plate at
       desktop proportions on a 390px screen, which is exactly what it looked
       like. resize() re-reads them now and swaps the texture when the 768
       line is crossed in either direction. */
    const mqWide = window.matchMedia("(min-width: 1280px)");
    /* THE SAME TEST THE CSS md:landscape: PREFIX USES, and it has to be:
       this decides whether the plate stands in the right-hand margin or
       centres on the floor, and the DOM decides where the copy goes. If the
       two disagree the flask sits on top of the headline. */
    const mqMid = window.matchMedia(
      "(min-width: 768px) and (orientation: landscape)",
    );
    let wide = mqWide.matches;
    let mid = mqMid.matches;
    const subject = SUBJECT;

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
      /* the SAME source the CSS md: prefix uses. `w` is the canvas client
         width, short by the scrollbar, so the two disagreed in a ~17px band. */
      const stacked = !mid;
      let hUV = wide ? 0.62 : mid ? 0.52 : 0.44;
      let wUV = (hUV * texAspect) / aspect;
      /* on a narrow screen a tall flask can still overflow sideways, so width
         gets the final say and height follows it back down. The stacked cap is
         looser because the flask is centred there rather than tucked into the
         right margin, so it has the whole width to use. */
      /* STACKED RUNS FULL WIDTH NOW. At 0.86 the width cap was the binding
         constraint on a phone — wUV wanted 0.91 at 393x852 and got clamped,
         which dragged hUV down with it to 0.34. So the plate was smaller than
         the 0.36 it asked for, and asking for more height did nothing at all
         while the cap was what actually bound. At 1.0 the same request comes
         out 393 wide and 336 tall instead of 338x289: about a fifth more
         flask, and the top edge rises from 62% of the frame to 56.5%, which
         closes most of the gap under the copy. The plate is a composite with
         its own transparent margin, so full width does not mean it touches
         the glass. */
      const wCap = stacked ? 1.0 : 0.6;
      if (wUV > wCap) {
        hUV *= wCap / wUV;
        wUV = wCap;
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
      /* A flat value cannot do this job. 0.73 looks right at 1766px and
         overlaps the copy at every width from 1280 to about 1750, because the
         copy column and the subject grow at different rates — the column is
         capped at 688px while the subject keeps widening with the viewport.
         So the wish is a floor, not a position. */
      const wantX = wide ? 0.73 : 0.8;
      /* STACKED: CENTRED AND ON THE FLOOR.
         It used to sit at 0.8 across and 0.24 up, which on a phone put it in
         the middle-right of the frame — straight through the buttons and the
         trust row, with dead space underneath it. The copy is top-aligned
         below md now, so all the slack is in one piece at the bottom and the
         flask fills it: centred, standing on the floor, 36% of the height.
         44, raised from 36. The old number was chosen to keep the plate's
         top below a copy block that ends at ~52% of a 393x852 screen, and it
         was over-cautious by ten points: at 44 the top edge lands at 56.5%,
         still clear, and the flask reads as a photograph rather than a
         thumbnail. It is also moot at most phone widths — the width cap binds
         first and hands height back down. Below about 700px of viewport height nothing clears
         anything and the flask goes back to being a background — which is
         what the scrim in SlideFlask is for. */
      /* THE PLATE HAS TO FIT THE FRAME, NOT ONLY CLEAR THE COPY.
         baseX was a FLOOR and nothing else: push right until the copy is
         clear, and stop. Nothing ever checked the other end. On a window that
         is wide but also tall the plate grows into its 0.6 width cap while
         the copy column stays put, so the floor pushed it straight off the
         right edge — 197px gone at 1440x1305, 152 at 1280x1024, and 10px on a
         1512x982 MacBook Pro 14, which is a machine people actually own.

         There is no arrangement that both clears the copy and fits at those
         aspects, so the plate gives up size rather than edge: it is shrunk to
         the strip that is actually available and then centred in it. Height
         follows width down through the ratio, exactly as it does under the
         width cap above. Where there IS room — 1920x1080, 1440x900, 1366x768
         — `room` exceeds wUV, nothing shrinks, and the geometry is untouched.

         The 0.18 floor is a backstop against a degenerate zero-width plate if
         the copy column is ever widened past what the frame can hold; it
         would overlap rather than vanish, which is the better failure. */
      const leftEdge = (copyRight + GUTTER) / w;
      const RIGHT_MARGIN = 0.008;
      const room = Math.max(0.18, 1 - RIGHT_MARGIN - leftEdge);
      if (!stacked && wUV > room) {
        hUV *= room / wUV;
        wUV = room;
      }
      const baseX = stacked
        ? 0.5
        : Math.min(
            1 - RIGHT_MARGIN - wUV / 2,
            Math.max(wantX, leftEdge + wUV / 2),
          );
      /* Sat down into the frame rather than floating in the upper half. It was
         lifted to keep dead liquid out of the bottom, but the new plate is
         taller in frame and fills that space on its own. */
      /* 0.04, not 0: the dot pill sits clamp(1.25rem, 3.5vh, 2.25rem) off the
         bottom, so a flask standing at exactly 0 has its base behind the
         controls. Four percent lifts it clear of the worst of that without
         eating into the gap above, which the copy needs. */
      const baseY = stacked ? 0.04 : mid ? 0.29 : 0.24;
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

      /* LIVE, NOT CAPTURED. These were read once at mount, so every number
         downstream was frozen at whatever the window was when the effect
         first ran — load on a desktop, narrow to a phone, and the flask kept
         desktop proportions on a 390px screen. */
      wide = mqWide.matches;
      if (mqMid.matches !== mid) {
        mid = mqMid.matches;
        uniforms.uOctaves.value = mid ? 3 : 2;
      }
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
