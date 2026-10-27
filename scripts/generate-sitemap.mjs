import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTES, SITE_URL } from "./routes.mjs";

export function generateSitemap(dist = "dist", lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = ROUTES.map(
    (r) =>
      `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  const out = join(dist, "sitemap.xml");
  writeFileSync(out, xml);
  console.log(`sitemap: ${out} (${ROUTES.length} urls)`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("generate-sitemap.mjs")) {
  generateSitemap();
}
