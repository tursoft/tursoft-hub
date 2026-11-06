import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTES, SITE_URL } from "./routes.mjs";

/**
 * Last change date (YYYY-MM-DD) of a route's source files: today when they have
 * uncommitted changes, otherwise the date of the last commit that touched them.
 * Falls back to the build date when git is unavailable. Search engines trust lastmod
 * only when it moves with real content changes, not with every build.
 */
export function lastChanged(sources = [], fallback) {
  if (!sources.length) return fallback;
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", ...sources], { encoding: "utf8" }).trim();
    if (dirty) return fallback;
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...sources], { encoding: "utf8" }).trim();
    return date || fallback;
  } catch {
    return fallback;
  }
}

export function generateSitemap(dist = "dist", buildDate = new Date().toISOString().slice(0, 10)) {
  const urls = ROUTES.map((r) => {
    const lines = [
      `  <url>`,
      `    <loc>${SITE_URL}${r.path}</loc>`,
      `    <lastmod>${lastChanged(r.sources, buildDate)}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
    ];
    for (const a of r.alternates || []) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${SITE_URL}${a.path}"/>`);
    }
    lines.push(`  </url>`);
    return lines.join("\n");
  }).join("\n");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls}\n</urlset>\n`;
  const out = join(dist, "sitemap.xml");
  writeFileSync(out, xml);
  console.log(`sitemap: ${out} (${ROUTES.length} urls)`);
}

if (process.argv[1]?.endsWith("generate-sitemap.mjs")) {
  generateSitemap();
}
