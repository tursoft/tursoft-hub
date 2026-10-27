# SEO and GEO Audit Report for tursoft.net

> A newer review is available: [v2 report, 2026-10-28](seo-geo-report-v2.md), with measured results, the status of every finding below, and new findings N-01 to N-07.

| | |
|---|---|
| **Site** | https://tursoft.net (GitHub Pages behind Cloudflare, custom domain) |
| **Audit date** | 2026-10-27 |
| **Code audited** | Branch `prod` at `a10fae4` (what is live), plus pending branch `feat/ai-architect-positioning` (`ab2ba87`, `13d94c3`) |
| **Live checks** | Raw HTML fetch, HTTP status and redirect probes, response headers, robots.txt and llms.txt as served, user-agent based access tests, profile link health, Bing `site:` query |
| **Not possible today** | Google PageSpeed Insights (public API quota exhausted for the day), Google index status (no Search Console access) |

GEO means Generative Engine Optimization: being readable, citable and correctly described by AI assistants and AI search (ChatGPT, Claude, Perplexity, Gemini, Copilot, Meta AI, Apple Intelligence).

---

## Implementation status (2026-10-27)

The code-side fixes from this report are implemented on branch `feat/seo-geo` (based on `feat/ai-architect-positioning`, uncommitted for review):

| Done in the branch | Finding IDs |
|---|---|
| Build-time prerendering of every route to static HTML (Puppeteer step in `scripts/postbuild.mjs`, wired into `npm run build` and the deploy workflow; build fails on an empty page) | F-01, F-03, F-07, F-09, F-25 |
| Per-route title, description, canonical, Open Graph, Twitter card and JSON-LD via `src/components/Seo.tsx`; privacy page and 404 page get their own | F-11, F-12, F-15 |
| Person + WebSite + ProfilePage graph and FAQPage schema (`src/lib/site.ts`, `src/data/faq.json`) | F-16, F-30 |
| Real `og-image.jpg` (1200×630) and `apple-touch-icon.png` generated from `scripts/og-image.html`; icon links, manifest, theme-color | F-10, F-13 |
| `robots.txt` with Sitemap line and download disallows; `sitemap.xml` and `llms-full.txt` generated at build; `llms.txt` v2 with facts, links, date and FAQ | F-04, F-29, F-32 |
| Nav items and hero CTA are anchor links; descriptive section headings; static positioning line under the h1; "At a glance" fact block; FAQ section; footer with last-updated date and profile links | F-08, F-17, F-18, F-21, F-30, F-31 |
| Facts aligned (25+ years in `statistics.json`, https URLs, x.com, ASCII name variant everywhere) | F-19 |
| `lang="tr"` on Turkish testimonials and on the privacy article; flag alt text | F-14, F-22 |
| Map and timeline sections load lazily; images get `loading="lazy"` and `decoding="async"`; hero image preloaded on the homepage | F-23, F-24 |
| Old CV sources, videos, ZIPs and .doc files pruned from the deploy; copy no longer duplicates nested folders (dist went from 1.4 GB to a fraction) | F-27, F-32 |

Still open (needs access outside the repo or a content decision): Cloudflare settings (F-02, F-05, F-26, F-28), Search Console and Bing verification (F-06), analytics (F-33), per-entity detail pages and case studies (F-20, F-21), WebP conversion and explicit image dimensions (F-24), the phone-number decision (F-34), a PageSpeed run, and merging the branch to `prod`.

---

## 1. Executive summary

The site has rich, well structured content (86 projects, 217 skills, 14 experience entries, 30 customers, 18 references, a complete education history) and a solid `llms.txt`. Almost none of that reaches search engines or AI systems today, for three structural reasons:

1. **The HTML shell is empty.** The server sends a 2.2 KB document containing only meta tags and a `<div id="root">`. All content is injected by a 869 KB JavaScript bundle that then fetches JSON data at runtime. Google can render it (with delay); Bing, social scrapers and every AI fetcher receive a title and a description and nothing else.
2. **Cloudflare is actively blocking AI crawlers.** The served robots.txt (not the one in the repo) disallows ClaudeBot, GPTBot, Google-Extended, CCBot, Meta, Amazon, Apple and more than twenty other agents, and the edge returns HTTP 403 to GPTBot and ClaudeBot even for `llms.txt`. For a personal brand site this cancels most of the GEO value of everything else.
3. **There is exactly one indexable URL.** Every other path returns HTTP 404 (the GitHub Pages single page app workaround), including the AmelBook privacy policy page. No sitemap, no structured data, no per-topic pages, no crawlable internal links.

On top of those, several hygiene issues hurt immediately: the Open Graph image returns 404 (social shares have no image), `http://` is not redirected to `https://`, the `www` host redirects to the insecure scheme, facts are inconsistent across surfaces (20+ vs 25+ years, Jengai vs Tursoft), and 63 PDF, DOC and ZIP files including old CVs are publicly crawlable.

### Scorecard

| Area | Grade | One-line reason |
|---|---|---|
| Crawlability and rendering | **D** | Empty HTML shell, runtime data fetch, content behind "Show more" and dialogs |
| Indexability and URLs | **D** | One URL, deep routes return 404, no sitemap, HTTP/www duplicates |
| On-page metadata | **C** | Decent title and description; broken og:image; one meta set for all routes |
| Structured data | **F** | None |
| Content quality | **B-** | Rich and specific, but slogans as headings, inconsistent numbers, no dedicated pages |
| Performance (static review) | **C** | 251 KB gzipped JS single chunk, no lazy images, no code splitting |
| GEO readiness | **D** | AI crawlers blocked, content invisible to non-JS fetchers, good llms.txt |

### Findings by severity

| Severity | Count | IDs |
|---|---|---|
| Critical | 4 | F-01, F-02, F-03, F-10 |
| High | 9 | F-04, F-05, F-06, F-07, F-11, F-16, F-20, F-23, F-32 |
| Medium | 13 | F-08, F-09, F-12, F-17, F-18, F-19, F-21, F-24, F-25, F-29, F-30, F-31, F-34 |
| Low | 8 | F-13, F-14, F-15, F-22, F-26, F-27, F-28, F-33 |

### The five things to do first

1. Turn off AI bot blocking and the managed robots.txt in Cloudflare (F-02). Zero code, ten minutes, largest GEO impact.
2. Enable "Always Use HTTPS", HSTS and a `www` to apex redirect in Cloudflare (F-05).
3. Ship a real `og-image.jpg` and fix the meta tags (F-10, F-12).
4. Add prerendering to the build so every route ships as real HTML with content (F-01, F-03, F-07). This is the one engineering change that unlocks everything else.
5. Add a sitemap, JSON-LD Person/WebSite/ProfilePage, and register the site in Google Search Console and Bing Webmaster Tools (F-04, F-06, F-16).

