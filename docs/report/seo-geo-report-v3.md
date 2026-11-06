# SEO and GEO Audit Report v3 for tursoft.net

| | |
|---|---|
| **Site** | https://tursoft.net (GitHub Pages behind Cloudflare) |
| **Report date** | 2026-10-28 |
| **Previous reports** | [v1, 2026-10-27](seo-geo-report.md) with findings F-01 to F-34 · [v2, 2026-10-28](seo-geo-report-v2.md) with findings N-01 to N-07 |
| **What was reviewed** | 1. The live site, which now runs the v2 build (commit `efd92a5`, merged into `prod` as `61e011d` and deployed during this session). 2. The v3 changes, uncommitted in the working tree on branch `prod`, built, prerendered and served locally with gzip like GitHub Pages |
| **Method** | Live HTTP probes. Crawler view of the built HTML with JavaScript disabled. Lighthouse 12.6.1 mobile: three runs on the v3 homepage (median reported), one run on each other page type, one run on the live site. Chrome performance metrics and traces at 4× CPU throttle. A hydration probe that samples the page text every 20 ms. Navigation and deep-link jump tests |

---

## 1. Executive summary

**The v2 build is live, and the v3 build is ready to ship.** Deploying v2 put prerendered HTML, structured data, the sitemap, the social card and llms-full.txt in front of search engines and AI crawlers. v3 now fixes every new finding from v2 and every partially fixed item that can be fixed in code.

| Lighthouse mobile, homepage | v1 (old SPA, 27 Oct) | Live now (v2 build) | v3 build (median of 3) |
|---|---|---|---|
| Performance | 31 | 28 | **71** |
| Accessibility | 92 | 97 | **100** |
| Best practices | 96 | 100 | **100** |
| SEO | 100 | 100 | **100** |
| Total Blocking Time | 119.5 s | 115.1 s | **0.54 s** |
| Time to Interactive | 147.8 s | 149.8 s | **4.2 s** |
| Speed Index | 32.4 s | 34.5 s | **3.2 s** |
| First Contentful Paint | 3.3 s | 4.1 s | **1.3 s** |
| Total transfer | 6,656 KiB | 766 KiB | **474 KiB** |

What v3 delivers:

- **The main-thread stall is gone.** The skills cloud no longer animates off screen, and hero animations pause after the visitor scrolls past them. Style work at the top of the page fell from 8.8 s to 1.4 s per 10 s on a throttled phone. Under reduced motion the page is fully idle.
- **Real hydration.** React now attaches to the prerendered page instead of rebuilding it, so the content no longer flashes away after load. All 86 projects stay in the page, which means Googlebot, which runs JavaScript, sees them too.
- **15 indexable URLs instead of 2.** Three case studies and a case-studies index, each with Article and breadcrumb schema. The AmelBook privacy policy now has one URL per language, with `hreflang`, `lang` and `dir` set correctly.
- **Accessibility 100 on every page type.** The homepage, a case study, the case-studies index and a privacy page all score 100.

### Status of all 41 findings

| Status | Count | IDs |
|---|---|---|
| Resolved on the live site | 19 | F-01, F-02, F-03, F-04, F-08, F-09, F-10, F-11, F-12, F-13, F-15, F-16, F-17, F-18, F-19, F-27, F-29, F-30, F-33 |
| Resolved in v3, ready to deploy | 15 | F-07, F-14, F-21, F-22, F-23, F-24, F-25, F-32, N-01, N-02, N-03, N-04, N-05, N-06, N-07 |
| Partially resolved | 3 | F-05, F-20, F-28 |
| Open, needs you | 4 | F-06, F-26, F-31, F-34 |

### What needs you

