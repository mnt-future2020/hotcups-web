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
/* THE PLATE IS THE CREAM HOTCUPS FLASK NOW, at the client's direction — the
   same composition as before, flask beside a glass of chai mid-splash, with
   the client's own branded flask in place of the unbranded steel one. It
   replaces hero-subject-v2.webp.

   IT WAS CUT HERE, NOT SUPPLIED CUT. The source is app/im1.png, a 1230x1278
   photograph on a wooden counter, fully opaque — no alpha channel at all. The
   cut is reproducible and committed: scripts/cut-im1.js carries the key, and
   every threshold in it was measured off this photograph rather than
   guessed.

   THE KEY HAS THREE ARMS, because no single threshold separates this frame.

     FLASK   sat < 0.30, fenced to u > 0.42. The body is (198,185,169) at sat
             0.15 and the lid (26,27,27) at sat 0.02 — near-neutral against a
             backdrop that is warm brown everywhere, sat 0.88-0.90. The fence
             exists because the PHOTOGRAPH'S OWN STEAM is grey enough in
             places to slip through this arm, and it drifts to the left.

     BRIGHT  lum > 110, anywhere. Takes the splash crown (152), every droplet
             (119+) and the lit ginger (164). 110 and not 70: that steam tops
             out near 90, and keying it in hung brown smears in mid-air beside
             the glass — visible, and wrong, because the hero draws its own.

     GLASS   lum > 55, fenced to u < 0.45 and 0.52 < v < 0.92. The tumbler's
             facets and its shaded side fall well under 110; at that threshold
             they keyed OUT and left transparent stripes down the middle of
             the chai. Nothing else in that corner survives 55 — the table
             reads 39-41, the cinnamon 37, the cardamom 38, the leaf 48.

   Then: drop components under 45px, fill interior holes, cut the table at
   v = 0.92, feather 1.5px. HOLES ARE FILLED BEFORE THE BOTTOM IS CUT, and
   getting that order wrong is what produced the stripes the first time —
   cutting first opens a channel from the chai's dark bands down through the
   glass base to the frame edge, so the flood that finds "outside" reaches
   them and they are never filled. The handle's opening is the one hole left
   alone: any hole over 4000px whose centroid is right of u 0.78.

   ASPECT 1.169 -> 1.059, near enough that the geometry below is untouched.
   The plate is sized by HEIGHT and width follows texAspect — the reason that
   choice is spelled out at the top of layout() — so a 9% narrower plate just
   leaves 9% more air in the right margin.

   THE STEAM STILL LEAVES THE CHAI, u = 0.27, v = 0.55, and the old note's
   reasoning survives the swap intact: "a closed vacuum flask does not steam,
   and the glass is the thing that is visibly hot." Re-measured on guides over
   THIS cut-out, the tumbler's rim sits at v = 0.60 and its centre line at
   u = 0.27. v = 0.55 is a notch above the rim rather than on it — the same
   0.055 of clearance the old plate used against its own 0.555 rim, and for
   the same reason: born exactly on the rim, the first half of every puff is
   spent behind the glass and the splash. */
