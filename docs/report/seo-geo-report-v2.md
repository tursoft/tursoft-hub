# SEO and GEO Audit Report v2 for tursoft.net

> A newer review is available: [v3 report, 2026-10-28](seo-geo-report-v3.md), with the v3 fixes and the status of every finding below.

| | |
|---|---|
| **Site** | https://tursoft.net (GitHub Pages behind Cloudflare) |
| **Report date** | 2026-10-28 |
| **Previous report** | [v1, 2026-10-27](seo-geo-report.md) with findings F-01 to F-34 |
| **What was reviewed** | 1. The live site, after the Cloudflare changes made since v1. 2. Branch `feat/seo-geo` (uncommitted), built and prerendered locally, served with gzip like GitHub Pages |
| **Method** | Live HTTP probes (status, redirects, headers, robots.txt, user-agent access). Crawler view of the built HTML with JavaScript disabled. Lighthouse 12.6.1 mobile on both versions. Chrome performance metrics at 4× CPU throttle. A hydration probe that samples the page text every 25 ms after load |

GEO means Generative Engine Optimization: being readable, citable and correctly described by AI assistants and AI search.

---

## 1. Executive summary

Since v1, the two biggest blockers have been fixed, but neither fix has reached search engines yet.

- **AI crawlers are allowed in.** Cloudflare's managed robots.txt and AI-bot blocking are off. GPTBot, ClaudeBot, Google-Extended, CCBot and PerplexityBot now get HTTP 200. HTTP now redirects to HTTPS, HSTS and `nosniff` are on, and Cloudflare Web Analytics is loading.
- **The branch serves real HTML.** On `feat/seo-geo`, the homepage ships about 44,000 characters of text, 13 headings at h1/h2 level, structured data, a FAQ and 32 internal links before any JavaScript runs. The privacy page now returns its own page.
- **None of the branch work is live.** The branch is not committed or deployed. The live site still serves the 2.2 KB empty shell, so the AI crawlers that are now allowed in still find nothing to read. Deploying is the single highest-value step.

The review also found problems that v1 missed:

- **N-01 (critical):** the animated skills cloud keeps the browser busy recalculating styles about 90% of the time on mobile. Lighthouse reports a Total Blocking Time of about 2 minutes on both the live site and the branch. Performance scores are 31 (live) and 33 (branch).
- **N-02 (high):** in the branch, React discards the prerendered HTML about 0.65 seconds after load and rebuilds the page. Visitors see the content flash. Googlebot, which runs JavaScript, indexes the rebuilt page with 21 of 86 projects instead of the full prerendered page.

Several partial items remain: the `www` redirect still goes through plain HTTP, four outdated CV PDFs are still public, the phone number will be in every static copy of the page, and there are no per-project pages yet.

### Status of the 34 v1 findings

| Status | Count | IDs |
|---|---|---|
| Resolved in the branch, waiting for deploy | 18 | F-01, F-03, F-04, F-08, F-09, F-10, F-11, F-12, F-13, F-15, F-16, F-17, F-18, F-19, F-22, F-27, F-29, F-30 |
| Resolved on the live site | 2 | F-02, F-33 |
| Partially resolved | 10 | F-05, F-07, F-14, F-21, F-23, F-24, F-25, F-28, F-31, F-32 |
| Open | 4 | F-06, F-20, F-26, F-34 |
| **New in v2** | **7** | N-01 to N-07 |

### Scorecard

| Area | v1 (live, 27 Oct) | Live today | Branch build |
|---|---|---|---|
| Crawlability and rendering | D | D | **B** (static HTML complete; discarded on load, see N-02) |
| Indexability and URLs | D | C (HTTPS fixed, no sitemap live) | **B+** (2 URLs, sitemap; `www` chain open) |
| On-page metadata | C | C | **A** |
| Structured data | F | F | **A-** |
| Content quality | B- | B- | **B+** (no detail pages or case studies yet) |
| Performance | C (estimate) | **D (measured)** | **D (measured)**, see N-01 |
| GEO readiness | D | C (bots allowed, shell empty) | **A-** once deployed |

### The five things to do first

