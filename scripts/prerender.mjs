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
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";
import handler from "serve-handler";
import { ROUTES } from "./routes.mjs";

const DIST = "dist";
const PORT = 4173;
// Sanity check: a prerendered page must contain real content (routes may set minText).
const MIN_TEXT_LENGTH = 600;
// State snapshots larger than this go to a separate, preloaded JSON file instead of the HTML.
const INLINE_STATE_MAX = 2048;

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

      if (route.waitForData) {
        // Wait for every data repository to finish loading (src/lib/prerender.ts).
        await page
          .waitForFunction(
            () => window.__prerender && window.__prerender.pending === 0 && window.__prerender.loads > 0,
            { timeout: 30000 }
          )
          .catch(() => console.warn(`[prerender] ${route.path}: no data loads detected, capturing anyway`));
      } else {
        // Lazily loaded pages: wait until the page has rendered into its route boundary.
        await page
          .waitForFunction(
            () => {
              const boundary = document.querySelector(".route-boundary");
              return !!boundary && (boundary.textContent || "").length > 300;
            },
            { timeout: 30000 }
          )
          .catch(() => console.warn(`[prerender] ${route.path}: page content did not appear, capturing anyway`));
      }
      await page.waitForNetworkIdle({ idleTime: 600, timeout: 30000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 800)); // let the last state updates paint

      await page.evaluate(() => {
        document.documentElement.removeAttribute("data-prerender-ready");
        const root = document.getElementById("root");
        if (!root) return;
        // Server-rendered React output separates adjacent text nodes with <!-- -->;
        // without the separator the browser merges them and hydration cannot match.
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) texts.push(walker.currentNode);
        for (const t of texts) {
          if (t.nextSibling && t.nextSibling.nodeType === Node.TEXT_NODE) {
            t.parentNode.insertBefore(document.createComment(" "), t.nextSibling);
          }
        }
        // Each homepage section and each lazily loaded page sits in its own Suspense
        // boundary; server output marks a resolved boundary with <!--$--> ... <!--/$-->.
        for (const el of root.querySelectorAll(".section-boundary, .route-boundary")) {
          el.insertBefore(document.createComment("$"), el.firstChild);
          el.appendChild(document.createComment("/$"));
        }
      });
      // Final state of the data sections (useSnapshotState) for hydration.
      const state = await page.evaluate(() => JSON.stringify(window.__prerenderState || {}));
      let stateTag = "";
      let stateHead = "";
      if (state.length > INLINE_STATE_MAX) {
        // Large state: a JSON file next to the page, named in a meta tag and preloaded so it
        // downloads in parallel with the scripts. The hash keeps caches from pairing an
        // old state file with new HTML.
        const dir = route.path === "/" ? "" : route.path.replace(/^\//, "");
        const hash = createHash("sha1").update(state).digest("hex").slice(0, 10);
        const url = `/${dir}state.json?v=${hash}`;
        mkdirSync(join(DIST, dir), { recursive: true });
        writeFileSync(join(DIST, dir, "state.json"), state);
        stateHead =
          `<meta name="prerender-state" content="${url}">` +
          `<link rel="preload" href="${url}" as="fetch" crossorigin="anonymous" fetchpriority="low">`;
      } else {
        stateTag =
          '<script id="__PRERENDER_STATE__" type="application/json">' +
          state.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") +
          "</script>";
      }
      const stats = await page.evaluate(() => ({
        textLength: (document.getElementById("root")?.textContent || "").length,
        h2: document.querySelectorAll("h2").length,
        title: document.title,
      }));
      if (stats.textLength < (route.minText ?? MIN_TEXT_LENGTH)) {
        throw new Error(`Prerender of ${route.path} produced only ${stats.textLength} characters of text; refusing to ship an empty page.`);
      }

      let html = await page.content();
      if (route.head && !html.includes(route.head)) html = html.replace("</head>", `    ${route.head}
  </head>`);
      if (stateHead) html = html.replace("</head>", `    ${stateHead}\n  </head>`);
      // Lazy chunks requested during the capture leave modulepreload links behind; like the
      // entry scripts they only add interactivity, so they fetch at low priority.
      html = html.replace(/<link rel="modulepreload"(?![^>]*fetchpriority)/g, '<link rel="modulepreload" fetchpriority="low"');
      if (stateTag) html = html.replace("</body>", `${stateTag}\n</body>`);
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
