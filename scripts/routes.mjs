/**
 * Routes that are prerendered to static HTML and listed in sitemap.xml.
 *
 * Paths other than "/" end with a slash because GitHub Pages serves `<path>/index.html`
 * at `<path>/`. `sources` are the files whose last git change sets the sitemap `lastmod`
 * of the route. `alternates` are hreflang language versions.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Page markup comes from the site design being built (design.config.json or SITE_DESIGN).
const { resolveDesign } = createRequire(import.meta.url)("./design-resolve.cjs");
const DESIGN = `src/designs/${resolveDesign().name}`;

export const SITE_URL = "https://tursoft.net";

const caseStudies = JSON.parse(readFileSync("src/data/case-studies.json", "utf8")).items;
const privacyLanguages = JSON.parse(readFileSync("src/content/privacy/amelbook/languages.json", "utf8"));

const privacyPath = (code) => (code === "tr" ? "/privacy/amelbook/" : `/privacy/amelbook/${code}/`);
const privacyAlternates = [
  ...privacyLanguages.map((l) => ({ hreflang: l.code, path: privacyPath(l.code) })),
  { hreflang: "x-default", path: privacyPath("en") },
];

export const ROUTES = [
  {
    path: "/",
    changefreq: "monthly",
    priority: "1.0",
    waitForData: true, // the homepage loads its sections from /data/*.json
    minText: 20000,
    sources: ["src/data", `${DESIGN}/components`, `${DESIGN}/pages/Index.tsx`, "src/lib/site.ts"],
  },
  {
    path: "/case-studies/",
    changefreq: "monthly",
    priority: "0.8",
    sources: ["src/data/case-studies.json", `${DESIGN}/pages/CaseStudies.tsx`],
  },
  ...caseStudies.map((c) => ({
    path: `/case-studies/${c.slug}/`,
    changefreq: "monthly",
    priority: "0.8",
    sources: ["src/data/case-studies.json", `${DESIGN}/pages/CaseStudy.tsx`],
  })),
  ...privacyLanguages.map((l) => ({
    path: privacyPath(l.code),
    changefreq: "yearly",
    priority: "0.3",
    alternates: privacyAlternates,
    sources: [`src/content/privacy/amelbook/${l.code}.md`],
  })),
];