---

## 2. Site snapshot

| Aspect | Observed |
|---|---|
| Stack | Vite 5, React 18, React Router 6, Tailwind, shadcn/Radix, Leaflet, TanStack Query |
| Hosting | GitHub Pages (workflow `.github/workflows/deploy.yml` on push to `prod`), Cloudflare proxy in front (`Server: cloudflare`, `X-GitHub-Request-Id` present) |
| Routes | `/` (single long page with 12 sections), `/privacy/amelbook`, catch-all 404 |
| Rendering | Client side only. `main.tsx` calls `createRoot().render()`. No SSR, SSG or prerender |
| Data | Repositories fetch `/data/*.json` at runtime (`src/repositories/base/BaseRepo.ts:22`). `projects.json` alone is 120 KB |
| Built output | `index-*.js` 869 KB raw / 251 KB gzip, `index-*.css` 134 KB raw / 25 KB gzip, one chunk each |
| Assets | 2,580 files, 557 MB copied from `src/assets` into `dist/assets` on every build (videos up to 50 MB, ZIPs, DOCs) |
| Meta | Title, description, keywords, OG and Twitter tags, canonical, all static in `index.html` |
| Robots / sitemap | Repo `public/robots.txt` allows everything. Live robots.txt is rewritten by Cloudflare. No sitemap |
| llms.txt | Present at `/llms.txt`, 5.3 KB, well structured |
| Analytics | None in the repo, no Cloudflare Web Analytics beacon in the served HTML |
| Pending branch | `feat/ai-architect-positioning` updates title, description, keywords and llms.txt to the "AI-Enabled Senior Software Architect" positioning. It does not touch robots, sitemap, og:image or structured data |

---

## 3. Findings

Each finding lists severity, evidence, impact and the fix. Section 4 turns them into a sequenced plan.

### A. Crawling, rendering and indexing

#### F-01 Critical: All content depends on JavaScript and runtime data fetches

**Evidence.** `curl https://tursoft.net/` returns a 2,194 byte document whose body is `<div id="root"></div>` plus the SPA redirect script. A fetch without JavaScript (the tool used by most AI assistants and link scrapers) reported "only one line of text: Muhammet Turşak - Senior Software Architect, no other visible text, headings or links." After the bundle loads, each section's repository calls `fetch('/data/<entity>.json')` before rendering.

**Impact.**
- Google: indexes the page via its rendering queue, typically hours to days after crawl, and may time out on slow renders. Rankings depend on a second wave of processing.
- Bing: limited JavaScript rendering; today a Bing `site:tursoft.net` query returned no pages from the domain.
- AI assistants and AI search (ChatGPT browsing, Claude, Perplexity, Copilot): their fetchers returned HTTP 200 (see F-02) but receive an empty body. They can only cite the title, the meta description and `llms.txt`.
- Social previews: same empty body (and a broken image, F-10).

**Fix.** Prerender every route to static HTML at build time so the served `index.html` already contains the full DOM. Two viable approaches for this stack:

1. **Puppeteer prerender step in CI (recommended, lowest friction).** After `vite build`, serve `dist/`, open each route in headless Chrome with a tall viewport and a `?prerender=1` flag, wait for a `data-prerender-ready` marker, and write the resulting HTML to `dist/<route>/index.html`. The app keeps fetching JSON at runtime; the prerenderer simply captures the result. Switch `main.tsx` to `hydrateRoot` when `#root` already has children. See Appendix C for a working skeleton.
2. **`vite-react-ssg`** (static site generation with React Router). Cleaner long term but requires moving data loading to build-time imports instead of `fetch`, which touches every repository class.

Also render the "crawler view" during prerender: all projects (not just 21), all skills, and `Reveal` blocks in their revealed state.

#### F-02 Critical: Cloudflare blocks AI crawlers in robots.txt and at the edge

**Evidence.** The served `https://tursoft.net/robots.txt` is 2,836 bytes, not the 174 byte file in `public/`. It contains a "BEGIN Cloudflare Managed content" block with:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: ClaudeBot        Disallow: /
User-agent: GPTBot           Disallow: /
User-agent: Google-Extended  Disallow: /
User-agent: CCBot            Disallow: /
User-agent: anthropic-ai     Disallow: /
User-agent: Claude-Web       Disallow: /
User-agent: meta-externalagent Disallow: /
User-agent: Applebot-Extended Disallow: /
User-agent: Amazonbot        Disallow: /
User-agent: Bytespider       Disallow: /
User-agent: cohere-ai        Disallow: /
User-agent: MistralAI-Training Disallow: /
User-agent: Google-CloudVertexBot Disallow: /
User-agent: KimiBot          Disallow: /
... (30+ agents in total)
```

User-agent tests against `/llms.txt`:

| User-Agent | HTTP status |
|---|---|
| GPTBot | **403** |
| ClaudeBot | **403** |
| PerplexityBot | 200 |
| OAI-SearchBot | 200 |
| ChatGPT-User | 200 |
| Claude-User | 200 |
| Googlebot, Bingbot, browser | 200 |

So two layers are active: the Cloudflare "managed robots.txt / content signals" feature, and the "Block AI bots" (AI Crawl Control) WAF rule.

**Impact.** The site opts out of the training corpora and retrieval indexes of OpenAI (GPTBot), Anthropic (ClaudeBot), Google Gemini and Vertex AI (Google-Extended, Google-CloudVertexBot), Common Crawl (CCBot, used by many smaller models), Meta AI, Amazon Alexa and Apple Intelligence. Models that never see the site cannot describe Muhammet Turşak or Tursoft from it. Even `llms.txt`, written specifically for these systems, is unreachable to two of them. The user-initiated fetchers (ChatGPT-User, Claude-User, PerplexityBot) are allowed, but they receive the empty shell from F-01.

**Fix (Cloudflare dashboard, no code).**
1. Security → Bots (or "AI Crawl Control" in newer dashboards): set AI crawlers to **Allow**. If you want to keep blocking scrapers with no discovery value (Bytespider, Amazonbot, PetalBot), use the per-crawler controls instead of the global block.
2. Disable **Managed robots.txt** and **Content Signals** so the repo's `public/robots.txt` is what gets served.
3. Re-test with the curl commands in Appendix F. Expect 200 for GPTBot and ClaudeBot and the repo's robots.txt content.

**Decision note.** Blocking AI training is a legitimate choice for publishers who sell content. For a personal site whose purpose is to be found and described accurately, discoverability outweighs the opt-out.

#### F-03 Critical: Every non-root URL returns HTTP 404

**Evidence.** `curl -I https://tursoft.net/privacy/amelbook` → `404`. GitHub Pages serves `public/404.html`, whose script redirects to `/?p=%2Fprivacy%2Famelbook`, and `index.html` restores the path client side. The same happens for any future route.

