# Site designs

The site has more than one design. Each design is an isolated folder of React components, pages and styles; every design reads the same JSON data, models, SEO and helpers. One setting picks the design that is built and deployed.

| Design | Folder | Look |
|---|---|---|
| `aurora` | `src/designs/aurora` | Midnight Aurora: dark indigo, violet to cyan accents, glass, ambient motion (the design live until November 2026) |
| `dossier` | `src/designs/dossier` | Dossier: warm paper, black ink, printer's red, Newsreader and Instrument Sans (rules in `dossier.md`) |

## Switching the design

The setting is `design` in `design.config.json` at the repo root:

```json
{ "design": "dossier" }
```

Change it by hand or with `npm run design -- use dossier`, commit, and push to `prod` as usual: the deploy workflow builds whatever the file names. `npm run design` lists the designs and shows which one builds.

Ways to override it without editing the file, in order of priority:

1. `SITE_DESIGN` environment variable for one command: `npm run build:dossier`, `npm run dev:aurora`, or `node scripts/design.mjs run dossier -- <any command>`.
2. In GitHub Actions, the repository variable `SITE_DESIGN` (Settings → Secrets and variables → Actions → Variables). When it is set, the deploy builds that design whatever the file says; delete it to go back to the file.

An unknown or incomplete design fails the build with a clear message, so a typo never deploys a broken site.

## How it works

- `scripts/design-resolve.cjs` reads `SITE_DESIGN` or `design.config.json`, checks the design folder, and is the one place every build step asks: `vite.config.ts`, `tailwind.config.ts` and `scripts/routes.mjs` (sitemap `lastmod` sources).
- `vite.config.ts` aliases `@design` to `src/designs/<name>`. `src/main.tsx` imports `@design/App` and `@design/index.css`, so only the chosen design is bundled. The `site-design` plugin puts the design's `head.html` (theme color, fonts) into `index.html`, adds `data-design="<name>"` to `<html>`, writes the design's colors from `design.json` into the deployed `manifest.webmanifest`, and prints the design at the start of every build.
- The root `tailwind.config.ts` loads the design's own `tailwind.config.ts` and scans only the shared code plus that design, so the other design's classes never reach the CSS.
- `import.meta.env.VITE_SITE_DESIGN` holds the design name at run time if code ever needs it.

## What is shared and what belongs to a design

Shared by every design (import with `@/…`):

- `src/data` (the JSON content), `src/content` (privacy policy Markdown), `src/assets` (photos, logos, screenshots)
- `src/models`, `src/repositories`, `src/hooks`
- `src/lib` (site identity and JSON-LD in `site.ts`, prerender and hydration helpers, dates, case studies)
- `src/shared/Seo.tsx` (titles, meta, canonical, JSON-LD for every route)
- `index.html`, `public/`, `scripts/` (prerender, sitemap, llms.txt)

Each design folder holds (import with `@design/…` inside the design):

- `App.tsx` (router and providers), `index.css`, `tailwind.config.ts`
- `components/` (sections, dialogs, shadcn UI primitives), `pages/`, and anything visual of its own (`styles/`, `lib/`)
- `design.json` (label, description, theme and background colors) and `head.html` (extra `<head>` tags)
- `tsconfig.json` (maps `@design` to this folder for the editor and `npm run typecheck`)

Rules that keep the designs isolated and the build working:

- A design never imports from another design. Shared code never imports a design, except types through `@design` (`src/hooks/use-toast.ts` does this for the toast types).
- Data fixes go into the shared files, never into a design.
- Every design keeps the contract the prerender step and SEO rely on: the same routes as `scripts/routes.mjs`, the homepage sections wrapped in `.section-boundary` and lazy pages in `.route-boundary` (React Suspense markers are added there), `Seo` on every page, the section ids used by links (`#about`, `#references`, …), and `useSnapshotState` for data the prerendered HTML must match.

## Adding a design

1. Copy a design folder: `src/designs/aurora` → `src/designs/<new>`.
2. Edit its `design.json`, `head.html` and `tsconfig.json` (the `@design` path), then restyle its components.
3. `npm run design` lists it; `npm run dev` with `SITE_DESIGN=<new>` (or `node scripts/design.mjs run <new> -- vite`) runs it.
4. Check with `npm run typecheck`, `npm run build:<new>`-style builds (`node scripts/design.mjs run <new> -- npm run build`) and `npm run verify:dist`.

## Checks

- `npm run typecheck`: type-checks every design against the shared code.
- `npm run build:aurora` / `npm run build:dossier` then `npm run verify:dist`: full build, prerender and page checks for one design.
