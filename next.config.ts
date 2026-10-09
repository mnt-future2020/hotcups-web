import type { NextConfig } from "next";

/**
 * ── WHY `npm run build` SAYS `--webpack` ──────────────────────────────────
 *
 * Next 16 made Turbopack the default bundler for `next build`. Turbopack is a
 * native Rust binary and, unlike SWC, it has NO WebAssembly fallback — if the
 * platform cannot load the binary, the build has nowhere to go.
 *
 * The shared host this deploys to cannot load it. Its build log says so:
 *
 *   Attempted to load @next/swc-linux-x64-gnu, but an error occurred:
 *   /lib64/libm.so.6: version 'GLIBC_2.29' not found
 *   Using cached swc package @next/swc-wasm-nodejs...
 *
 * The native binaries are built against glibc 2.29; that container is older.
 * SWC recovers by switching to its WASM build — which is the line above —
 * and Turbopack cannot, so the build fails.
 *
 * `next build --webpack` is the documented opt-out (see the Next 16 upgrade
 * guide, "Opting out of Turbopack"), and webpack drives the WASM SWC happily.
 * Slower, and the slowness is the price of running on that host.
 *
 * DEVELOPMENT STAYS ON TURBOPACK. `next dev` is unchanged: this machine can
 * load the native binary, and the fast refresh is worth having. The split is
 * the exact arrangement the upgrade guide recommends.
 *
 * WHEN TO DELETE THIS. The flag is a workaround for one host, not a property
 * of the app. Move to any platform on a current glibc — Vercel, Railway,
 * Render, a modern VPS — and `next build` alone is correct again, and faster.
 */
const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
