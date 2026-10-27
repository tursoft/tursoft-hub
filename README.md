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

1. writes `dist/sitemap.xml` from `scripts/routes.mjs`;
2. writes `dist/llms-full.txt` (the whole site as Markdown for AI assistants) from `src/data/*.json`;
3. prerenders every route in `scripts/routes.mjs` with headless Chrome (Puppeteer) into
   `dist/<route>/index.html`, so the served pages contain the full content, per-route
   title, description, canonical, Open Graph tags and JSON-LD before any JavaScript runs.
   The build fails if a prerendered page is empty.

Useful commands:

- `npm run build:fast` – plain Vite build without prerendering (quick local check).
- `npm run prerender` – re-run only the postbuild step on an existing `dist/`.
- `npm run og-image` – regenerate `public/og-image.jpg` and `public/apple-touch-icon.png`
  from `scripts/og-image.html` (run after changing the photo, title or colours).

Where the SEO pieces live:

- Per-route head tags: `src/components/Seo.tsx` (react-helmet-async), used by `src/pages/*`.
- Identity facts, JSON-LD builders and the default title/description: `src/lib/site.ts`.
- Prerender mode (`?prerender=1`): `src/lib/prerender.ts`; `ListViewer`, `Reveal` and
  `AnimatedCounter` render their complete state in that mode.
- FAQ content (page section + FAQPage schema + llms.txt): `src/data/faq.json`.
- `public/robots.txt`, `public/llms.txt`, `public/manifest.webmanifest`.

Settings that live outside the repo (Cloudflare and search consoles) are listed in
`docs/report/seo-geo-report.md`, phase 0.