1. **Deploy v3.** Commit the working tree (ideally on a branch), merge into `prod` and push. Until then the live site keeps the v2 stall: Performance 28 and about 2 minutes of blocking time.
2. **Decide on the phone number** (F-34). It is in the static HTML twice and will stay in every crawled copy.
3. **Two Cloudflare redirect rules** (F-05). `https://www.tursoft.net/` and directory URLs without a trailing slash, such as `/privacy/amelbook`, still pass through plain `http://` before reaching HTTPS.
4. **A cache rule for hashed assets** (F-26), and optionally a Referrer-Policy header (F-28). The pages already send the policy as a meta tag.
5. **Search Console and Bing Webmaster Tools** (F-06): submit the sitemap, which now lists 15 URLs.
6. **Profile bios** (F-31): suggested texts are in Appendix C.
7. **Two data questions.** The AHIN project is filed under DataSel with the e-commerce domain, while your experience entry places it at ERC Group. An AHIN case study also needs more source material than the data holds.

---

## 2. What changed in v3

### Performance

- **Skills cloud (N-01).** The animation loop runs only while the cloud is on screen and the tab is visible. It rotates for 12 seconds after it comes into view or after the last interaction, then fades to a stop until it is hovered, dragged or keyed. The idle frame rate is about 25 fps. Opacity and stacking order are written only when they change, and the per-frame CSS variable is gone. Under reduced motion or during prerender it renders one static frame.
- **Particle background (N-03).** Capped at about 30 fps, 28 particles instead of 60 below 768 px, paused while the tab is hidden, and skipped during prerender.
- **Hero.** Its ambient animations (aurora, gradient name, typewriter, pulse, scroll hint) pause while the hero is off screen; they were about half of the page's main-thread work. The entrance animation no longer starts fully transparent, so the hero text counts as painted from the first frame.
- **Map (N-04).** Leaflet, its CSS and the map tiles moved into a separate chunk. It loads when the map section nears the viewport. Until then a list of countries and cities stands in, so the static HTML has no map tiles and crawlers still get the places.
- **Lists.** Items past "Show all" stay in the HTML as compact text (title, subtitle, description) and expand into full cards on demand. The homepage DOM shrank from 5,598 to 4,929 elements.
- **Rendering.** Homepage sections use `content-visibility: auto`, so the browser skips layout and paint below the fold during load. Section jumps first lay out every section at its real size, so they land exactly. That covers navigation, hero buttons, footer links and `#section` URLs.
- **JavaScript (F-23).** The React and Radix vendor chunks are restored. The privacy, case-study and case-studies index pages load on demand. Initial JavaScript is 173 KB gzipped: 95 KB app, 45 KB React, 33 KB Radix. That compares with 251 KB in v1. Scripts and the state file load at low fetch priority, because the page is already readable.
- **Images (F-24).** The hero background is now WebP: 77 KB instead of 134 KB. The 40 px avatar uses an 80 px WebP of 2 KB. Lighthouse image audits pass.

### Hydration (N-02, F-07, F-25)

- During prerender, every data section records its final state. The build embeds the state inline when small, or as a preloaded `state.json` next to the page when large: 282 KB raw, 53 KB gzipped for the homepage.
- `main.tsx` waits for the state and calls `hydrateRoot`. The prerender step adds the markers React expects from server rendering: separators between adjacent text nodes, and Suspense boundaries around each section and each lazily loaded page.
- Animated components start in their final state and animate only after mount. That applies to the counters, scroll reveals, typewriter and skills cloud.
- Verified on the homepage, a case study and the Arabic privacy page. None loses text at any point after load, and none reports a hydration warning.

### New pages and SEO

- **Case studies (F-21, F-20).** `/case-studies/` plus three studies written strictly from your project and experience data:
  - the Jengai AI document pipeline;
  - BestJobFinder and the agentic development lifecycle;
  - Account Manager for Claude.

  Each has Article and BreadcrumbList schema, previous and next links, and links from the homepage, the footer, llms.txt and llms-full.txt.