1. **Fix the skills cloud loop** (N-01) and the background canvas (N-03). This is a contained change in two components and removes most of the blocking time.
2. **Decide on the phone number** (F-34) and **remove the four old CV PDFs** (F-32). Both become part of the static HTML or stay crawlable once you deploy.
3. **Commit, merge and deploy `feat/seo-geo`**. Then submit the sitemap in Google Search Console and Bing Webmaster Tools (F-06).
4. **Make `www` redirect straight to `https://tursoft.net/`** (F-05), and add a Referrer-Policy header (F-28).
5. **Switch to real hydration** (N-02) so the prerendered page is kept instead of rebuilt.

---

## 2. Measurements

### Lighthouse, mobile (12.6.1, simulated slow 4G, 4× CPU)

| Metric | Live site (old build) | Branch build (gzip, local) |
|---|---|---|
| Performance | 31 | 33 |
| Accessibility | 92 | 97 |
| Best practices | 96 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 3.3 s | 2.8 s |
| Largest Contentful Paint | 6.7 s | 6.3 s |
| **Total Blocking Time** | **119.5 s** | **123.2 s** |
| Cumulative Layout Shift | 0.003 | 0.003 |
| Speed Index | 32.4 s | 30.0 s |
| Time to Interactive | 147.8 s | 153.9 s |
| **Total transfer** | **6,656 KiB** | **754 KiB** |
| DOM elements | 4,525 | 4,766 |

How to read these numbers:

- **Lighthouse SEO 100 is not proof of crawlability.** Lighthouse runs JavaScript and checks only basic tags. It cannot see the empty-shell problem that non-rendering crawlers and AI fetchers face. The crawler view below is the meaningful comparison.
- The branch was measured on localhost, so server latency is lower (20 ms versus 230 ms). Treat small paint-time differences as noise. Byte weight and blocking time are reliable.
- The page weight dropped by 89%, mainly because the asset pruning removed duplicated and oversized files.

### Crawler view (static HTML, JavaScript disabled)

| | Live site | Branch build |
|---|---|---|
| HTML size | 2.2 KB | 864 KB raw, 78 KB gzipped |
| Visible text | title only | 43,902 characters, 6,156 words |
| Headings | none | 1 h1, 12 h2, 144 h3 |
| Structured data | none | 2 blocks: Person, WebSite and ProfilePage; FAQPage |
| Internal anchor links | none | 32 |
| Projects in the HTML | 0 | 86 |
| Title / description length | 44 / 160 characters | 63 / 150 characters |

### What is keeping the main thread busy

Chrome performance metrics over 10 seconds at 4× CPU throttle, homepage, mobile viewport:

| Variant | Style recalculation time | Total task time |
|---|---|---|
| Branch, as built | 8.8 s | 10.1 s |
| Branch, CSS animations off, typewriter removed, canvas hidden | 9.6 s | 10.3 s |
| Branch, **skills section hidden** | **0.7 s** | 9.9 s |
| Live, as built | 9.9 s | 10.7 s |
| Live, **skills section hidden** | **0.9 s** | 9.7 s |

With the skills section hidden, style work drops by more than 90%. The main thread still stays busy, now running frames for the particle background (N-03), but in short tasks that no longer count as blocking.

### Hydration probe (branch build)

| Moment after load | Characters of text in the page |
|---|---|
| First sample (prerendered HTML) | 48,709 |
| 656 ms, React starts | 6,536 (an 87% drop) |
| After data loads | 39,274 (the visitor view, 21 of 86 projects) |

### Live configuration, v1 versus today

| Check | v1 (27 Oct) | Today (28 Oct) |
|---|---|---|
| GPTBot, ClaudeBot, Google-Extended, CCBot | 403 / blocked by robots.txt | 200, allowed |
| Cloudflare managed robots.txt | present | removed |
| `http://tursoft.net/` | 200, no redirect | 301 → `https://tursoft.net/` |
| `https://www.tursoft.net/` | 301 → `http://tursoft.net/` | unchanged: 301 → `http://tursoft.net/` → 301 → `https://` |
| Strict-Transport-Security | none | `max-age=2592000; includeSubDomains; preload` |
| X-Content-Type-Options | none | `nosniff` |
| Referrer-Policy | none | none |
| Analytics | none | Cloudflare Web Analytics beacon loads |
| Deployed build | empty SPA shell | **still the empty SPA shell** |
| `/sitemap.xml`, `/og-image.jpg` | 404 | 404 until the branch is deployed |

---

## 3. New findings in v2

### N-01 Critical: The skills cloud recalculates styles for 217 elements on every frame, forever

