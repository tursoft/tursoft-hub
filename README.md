# Welcome to Muhammet Turşak's Website (v2025)

## How can I edit this code?

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS



## Todos

* remove highlight box on detail popups which initially selected
* remove dublicated fields from education detail popup

* add domain details page (projects, experiences)
* add skills detail page (years, experiencs, projects etc.)

* techs: sort
* projects: sort
* projects: show major items first, load minors on demand
* improve texts (project, experience, education etc.)
* fix project texts and linkds
* add language support (tr, en)
* auto translate texts, including reference texts etc.
* refactor json files and make relations more concrete

* improve map
* fix highlight animations
* add animation to switch between map & grid
* add animation to switch between card, list and carosel views
* use better design and animation for download cv button
* use better design and animation for map buttons

* store data in db and develop admin panel
* add missing relations between entities
experience => projects
experience => customers
project => customers
project => modules

* check and fix dates

* add photos of collegues
* add generic customers => vkbs => 80 tr hospitals
* add jengai customers
* add fonet customers
* add datasel customers
* add erc customers
* add halici customers
* add/relate halici projects

* improve texts, keep short
* add highlights to texts
* microsoft dynamics nav

* add more recent techs: kubernetes, docker, cloud, serverless, azure, google cloud, aws
* mark projects as major and minor
* mark customers as major and minor
* mark skills as major and minor


* sort skills
* reorganize skills carousel

* add certify.health => screenshots
* add gamyte => screenshots
* add jengai => screenshots
* add proempower => screenshots


# add projects for skills:
* pascal
* photohop
* html
* css
* js


# add new skills:
* flutter
* go


## Build, prerendering and SEO

`npm run build` runs `vite build` and then `scripts/postbuild.mjs`, which:

1. prunes files that are not part of the public site (old CVs, videos, downloads, .doc);
2. writes `dist/sitemap.xml` from `scripts/routes.mjs`, with hreflang alternates and a
   `lastmod` per page taken from the last git change of its sources;
3. writes `dist/llms-full.txt` (the whole site as Markdown for AI assistants) and stamps
   `dist/llms.txt` with its last-change date;
4. prerenders every route in `scripts/routes.mjs` with headless Chrome (Puppeteer) into
   `dist/<route>/index.html`, so the pages contain the full content, per-route title,
   description, canonical, hreflang, Open Graph tags and JSON-LD before any JavaScript runs.
   The build fails if a prerendered page is empty.

Routes: the homepage, `/case-studies/` and one page per entry in `src/data/case-studies.json`,
and the AmelBook privacy policy per language (`/privacy/amelbook/` is Turkish, the others
are `/privacy/amelbook/<lang>/`, see `src/content/privacy/amelbook/languages.json`).

### Hydration

Prerendered pages are hydrated, not re-rendered. During prerendering, data sections record
their final state through `useSnapshotState` (`src/hooks/use-snapshot-state.ts`); the build
embeds it inline or, when large, as a preloaded `state.json` next to the page. On load,
`src/main.tsx` waits for that state and calls `hydrateRoot`. The prerender step also adds
the markers React expects from server rendering (text separators and Suspense boundaries).
Rules that keep hydration exact:

- Any state that decides what a data section renders goes through `useSnapshotState` with a
  unique key (add a codec when it holds dates or components).
- Animated components start in their final state when `startsStatic` is true
  (`src/lib/prerender.ts`) and animate only after mount.
- Lists keep every item in the HTML; items past "Show all" render compact and hidden.

`npm run verify:dist` opens every built route in Chrome and checks metadata and errors.

### Performance notes

- Homepage sections use `content-visibility: auto`; jumps to a section must go through
  `scrollToSection` in `src/lib/section-settle.ts` so they land exactly.
- The skills cloud and the particle background animate only while visible; hero animations
  pause off screen; everything is static under reduced motion.
- The Leaflet map loads only when the map section nears the viewport.

### Commands

- `npm run build:fast` – plain Vite build without prerendering (quick local check).
- `npm run prerender` – re-run only the postbuild step on an existing `dist/`.
- `npm run verify:dist` – browser check of every prerendered route.
- `npm run og-image` – regenerate `public/og-image.jpg` and `public/apple-touch-icon.png`.
- `npm run images` – regenerate the WebP hero background and avatar from their JPEGs.

On Windows, if Puppeteer cannot download its Chrome, point it at an installed one:
`PUPPETEER_EXECUTABLE_PATH="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"`.

### Where the SEO pieces live

- Per-route head tags: `src/components/Seo.tsx` (react-helmet-async), used by `src/pages/*`.
- Identity facts and JSON-LD builders (Person, ProfilePage, FAQPage, Article, BreadcrumbList):
  `src/lib/site.ts`.
- FAQ content: `src/data/faq.json`; case studies: `src/data/case-studies.json`.
- `public/robots.txt`, `public/llms.txt`, `public/manifest.webmanifest`.

Settings that live outside the repo (Cloudflare, GitHub Pages, search consoles) are listed in
`docs/report/seo-geo-report-v3.md`.
