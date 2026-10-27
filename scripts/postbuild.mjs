/**
 * Runs after `vite build`: prunes non-public assets, writes sitemap.xml and
 * llms-full.txt into dist/ and prerenders every route to static HTML. Fails the
 * build if prerendering fails, so an empty SPA shell is never deployed.
 */
import { pruneAssets } from "./prune-assets.mjs";
import { generateSitemap } from "./generate-sitemap.mjs";
import { generateLlmsFull } from "./generate-llms-full.mjs";
import { prerender } from "./prerender.mjs";

const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

try {
  pruneAssets("dist");
  generateSitemap("dist", buildDate);
  generateLlmsFull("dist", buildDate);
  await prerender();
  console.log("postbuild: done");
} catch (err) {
  console.error("postbuild failed:", err);
  process.exit(1);
}
