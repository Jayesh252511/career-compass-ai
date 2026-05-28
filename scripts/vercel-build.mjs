/**
 * vercel-build.mjs
 * Custom build script for Vercel deployment.
 *
 * TanStack Start v1 with Vite outputs to dist/client (static assets)
 * and dist/server (SSR Node.js handler). This script:
 *   1. Runs the standard Vite build
 *   2. Restructures the output into Vercel Build Output API v3 format
 *      (.vercel/output/) so Vercel knows how to serve it.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, ".vercel", "output");

// ─── 1. Run Vite build ─────────────────────────────────────────────────────
console.log("📦  Building TanStack Start app…");
execSync("npm run build", { stdio: "inherit", cwd: root });

// ─── 2. Scaffold output directories ────────────────────────────────────────
console.log("🔧  Creating Vercel Build Output API structure…");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, "static", "assets"), { recursive: true });
fs.mkdirSync(path.join(outDir, "functions", "index.func", "dist", "server"), { recursive: true });

// ─── 3. Static assets: dist/client/assets → .vercel/output/static/assets ──
fs.cpSync(
  path.join(root, "dist", "client", "assets"),
  path.join(outDir, "static", "assets"),
  { recursive: true }
);
console.log("  ✓ Static assets copied");

// ─── 4. SSR bundle: dist/server → function bundle ──────────────────────────
fs.cpSync(
  path.join(root, "dist", "server"),
  path.join(outDir, "functions", "index.func", "dist", "server"),
  { recursive: true }
);
console.log("  ✓ SSR server bundle copied");

// ─── 5. Vercel function entry (Node.js 20 — adapts fetch handler → http) ──
const funcEntry = `
import { createServer } from "http";

// Lazy-load to avoid module-resolution issues at import time
let _handler = null;
async function getHandler() {
  if (!_handler) {
    const mod = await import("./dist/server/server.js");
    _handler = mod.default;
  }
  return _handler;
}

/** Convert Node.js IncomingMessage → Web API Request */
async function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = new URL(req.url || "/", \`\${protocol}://\${host}\`);

  const body = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : undefined));
    req.on("error", reject);
  });

  const skipBody = ["GET", "HEAD"].includes(req.method || "GET");
  return new Request(url.toString(), {
    method: req.method,
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => v !== undefined)
    ),
    body: !skipBody && body && body.length > 0 ? body : undefined,
  });
}

/** Send Web API Response → Node.js ServerResponse */
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
    const server = await getHandler();
    const request = await toWebRequest(req);
    const response = await server.fetch(request);
    await sendWebResponse(response, res);
  } catch (err) {
    console.error("[SSR] Unhandled error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>500 – Internal Server Error</h1>");
  }
}
`.trim();

fs.writeFileSync(
  path.join(outDir, "functions", "index.func", "index.mjs"),
  funcEntry
);

// ─── 6. Vercel function runtime config ─────────────────────────────────────
fs.writeFileSync(
  path.join(outDir, "functions", "index.func", ".vc-config.json"),
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.mjs", maxDuration: 30 }, null, 2)
);

// ─── 7. Vercel output config (routing rules) ────────────────────────────────
const config = {
  version: 3,
  routes: [
    // Long-cache static assets (content-hashed filenames)
    {
      src: "^/assets/(.*)$",
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    // Serve static files if they exist on disk
    { handle: "filesystem" },
    // All other requests → SSR function
    { src: "^/(.*)$", dest: "/index" },
  ],
};
fs.writeFileSync(path.join(outDir, "config.json"), JSON.stringify(config, null, 2));

console.log("✅  Vercel output ready at .vercel/output/");
console.log("    Static:  .vercel/output/static/");
console.log("    SSR fn:  .vercel/output/functions/index.func/");
