/**
 * Prerenders every route in routes.mjs to static HTML inside dist/.
 *
 * It serves dist/ locally, opens each route in headless Chrome with `?prerender=1`
 * (the app then renders its complete state, see src/lib/prerender.ts), waits until
 * all data repositories have loaded, and writes the resulting DOM to
 * dist/<route>/index.html. The served pages therefore contain the full content,
 * title, meta tags and JSON-LD before any JavaScript runs.
 */
import { createServer } from "node:http";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";
import handler from "serve-handler";
import { ROUTES } from "./routes.mjs";

const DIST = "dist";
const PORT = 4173;
const MIN_TEXT_LENGTH = 2000; // sanity check: a prerendered page must contain real content

export async function prerender() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error(`${DIST}/index.html not found. Run "vite build" first.`);
  }

  // Serve the untouched SPA shell as the fallback for every route. Once "/" has been
  // prerendered, dist/index.html holds the full homepage, which must not be the starting
  // point for the other routes (slower, and its head would leak into their capture).
  // A pristine shell has an empty root; when the step is re-run on an already
  // prerendered dist/, the shell saved by the previous run is reused instead.
  const shellPath = join(DIST, "__spa-shell.html");
  const shellCache = join(".cache", "spa-shell.html");
  const current = readFileSync(join(DIST, "index.html"), "utf8");
  if (current.includes('<div id="root"></div>')) {
    mkdirSync(".cache", { recursive: true });
    writeFileSync(shellCache, current);
    writeFileSync(shellPath, current);
  } else if (existsSync(shellCache)) {
    console.log("prerender: dist/index.html is already prerendered, reusing the cached SPA shell");
    copyFileSync(shellCache, shellPath);
  } else {
    throw new Error("dist/index.html is already prerendered and no cached shell exists. Run \"vite build\" first.");
  }

  const server = createServer((req, res) =>
    handler(req, res, {
      public: DIST,
      cleanUrls: false,
      rewrites: [{ source: "**", destination: "/__spa-shell.html" }],
    })
  );
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      // Reveal blocks render open in prerender mode, so a normal viewport is enough and
      // keeps lazy images below the fold from being fetched during the capture.
      await page.setViewport({ width: 1366, height: 1000, deviceScaleFactor: 1 });
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const host = new URL(req.url()).hostname;
        if (host === "localhost" || host === "127.0.0.1") req.continue();
        else req.abort(); // map tiles, fonts, external images: not needed for the DOM
      });
      page.on("pageerror", (err) => console.warn(`[prerender] page error on ${route.path}:`, err.message));

      const url = `http://localhost:${PORT}${route.path}?prerender=1`;
      await page.goto(url, { waitUntil: "load", timeout: 90000 });
      await page
        .waitForNetworkIdle({ idleTime: 500, timeout: 45000 })
        .catch(() => console.warn(`[prerender] ${route.path}: network still busy after 45s, continuing`));

      // Wait for every data repository to finish loading (src/lib/prerender.ts).
      await page
        .waitForFunction(
          () => window.__prerender && window.__prerender.pending === 0 && window.__prerender.loads > 0,
          { timeout: 30000 }
        )
        .catch(() => console.warn(`[prerender] ${route.path}: no data loads detected, capturing anyway`));
      await page.waitForNetworkIdle({ idleTime: 600, timeout: 30000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 800)); // let the last state updates paint

      await page.evaluate(() => document.documentElement.removeAttribute("data-prerender-ready"));
      const stats = await page.evaluate(() => ({
        textLength: (document.getElementById("root")?.textContent || "").length,
        h2: document.querySelectorAll("h2").length,
        title: document.title,
      }));
      if (stats.textLength < MIN_TEXT_LENGTH) {
        throw new Error(`Prerender of ${route.path} produced only ${stats.textLength} characters of text; refusing to ship an empty page.`);
      }

      let html = await page.content();
      if (route.head && !html.includes(route.head)) html = html.replace("</head>", `    ${route.head}
  </head>`);
      const outFile = route.path === "/" ? join(DIST, "index.html") : join(DIST, route.path.replace(/^\/|\/$/g, ""), "index.html");
      mkdirSync(dirname(outFile), { recursive: true });
      writeFileSync(outFile, html);
      console.log(`prerender: ${route.path} -> ${outFile} (${(html.length / 1024).toFixed(0)} KB, ${stats.h2} h2, title "${stats.title}")`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
    rmSync(shellPath, { force: true });
  }
}

if (process.argv[1]?.endsWith("prerender.mjs")) {
  prerender().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