**Evidence.** `src/components/ui/item-cloud.tsx` runs a `requestAnimationFrame` loop that, on every frame, writes `transform`, `zIndex` and the CSS variable `--cloud-depth` onto each of the 217 skill items. The item's inline opacity is a `calc()` over that variable, so each write invalidates style for the item and its children. The loop never pauses: not when the section is off screen, not when the tab is hidden, and not under `prefers-reduced-motion` (the rotation speed becomes 0 but the loop keeps writing). Hiding only the skills section cuts style recalculation from 8.8 s to 0.7 s per 10 s on the branch, and from 9.9 s to 0.9 s on the live site.

**Impact.** Total Blocking Time is about 120 seconds and Time to Interactive about 150 seconds on mobile, on both versions. Performance scores stay around 31 to 33. Phones run hot and scroll janks. Google's page experience signals use the same metrics (Interaction to Next Paint in the field).

**Fix.**
- Start the loop only while the cloud is on screen and the tab is visible. Use an IntersectionObserver plus a `visibilitychange` listener, and stop requesting frames otherwise.
- Do not run the loop at all under reduced motion or in prerender mode. Render one static frame instead.
- Stop writing the CSS variable per frame. Write `opacity` directly next to `transform`, or set the depth only when it changes by a visible amount.
- Optionally cap the loop at 30 frames per second and pause after a few seconds without interaction.

See Appendix A. Expected result: blocking time drops by roughly 90%, based on the measurement above.

### N-02 High: React discards the prerendered HTML and rebuilds the page

**Evidence.** `src/main.tsx` still calls `createRoot(...).render(<App />)`. React clears the container on the first render, so the text drops from 48,709 to 6,536 characters about 0.65 seconds after load, then refills once ten JSON files have loaded. The visitor view then shows 21 projects, not 86.

**Impact.**
- Visitors see the full page, then a mostly empty page, then the full page again.
- The Largest Contentful Paint element is re-created when React renders, which delays LCP.
- Googlebot runs JavaScript and indexes the rebuilt page. It therefore sees 21 of 86 projects and none of the dialog content. The full prerendered content only helps crawlers that do not run JavaScript, such as most AI fetchers.

**Fix.** Hydrate instead of rebuilding. The client's first render must produce the same markup as the prerender:
1. In the prerender step, embed the loaded JSON data in the page as `<script id="__DATA__" type="application/json">`.
2. Let the repositories read that snapshot synchronously, and let each section start with the cached data (`useState(() => repo.peek() ?? [])`) instead of loading in an effect.
3. Render all list items in both modes and collapse the extras with `hidden="until-found"` instead of slicing the list. Google treats this as page content, and browser find-in-page can reveal it.
4. Call `hydrateRoot` when the root already has children and a snapshot exists. Otherwise keep `createRoot`.

See Appendix B. This also completes F-07 and F-25.

### N-03 Medium: The particle background animates continuously

**Evidence.** `src/components/BackgroundAnimation.tsx` redraws a full-screen canvas on every frame, including pairwise links between particles. It never pauses when the tab is hidden and does not lower its particle count on small screens. With the skills cloud hidden, the main thread still spent almost all of each 10-second window producing frames.

**Impact.** Battery and CPU use on phones, and less headroom for real interactions once N-01 is fixed.

**Fix.** Pause on `visibilitychange` and when the hero is out of view, cap at 30 frames per second, use fewer particles below 768 px, and draw a single static frame under reduced motion.

### N-04 Medium: The prerendered homepage is heavier than it needs to be

**Evidence.** `dist/index.html` is 864 KB raw (78 KB gzipped) with 4,766 DOM elements, where Lighthouse warns above 1,400. It contains 218 inline SVG icons and 40 OpenStreetMap tile images captured from the map, so the static page requests third-party map tiles before any script runs.

**Impact.** A slower first parse on low-end phones, a higher DOM-size penalty, and needless third-party requests.

**Fix.** In prerender mode, render a static placeholder (a heading, the list of countries and a "Load map" button) instead of the Leaflet map. Render the skills as a plain grouped list instead of the cloud. Add `content-visibility: auto` with a `contain-intrinsic-size` to below-the-fold sections.

### N-05 Low: Two accessibility failures remain

**Evidence.** Lighthouse accessibility is 97. The remaining failures are colour contrast on one badge, and the back-to-top profile photo, whose alt text "Muhammet Turşak" repeats the text right next to it.