- **Privacy per language (F-14).** `/privacy/amelbook/` (Turkish) plus nine `/privacy/amelbook/<lang>/` pages. Each has its own title and description taken from its Markdown, `<html lang>` and `dir`, `og:locale`, a full `hreflang` set with `x-default` set to English, and plain links to the other languages.
- **Sitemap (N-07).** 15 URLs with 110 `hreflang` links. Each `lastmod` comes from the last git change of that page's sources, so the privacy pages show 2026-03-11. llms.txt is stamped the same way, and CI now checks out full history.
- **llms-full.txt (N-06).** Internal codes are resolved to titles, for example "Domains: Construction IT", and the case studies are included.
- **Old CVs (F-32).** The build removes every CV PDF that `cv.json` does not link. Only v60 detailed and v56 compact remain.
- **Referrer policy (F-28).** `<meta name="referrer" content="strict-origin-when-cross-origin">` on every page.
- **Accessibility (N-05).** Badge contrast raised, redundant alt texts removed, a readable violet for small links on subpages, and the inline link underlined.

---

## 3. Measurements

### Lighthouse mobile, every page type (v3 build)

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT |
|---|---|---|---|---|---|---|---|
| Homepage (median of 3) | 71 | 100 | 100 | 100 | 1.3 s | 4.2 s | 535 ms |
| Case study | 98 | 100 | 100 | 100 | 0.9 s | 2.3 s | 90 ms |
| Case studies index | 98 | 100 | 100 | 100 | 0.9 s | 2.3 s | 60 ms |
| Privacy (English) | 94 | 100 | 100 | 100 | 0.9 s | 2.8 s | 140 ms |

How to read the homepage numbers:

- **The 4.2 s LCP is mostly simulation.** In the same trace, the observed LCP equals the observed FCP, 1.3 s, because the hero text is the LCP element and is in the HTML. Lighthouse's simulator ties text LCP to scripts that start early. Real-user LCP will show in Search Console's Core Web Vitals report after deploy.
- **Blocking time varies by run.** Across this session's runs on nearly identical builds, TBT ranged from 260 ms to 620 ms. The median of the final three runs was 535 ms, within the v2 target of under 600 ms. The Performance target of 80 was not reached; see "Next opportunities".
- The v3 build was measured on localhost with gzip; the live numbers come from production through Cloudflare.

### Main-thread work (10 s at 4× CPU, mobile viewport)

| Situation | Style recalculation | Total main-thread work |
|---|---|---|
| v2 build, top of the page (cloud off screen but animating) | 8.8 s | 10.1 s |
| v3 build, top of the page (hero effects visible, by design) | 1.4 s | 9.1 s |
| v3 build, scrolled past the hero | 0.16 s | 4.3 s (8.5 s before the hero pause) |
| v3 build, skills cloud in view, first 10 s while it turns | 6.6 s | – |
| v3 build, skills cloud in view, after the 12 s idle window | 0.6 s | – |
| v3 build, reduced motion, skills cloud in view | 0 s | 0 s |

### Hydration probe (homepage)

| | v2 build | v3 build |
|---|---|---|
| Text right after load | 48,709 characters | 43,714 characters, still streaming in |
| Lowest point after load | 6,536 (an 87% drop at 656 ms) | no drop |
| Text after data loads | 39,274 (21 of 86 projects) | 50,598 (all 86 projects) |
| Hydration warnings | n/a (full re-render) | none |

### Crawler view (static HTML, JavaScript disabled)

| | Live now (v2 build) | v3 build |
|---|---|---|
| HTML (gzipped) | 78 KB | 73 KB, plus 53 KB state fetched in parallel |
| Text in the page | 49,019 characters, 5,753 words | 50,610 characters, 5,924 words |
| Headings | 1 h1, 12 h2, 144 h3 | 1 h1, 13 h2, 156 h3 |
| Structured data, homepage | Person, WebSite, ProfilePage; FAQPage | same |
| Structured data, subpages | none | Article and BreadcrumbList; CollectionPage |
| Internal links | 39 | 38, including 5 to case studies |
| Map tile images in the HTML | 40 | 0 |
| Indexable URLs | 2 | 15 |