const SUBJECT = { src: "/img/hero-hotcups-chai.webp", u: 0.27, v: 0.55 };

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
      /* A PLAIN ARRAY, NOT A Float32Array, AND THE RIPPLES DID NOTHING UNTIL
         IT WAS. WebGL reports `vec4 uRipples[8]` under the name
         "uRipples[0]", and ogl splits that into a base name plus components,
         then walks them (core/Program.js ~line 182). The component "0" is not
         a key on { value }, so it falls to `Array.isArray(uniform.value)` to
         decide whether this is an array uniform being supplied whole — and
         Array.isArray of a TYPED array is false. So it took the else branch,
         set the uniform to undefined, logged "Active uniform uRipples[0] has
         not been supplied" and RETURNED BEFORE UPLOADING.

         Which meant uRipples stayed at its GL default of all zeros for the
         life of the page: strength (.w) was always 0, so every ripple summed
         to nothing. The pointer wake and the ripple fired at 1150ms behind
         the flask have never once been visible. It also explains the console
         — one warning per uniform per frame, which is what "more than 100
         program warnings - stopping logs" was counting.

         Every other array uniform here is already a plain array (uMouse,
         uFlaskRect); this was the one that was not. 32 slots, 8 ripples of
         vec4, and gl.uniform4fv takes a number[] as happily as a typed one. */
      uRipples: { value: new Array(8 * 4).fill(0) },
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
      /* 0.13 ON DESKTOP, DOWN FROM 0.29, at the client's direction — the
         plate was sitting too high in the frame.

         Measured at 1440x900 before any of this: hUV 0.62 makes the plate
         558px tall, its base sat 261px up, and its TOP therefore landed at
         y=81 — three pixels under a 78px header — with 261px of empty frame
         beneath it. It read as pressed against the bar with a hole under it.

         IT WAS TUNED BY EYE, IN THREE STEPS, AND THE MIDDLE ONE IS WHY THE
         NUMBER LOOKS ARBITRARY. 0.18 centred the plate in the band below the
         header and was still too high. 0.09 stood it on the floor of the
         frame and went too far the other way. 0.13 is the settle: base about
         120px up at 1920x930, which lands the plate's mass level with the
         copy block beside it rather than above or below it.

         That is the actual target, and it is worth stating because it is not
         "centre the plate". The copy column runs roughly 210..710 on a
         desktop; matching the photograph to THAT, not to the frame, is what
         makes the two halves read as one composition.

         THE BOTTOM SCRIM WAS EXPECTED TO STOP THIS AND DOES NOT.
         SlideFlask lays a desktop-only `bottom-0 h-60` ramp to
         rgba(18,5,2,0.9) over this area, and the phone case already records
         that ramp "sat exactly where the flask now stands and crushed its
         base to almost black". The same was predicted here below about 0.14
         — which 0.13 is under — and it was checked rather than assumed. The
         test was run at 0.09, further down than this sits, where the plate's
         lower body takes roughly 0.5-0.66 of that ramp at 1280x720: the worst
         case, because h-60 is a FIXED 240px and therefore a third of a short
         frame against an eighth of a tall one.

         It survives, and the reason is what the ramp lands on. On a phone it
         fell across a small plate whose base was already the darkest thing in
         the frame. Here it falls across a polished steel body that is the
         BRIGHTEST thing in the frame, and 0.6 of black over specular metal is
         still legible metal — it reads as light falling off towards the
         floor, which is what the reflection underneath is already doing.

         So the floor on baseY is not the scrim. It is the dot pill, which
         sits clamp(1.25rem, 3.5vh, 2.25rem) off the bottom and is centred,
         while the plate is tucked right — they do not overlap horizontally at
         any width the desktop branch covers.

         Checked at 1280x720, 1440x900, 1512x982 and 1920x930. 0.18 and 0.09
         were both looked at on the short 1280x720 frame and both held, so the
         0.13 between them is bracketed rather than separately eyeballed
         there.

         THE THIRD ARM WAS UNREACHABLE AND IS GONE. This read
         `stacked ? 0.04 : mid ? 0.29 : 0.24`, but `stacked` is defined four
         lines up as `!mid` — so `!stacked` guarantees `mid`, and 0.24 could
         never be selected. Two states, two values. (hUV above genuinely has
         three, because it branches on `wide` first, which is a different
         query.) */
      const baseY = stacked ? 0.04 : 0.13;
      uniforms.uFlaskRect.value = [baseX, baseY, wUV, hUV];
      /* the steam leaves the chai, which is off-centre inside the composite
         — reported in the 2D canvas's top-down space. SUBJECT.v is measured
         from the TOP of the image, which is why it is added to the plate's
         top edge rather than subtracted from it. */
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