**Fix.** Give the photo `alt=""` because the button already has a label, and darken the badge text or lighten its background until it reaches 4.5:1.

### N-06 Low: llms-full.txt shows raw codes and some data errors

**Evidence.** Project entries list internal codes such as `Domains: healthcareit, ecommerce` and `Technologies: C#, .net, angular, tsql`. Some data looks wrong: the Avicenna Health Integration Network is listed under DataSel with the e-commerce domain, while the experience text places it at ERC Group.

**Impact.** AI assistants quote this file almost verbatim. Codes read as noise, and wrong employers or domains become wrong answers.

**Fix.** Resolve domain, skill and customer codes to their display titles in `scripts/generate-llms-full.mjs`, and correct the project-to-company data in `projects.json`.

### N-07 Low: Some freshness dates are wrong by design

**Evidence.** `public/llms.txt` has a hard-coded "Last updated: 2026-10-27". The sitemap sets every URL's `lastmod` to the build date on every build.

**Impact.** Search engines ignore `lastmod` when it changes on every build without content changes. A stale date in llms.txt undermines the freshness signal.

**Fix.** Generate the llms.txt date at build time, and take each route's `lastmod` from the last git commit that touched its content.

---

## 4. Status of the v1 findings

| ID | Sev. | Finding | Status | Note |
|---|---|---|---|---|
| F-01 | Critical | All content depends on JavaScript | Resolved in branch | Full content in static HTML. Discarded on load, see N-02 |
| F-02 | Critical | Cloudflare blocks AI crawlers | **Resolved live** | All AI crawlers get 200, managed robots.txt removed |
| F-03 | Critical | Every non-root URL returns 404 | Resolved in branch | `/privacy/amelbook/` is a real file; live after deploy |
| F-04 | High | No sitemap | Resolved in branch | Generated at build, linked from robots.txt |
| F-05 | High | HTTP not redirected, no HSTS | **Partial** | HTTP→HTTPS and HSTS done live. `www` still redirects to `http://` first. HSTS `preload` with a 30-day max-age does not qualify for the preload list (needs 1 year) |
| F-06 | High | Search engine presence unverified | Open | Cannot be verified from outside; submit the sitemap after deploy |
| F-07 | High | Most content never enters the DOM | **Partial** | All 86 projects in static HTML; Googlebot sees 21 after JS, see N-02 |
| F-08 | Medium | No crawlable internal links | Resolved in branch | Navigation and hero use anchor links |
| F-09 | Medium | Reveal hides content | Resolved in branch | Prerender renders revealed state |
| F-10 | Critical | Open Graph image 404 | Resolved in branch | `og-image.jpg` 1200×630, tagline starts with AI Agentic Development |
| F-11 | High | One meta set for every route | Resolved in branch | Per-route title, description, canonical, OG via `Seo.tsx` |
| F-12 | Medium | Title and description issues | Resolved in branch | Title 63 characters with "Tursak", description 150 characters |
| F-13 | Low | No icons or manifest | Resolved in branch | Touch icon, manifest, theme colour |
| F-14 | Low | Mixed language signals | **Partial** | `lang="tr"` on Turkish testimonials and the privacy article; privacy languages still share one URL |
| F-15 | Low | 404 page title and style | Resolved in branch | Own title, `noindex`, site styling |
| F-16 | High | No JSON-LD | Resolved in branch | Person, WebSite, ProfilePage, FAQPage |
| F-17 | Medium | Slogan headings | Resolved in branch | Descriptive h2 on every section |
| F-18 | Medium | Animated positioning statement | Resolved in branch | Static line under the h1 |
| F-19 | Medium | Facts disagree across surfaces | Resolved in branch | 25+ years, https, x.com, ASCII name everywhere on the site |
| F-20 | High | One URL for 400+ entities | Open | Detail pages for projects and domains not started |
| F-21 | Medium | No freshness or authority signals | **Partial** | Footer date and `dateModified` done; case studies not written |
| F-22 | Low | Image alt text | Resolved in branch | Flag alt text fixed; one redundant alt remains, see N-05 |
| F-23 | High | 869 KB single JS chunk | **Partial** | Map and timeline load lazily; main chunk 645 KB raw, 189 KB gzipped. The vendor split was lost when the Vite config was rewritten; restore it |
| F-24 | Medium | Images not optimized | **Partial** | 417 of 457 images lazy, hero preloaded; no width/height and no WebP |
| F-25 | Medium | Data waterfall | **Partial** | Prerender removes it for the first paint; the rebuild in N-02 brings it back |
| F-26 | Low | Short cache headers | Open | Still `max-age=600` on hashed files |
| F-27 | Low | Deploy payload | Resolved in branch | Output 1.4 GB → 225 MB; page transfer 6.6 MB → 754 KB |
| F-28 | Low | Security headers | **Partial** | HSTS and `nosniff` live; Referrer-Policy missing |
| F-29 | Medium | llms.txt incomplete | Resolved in branch | v2 with facts, links, FAQ; llms-full.txt generated. Refinements in N-06 and N-07 |
| F-30 | Medium | No answer-ready content | Resolved in branch | "At a glance" block and 8-question FAQ |
| F-31 | Medium | Entity corroboration | **Partial** | `sameAs` and `rel="me"` done; LinkedIn, GitHub and Stack Overflow bios not yet aligned |
| F-32 | High | Old documents crawlable | **Partial** | Old .doc CVs, videos and ZIPs pruned. Four outdated CV PDFs (v48, v53, v54, v59) remain public in `/assets/files/downloads/` and are not covered by robots.txt |
| F-33 | Low | No analytics | **Resolved live** | Cloudflare Web Analytics beacon loads |
| F-34 | Medium | Personal data in page text | Open | The phone number appears twice in the static HTML of the branch |