**Impact.**
- The AmelBook privacy policy, which the app stores need to link to, answers 404 to any automated check and is never indexed.
- Google may index `https://tursoft.net/?p=...` variants as duplicates (the canonical tag partially mitigates this).
- Any detail pages added later (projects, skills, domains) would be unindexable until this is solved.

**Fix.** Prerender (F-01) writes `dist/privacy/amelbook/index.html`, which GitHub Pages serves with 200. Keep `404.html` only for genuinely unknown URLs. Give the 404 page a proper `<title>` and no canonical.

#### F-04 High: No sitemap, robots.txt has no `Sitemap:` line

**Evidence.** `https://tursoft.net/sitemap.xml` → 404. `public/robots.txt` lists only `Allow: /` rules.

**Fix.** Add `public/sitemap.xml` now (two URLs), then generate it at build time from the data JSON files once detail pages exist. Add `Sitemap: https://tursoft.net/sitemap.xml` to robots.txt and submit it in Search Console and Bing Webmaster Tools. See Appendix A.

#### F-05 High: HTTP is not redirected to HTTPS, `www` redirects to HTTP, no HSTS

**Evidence.**

| Request | Response |
|---|---|
| `http://tursoft.net/` | 200 (served over plain HTTP, no redirect) |
| `https://www.tursoft.net/` | 301 → `http://tursoft.net/` |
| `http://www.tursoft.net/` | 301 → `http://tursoft.net/` |
| Response headers | no `Strict-Transport-Security` |

**Impact.** Four URL variants of the homepage are reachable (http/https × www/apex); the canonical tag helps but still wastes crawl and splits link equity. HTTPS is a confirmed Google ranking signal. Visitors who type the domain land on an insecure page.

**Fix (Cloudflare).** SSL/TLS → Edge Certificates → enable **Always Use HTTPS** and **HSTS** (max-age 6 months, include subdomains). Rules → Redirect Rules → `www.tursoft.net/*` → `https://tursoft.net/$1`, 301. Also tick **Enforce HTTPS** in the GitHub Pages settings.

#### F-06 High: Search engine presence is unverified; Bing shows nothing

**Evidence.** A Bing `site:tursoft.net` query returned ten results, none from the domain. No Search Console or Bing verification file or meta tag exists in the repo (verification may be via DNS, which this audit cannot see).

**Fix.** Verify the domain in Google Search Console and Bing Webmaster Tools (DNS TXT via Cloudflare is easiest), submit the sitemap, request indexing of `/` and `/privacy/amelbook`. Turn on Cloudflare **Crawler Hints / IndexNow** so Bing, Yandex and others are pinged on every deploy. Review the Coverage and Page Indexing reports two weeks after the prerender ships.

#### F-07 High: Most content never enters the DOM

**Evidence.**
- Portfolio: `visibleMajorItemCount={21}` with `enableShowMore` in `PortfolioSection.tsx`; `listviewer.tsx:267` slices the list. 65 of 86 projects are only rendered after a click.
- Project full text (`fulltext`), screenshots, customers and skills per project: rendered only inside `ProjectDetailDialog`.
- Skills (217), customers (30), education, domains, people: card titles are in the DOM, details are in dialogs.
- Experience position descriptions are rendered as `<p>` elements (good).

**Impact.** The long-tail content that would rank for queries like "HL7 FHIR integration platform architect" or "hospital information system Kosovo" is invisible to crawlers.

**Fix.** During prerender render everything (`?prerender=1` → `showAll`). Longer term, give each project, skill and domain its own URL (F-20) so the dialog content becomes a page.

#### F-08 Medium: No crawlable internal links or section anchors

**Evidence.** `Navigation.tsx` renders `<button onClick={scrollToSection}>` for all 12 items; the hero CTA is a button; sections have `id`s but no page links to `#about`, `#experience`, etc.

**Impact.** No anchor text signals, no "Jump to" sitelinks in Google results, keyboard and screen reader users get buttons instead of links, and the URL never reflects the section.

**Fix.** Use `<a href="#experience">` for nav items (keep the active state logic), add `html { scroll-behavior: smooth }` (already guarded by `prefers-reduced-motion`), and link between sections in copy ("see the Avicenna HIS project").

#### F-09 Medium: `Reveal` hides content until an IntersectionObserver fires

**Evidence.** `.reveal { opacity: 0; transform: translateY(28px) }` in `index.css:309`; the class `is-revealed` is added only when the element intersects the viewport. Every section except the hero is wrapped.

**Impact.** Text is in the DOM, so Google indexes it, but content that is never "visible" during rendering can be discounted. The headless prerenderer (F-01) must also force the revealed state, otherwise the captured HTML has every section at `opacity: 0`.

**Fix.** Apply the hidden state only when JavaScript is present (`html.js .reveal`), and in prerender mode render with `is-revealed` set. Alternatively use `content-visibility: auto` for the performance win without hiding.

### B. Metadata and social

#### F-10 Critical: Open Graph and Twitter image return 404

**Evidence.** `og:image` and `twitter:image` point to `https://tursoft.net/assets/images/about/about-me.jpg`. That path exists neither in the repo (`src/assets/images/...` does not exist) nor live (404). `profile-photo.jpg` (8 KB) is far too small for a 1200×630 card.

**Impact.** Every share on LinkedIn, X, Slack, WhatsApp, iMessage and Teams renders without an image. For a personal brand site, LinkedIn shares are a primary traffic source.

**Fix.** Create `public/og-image.jpg` (1200×630, under 300 KB, name, title and photo), and update the tags:

```html
<meta property="og:image" content="https://tursoft.net/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Muhammet Turşak, Senior Software Architect" />
<meta property="og:site_name" content="Muhammet Turşak" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:image" content="https://tursoft.net/og-image.jpg" />
<meta name="twitter:creator" content="@muhammettursak" />
```

Validate with the LinkedIn Post Inspector and X Card Validator after deploy (both cache aggressively; use the "re-scrape" button).

#### F-11 High: One meta set for every route; privacy page canonicalizes to the homepage

