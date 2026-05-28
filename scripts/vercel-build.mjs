/**
 * vercel-build.mjs
 * Custom build script for Vercel deployment.
 *
 * TanStack Start v1 with Vite SSR outputs to dist/server/ but the
 * server bundle has external NPM imports (h3-v2, @tanstack/router-core,
 * react, seroval, etc.) that are not co-located.  We use esbuild to
 * create a fully self-contained bundle so the Vercel Node.js function
 * has zero external dependencies at runtime.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, ".vercel", "output");
const funcDir = path.join(outDir, "functions", "index.func");

// ─── 1. Run Vite build ─────────────────────────────────────────────────────
console.log("📦  Building TanStack Start app…");
execSync("npm run build", { stdio: "inherit", cwd: root });

// ─── 2. Scaffold output directories ────────────────────────────────────────
console.log("🔧  Creating Vercel Build Output API structure…");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "static", "assets"), { recursive: true });
fs.mkdirSync(funcDir, { recursive: true });

// ─── 3. Static assets: dist/client/assets → .vercel/output/static/assets ──
fs.cpSync(
  path.join(root, "dist", "client", "assets"),
  path.join(outDir, "static", "assets"),
  { recursive: true }
);
console.log("  ✓ Static assets copied");

// ─── 4. Bundle SSR server + all npm deps into a single self-contained file ─
// The Vite SSR build externalises node_modules (h3-v2, @tanstack/*, react…).
// We re-bundle with esbuild JS API so the Vercel function needs no node_modules.
console.log("  ⚙️  Bundling SSR server with esbuild (JS API)…");

// Use dynamic import so we get the installed esbuild module
const { build: esbuild } = await import("esbuild");

const NODE_BUILTINS = [
  "node:*", "async_hooks", "buffer", "child_process", "cluster", "crypto",
  "dgram", "dns", "domain", "events", "fs", "http", "http2", "https",
  "module", "net", "os", "path", "perf_hooks", "process", "punycode",
  "querystring", "readline", "stream", "string_decoder", "tls", "tty",
  "url", "util", "v8", "vm", "worker_threads", "zlib",
];

await esbuild({
  entryPoints: [path.join(root, "dist", "server", "server.js")],
  bundle: true,
  platform: "node",
  target: ["node20"],
  format: "esm",
  // Single output file — all dynamic imports inlined via splitting + chunk merging
  splitting: true,
  outdir: funcDir,
  entryNames: "server.bundle",
  chunkNames: "chunks/[name]-[hash]",
  external: NODE_BUILTINS,
  logLevel: "warning",
});
console.log("  ✓ SSR server bundled (self-contained)");

// ─── 5. Vercel function entry — adapts Node.js req/res ↔ Web Fetch API ────
const funcEntry = `
// Node.js 20 serverless function wrapping the TanStack Start SSR server.
// The server exports a standard WinterCG fetch handler.
import serverMod from './server.bundle.js';

// server.bundle is the outer server.js; its default export has a .fetch method.
const server = serverMod;

/** Convert Node.js IncomingMessage → Web API Request */
async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url || "/", protocol + "://" + host);

  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : undefined));
    req.on("error", reject);
  });

  const skipBody = ["GET", "HEAD"].includes((req.method || "GET").toUpperCase());
  return new Request(url.toString(), {
    method: req.method || "GET",
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => v !== undefined)
    ),
    body: !skipBody && body && body.length > 0 ? body : undefined,
  });
}

/** Stream Web API Response → Node.js ServerResponse */
async function sendWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

export default async function handler(req, res) {
  try {
    const request = await toWebRequest(req);
    const response = await server.fetch(request);
    await sendWebResponse(response, res);
  } catch (err) {
    console.error("[SSR] Unhandled error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>500 – Internal Server Error</h1><pre>" + String(err) + "</pre>");
  }
}
`.trim();

fs.writeFileSync(path.join(funcDir, "index.mjs"), funcEntry);

// ─── 6. Vercel function runtime config ─────────────────────────────────────
fs.writeFileSync(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.mjs", maxDuration: 30 }, null, 2)
);

// ─── 7. Vercel output config (routing rules) ────────────────────────────────
const config = {
  version: 3,
  routes: [
    // Long-cache content-hashed assets
    {
      src: "^/assets/(.*)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // Serve static files if they exist
    { handle: "filesystem" },
    // All other requests → SSR function
    { src: "^/(.*)$", dest: "/index" },
  ],
};
fs.writeFileSync(path.join(outDir, "config.json"), JSON.stringify(config, null, 2));

console.log("✅  Vercel output ready at .vercel/output/");
console.log("    Static:  .vercel/output/static/");
console.log("    SSR fn:  .vercel/output/functions/index.func/");