---

## 5. Changes made during this review

These small fixes were applied to `feat/seo-geo` while reviewing and are included in the measurements above:

- **Prerender robustness.** The step now caches the original SPA shell, so it can be re-run on an already built folder. It no longer injects the same head tag twice. The privacy page no longer inherits the homepage's head, which shrank it from 38 KB to 23 KB.
- **Accessibility.** Carousel previous, next and slide-dot buttons, the map and grid toggles, and the company website and LinkedIn icon links now have accessible names. Links inside data-driven descriptions now get `rel="noopener noreferrer"`. Lighthouse accessibility went from 92 to 97.
- `.cache/` is ignored by git.

---

## 6. Action plan v2

### Phase A: Ship what is ready (today, about 2 hours)

| # | Action | Fixes |
|---|---|---|
| A.1 | Decide whether the phone number stays in the page; if not, remove it from `AboutSection` and `ContactSection` | F-34 |
| A.2 | Delete the four outdated CV PDFs, or add the robots rules in Appendix C | F-32 |
| A.3 | Restore the vendor chunk split in `vite.config.ts` | F-23 |
| A.4 | Commit `feat/seo-geo`, merge to `prod`, push; the workflow builds, prerenders and deploys | All "resolved in branch" items |
| A.5 | Run the verification checklist against the live site | – |
| A.6 | Google Search Console and Bing Webmaster Tools: verify, submit the sitemap, request indexing of `/` and `/privacy/amelbook/` | F-06 |
| A.7 | Cloudflare: redirect rule `www.tursoft.net/*` → `https://tursoft.net/$1` (301); tick Enforce HTTPS in GitHub Pages; add Referrer-Policy; drop `preload` from HSTS or raise max-age to one year | F-05, F-28 |
| A.8 | Validate the social card in LinkedIn Post Inspector and the X card validator | F-10 |

### Phase B: Performance (week 1, about 1 day)

| # | Action | Fixes |
|---|---|---|
| B.1 | Skills cloud: run only when visible, stop under reduced motion and in prerender, no per-frame CSS variable | N-01 |
| B.2 | Particle background: pause when hidden or out of view, fewer particles on mobile, 30 fps cap | N-03 |
| B.3 | Prerender: static map placeholder, plain skills list, `content-visibility` on lower sections | N-04 |
| B.4 | Image `width`/`height`, WebP via `vite-imagetools`, Cloudflare cache rule for hashed assets | F-24, F-26 |
| B.5 | Two small accessibility fixes: redundant alt and badge contrast | N-05 |
| B.6 | Re-run Lighthouse mobile. Targets: Total Blocking Time under 600 ms, Performance 80 or higher | – |

### Phase C: Real hydration (week 2, 1 to 2 days)

