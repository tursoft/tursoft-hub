/**
 * Runs after `vite build`: prunes non-public assets, writes sitemap.xml and
 * llms-full.txt, stamps llms.txt with its real last-change date, and prerenders every
 * route to static HTML. Fails the build if prerendering fails, so an empty SPA shell
 * is never deployed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pruneAssets } from "./prune-assets.mjs";
import { generateSitemap, lastChanged } from "./generate-sitemap.mjs";
import { generateLlmsFull } from "./generate-llms-full.mjs";
import { prerender } from "./prerender.mjs";

const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

function stampLlmsTxt() {
  const file = "dist/llms.txt";
  const date = lastChanged(["public/llms.txt", "src/data"], buildDate);
  const text = readFileSync(file, "utf8").replace(/^Last updated: .*$/m, `Last updated: ${date}`);
  writeFileSync(file, text);
  console.log(`llms.txt: last updated ${date}`);
}

try {
  pruneAssets("dist");
  generateSitemap("dist", buildDate);
  generateLlmsFull("dist", buildDate);
  stampLlmsTxt();
  await prerender();
  console.log("postbuild: done");
} catch (err) {
  console.error("postbuild failed:", err);
  process.exit(1);
}