### Live configuration today

| Check | Status |
|---|---|
| AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot) | 200, allowed |
| `http://tursoft.net/` | 301 → `https://tursoft.net/` |
| `https://www.tursoft.net/` | 301 → `http://tursoft.net/` (then 301 → https): **two hops via HTTP** |
| `https://tursoft.net/privacy/amelbook` | 301 → `http://tursoft.net/privacy/amelbook/`: **via HTTP** |
| HSTS | `max-age=2592000; includeSubDomains; preload` (30 days) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy header | none (v3 adds the meta tag) |
| Cache-Control on hashed assets | `max-age=600` |
| Deployed build | v2: prerendered, but with the skills-cloud stall and the rebuild on load |
| Outdated CV v48 | still 200 (removed by the v3 build) |

---

## 4. Status of every finding

| ID | Sev. | Finding | Status | Note |
|---|---|---|---|---|
| F-01 | Critical | Content depends on JavaScript | Resolved live | Prerendered HTML deployed; v3 adds hydration |
| F-02 | Critical | Cloudflare blocks AI crawlers | Resolved live | All AI crawlers get 200 |
| F-03 | Critical | Non-root URLs return 404 | Resolved live | `/privacy/amelbook/` returns 200 |
| F-04 | High | No sitemap | Resolved live | v3: 15 URLs with hreflang and real lastmod |
| F-05 | High | HTTPS, www, HSTS | **Partial** | HTTP→HTTPS and HSTS live. `www` and slash-less directory URLs still redirect via `http://`. HSTS `preload` with 30 days does not qualify for the preload list |
| F-06 | High | Search engine presence unverified | **Open** | Submit the 15-URL sitemap in Search Console and Bing |
| F-07 | High | Content missing from the DOM | Resolved in v3 | All 86 projects stay in the DOM after hydration |
| F-08 | Medium | No crawlable internal links | Resolved live | |
| F-09 | Medium | Reveal hides content | Resolved live | v3: on-screen content stays put after hydration |
| F-10 | Critical | Social image 404 | Resolved live | |
| F-11 | High | One meta set for every route | Resolved live | |
| F-12 | Medium | Title and description | Resolved live | |
| F-13 | Low | Icons and manifest | Resolved live | |
| F-14 | Low | Mixed language signals | Resolved in v3 | Ten privacy URLs with hreflang, lang, dir and og:locale |
| F-15 | Low | 404 page | Resolved live | |
| F-16 | High | No JSON-LD | Resolved live | v3 adds Article, BreadcrumbList and CollectionPage |
| F-17 | Medium | Slogan headings | Resolved live | |
| F-18 | Medium | Animated positioning statement | Resolved live | |
| F-19 | Medium | Facts disagree | Resolved live | |
| F-20 | High | One URL for 400+ entities | **Partial** | 13 new URLs (case studies, privacy languages); project and domain detail pages still open |
| F-21 | Medium | No freshness or authority signals | Resolved in v3 | Three case studies with dates; an AHIN study needs source material |
| F-22 | Low | Image alt text | Resolved in v3 | |
| F-23 | High | One large JS chunk | Resolved in v3 | 173 KB gzipped initial JS in three chunks; pages and map load on demand |
| F-24 | Medium | Images not optimized | Resolved in v3 | WebP hero and avatar; Lighthouse image audits pass |
| F-25 | Medium | Data waterfall | Resolved in v3 | Hydration from the recorded state |
| F-26 | Low | Cache headers | **Open** | Needs a Cloudflare cache rule (Lighthouse: 268 KiB repeat-visit saving) |
| F-27 | Low | Deploy payload | Resolved live | |
| F-28 | Low | Security headers | **Partial** | HSTS and nosniff live; Referrer-Policy as a meta tag in v3; header optional |
| F-29 | Medium | llms.txt incomplete | Resolved live | v3 refinements in N-06 and N-07 |
| F-30 | Medium | No answer-ready content | Resolved live | |
| F-31 | Medium | Entity corroboration | **Open** | Profile bios; suggested texts in Appendix C |
| F-32 | High | Old documents crawlable | Resolved in v3 | Unlinked CV PDFs removed from the build |
| F-33 | Low | No analytics | Resolved live | |
| F-34 | Medium | Personal data in page text | **Open** | Phone number decision |
| N-01 | Critical | Skills cloud stalls the browser | Resolved in v3 | Style work at the top of the page: 8.8 s → 1.4 s per 10 s |
| N-02 | High | Prerendered HTML discarded on load | Resolved in v3 | Hydration, no content drop |
| N-03 | Medium | Particle background always animating | Resolved in v3 | 30 fps, fewer particles on phones, paused in hidden tabs |
| N-04 | Medium | Heavy prerendered homepage | Resolved in v3 | No map tiles, compact collapsed items, content-visibility; DOM still 4,929 elements by design |
| N-05 | Low | Two accessibility failures | Resolved in v3 | Accessibility 100 on every page type |
| N-06 | Low | Codes in llms-full.txt | Resolved in v3 | Titles instead of codes; data questions listed in section 1 |
| N-07 | Low | Freshness dates | Resolved in v3 | lastmod and llms.txt date from git |

