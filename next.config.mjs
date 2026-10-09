/**
 * ── WHY THIS IS `.mjs` AND NOT `.ts` ──────────────────────────────────────
 *
 * Because a TypeScript config cannot be loaded on the host this deploys to,
 * and the build dies before it compiles a single page. The build log:
 *
 *   Attempted to load @next/swc-linux-x64-gnu, but an error occurred:
 *   /lib64/libm.so.6: version 'GLIBC_2.29' not found
 *   Attempted to load @next/swc-linux-x64-musl, but an error occurred:
 *   /lib64/libc.so: invalid ELF header
 *   Using cached swc package @next/swc-wasm-nodejs...
 *   × Failed to load next.config.ts
 *   Error: Cannot find module '<hash>.next.config'
 *          imported from 'next.config.compiled.js'  (ERR_MODULE_NOT_FOUND)
 *
 * THE EXTENSION IS THE WHOLE DIFFERENCE, and it is one branch in Next's
 * config loader (next/dist/server/config.js, in loadConfig):
 *
 *   } else if (configFileName === 'next.config.ts') {
 *       userConfigModule = await transpileConfig({ nextConfigPath, dir })
 *   } else {
 *       userConfigModule = await import(pathToFileURL(path).href)
 *   }
 *
 * The `.ts` arm calls transpileConfig, which calls loadBindings() and runs
 * the file through SWC before evaluating it. Every other extension is a
 * plain dynamic import with no SWC involved at all. `next.config.compiled.js`
 * in the error is that transpiler's synthetic filename — it appears in
 * exactly one place in Next 16.3.1, transpile-config.js, so the failure is
 * unambiguously that arm.
 *
 * On this host SWC is the WASM build, because both native binaries fail to
 * load: the glibc binary wants 2.29 and that container is older, and the musl
 * one is not a valid ELF there. The WASM transpile of the config then emitted
 * something Node could not resolve. CONFIG_FILES is
 * ['next.config.js', 'next.config.mjs', 'next.config.ts', ...], so renaming
 * the file is enough to take the other branch and the problem cannot occur.
 *
 * NOTHING WAS LOST. The config has no options in it. The only TypeScript here
 * was `const nextConfig: NextConfig = {}` — an annotation on an empty object —
 * and the JSDoc below gives the editor the same type without the extension
 * that breaks the build.
 *
 * ── AND WHY `npm run build` STILL SAYS `--webpack` ────────────────────────
 *
 * Separate problem, same cause, already fixed. Next 16 made Turbopack the
 * default bundler for `next build`, and Turbopack is a native Rust binary
 * with NO WebAssembly fallback — if the platform cannot load it, the build
 * has nowhere to go. SWC recovers by switching to WASM; Turbopack cannot.
 * `next build --webpack` is the documented opt-out and webpack drives the
 * WASM SWC happily. Slower, and the slowness is the price of that host.
 *
 * DEVELOPMENT STAYS ON TURBOPACK. `next dev` is unchanged: this machine loads
 * the native binary fine and the fast refresh is worth having.
 *
 * WHEN TO UNDO BOTH. They are workarounds for one host, not properties of the
 * app. Move to any platform on a current glibc — Vercel, Railway, Render, a
 * modern VPS — and `next build` alone is correct again, and faster, and the
 * config can go back to TypeScript if anyone wants it to.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