**Evidence.** `index.html` is the only head. `/privacy/amelbook` therefore carries the title "Muhammet Turşak - Senior Software Architect", the homepage description and `<link rel="canonical" href="https://tursoft.net">`.

**Impact.** Even once the privacy page returns 200, Google will fold it into the homepage because of the canonical. Its title in results would be wrong.

**Fix.** Add `react-helmet-async` (or React 19's native `<title>`/`<meta>` hoisting if you upgrade) and set per-route title, description, canonical and OG tags. Prerender captures them into the static HTML. Privacy page: title "AmelBook Privacy Policy", canonical `https://tursoft.net/privacy/amelbook`, `og:type` `article`.

#### F-12 Medium: Title and description content issues

**Evidence (live `prod`).**
- Title: "Muhammet Turşak - Senior Software Architect" (44 characters, fine).
- Description: 160 characters, says "20+ years" and "Director of Technology at Jengai". The hero, About section and `llms.txt` say 25+ years; the pending branch repositions the current role as Tursoft founder.
- The ASCII spelling "Tursak", which most people type into a search box, appears nowhere in the head.
- Pending branch description is 181 characters and will be truncated in results.
- `meta keywords` is ignored by Google and Bing (harmless, but not a lever).

**Fix.** After merging the positioning branch:

```html
<title>Muhammet Turşak (Tursak) | AI-Enabled Senior Software Architect</title>
<meta name="description" content="Muhammet Turşak is a Senior Software Architect in Ankara, Turkey with 25+ years in .NET, Node.js, Azure and SaaS, now building with AI coding agents and agent teams. Founder of Tursoft." />
```

Keep the description at or under 155 characters. Mirror the same wording in the hero's first paragraph and in `llms.txt` so all three agree (F-19).

#### F-13 Low: No icon links, touch icon, manifest or theme color

**Evidence.** `index.html` has no `<link rel="icon">`; `/apple-touch-icon.png` and `/manifest.webmanifest` return 404. `favicon.ico` works by browser convention only.

**Fix.**

```html
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="icon" href="/icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0b1020" />
```

Google shows favicons in mobile results; a missing or default icon lowers click-through.

#### F-14 Low: Language signals are mixed

**Evidence.** `<html lang="en">`, but 5 of 18 testimonials in `references.json` and several company and project strings are Turkish. The privacy page switches among ten languages with client state only, so all languages share one URL.

**Fix.** Add `lang="tr"` on Turkish blocks. When the Turkish site version ships (it is on the README todo list and in a stash), use separate URLs (`/tr/`) with `hreflang` pairs and `x-default`. For the privacy page, consider `/privacy/amelbook/<lang>` routes with hreflang so each language is indexable.

#### F-15 Low: 404 page lacks its own title and uses light-theme styles

**Fix.** Set `<title>Page not found | Muhammet Turşak</title>`, no canonical, consistent dark styling, and a link to the homepage (already present).

### C. Structured data

#### F-16 High: No JSON-LD of any kind

**Evidence.** No `application/ld+json`, no `schema.org` reference anywhere in `index.html` or `src/`.

**Impact.** Google and AI systems have no machine-readable statement of who the person is, what the site is, where they work, what they know, and which profiles are the same entity. Person and ProfilePage markup is the basis for a Knowledge Panel and for correct entity resolution in AI answers ("Muhammet Turşak" vs other people with similar names). SoftwareApplication markup can earn rich results for AmelBook and Jengai App.

**Fix.** Add a `@graph` with `Person`, `WebSite` and `ProfilePage` to the homepage (Appendix B), `SoftwareApplication` to product pages when they exist, `FAQPage` once an FAQ section exists, and `BreadcrumbList` on detail pages. Validate with the Rich Results Test and the Schema Markup Validator.

### D. Content and semantics

#### F-17 Medium: Headings are slogans, not topics

**Evidence.** `h1` = "MUHAMMET TURŞAK" (name only). Section `h2`s: "Transforming Ideas Into Digital Reality", "Building Tomorrow's …", "Industry Domains", "Educational …", "Global …", "Professional …", "Let's Work Together". The skills section has no `h2` at all (only `h3` per card). The portfolio heading is injected through `dangerouslySetInnerHTML`.

**Fix.** Keep the visual slogans as sub-lines but make the semantic heading descriptive:

| Section | Suggested h2 |
|---|---|
| About | About Muhammet Turşak, Senior Software Architect |
| Experience | 25+ Years of Experience: Jengai, Gamyte, ERC Group, DataSel, Fonet, Halıcı |
| Skills | Skills: .NET, Node.js, Azure, React, AI Agents and Agentic Engineering |
| Portfolio | Software Projects: Healthcare IT, Construction IT, E-Learning, SaaS |
| Contact | Contact Muhammet Turşak for Consulting and Architecture Roles |

Optionally extend the `h1` with a static sub-line: "Senior Software Architect, Ankara, Turkey".

#### F-18 Medium: The hero's positioning statement is animated, not static

**Evidence.** The role line is a `Typewriter` that shows one of four phrases at a time. The static text under it is a benefits sentence without the role or location.

**Fix.** Add one static sentence directly under the `h1` (visually styled as the sub-line) such as "Senior Software Architect and Director of Technology, building cloud and SaaS products with AI agent teams. Ankara, Turkey." Keep the typewriter below it as decoration, or give it a visually hidden full list.

#### F-19 Medium: Facts disagree across surfaces

| Fact | index.html | Hero / About | statistics.json | llms.txt | Pending branch |
|---|---|---|---|---|---|
| Years of experience | 20+ | 25+ | 20 | 25+ | 25+ |
| Current role | Director of Technology at Jengai | Director of Technology at Jengai | – | Director of Technology at Jengai | Founder at Tursoft; formerly Jengai |
| Location | "Turkey" (keywords) | "Turkey" (contact) | – | Ankara, Turkey | Ankara, Turkey |
| Website URL | https | https | – | `http://tursoft.net` | `http://tursoft.net` |
| Name casing | Muhammet Turşak | MUHAMMET TURŞAK | – | Muhammet TURŞAK | Muhammet TURŞAK |

**Impact.** Entity consistency is one of the strongest GEO signals: AI systems cross-check sources, and conflicting numbers lower confidence and produce hedged or wrong answers.

**Fix.** Pick one value per fact and apply it everywhere, including `statistics.json` (20 → 25), `general.json` (`website` → https), `llms.txt` (`http` → https, add "also written Tursak"), LinkedIn, GitHub and Stack Overflow bios.

#### F-20 High: One indexable URL for 400+ content entities

**Evidence.** Routes: `/` and `/privacy/amelbook`. The README todo list already includes "add domain details page" and "add skills detail page".

**Impact.** The site can only rank for the person's name. Queries that would bring recruiters and clients ("HL7 FHIR integration architect", "construction estimation SaaS architect", "hospital information system .NET architect Turkey") have no page to land on.

**Fix.** Add static routes generated from the JSON data: `/projects/<slug>`, `/domains/<slug>`, `/skills/<slug>`, `/services`, `/experience/<company>`, `/about`, `/faq`. Each page: unique title and description, `h1`, the dialog content as body, related entities as internal links, `BreadcrumbList` and the relevant schema type. The prerenderer or SSG produces one HTML file per route and the sitemap is generated from the same data. Start with the 10 to 15 major projects and the 6 domains.

#### F-21 Medium: No freshness or authority signals

**Evidence.** No "last updated" date, no `dateModified`, no articles, no case studies, no changelog. The CV PDFs are the only dated artefacts.

**Fix.** Show "Last updated: <date>" in the footer (and `dateModified` in `ProfilePage`), add a short "Writing" or "Case studies" section with three pieces that AI engines can cite: the Jengai AI CRM and estimation architecture, the AHIN HL7/FHIR integration platform, and the AI-enabled development lifecycle (agent teams, prompt and context engineering). These are also the topics the positioning branch wants to own.

#### F-22 Low: Image alt text

**Evidence.** All 43 `<img>` elements have `alt` (good). A few use codes as alt (`alt={code}` for flags). Project logos use the project title.

**Fix.** Use the language name for flag images. Add context to project images ("Avicenna HIS patient registration screen").

### E. Performance (static review; run PageSpeed Insights manually to confirm)

#### F-23 High: One 869 KB JavaScript chunk (251 KB gzipped), no code splitting

**Evidence.** `dist/assets/index-*.js` 869 KB raw / 251 KB gzip; CSS 134 KB / 25 KB. No `React.lazy` anywhere. `MapSection.tsx` imports Leaflet and react-leaflet eagerly; 11 detail dialogs, Embla carousel and the full Radix set ship in the initial bundle.

**Impact.** Time to Interactive and Total Blocking Time on mobile; Google's page experience signals; render delay for Googlebot.

**Fix.**
- `React.lazy` + `Suspense` for `MapSection`, `TimelineSection` and every `*DetailDialog`.
- `build.rollupOptions.output.manualChunks` for `react`, `radix`, `leaflet`.
- Remove unused dependencies (`recharts`, `react-day-picker`, `input-otp`, `vaul`, `cmdk` appear only in unused `ui/` wrappers; verify with `npx depcheck` and delete the wrappers).
- Target: initial JS under 120 KB gzipped.

#### F-24 Medium: Images are not optimized for Core Web Vitals

**Evidence.** 0 of 43 `<img>` tags have `loading="lazy"`, `decoding="async"` or `width`/`height`. The hero background (`hero-bg.jpg`, 134 KB) is a CSS background image, so it is not preloaded and is the likely LCP element. 2,360 JPG/PNG assets, no WebP/AVIF, no `srcset`.

**Fix.** Add `width`/`height` (prevents CLS) and `loading="lazy"` for everything below the fold; `<link rel="preload" as="image" href="/assets/hero-bg.jpg" fetchpriority="high">` for the hero; use `vite-imagetools` to emit WebP/AVIF with `srcset` for logos and screenshots.

#### F-25 Medium: Data loads in a waterfall after the bundle

**Evidence.** HTML → JS (251 KB) → `fetch('/data/projects.json')` (120 KB) and nine other JSON files → render. Nothing is cached beyond 600 seconds.

**Fix.** Prerendering removes the waterfall for the first paint. For interactivity, import the small JSON files statically (bundled) and keep `fetch` only for large ones, with `<link rel="preload" as="fetch">` for `projects.json`.

#### F-26 Low: Cache headers

**Evidence.** `Cache-Control: max-age=600` for everything (GitHub Pages default), including hashed `index-*.js`.

**Fix.** Cloudflare Cache Rule: `/assets/index-*.js` and `*.css` → Edge and Browser TTL 1 year (hashed names are safe). Leave `/data/*.json` and copied asset images at 1 day, since their names are not hashed.

#### F-27 Low: Deploy payload hygiene

**Evidence.** `viteStaticCopy` copies all of `src/assets` (2,580 files, 557 MB, including 50 MB videos, ZIPs and `.doc` files) into `dist` on every build. GitHub Pages has a 1 GB soft limit and large deploys are slow.

**Fix.** Exclude `**/videos/**`, `**/downloads/**/_old/**` and `*.doc` from the copy, or move large media to Cloudflare R2 with a public bucket.

#### F-28 Low: Security headers (Lighthouse best practices)

**Evidence.** No `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` or `Content-Security-Policy`.

**Fix.** Cloudflare Rules → Transform Rules → Response headers: add the four headers. HSTS comes with F-05.

### F. GEO specifics

#### F-29 Medium: `llms.txt` is good but incomplete against the spec

**Evidence.** `/llms.txt` exists (good: title, blockquote summary, About, Experience, Education, Skills, Projects, Domains, Statistics). Gaps: no links section pointing to canonical HTML pages (the spec expects Markdown link lists so agents can follow to detail content), website URL is `http://`, no "last updated" line, no ASCII name alias, statistics disagree with the page (F-19), no `llms-full.txt`, no Q&A phrasing. GPTBot and ClaudeBot cannot fetch it (F-02).

**Fix.** Rewrite per Appendix E: add a one-line identity sentence with name variants, a "Facts" list, a "Links" section (homepage sections and, later, detail pages, CV PDFs, GitHub, LinkedIn), a "Last updated" date, and publish `llms-full.txt` containing the full text of projects and experience generated from the JSON data at build time.

#### F-30 Medium: No answer-ready content blocks

**Evidence.** The first visible paragraphs are marketing copy ("Transforming Ideas Into Digital Reality", "With 25+ years in technology, I've driven…"). There is no concise definitional sentence, no fact table, no FAQ.

**Impact.** AI answers are built from short, self-contained statements. A page that opens with a definition ("X is a Y based in Z who does W") is quoted; a page that opens with a slogan is paraphrased or skipped.

**Fix.** Add an "At a glance" block near the top (name with variants, title, location, years, current company, specialties, availability) and an FAQ section with 6 to 8 questions people actually ask ("Who is Muhammet Turşak?", "What does Tursoft build?", "Is Muhammet Turşak available for consulting?", "Which industries has he worked in?", "What is his experience with AI agents?"), marked up with `FAQPage`.

#### F-31 Medium: Entity corroboration across the web

**Evidence.** `sameAs` links exist only in `llms.txt`. LinkedIn, GitHub and Stack Overflow respond (200/301). The X link still uses `twitter.com`. There is no third-party page describing Tursoft, BestJobFinder or Account Manager for Claude.

**Fix.** Put `sameAs` into the Person schema (F-16) and `<link rel="me">` tags; align the LinkedIn headline, GitHub profile README and Stack Overflow "About" with the site's one-sentence identity; link all of them back to `https://tursoft.net`; list Tursoft products on at least one independent directory (GitHub organization page, Product Hunt or Crunchbase) so AI systems see corroboration.

#### F-32 High: 63 PDF, DOC and ZIP files are publicly crawlable, including old CVs

**Evidence.** `src/assets/downloads/CV/_old/*.doc` (five old CV versions, including "CompleteEdition"), 39 PDFs and several ZIPs are copied to `dist` and served. Nothing excludes them in robots.txt and GitHub Pages cannot send `X-Robots-Tag`.

**Impact.** Search engines index documents. AI crawlers ingest them and may quote a 2014 CV as current fact. Old CVs typically contain phone numbers, birth dates and addresses.

**Fix.** Remove `_old` and anything you do not want public from the deploy (F-27). For the current CV PDFs, which should be found, keep them but add `Disallow: /assets/downloads/CV/_old/` and `Disallow: /assets/projects/*/downloads/` to robots.txt as a safety net. Optionally add a Cloudflare response header rule `X-Robots-Tag: noindex` for `*.doc` and `*.zip`.

**Caution.** Do not disallow `/data/` or `/assets/` wholesale: Googlebot needs those JSON and image files to render the page.

#### F-33 Low: No analytics, so AI and search referrals cannot be measured

**Fix.** Enable Cloudflare Web Analytics (cookieless, no consent banner needed) or Plausible. Create a referrer segment for `chatgpt.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com`, `gemini.google.com` to track GEO outcomes.

#### F-34 Medium: Personal data exposure in page text

**Evidence.** Phone number and email are rendered as plain text in three places; `general.json` also carries a birth date (not rendered today).

**Fix.** Not an SEO issue, but since the prerender will put these into static HTML, decide now: keep the email (it is in `llms.txt` anyway), consider obfuscating or removing the phone number, and never render the birth date.

---

## 4. Action plan

### Phase 0: Configuration only (day 1, about 1 hour, no deploy needed)

| # | Action | Fixes | Verify |
|---|---|---|---|
| 0.1 | Cloudflare → Security → Bots / AI Crawl Control: allow AI crawlers; disable Managed robots.txt and Content Signals | F-02 | `curl -A GPTBot https://tursoft.net/llms.txt` → 200; robots.txt equals repo file |
| 0.2 | Cloudflare → SSL/TLS: Always Use HTTPS on, HSTS on; Redirect Rule `www` → `https://tursoft.net/$1` 301; GitHub Pages: Enforce HTTPS | F-05, F-28 | `curl -I http://tursoft.net/` → 301 to https; `curl -I https://www.tursoft.net/` → 301 to https apex |
| 0.3 | Verify domain in Google Search Console and Bing Webmaster Tools (DNS TXT); enable Cloudflare Crawler Hints (IndexNow) | F-06 | Both consoles show the property; request indexing of `/` |
| 0.4 | Cloudflare Transform Rule for `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` | F-28 | `curl -I` shows headers |

### Phase 1: Small code changes (week 1, about 1 day)

| # | Action | Fixes |
|---|---|---|
| 1.1 | Create `public/og-image.jpg` (1200×630); update OG and Twitter tags (Appendix B) | F-10 |
| 1.2 | Merge the positioning branch; set final title (with "Tursak"), description ≤155 chars, keep one fact set | F-12, F-19 |
| 1.3 | Add icon links, `apple-touch-icon.png`, `manifest.webmanifest`, `theme-color` | F-13 |
| 1.4 | Add `public/sitemap.xml`; add `Sitemap:` and `_old` disallow lines to `public/robots.txt` (Appendix A) | F-04, F-32 |
| 1.5 | Add JSON-LD `@graph` (Person, WebSite, ProfilePage) to `index.html` (Appendix B) | F-16 |
| 1.6 | Nav items and hero CTA become `<a href="#id">`; descriptive `h2`s; static hero sub-line | F-08, F-17, F-18 |
| 1.7 | `statistics.json` 20 → 25; `general.json` and `llms.txt` URLs to https; "also written Tursak" in About and llms.txt | F-19, F-29 |
| 1.8 | Remove `_old` CVs and `.doc` files from `src/assets` or exclude them from `viteStaticCopy` | F-32, F-27 |
| 1.9 | Enable Cloudflare Web Analytics | F-33 |

### Phase 2: Prerendering (weeks 2 to 3, about 2 to 3 days)

| # | Action | Fixes |
|---|---|---|
| 2.1 | Add `scripts/prerender.mjs` (Appendix C) and run it after `vite build` in `deploy.yml` | F-01, F-03, F-07, F-09, F-25 |
| 2.2 | `main.tsx`: `hydrateRoot` when `#root` has children, else `createRoot` | F-01 |
| 2.3 | Prerender mode (`?prerender=1` or `navigator.userAgent` check): `ListViewer` shows all items, `Reveal` renders revealed, dialogs' content rendered inline but visually collapsed | F-07, F-09 |
| 2.4 | `react-helmet-async` with per-route title, description, canonical, OG; privacy page gets its own set | F-11 |
| 2.5 | Verify: `curl https://tursoft.net/ \| grep -c "<h2"` > 0; `curl -I https://tursoft.net/privacy/amelbook` → 200; Rich Results Test passes | all above |

### Phase 3: Content architecture (month 1 to 2)

| # | Action | Fixes |
|---|---|---|
| 3.1 | Routes and pages for the major projects, 6 domains, services, FAQ, about; generated from JSON with slugs | F-20, F-30 |
| 3.2 | Per-page schema (`SoftwareApplication`, `BreadcrumbList`, `FAQPage`) and internal links between related entities | F-16, F-08 |
| 3.3 | Build-time sitemap and `llms-full.txt` generated from the same data | F-04, F-29 |
| 3.4 | "At a glance" block, FAQ section, "Last updated" footer with `dateModified` | F-21, F-30 |
| 3.5 | Three case-study articles (Jengai AI CRM, AHIN HL7/FHIR, AI-enabled SDLC) | F-21 |

### Phase 4: Performance (parallel to phase 3, about 2 days)

| # | Action | Fixes |
|---|---|---|
| 4.1 | `React.lazy` for Map, Timeline and all detail dialogs; `manualChunks`; remove unused deps | F-23 |
| 4.2 | `width`/`height`, `loading="lazy"`, `decoding="async"` on images; preload hero image; WebP via `vite-imagetools` | F-24 |
| 4.3 | Cloudflare cache rules for hashed assets; exclude videos and ZIPs from the deploy | F-26, F-27 |
| 4.4 | Run PageSpeed Insights (mobile and desktop) before and after; target LCP < 2.5 s, CLS < 0.1, TBT < 200 ms | – |

### Phase 5: GEO upkeep (ongoing)

| # | Action | Fixes |
|---|---|---|
| 5.1 | Align LinkedIn, GitHub README, Stack Overflow bio with the site's identity sentence; link back to tursoft.net; `rel="me"` | F-31 |
| 5.2 | Monthly: ask ChatGPT, Claude, Perplexity and Gemini "Who is Muhammet Turşak?" and "What is Tursoft?"; record which sources they cite; fix gaps at the source | F-30, F-31 |
| 5.3 | Review AI referrer traffic and Search Console queries quarterly; add FAQ entries for real questions | F-33 |

---

## 5. Verification checklist (run after each phase)

```bash
# Content visible without JavaScript
curl -s https://tursoft.net/ | grep -c "<h2"                       # expect > 0 after phase 2

# Deep route and status codes
curl -s -o /dev/null -w "%{http_code}\n" https://tursoft.net/privacy/amelbook   # expect 200
curl -s -o /dev/null -w "%{http_code}\n" https://tursoft.net/sitemap.xml        # expect 200
curl -s -o /dev/null -w "%{http_code}\n" https://tursoft.net/og-image.jpg       # expect 200

# Redirects and HSTS
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://tursoft.net/        # 301 https://tursoft.net/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.tursoft.net/   # 301 https://tursoft.net/
curl -sI https://tursoft.net/ | grep -i strict-transport-security

# AI crawler access
for ua in GPTBot ClaudeBot PerplexityBot OAI-SearchBot Google-Extended CCBot; do
  printf "%-16s " $ua; curl -s -o /dev/null -w "%{http_code}\n" -A "$ua" https://tursoft.net/llms.txt
done                                                                  # expect 200 for all
curl -s https://tursoft.net/robots.txt | grep -c "Cloudflare Managed"  # expect 0

# Structured data
curl -s https://tursoft.net/ | grep -c 'application/ld+json'          # expect 1
# then: https://search.google.com/test/rich-results?url=https://tursoft.net/
# and:  https://validator.schema.org/
```

Also check: Google Search Console → Pages report (indexed count grows with phase 3), URL Inspection → "View crawled page" shows real content; Bing Webmaster Tools → Site Explorer lists `/`.

---

## Appendix A: robots.txt and sitemap.xml

`public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /assets/downloads/CV/_old/
Disallow: /assets/projects/*/downloads/

Sitemap: https://tursoft.net/sitemap.xml
```

Do not disallow `/data/` or `/assets/` in general; the renderer needs them. The explicit Googlebot, Bingbot, Twitterbot and facebookexternalhit blocks in the current file are redundant and can go.

`public/sitemap.xml` (initial; generate from data in phase 3)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tursoft.net/</loc>
    <lastmod>2026-10-27</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tursoft.net/privacy/amelbook</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
```

## Appendix B: head additions and JSON-LD

Add to `index.html` `<head>` (values reflect the pending positioning; adjust wording to the final fact set):

```html
<title>Muhammet Turşak (Tursak) | AI-Enabled Senior Software Architect</title>
<meta name="description" content="Muhammet Turşak is a Senior Software Architect in Ankara, Turkey with 25+ years in .NET, Node.js, Azure and SaaS, now building with AI coding agents and agent teams. Founder of Tursoft." />
<link rel="canonical" href="https://tursoft.net/" />

<meta property="og:site_name" content="Muhammet Turşak" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="https://tursoft.net/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Muhammet Turşak, Senior Software Architect" />
<meta name="twitter:image" content="https://tursoft.net/og-image.jpg" />
<meta name="twitter:creator" content="@muhammettursak" />

<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#0b1020" />
<link rel="me" href="https://github.com/tursoft" />
<link rel="me" href="https://www.linkedin.com/in/tursoft/" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://tursoft.net/#person",
      "name": "Muhammet Turşak",
      "alternateName": ["Muhammet Tursak", "Muhammet TURŞAK"],
      "givenName": "Muhammet",
      "familyName": "Turşak",
      "jobTitle": "Senior Software Architect",
      "description": "Senior Software Architect with 25+ years of experience in .NET, Node.js, Azure and SaaS, building enterprise systems with AI coding agents and agent teams.",
      "url": "https://tursoft.net/",
      "image": "https://tursoft.net/og-image.jpg",
      "email": "mailto:tursoft@gmail.com",
      "address": { "@type": "PostalAddress", "addressLocality": "Ankara", "addressCountry": "TR" },
      "nationality": { "@type": "Country", "name": "Turkey" },
      "worksFor": { "@type": "Organization", "name": "Tursoft", "url": "https://tursoft.net/" },
      "alumniOf": { "@type": "CollegeOrUniversity", "name": "Middle East Technical University", "sameAs": "https://www.metu.edu.tr/" },
      "knowsAbout": [
        "Software architecture", ".NET", "Node.js", "Microsoft Azure", "React",
        "AI coding agents", "Prompt engineering", "Context engineering",
        "Healthcare IT", "HL7 FHIR", "Construction IT", "E-learning", "SaaS"
      ],
      "sameAs": [
        "https://www.linkedin.com/in/tursoft/",
        "https://github.com/tursoft",
        "https://stackoverflow.com/users/1949367/muhammet-tur%C5%9Eak",
        "https://x.com/muhammettursak"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://tursoft.net/#website",
      "url": "https://tursoft.net/",
      "name": "Muhammet Turşak",
      "inLanguage": "en",
      "publisher": { "@id": "https://tursoft.net/#person" }
    },
    {
      "@type": "ProfilePage",
      "@id": "https://tursoft.net/#profilepage",
      "url": "https://tursoft.net/",
      "isPartOf": { "@id": "https://tursoft.net/#website" },
      "mainEntity": { "@id": "https://tursoft.net/#person" },
      "dateModified": "2026-10-27"
    }
  ]
}
</script>
```

Do not add `birthDate` or `telephone` to the public schema.

## Appendix C: prerender step

`package.json`

```json
"scripts": {
  "build": "vite build && node scripts/prerender.mjs"
},
"devDependencies": {
  "puppeteer": "^23.0.0",
  "serve-handler": "^6.1.5"
}
```

`scripts/prerender.mjs`

```js
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import puppeteer from "puppeteer";
import handler from "serve-handler";