| # | Action | Fixes |
|---|---|---|
| C.1 | Embed the data snapshot during prerender; repositories read it synchronously | N-02 |
| C.2 | Sections start from cached data; lists render all items and collapse extras with `hidden="until-found"` | N-02, F-07 |
| C.3 | `hydrateRoot` when prerendered markup and a snapshot exist; check the console for hydration warnings | N-02, F-25 |

### Phase D: Content and GEO depth (month 1 to 2)

| # | Action | Fixes |
|---|---|---|
| D.1 | Detail pages for the 10 to 15 major projects and the 6 domains, added to `scripts/routes.mjs` | F-20 |
| D.2 | Three case studies: Jengai AI CRM, AHIN HL7/FHIR, the AI agentic development lifecycle | F-21 |
| D.3 | llms-full.txt with display titles instead of codes; fix project-to-company data | N-06 |
| D.4 | Build-time dates for llms.txt and per-route `lastmod` | N-07 |
| D.5 | Per-language privacy URLs with `hreflang` | F-14 |
| D.6 | Align LinkedIn headline, GitHub profile README and Stack Overflow bio with the site's identity sentence | F-31 |
| D.7 | Monthly: ask ChatGPT, Claude, Perplexity and Gemini who Muhammet Turşak is, record the sources they cite | – |

---

## 7. Verification checklist (after deploying Phase A)

```bash
# Static content and structured data reach crawlers
curl -s https://tursoft.net/ | grep -c "<h2"                          # expect 12
curl -s https://tursoft.net/ | grep -c 'application/ld+json'          # expect 2
curl -s https://tursoft.net/ | grep -o "<title>[^<]*"                 # new title with "Tursak"

# URLs
for p in / /privacy/amelbook/ /sitemap.xml /og-image.jpg /llms-full.txt /manifest.webmanifest; do
  printf "%-24s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://tursoft.net$p"
done                                                                  # expect 200 for all

# Redirects: one hop, always to https apex
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.tursoft.net/   # 301 https://tursoft.net/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://tursoft.net/        # 301 https://tursoft.net/

# AI crawlers
for ua in GPTBot ClaudeBot PerplexityBot OAI-SearchBot Google-Extended CCBot; do
  printf "%-16s " $ua; curl -s -o /dev/null -w "%{http_code}\n" -A "$ua" https://tursoft.net/llms.txt
done                                                                  # expect 200

# Old CVs gone or blocked
curl -s -o /dev/null -w "%{http_code}\n" https://tursoft.net/assets/files/downloads/CV_MuhammetTursak_v48.20190529-Summary.pdf   # 404 if deleted

# Headers
curl -sI https://tursoft.net/ | grep -iE "strict-transport|x-content-type|referrer-policy"
```

Then run the Rich Results Test and PageSpeed Insights on `https://tursoft.net/`, and use URL Inspection in Search Console to confirm Google's rendered page shows the content.

---

## Appendix A: Skills cloud loop that only runs when it should

The idea, applied to the existing effect in `src/components/ui/item-cloud.tsx`:

```ts
useEffect(() => {
  if (!width || basePoints.length === 0) return;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let frame = 0;
  let onScreen = false;
  let pageVisible = !document.hidden;

  const renderFrame = () => {
    // existing projection code; per item write only transform, opacity and zIndex:
    // node.style.transform = `translate3d(...) translate(-50%, -50%) scale(${scale})`;
    // node.style.opacity = String(baseOpacity * (MIN_DEPTH_OPACITY + (1 - MIN_DEPTH_OPACITY) * depth));
    // node.style.zIndex = onTop ? "2000" : String(Math.round(depth * 1000));
  };
  const tick = () => {
    if (!onScreen || !pageVisible) { frame = 0; return; }   // stop requesting frames
    renderFrame();
    frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame && onScreen && pageVisible && !reduceMotion && !isPrerender) frame = requestAnimationFrame(tick); };

  renderFrame();                                            // one static frame for prerender and reduced motion
  const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; start(); }, { rootMargin: "200px" });
  if (containerRef.current) io.observe(containerRef.current);
  const onVisibility = () => { pageVisible = !document.hidden; start(); };
  document.addEventListener("visibilitychange", onVisibility);

  return () => { cancelAnimationFrame(frame); io.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
}, [width, height, basePoints, radius, items]);
```

Drop `var(--cloud-depth)` from the item's inline opacity once the loop writes `opacity` directly.

## Appendix B: Hydration outline