---

## 5. Next opportunities

These are not defects; they are the remaining headroom on the homepage's Performance score.

- **The skills cloud while it turns.** Each rotating frame restyles about 227 elements, roughly 8 ms on a desktop CPU and 30 ms on a phone. Moving the sphere to CSS 3D transforms animated on the compositor would make it free; that is a redesign of the component.
- **Parsing a large page.** The full content in the HTML costs a 380 ms layout task at 4× CPU. Hydrating sections below the fold only when they near the viewport, and loading the detail dialogs on demand, would cut the remaining 54 KiB of unused JavaScript and some of the long tasks.
- **Field data.** After deploy, Search Console's Core Web Vitals report will show real-user LCP and INP, which matter more than the lab score.

---

## 6. Action plan v3

### Phase A: Ship v3 (today)

| # | Action | Fixes |
|---|---|---|
| A.1 | Decide on the phone number in About and Contact | F-34 |
| A.2 | Move the working-tree changes to a branch, commit, merge into `prod` and push | All "Resolved in v3" items |
| A.3 | Run the verification checklist against the live site | – |
| A.4 | Submit the sitemap in Google Search Console and Bing Webmaster Tools; request indexing of the case studies | F-06 |
| A.5 | Rich Results Test on the homepage and one case study | F-16 |

### Phase B: Cloudflare and GitHub (about 30 minutes)

| # | Action | Fixes |
|---|---|---|
| B.1 | Redirect rule: `www.tursoft.net/*` → `https://tursoft.net/${1}`, 301 | F-05 |
| B.2 | Redirect rule: paths without a file extension and without a trailing slash → `https://tursoft.net${path}/`, 301 | F-05 |
| B.3 | Cache rule: hashed `/assets/*.js` and `*.css`, edge and browser TTL one year | F-26 |
| B.4 | Optional: Referrer-Policy response header; drop `preload` from HSTS or raise max-age to one year | F-28, F-05 |

### Phase C: Off-site (about 1 hour)

| # | Action | Fixes |
|---|---|---|
| C.1 | Update LinkedIn headline and About, GitHub bio and Stack Overflow About (Appendix C) | F-31 |
| C.2 | Answer the AHIN data questions; supply material for an AHIN case study | N-06, F-21 |

### Phase D: Content depth (month 1 to 2)

| # | Action | Fixes |
|---|---|---|
| D.1 | Detail pages for the 10 to 15 major projects and the 6 domains: add them to `scripts/routes.mjs` like the case studies | F-20 |
| D.2 | One case study per quarter; each becomes a page, a sitemap entry and an llms.txt link automatically | F-21 |

### Phase E: Performance headroom (optional)

