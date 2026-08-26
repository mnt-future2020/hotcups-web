/**
 * The hero's liquid surface.
 *
 * Phase 1: surface, radial bend, vignette, specular sweep. Every uniform the
 * later phases need is declared and genuinely used, so nothing here is a dead
 * binding waiting to be wired — GLSL strips unused uniforms and ogl then warns
 * about a location it cannot find.
 *
 * The colour rule this shader lives or dies by: it is a DARK surface with
 * orange light ON it. Espresso is the material, amber is the highlight only.
 * If the screen reads orange overall the specular has escaped its band.
 */

export const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const FRAG = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  /** 0 = surface frozen, 1 = fully awake */
  uniform float uWake;
  /** vignette radius. small = closed in, large = pulled back */
  uniform float uRim;
  /** hero scroll progress, 0 at rest, 1 fully scrolled past */
  uniform float uScroll;
  uniform vec2  uMouse;
  /** x, y, startTime, strength */
  uniform vec4  uRipples[8];
  /** 2 on mobile, 3 on desktop */
  uniform int   uOctaves;
  /* The specular band's position, driven from JS rather than derived from
     uTime here. It has to leave this shader so the headline's reveal mask can
     ride the SAME value on the SAME frame — a second timeline that merely
     looks similar is exactly what kills the effect. */
  uniform float uSweep;

  /* the flask lives IN the shader, not in the DOM. As a texture the surface
     noise can distort its reflection, the ripple knows where its base is, and
     the waterline is a step() rather than a faked CSS mask. */
  uniform sampler2D uFlask;
  /** 0 = fully submerged, 1 = risen */
  uniform float uFlaskRise;
  /** x, y of the flask's base, and its width/height in UV */
  uniform vec4  uFlaskRect;
  /** 0 until the texture has actually decoded */
  uniform float uFlaskReady;
  /** reflection strength, faded in after the rise */
  uniform float uReflect;

  const vec3 TROUGH = vec3(0.1412, 0.0392, 0.0235); // #240a06
  const vec3 MID    = vec3(0.2275, 0.0784, 0.0549); // #3a140e
  const vec3 HOT    = vec3(0.9490, 0.3961, 0.1333); // #f26522

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                 hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  vec2 rot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }

  /* Pull the sampling grid toward the centre so the noise sits on something
     curved. Without this the surface reads as a flat sheet of wallpaper. */
  vec2 bend(vec2 p) {
    vec2 c = p - 0.5;
    return p - c * dot(c, c) * 0.62;
  }

  /* The height field.
     Three octaves on incommensurate drifts — 0.13 / 0.21 / 0.34 share no
     factor, so the combined pattern does not return for hours. Each octave is
     also ROTATED: value noise lives on an integer lattice, and unrotated
     octaves stack their grids into visible squares. */
  float height(vec2 q, float t) {
    float h  = 0.54 * vnoise(rot(q, 0.00) *  3.10 + vec2( t * 0.13, t * 0.090));
          h += 0.30 * vnoise(rot(q, 1.13) *  6.90 + vec2(-t * 0.21, t * 0.170));
    if (uOctaves > 2) {
          h += 0.13 * vnoise(rot(q, 2.41) * 14.20 + vec2( t * 0.34, -t * 0.270));
    } else {
          h += 0.065;
    }
    return h;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);

    /* the whole surface drops and shrinks away as the hero scrolls out */
    vec2 uv = vUv;
    uv.y = (uv.y - 1.0) / max(1.0 - uScroll * 0.55, 0.001) + 1.0;

    vec2 q = bend(uv);
    q.x *= aspect;

    float t = uTime;
    float e = 0.0016;
    float h = height(q, t);

    /* rings from the pointer, expanding and decaying over ~1.5s */
    float ripple = 0.0;
    for (int i = 0; i < 8; i++) {
      vec4 rp = uRipples[i];
      if (rp.w > 0.001) {
        float age = uTime - rp.z;
        if (age > 0.0 && age < 1.5) {
          float d = length((uv - rp.xy) * vec2(aspect, 1.0));
          ripple += sin(d * 26.0 - age * 11.0)
                  * exp(-pow((d - age * 0.34) * 9.0, 2.0))
                  * rp.w * (1.0 - age / 1.5) * 0.13;
        }
      }
    }
    h += ripple;

    /* asleep the surface is flat; awake it has relief */
    h = mix(0.5, h, clamp(uWake, 0.0, 1.0));

    /* the normal, from forward differences. Lighting the HEIGHT gives a
       shapeless blob; lighting the NORMAL gives the thin bright lines that
       read as a liquid surface. */
    float hx = mix(0.5, height(q + vec2(e, 0.0), t) + ripple, clamp(uWake, 0.0, 1.0));
    float hy = mix(0.5, height(q + vec2(0.0, e), t) + ripple, clamp(uWake, 0.0, 1.0));
    /* a lower z tilts the normals further, which deepens the relief —
       at 3.4 the surface was legible but flat */
    vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 2.5));

    /* a broad fixed light, so the surface still has relief between sweeps.
       Without this the frames where the band is off screen are brown sludge. */
    float amb = pow(max(dot(n, normalize(vec3(-0.35, 0.42, 0.84))), 0.0), 7.0);

    /* ONE band crossing the surface: a fast pass to write the headline, then
       about nine seconds a pass for ever after */
    float band  = exp(-pow((uv.x + uv.y * 0.22 - uSweep) / 0.155, 2.0));
    float spec  = pow(max(dot(n, normalize(vec3(0.62, 0.30, 0.72))), 0.0), 30.0) * band;

    /* the frame edge is the cup wall curving up out of view */
    float r = length((uv - 0.5) * vec2(aspect, 1.0));
    float vig = smoothstep(uRim, uRim * 0.325, r);

    vec3 col = mix(TROUGH, MID, smoothstep(0.34, 0.70, h));
    col += HOT * amb * 0.26;
    col += HOT * spec * 1.30;
    col += HOT * band * 0.048;
    col *= mix(0.38, 1.0, vig);

    /* a soft lift under the pointer, so the liquid feels attended to */
    col += HOT * exp(-pow(length((uv - uMouse) * vec2(aspect, 1.0)) * 3.4, 2.0)) * 0.020;

    /* ------------------------------------------------------------------
       THE FLASK
       ------------------------------------------------------------------ */
    if (uFlaskReady > 0.5) {
      vec2  base = uFlaskRect.xy;          // where it meets the liquid
      vec2  size = uFlaskRect.zw;          // width, height in UV
      float rise = clamp(uFlaskRise, 0.0, 1.0);

      /* it emerges by sliding up out of its own reflection */
      float waterline = base.y;
      vec2  fUv = vec2(
        (uv.x - (base.x - size.x * 0.5)) / size.x,
        (uv.y - waterline + size.y * (1.0 - rise)) / size.y
      );

      /* ---- REFLECTION ----
         The same texture, mirrored below the waterline and dragged sideways
         by the SAME height field that moves the surface, so it wobbles
         exactly as the liquid does. This is the detail that sells it.

         ogl gives textures flipY = true, so v = 0 is the BOTTOM of the image.
         The reflection therefore reads straight up from v = 0 as depth grows,
         which is already the mirror — no flip needed. */
      float depth = waterline - uv.y;
      float reach = size.y * 0.62;
      if (depth > 0.0 && depth < reach) {
        float wobble = (h - 0.5) * 0.09 * smoothstep(0.0, 0.04, depth);
        vec2 rUv = vec2(fUv.x + wobble, depth / size.y);
        if (rUv.x > 0.0 && rUv.x < 1.0 && rUv.y < 1.0) {
          vec4 refl = texture2D(uFlask, rUv);
          float fade = 1.0 - depth / reach;
          /* the texture is PREMULTIPLIED — straight alpha left 167k edge
             pixels carrying white, which read as a pale rectangle on a dark
             hero. Premultiplied source composites as col*(1-a) + rgb. */
          float k = 0.25 * fade * fade * uReflect * rise;
          col = col * (1.0 - refl.a * k) + refl.rgb * k;
        }
      }

      /* ---- CONTACT DARKENING: liquid pushed down around the base ---- */
      float cd = exp(-pow(length((uv - vec2(base.x, waterline)) * vec2(aspect, 1.0)) * 3.2, 2.0));
      col *= 1.0 - cd * 0.42 * rise;

      /* ---- THE FLASK, cut at the waterline ---- */
      if (fUv.x > 0.0 && fUv.x < 1.0 && fUv.y > 0.0 && fUv.y < 1.0) {
        vec4 flask = texture2D(uFlask, fUv);
        float above = smoothstep(waterline - 0.004, waterline + 0.004, uv.y);
        /* the part still under the surface is seen through the liquid.
           TROUGH is scaled by alpha to stay in premultiplied space. */
        vec3 sunk = mix(flask.rgb, TROUGH * flask.a, 0.62);
        col = col * (1.0 - flask.a) + mix(sunk, flask.rgb, above);
      }
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;