```ts
// scripts/prerender.mjs, after the page is ready
const snapshot = await page.evaluate(() => window.__repoSnapshot);   // { "/data/projects.json": {...}, ... }
html = html.replace("</head>", `<script id="__DATA__" type="application/json">${JSON.stringify(snapshot).replace(/</g, "\\u003c")}</script></head>`);

// src/repositories/base/BaseRepo.ts
const SNAPSHOT = JSON.parse(document.getElementById("__DATA__")?.textContent || "null");
// constructor: if (SNAPSHOT?.[jsonPath]) { this.data = SNAPSHOT[jsonPath]; this.buildMaps(); }
// record loads for the prerender: window.__repoSnapshot[jsonPath] = json;
peek(): TItem[] | null { return this.data ? this.data.items.slice() : null; }

// a section
const [projects, setProjects] = useState(() => projectsRepo.peek() ?? []);
const [isLoading, setIsLoading] = useState(() => projectsRepo.peek() === null);

// src/main.tsx
const root = document.getElementById("root")!;
if (root.hasChildNodes() && document.getElementById("__DATA__")) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
```

Two rules keep the first client render identical to the prerender:
- Lists render every item and hide the extras with `hidden="until-found"`, instead of slicing.
- Counters and reveal blocks start in their final state when hydrating, and animate only content that enters the viewport later.

## Appendix C: robots.txt for the CV folder

Either delete the four unused PDFs, or keep only the two linked versions crawlable:

```
User-agent: *
Allow: /
Disallow: /assets/downloads/
Disallow: /assets/projects/*/downloads/
Disallow: /assets/files/downloads/
Allow: /assets/files/downloads/CV_MuhammetTursak_Detailed-v60.pdf
Allow: /assets/files/downloads/CV_MuhammetTursak_v56-compact.20260403.pdf

Sitemap: https://tursoft.net/sitemap.xml
```

Google and Bing apply the most specific matching rule, so the two `Allow` lines win over the folder `Disallow`. Update them whenever `src/data/cv.json` points to a new version.

## Appendix D: Cloudflare settings still to change

| Setting | Where | Value |
|---|---|---|
| `www` redirect | Rules → Redirect Rules | `http*://www.tursoft.net/*` → `https://tursoft.net/${2}`, 301, preserve query string |
| Enforce HTTPS | GitHub repository → Settings → Pages | ticked |
| Referrer-Policy | Rules → Transform Rules → Response headers | `strict-origin-when-cross-origin` |
| HSTS | SSL/TLS → Edge Certificates | keep max-age 1 month without `preload`, or raise to 12 months before submitting to hstspreload.org |
| Cache for hashed assets | Caching → Cache Rules | `/assets/index-*`, `/assets/*-*.js`, `/assets/*-*.css`: edge and browser TTL 1 year |

## Appendix E: Evidence log (2026-10-28)

| Check | Result |
|---|---|
| AI crawlers on `/llms.txt` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bytespider) | 200 for all |
| Live robots.txt | Repo version from the old deploy; no Cloudflare managed block |
| `http://tursoft.net/` | 301 → `https://tursoft.net/` |
| `https://www.tursoft.net/` | 301 → `http://tursoft.net/` |
| Live headers | HSTS `max-age=2592000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Cache-Control: max-age=600`; no Referrer-Policy |
| Live title | "Muhammet Turşak - Senior Software Architect" (old build) |
| Branch `dist/index.html` | 863,540 bytes raw, 78,300 bytes gzipped; 1 hero-image preload; 40 map tile images; 218 inline SVGs; phone number twice |
| Branch privacy page | 23 KB; own title, canonical `https://tursoft.net/privacy/amelbook/`, `og:type` article, `lang="tr"` article |
| Branch main JS chunk | 645 KB raw, 189 KB gzipped |
| Public CV PDFs in the build | 6, of which 2 are linked (v60 detailed, v56 compact) |
| Lighthouse mobile, live | Performance 31, Accessibility 92, Best practices 96, SEO 100 |
| Lighthouse mobile, branch (gzip) | Performance 33, Accessibility 97, Best practices 100, SEO 100 |
| Style recalculation per 10 s at 4× CPU | Branch 8.8 s, without skills section 0.7 s; live 9.9 s, without skills section 0.9 s |
| Hydration probe | 48,709 → 6,536 characters at 656 ms → 39,274 after data load |