| # | Action | Target |
|---|---|---|
| E.1 | Skills cloud on compositor-driven CSS 3D | No main-thread cost while turning |
| E.2 | Lazy-hydrate sections below the fold; load detail dialogs on demand | Performance ≥ 80 |
| E.3 | Review Core Web Vitals in Search Console 28 days after deploy | LCP < 2.5 s and INP < 200 ms in the field |

---

## 7. Verification checklist (after deploying v3)

```bash
# Every page returns 200
for p in / /case-studies/ /case-studies/jengai-ai-document-pipeline/ /case-studies/bestjobfinder-ai-native-saas/ \
         /case-studies/account-manager-for-claude/ /privacy/amelbook/ /privacy/amelbook/en/ /privacy/amelbook/ar/ \
         /sitemap.xml /llms.txt /llms-full.txt /og-image.jpg; do
  printf "%-48s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://tursoft.net$p"
done

# Hydration state and structured data on the homepage
curl -s https://tursoft.net/ | grep -o '<meta name="prerender-state"[^>]*>'      # one meta tag
curl -s https://tursoft.net/ | grep -c 'application/ld+json'                      # 2
curl -s https://tursoft.net/case-studies/jengai-ai-document-pipeline/ | grep -o '"@type":"Article"'

# Sitemap: 15 URLs with hreflang
curl -s https://tursoft.net/sitemap.xml | grep -c "<url>"                         # 15
curl -s https://tursoft.net/privacy/amelbook/ar/ | grep -oE '<html[^>]*>'          # lang="ar" dir="rtl"

# Old CV gone, no map tiles in the HTML
curl -s -o /dev/null -w "%{http_code}\n" https://tursoft.net/assets/files/downloads/CV_MuhammetTursak_v48.20190529-Summary.pdf   # 404
curl -s https://tursoft.net/ | grep -c "tile.openstreetmap.org"                    # 0

# Redirects (after Phase B): one hop, always https
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.tursoft.net/            # 301 https://tursoft.net/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://tursoft.net/privacy/amelbook  # 301 https://tursoft.net/privacy/amelbook/
```

Then run PageSpeed Insights on the homepage (expect Performance near 70 and TBT under 600 ms, against 28 today) and the Rich Results Test on a case study.

---

## Appendix A: Files changed in v3

| Area | Files |
|---|---|
| Hydration | `src/main.tsx`, `src/lib/prerender.ts`, `src/hooks/use-snapshot-state.ts` (new), eight data sections, `scripts/prerender.mjs` |
| Animated components | `src/components/ui/item-cloud.tsx`, `BackgroundAnimation.tsx`, `ui/typewriter.tsx`, `ui/reveal.tsx`, `ui/animated-counter.tsx`, `HeroSection.tsx` |
| Map | `src/components/map/MapSection.tsx`, `MapCanvas.tsx` (new), `MapPlaceholder.tsx` (new) |
| Lists | `src/components/ui/listviewer.tsx` |
| Section jumps | `src/lib/section-settle.ts` (new), `Navigation.tsx`, `pages/Index.tsx`, `index.css` |
| Case studies | `src/data/case-studies.json`, `src/lib/case-studies.ts`, `pages/CaseStudy.tsx`, `pages/CaseStudies.tsx`, `components/case-studies/CaseStudiesSection.tsx`, `components/PageHeader.tsx` (all new) |
| Privacy languages | `src/pages/AmelBookPrivacy.tsx`, `src/content/privacy/amelbook/languages.json` (new), `src/App.tsx` |
| SEO plumbing | `src/components/Seo.tsx` (hreflang, locale), `src/lib/site.ts` (Article, BreadcrumbList), `index.html` (referrer) |
| Build | `scripts/routes.mjs`, `generate-sitemap.mjs`, `generate-llms-full.mjs`, `prune-assets.mjs`, `postbuild.mjs`, `verify-dist.mjs`, `convert-images.mjs` (new), `vite.config.ts`, `.github/workflows/deploy.yml`, `package.json` |
| Assets and content | `src/assets/hero-bg.webp`, `src/assets/profile-photo-80.webp`, `public/llms.txt`, `src/components/ui/badge.tsx`, `README.md` |