const dist = "dist";
const routes = ["/", "/privacy/amelbook"];           // phase 3: push project/domain/skill routes here
const port = 4173;

const server = createServer((req, res) =>
  handler(req, res, { public: dist, rewrites: [{ source: "**", destination: "/index.html" }] })
);
await new Promise((r) => server.listen(port, r));

const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
for (const route of routes) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 12000 });   // tall viewport: every Reveal intersects
  await page.goto(`http://localhost:${port}${route}?prerender=1`, { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-prerender-ready]", { timeout: 30000 });
  const html = await page.content();
  const out = route === "/" ? join(dist, "index.html") : join(dist, route, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log("prerendered", route, html.length, "bytes");
  await page.close();
}
await browser.close();
server.close();
```

`src/main.tsx`

```tsx
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;
if (root.hasChildNodes()) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
```

App-side hooks for prerender mode:
- `const isPrerender = new URLSearchParams(location.search).has("prerender")` in a small `lib/prerender.ts`.
- `ListViewer`: `showAll` defaults to `isPrerender`.
- `Reveal`: initial `revealed` state is `isPrerender`.
- `Index.tsx`: after all repositories resolve, set `document.body.dataset.prerenderReady = "1"`.
- Strip `?prerender=1` from the captured HTML is not needed; the script writes the DOM, not the URL.

Hydration mismatches (for example the typewriter or animated counters) only log warnings in React 18; keep those components client-only by rendering their static fallback until mounted.

## Appendix D: nav links

```tsx
{navItems.map((item) => (
  <a
    key={item.id}
    href={`#${item.id}`}
    aria-current={activeSection === item.id ? "location" : undefined}
    onClick={(e) => { e.preventDefault(); scrollToSection(item.id); history.replaceState(null, "", `#${item.id}`); }}
    className={...}
  >
    {item.label}
  </a>
))}
```

## Appendix E: llms.txt skeleton (v2)

```markdown
# Muhammet Turşak (Tursak) — AI-Enabled Senior Software Architect

> Muhammet Turşak (also written Tursak) is a Senior Software Architect based in Ankara, Turkey,
> with 25+ years of experience in .NET, Node.js, Azure and SaaS. He runs the software development
> lifecycle with AI coding agents and designs agent teams. Founder of Tursoft; formerly Director of
> Technology at Jengai and Gamyte (New York).

Last updated: 2026-10-27

## Facts
- Name: Muhammet Turşak (Tursak, TURŞAK)
- Title: Senior Software Architect, Director of Technology
- Location: Ankara, Turkey (remote, international clients)
- Experience: 25+ years; 50+ projects; 14 countries
- Current: Founder, Tursoft (BestJobFinder, Account Manager for Claude)
- Availability: consulting, architecture reviews, senior roles
- Contact: tursoft@gmail.com

## Links
- [Homepage](https://tursoft.net/)
- [About](https://tursoft.net/#about)
- [Experience](https://tursoft.net/#experience)
- [Projects](https://tursoft.net/#portfolio)
- [Compact CV (PDF)](https://tursoft.net/assets/files/downloads/CV_MuhammetTursak_v56-compact.20260403.pdf)
- [Detailed CV (PDF)](https://tursoft.net/assets/files/downloads/CV_MuhammetTursak_Detailed-v60.pdf)
- [LinkedIn](https://www.linkedin.com/in/tursoft/) · [GitHub](https://github.com/tursoft) · [Stack Overflow](https://stackoverflow.com/users/1949367/muhammet-tur%C5%9Eak)
- [Full content for LLMs](https://tursoft.net/llms-full.txt)

## Experience
(existing content)

## Projects
(existing content; one line each, link to detail pages once they exist)

## FAQ
- Who is Muhammet Turşak? …
- What does Tursoft build? …
- Is he available for consulting? …
```

## Appendix F: evidence log (2026-10-27)

| Check | Result |
|---|---|
| `GET https://tursoft.net/` raw HTML | 2,194 bytes, body is `<div id="root">` + redirect script |
| `GET /robots.txt` (served) | 2,836 bytes, Cloudflare managed block with 30+ `Disallow: /` entries and `Content-Signal: search=yes,ai-train=no,use=reference` |
| `GET /robots.txt` (repo) | 174 bytes, allow all |
| `GET /llms.txt` as GPTBot / ClaudeBot | 403 / 403 |
| `GET /llms.txt` as PerplexityBot / OAI-SearchBot / ChatGPT-User / Claude-User | 200 |
| `GET /sitemap.xml` | 404 |
| `GET /assets/images/about/about-me.jpg` (og:image) | 404 |
| `GET /privacy/amelbook` | 404 (404.html, 502 bytes) |
| `GET /apple-touch-icon.png`, `/manifest.webmanifest` | 404 |
| `GET http://tursoft.net/` | 200, no redirect |
| `GET https://www.tursoft.net/` | 301 → `http://tursoft.net/` |
| Response headers | `Server: cloudflare`, `Cache-Control: max-age=600`, no HSTS/CSP/X-Content-Type-Options |
| CV PDFs | 200 (1.36 MB detailed, 317 KB compact) |
| Built bundle | JS 869 KB raw / 251 KB gzip; CSS 134 KB / 25 KB; single chunks |
| `<img>` tags | 43, all with alt; 0 lazy, 0 width/height |
| Headings | 2 h1 (hero, 404 page), 9 h2, 21 h3, 13 h4 |
| Semantic landmarks | 1 main, 1 nav, 20 section, 0 header/footer/article |
| JSON-LD / schema.org / helmet | none |
| Data loading | `fetch(this.jsonPath)` in `BaseRepo.ts:22`, runtime |
| Portfolio initial render | 21 of 86 projects (`visibleMajorItemCount`) |
| Tracked assets | 2,580 files, 557 MB; 63 PDF/DOC/ZIP; largest file 50 MB MP4 |
| Bing `site:tursoft.net` | 10 results, none from the domain |
| Profile links | GitHub 200, Stack Overflow 200, LinkedIn 301, twitter.com 301 (x.com) |
| PageSpeed Insights API | quota exceeded; run manually at https://pagespeed.web.dev/ |
