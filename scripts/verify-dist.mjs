/**
 * Opens the built site in headless Chrome (as a visitor, without the prerender flag)
 * and checks that the prerendered pages hydrate without errors and still carry the
 * per-route metadata. Run after `npm run build`: `npm run verify:dist`.
 */
import { createServer } from "node:http";
import puppeteer from "puppeteer";
import handler from "serve-handler";
import { ROUTES } from "./routes.mjs";

const PORT = 4175;
const server = createServer((req, res) =>
  handler(req, res, { public: "dist", cleanUrls: false, rewrites: [{ source: "**", destination: "/index.html" }] })
);
await new Promise((r) => server.listen(PORT, r));
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
let failed = false;

try {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
    await page.setRequestInterception(true);
    const pending = new Set();
    page.on("request", (r) => { if (new URL(r.url()).hostname === "localhost") { pending.add(r.url()); r.continue(); } else r.abort(); });
    page.on("requestfinished", (r) => pending.delete(r.url()));
    page.on("requestfailed", (r) => pending.delete(r.url()));
    await page.setViewport({ width: 1366, height: 900 });
    await page.goto(`http://localhost:${PORT}${route.path}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 20000 }).catch(() => console.log("      (network never idle; still pending:", [...pending].slice(0, 5).join(", "), ")"));
    await new Promise((r) => setTimeout(r, 1500));

    const info = await page.evaluate(() => ({
      title: document.title,
      descriptionTags: document.querySelectorAll('meta[name="description"]').length,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      canonicalTags: document.querySelectorAll('link[rel="canonical"]').length,
      jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
      h1: document.querySelectorAll("h1").length,
      h2: document.querySelectorAll("h2").length,
      navAnchors: document.querySelectorAll('nav a[href^="#"]').length,
      rootText: (document.getElementById("root")?.textContent || "").length,
      articleLang: document.querySelector("article")?.getAttribute("lang") ?? null,
      footer: !!document.querySelector("footer"),
    }));
    const problems = [];
    if (pageErrors.length) problems.push(`page errors: ${pageErrors.join(" | ")}`);
    if (info.descriptionTags !== 1) problems.push(`expected 1 meta description, found ${info.descriptionTags}`);
    if (info.canonicalTags !== 1) problems.push(`expected 1 canonical, found ${info.canonicalTags}`);
    if (info.h1 !== 1) problems.push(`expected 1 h1, found ${info.h1}`);
    if (info.rootText < (route.minText ?? 600)) problems.push(`root text too short: ${info.rootText}`);
    if (problems.length) failed = true;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${route.path}`, JSON.stringify({ ...info, consoleErrors: consoleErrors.slice(0, 3) }));
    for (const p of problems) console.log(`      - ${p}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