## Appendix B: Cloudflare and GitHub settings

| Setting | Where | Value |
|---|---|---|
| `www` redirect | Rules → Redirect Rules | `http*://www.tursoft.net/*` → `https://tursoft.net/${2}`, 301, preserve query string |
| Trailing-slash redirect | Rules → Redirect Rules | When the path does not end in `/` and has no file extension: dynamic redirect to `concat("https://tursoft.net", http.request.uri.path, "/")`, 301 |
| Cache for hashed assets | Caching → Cache Rules | `/assets/*` files whose names contain a content hash (`*-*.js`, `*-*.css`): edge and browser TTL one year |
| Referrer-Policy (optional) | Rules → Transform Rules → Response headers | `strict-origin-when-cross-origin` |
| HSTS | SSL/TLS → Edge Certificates | keep one month without `preload`, or raise to 12 months before submitting to hstspreload.org |

The slash-less redirect goes through `http://` because GitHub Pages builds it without knowing the visitor used HTTPS. All internal links and the sitemap already use the trailing slash, so this only affects links from outside, such as app store listings that point at `/privacy/amelbook`.

## Appendix C: Profile texts (F-31)

Use the same identity sentence everywhere and link back to the site.

- **LinkedIn headline:** AI-Enabled Senior Software Architect · Founder, Tursoft · .NET, Node.js, Azure, SaaS · AI agentic development
- **LinkedIn About, first paragraph:** Muhammet Turşak (Tursak) is a Senior Software Architect in Ankara, Turkey, with 25+ years in .NET, Node.js, Azure and SaaS. Founder of Tursoft; previously Director of Technology at Jengai and Gamyte in New York. Case studies and CV: https://tursoft.net
- **GitHub bio (160 characters max):** AI-enabled Senior Software Architect · Founder of Tursoft · .NET, Node.js, Azure, SaaS · AI agentic development · tursoft.net
- **Stack Overflow About:** Senior Software Architect in Ankara, Turkey, with 25+ years in .NET, Node.js, Azure and SaaS, now building with AI coding agents. More at https://tursoft.net

## Appendix D: Evidence log (2026-10-28)

| Check | Result |
|---|---|
| Deployed commit | `efd92a5` (v2 state) via `61e011d` on `prod`; v3 work uncommitted on `prod` |
| Live Lighthouse mobile | Performance 28, Accessibility 97, Best practices 100, SEO 100; TBT 115,050 ms; transfer 766 KiB |
| v3 Lighthouse mobile, homepage, three runs | Performance 71 / 70 / 74; TBT 540 / 580 / 460 ms; FCP 1.3 s; LCP 4.2 s (observed 1.3 s) |
| v3 Lighthouse, other pages | Case study 98/100/100/100; index 98/100/100/100; privacy (en) 94/100/100/100 |
| v3 homepage HTML | 723,442 bytes raw, 72,550 gzipped; `state.json` 281,963 raw, 52,730 gzipped |
| v3 JavaScript, gzipped | app 95 KB, React 45 KB, Radix 33 KB; on demand: map 17 KB, Leaflet 46 KB, timeline 5 KB, privacy 27 KB, case studies 3 KB |
| v3 routes verified in Chrome | 15 of 15: one title, description, canonical and h1 each; no page errors |
| Section jumps | Navigation to contact, map, portfolio and education: within 30 px. Deep links to contact, case-studies and timeline on mobile: within 4 px. Footer link to FAQ: 39 px |
| Hydration probe | No text drop on the homepage, a case study or the Arabic privacy page; no hydration warnings |
| Sitemap | 15 URLs, 110 hreflang links; privacy lastmod 2026-03-11 from git |
| Lint and types | Unchanged baseline: 2 errors and 7 warnings in untouched shadcn files; 3 pre-existing type errors in models |
