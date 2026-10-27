/**
 * Routes that are prerendered to static HTML and listed in sitemap.xml.
 * Paths other than "/" end with a slash because GitHub Pages serves
 * `<path>/index.html` at `<path>/`.
 */
export const ROUTES = [
  {
    path: "/",
    changefreq: "monthly",
    priority: "1.0",
    // Extra head markup for this route only (the hero background is the LCP image).
    head: "<link rel=\"preload\" as=\"image\" href=\"/assets/hero-bg.jpg\" fetchpriority=\"high\">",
  },
  { path: "/privacy/amelbook/", changefreq: "yearly", priority: "0.3" },
];

export const SITE_URL = "https://tursoft.net";
