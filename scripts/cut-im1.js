/**
 * Cut app/im1.png into public/img/hero-hotcups-chai.webp — the hero plate.
 *
 * NOT PART OF THE BUILD. Run by hand with `node scripts/cut-im1.js <outdir>`
 * when the source photograph changes. It is committed because every threshold
 * in it was MEASURED off that specific photograph, and the next person to
 * swap the plate needs to know which numbers are load-bearing and why. The
 * reasoning lives next to the SUBJECT constant in
 * components/hero/LiquidSurface.tsx; this file is the executable half of it.
 *
 * Needs sharp, which is already a dependency of the image pipeline.
 */

const s = require('sharp');
const T = process.argv[2] || '.';

/* ---- the key ----------------------------------------------------------
   Three arms, because no single threshold separates this photograph.

   FLASK  sat < 0.30, fenced to u > 0.42. The body is (198,185,169) at sat
          0.15 and the lid (26,27,27) at sat 0.02 — both near-neutral against
          a backdrop that is warm brown everywhere, sat 0.88-0.90. The fence
          is there because the PHOTOGRAPH'S OWN STEAM is grey enough in
          places to slip through this arm, and it lives to the left.
   BRIGHT lum > 110, anywhere. Takes the splash crown (152), every droplet
          (119+) and the lit ginger (164). 110 and not 70: the photo steam
          tops out near 90, and keying it in hung brown smears in mid-air
          beside the glass.
   GLASS  lum > 55, fenced to u < 0.45 and v > 0.52. The tumbler's facets and
          its shadowed side fall well under 110 — at that threshold they
          keyed OUT and left transparent stripes down the middle of the chai.
          Nothing else in that corner survives 55: the table reads 39-41, the
          cinnamon 37, the cardamom 38 and the leaf 48.                    */
const key = (L, S, u, v) =>
  (S < 0.30 && L > 15 && u > 0.42) ||
  L > 110 ||
  (L > 55 && u < 0.45 && v > 0.52 && v < 0.92);

/* 0.92. Measured on rows drawn over the source: the flask's base ends near
   0.89, the glass's near 0.892 and the last cardamom pods reach 0.92. Below
   that is table and the reflection in it. The shader waterlines the plate at
   its base and mirrors it anyway, so a flat bottom edge is what it wants. */
const BASE_V = 0.92;

(async () => {
  const { data, info } = await s('app/im1.png').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels, N = W * H;

  const m = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const x = p % W, y = (p / W) | 0;
    const r = data[p*C], g = data[p*C+1], b = data[p*C+2];
    const L = 0.2126*r + 0.7152*g + 0.0722*b;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    if (key(L, mx ? (mx-mn)/mx : 0, x / W, y / H)) m[p] = 1;
  }

  const comps = (mask, want) => {
    const lab = new Int32Array(N).fill(-1); const out = [];
    for (let p = 0; p < N; p++) {
      if (mask[p] !== want || lab[p] >= 0) continue;
      const cells = [p]; lab[p] = out.length; const st = [p];
      while (st.length) {
        const q = st.pop(); const x = q % W, y = (q / W) | 0;
        for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x+dx, ny = y+dy;
          if (nx<0||ny<0||nx>=W||ny>=H) continue;
          const r2 = ny*W+nx;
          if (mask[r2] === want && lab[r2] < 0) { lab[r2] = out.length; cells.push(r2); st.push(r2); }
        }
      }
      out.push(cells);
    }
    return out;
  };

  for (const c of comps(m, 1)) if (c.length < 45) for (const p of c) m[p] = 0;

  /* HOLES ARE FILLED BEFORE THE BOTTOM IS CUT. Cutting first punches the
     table rows out, which opens a channel from the chai's dark bands down
     through the glass base to the frame edge — the "outside" flood reaches
     them and they never get filled. */
  for (const c of comps(m, 0)) {
    let touches = false, sx = 0;
    for (const p of c) {
      const x = p % W, y = (p / W) | 0;
      if (x===0||y===0||x===W-1||y===H-1) { touches = true; break; }
      sx += x;
    }
    if (touches) continue;
    // the handle's opening is the one big hole out on the right; it stays open
    if (c.length > 4000 && sx / c.length / W > 0.78) continue;
    for (const p of c) m[p] = 1;
  }

  const cut = Math.round(BASE_V * H);
  for (let p = 0; p < N; p++) if (((p / W) | 0) >= cut) m[p] = 0;
  for (const c of comps(m, 1)) if (c.length < 45) for (const p of c) m[p] = 0;

  const a = Buffer.alloc(N);
  for (let p = 0; p < N; p++) a[p] = m[p] ? 255 : 0;
  await s(a, { raw: { width: W, height: H, channels: 1 } }).png().toFile(T + '/im1-mask.png');

  const clean = await s(T + '/im1-mask.png').blur(2.2).threshold(128).blur(1.5)
    .toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(N * 4);
  for (let p = 0; p < N; p++) {
    out[p*4]=data[p*C]; out[p*4+1]=data[p*C+1]; out[p*4+2]=data[p*C+2]; out[p*4+3]=clean.data[p];
  }
  await s(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png()
    .toFile(T + '/im1-cut.png');
  const mm = await s(T + '/im1-cut.png').metadata();
  console.log('cut', mm.width + 'x' + mm.height, 'aspect', (mm.width/mm.height).toFixed(3));
  await s(T + '/im1-cut.png').flatten({ background: { r: 26, g: 14, b: 10 } })
    .resize(620).jpeg({ quality: 92 }).toFile(T + '/im1-on-dark.jpg');
  await s(T + '/im1-cut.png').flatten({ background: { r: 0, g: 200, b: 90 } })
    .resize(620).jpeg({ quality: 92 }).toFile(T + '/im1-on-green.jpg');
})();
