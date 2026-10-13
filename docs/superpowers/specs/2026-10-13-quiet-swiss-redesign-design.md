# Quiet Swiss redesign — design spec

Date: 2026-10-13 · Status: approved by Muhammet (direction B of the brainstorm) · Reference mockup: [assets/2026-10-13-quiet-swiss-mockup.html](assets/2026-10-13-quiet-swiss-mockup.html) (open it in a browser; its `/files/*` images only resolve inside the companion server, every CSS value and script in it is authoritative).

## 1. Goal

Replace the current "Midnight Aurora" look (indigo base, violet→cyan gradients, glass, particle canvas, per-card streaks) with the approved **Quiet Swiss** system: neutral near-black, one typeface family (Geist Sans + Geist Mono), one cyan accent, hairline borders, a designed ambient/motion layer, and strong hover/touch behaviour. The site must feel elegant and deliberately designed on desktop, tablet and phone.

### Constraints (decided in the brainstorm)

1. **Feature parity.** All 12 sections stay, in the same order. `ListViewer` keeps its four view modes (small-card, card, list, carousel), category filter, search and show-more. Experience and Education keep hover-to-expand (plus tap-to-expand on touch). Map keeps map/grid views, filters and maximise. Timeline keeps list/timeline views, filters and zoom. All eight detail dialogs keep their logic and cross-links. CV download menus stay.
2. **Rewrite, don't patch.** Section components and shared UI are written from scratch on the new system. Models, repositories, data JSON, dialog *logic* (data loading, tabs, nested dialogs) are kept and only re-skinned.
3. **Copy.** Section titles, one-line intros and the hero lines are rewritten (§7). Biographical facts, project texts, testimonials and all data files are untouched.
4. Two additions are allowed because the approved mockup has them: a **ticker band** under the hero and a **footer**.
5. The privacy page (`/privacy/amelbook`) keeps its own look; it must still render after the token change.

## 2. Design tokens

All tokens live in `src/index.css` as HSL triplets (shadcn convention) and are mapped in `tailwind.config.ts`. Hex values are the source of truth from the mockup; HSL conversions are given for the CSS variables.

### Colour

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--background` | `#09090b` | `240 10% 4%` | page |
| `--surface` (`--card`) | `#0f0f12` | `240 9% 6.5%` | cards, panels, inputs, nav |
| `--surface-2` (`--secondary`, `--muted`) | `#17171b` | `240 8% 10%` | tiles, active segmented item, hover fills |
| `--well` | `#f4f4f5` | `240 5% 96%` | light logo wells (clients, map pins) |
| `--line` (`--border`, `--input`) | `#1f1f23` | `240 6% 13%` | hairlines |
| `--line-strong` | `#2a2a30` | `240 7% 18%` | hover borders, dividers that must read |
| `--foreground` | `#fafafa` | `0 0% 98%` | text |
| `--muted-foreground` | `#cdcdd4` | `240 7% 82%` | secondary text, ledes, descriptions |
| `--faint` | `#94949f` | `240 5% 60%` | labels, meta, counts, placeholders |
| `--accent` (`--primary`, `--ring`) | `#5ec8f2` | `197 85% 66%` | accent text, underlines, dots, glow border |
| `--accent-deep` | `#0ea5e9` | `199 89% 48%` | glow colour only |
| `--success` | `#4ade80` | `142 69% 58%` | availability dot |
| `--destructive` | keep `0 70% 55%` | | |

Entity colours (replace values in `src/lib/colors.ts`, keep its exports): experience `#7cc4ff`, project `#5ec8f2`, education `#f5c66b`, customer `#f87b9b`, partner `#5fd6bd`. Tag tints are the colour at 8 % background / 25 % border.

No gradients anywhere except the ambient glows, the light sweeps and the hero `em` shine. No `--primary-glow`, `--navy-deep`, `text-gradient`, `glass` classes remain.

### Typography

- Fonts: **Geist Sans** (variable) for everything, **Geist Mono** (variable) for labels, counts, meta, dates, eyebrows and the wordmark. Self-hosted via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (both 5.3.0 on npm), imported once in `src/main.tsx`. Fallbacks: `Inter, system-ui, sans-serif` / `ui-monospace, Menlo, monospace`. Tailwind `fontFamily.sans` / `fontFamily.mono` point at them.
- Body: 15 px / 1.6 / letter-spacing −0.005em, antialiased.
- Display (hero h1): `clamp(40px, 5.2vw, 60px)`, weight 500, line-height 1.04, tracking −0.04em; 38 px on phones. `em` inside = weight 400, `--muted-foreground` colour (two-tone), no italics.
- Section title (h2): `clamp(26px, 3vw, 34px)`, 500, 1.15, −0.03em; `em` two-tone as above.
- Card title (h3): 16 px 500 −0.02em. Dialog title: 22 px 500 −0.03em. Panel title: 22 px.
- Lede: 15.5 px (16.5 in hero) / 1.65, muted. Card description: 13.5 px muted. Meta/labels: mono 12 px, faint, lowercase. Eyebrow: mono 12 px accent, lowercase, number in faint followed by ` /` (`02 / experience`). Stat number: 34 px 500 −0.04em tabular. Quote: 20 px / 1.5 / −0.02em, `em` in accent.
- All numbers that can change width use `font-variant-numeric: tabular-nums`.

### Shape, space, elevation

- Radius: cards 10 px, controls/buttons/chips/tags 6 px, logo tiles 8 px, logo wells 6 px, avatars 8 px (square, not round), dialog 14 px. No pills.
- Container 1120 px + 24 px side padding. Section padding 96 px top/bottom (64 px ≤ 640 px). Section header margin-bottom 44 px. Grid gaps 16 px (cards), 10 px (small tiles), 6–8 px (chips).
- Borders: 1 px `--line`; hover → `--line-strong`; focus → 2 px accent ring with 2 px offset.
- Shadows: dialog only (`0 40px 100px -30px rgba(0,0,0,.9)`); primary button hover `0 10px 30px -10px accent`.
- Motion easing `cubic-bezier(.2,.7,.2,1)`; durations 200 ms (colour/hover), 350 ms (tilt), 1 000 ms (reveal), 1 100 ms (hero entrance).

## 3. Ambient layer

`src/components/system/AmbientBackdrop.tsx` replaces `BackgroundAnimation.tsx`. Fixed, full-viewport, `z-index: 0`, `pointer-events: none`, rendered once in `App.tsx`. Layers, bottom to top:

1. **Glows** (wrapper `.glows`, moved by parallax): four blurred (100 px) radial discs at 70 % opacity. g1 70vw cyan `rgba(14,165,233,.26)` top-left, 60 s drift; g2 50vw indigo `rgba(99,102,241,.2)` right, 72 s; g3 48vw teal `rgba(45,212,191,.14)` bottom-centre, 76 s; g4 40vw violet `rgba(139,92,246,.12)` centre-right, 68 s. All `ease-in-out infinite alternate` with translate+scale keyframes as in the mockup.
2. **Halo**: 1100×460 px cyan ellipse behind the hero (`rgba(94,200,242,.2)`), breathing 9 s (opacity → .7, scale 1.06).
3. **Dot grid**: `radial-gradient(rgba(250,250,250,.09) 1px, transparent 1px)` 28 px, masked to a top ellipse (70 % × 50 % at 50 % 0, solid to 20 %, gone at 75 %).
4. **Hot dot grid**: same grid in `rgba(94,200,242,.55)`, masked by a 260 px circle at the (smoothed) cursor. The "flashlight".
5. **Lines canvas**: horizontal hairlines every 48 px, sampled every 10 px, scrolling with `0.25·scrollY mod 48`. Each point is pushed away from the cursor vertically by `34·exp(−d²/2R²)` (R = 170) and carries a wave `sin(x·0.012 + t·0.9 + y·0.01)·(1.5 + 10·ripple)` where `ripple = min(1, |scrollVelocity|/30)`. Base stroke `rgba(250,250,250,.045)`; lines within 2.2R of the cursor get a second stroke with a radial gradient `rgba(94,200,242,.55 → .18 → 0)` over 2R, width 1.2.
6. **Beams**: two 1 px vertical cyan gradients that cross the viewport left→right over 14 s (second delayed −7 s), fading in at 40 % and out at 70 %.
7. **Dust**: 34 particles, 1–3 px, accent colour with 6 px glow, each rising 140 px over 18–44 s with a random horizontal drift, opacity .15–.55, random negative delays.
8. **Grain**: SVG `feTurbulence` tile, opacity .06, stepped 4-frame jitter.

Behaviour: one `requestAnimationFrame` loop owns cursor smoothing (lerp .12), scroll velocity, glow parallax (`±20 px` from the cursor, `−0.06·scrollY`) and the canvas. Canvas DPR capped at 2. The loop pauses on `visibilitychange` hidden and when the tab is not intersecting (always is). On touch/coarse pointers the lines canvas and hot grid are not rendered. With `prefers-reduced-motion`: no loop, static glows, no dust/beams/grain jitter.

## 4. Motion system

Implemented as small hooks/components in `src/components/system/` and global CSS in `index.css`.

| Behaviour | Spec |
|---|---|
| **Reveal** (`<Reveal>` rewrite, class `rv`) | hidden: opacity 0, translateY 26 px, blur 6 px; shown: none. 1 s transition, delay `--i × 75 ms` for staggered children. Observer threshold .05; element re-hides when it leaves **below** the viewport (`rect.top > 0.9·vh`) so scrolling back down replays it. Direct children of each section container are reveal targets; children of grids, stats, timelines and the contact grid are staggered individually. |
| **Hero entrance** | hero children animate `rise` (opacity 0 → 1, translateY 22 px, blur 10 px) 1.1 s with delays .15/.28/.42/.54/.66/.9 s. The display `em` gets a one-shot-per-7 s white shine sweep (background-clip text). |
| **Scroll velocity skew** | `<main>` gets `skewY(clamp(vel·0.06, −2.2°, 2.2°))`, velocity smoothed .15, skew smoothed .2; cleared when |skew| < .02. |
| **Horizontal drift** | elements with `data-px` translateX by `−(centreProgress)·amp` where centreProgress ∈ [−.5, .5] is the element centre's position in the viewport; section titles amp 56, ledes −36. Off ≤ 1024 px. |
| **Ticker band** | two rows under the hero; row 1 `translateX(+0.35·scrollY)`, row 2 `−0.35·scrollY`; tracks also marquee via CSS (70 s / 84 s reverse), duplicated content for a seamless loop, paused on hover. Row 1 = major skills (`isMajor`) with logos, row 2 = customers with logos, both from the repositories (no hard-coded lists). |
| **Count-up** | every stat number counts 0 → n over 1.4 s (ease-out cubic) the first time it is ≥ 60 % visible; suffixes (`+`) preserved. Reuse/restyle `AnimatedCounter`. |
| **Section rule sweep** | each section (not hero) has a 260 px cyan gradient running along its top border, 11 s cycle, delay `−2.7 s × index`. |
| **Scroll cue / progress** | hero scroll cue line animates a moving highlight (2.6 s); nav progress line = scroll percentage, 1 px accent. |
| **Hover (fine pointer only)** | cards: `perspective(900px) rotateX(±2.5°) rotateY(±3°) translateY(−3px)` following the cursor + a 1 px glowing border (radial `rgba(94,200,242,.45)` at the cursor, masked to the border ring) + spotlight fill + logo scale 1.06. Buttons (primary, secondary, carousel arrows) are magnetic (`±5 px / ±4 px` toward cursor, −2 px lift). Chips lift 1 px with accent border; stat tiles lift 2 px and grow a 2 px accent top line; list rows reveal a `→` after the date; nav links grow an underline from the left; tabs/icon buttons/map pins/contact icons/segmented items have hover states; skill tiles scale the logo 1.14 and rotate −4°; domain tiles get a 5 px accent ring; wordmark avatar tilts. |
| **Touch (coarse pointer)** | no tilt/magnet/lines/flashlight; `:active` scales surfaces to .985; Experience/Education cards expand on tap (toggle) and show a mono "tap to expand" hint; carousels are swipeable (pointer events, 40 px threshold) and still have arrows on desktop; all tap targets ≥ 44 px on phones. |
| **Reduced motion** | every animation above is disabled; reveals render visible. |

## 5. Shared components

New, in `src/components/system/` (shadcn `ui/` primitives are kept where used and restyled: button, dialog, tabs, input, badge→Tag, tooltip, table, dropdown-menu).

- **SiteNav** — sticky, `rgba(9,9,11,.7)` + blur, hairline bottom, 56 px. Left: wordmark = 26 px square avatar + "Muhammet Turşak" in mono 13 px (replaces the floating name pill; the avatar fades in after the hero like today's pill, the name is always there). Centre: section links 12.5 px, active = accent underline (IntersectionObserver as today). Right: Download CV dropdown (primary sm) with Compact/Detailed. ≤ 1100 px: links and CV hide, a 42 px burger opens a full-screen **Sheet** (blurred ink background, 21 px links with mono numbers, Download CV + Get in touch buttons, close button). Progress line on top.
- **SectionHeader** — `eyebrow` (mono number + label), `title` (h2, `em` two-tone), optional `lede` on the right (grid 1.2fr/.8fr, stacked ≤ 1024). Applies `data-px` drift.
- **Surface** — card base: surface colour, hairline, 10 px radius, `overflow:hidden`. Variants `spot` (spotlight + tilt + glow border, for clickable cards) and `quiet` (static panels).
- **Tile** (logo on `--surface-2`, 8 px) and **LogoWell** (logo on `--well`, 6 px) with sizes 44/48/52/56 and `object-fit: contain`.
- **Chip** (filter: label + mono count; selected = `--surface-2` fill, strong border, fg text; optional 7 px square colour dot) and **Tag** (22 px, mono 11 px lowercase; variants accent, quiet, exp/proj/edu/cust/part).
- **StatTile** — surface, 34 px count-up number, mono lowercase label.
- **SegmentedControl** — 3 px padded surface, 32×30 icon items, active item `--surface-2` with inset ring; tooltips name the mode.
- **SearchField** — 38 px surface input with leading icon.
- **Ticker** (§4), **TimelineRail** (120 px year column in mono + 1 px rail + 7 px square accent dot with a 3.2 s ping), **Carousel** (flat: 1fr/1.25fr/1fr strip, side cards opacity .45 scale .96, 38 px square arrows, **ProgressBars** 22 px/34 px active instead of dots, swipe), **QuoteCard**, **ContactRow**, **Footer** (wordmark · "© year · Senior Software Architect · ● Available" · GitHub/LinkedIn/Email, stacked on phones).
- **Button** variants: `primary` (fg fill, bg text), `secondary` (surface + strong border), `ghost` (muted → fg); sizes sm 32, md 38, lg 44; `magnetic` prop.
- **DetailDialogShell** — used by all eight dialogs: surface, strong hairline, 14 px radius, dialog shadow, overlay `rgba(9,9,11,.7)` + blur. Header grid `52px / 1fr / auto`: Tile, title (22 px) + mono meta row with icons, maximise + close icon buttons (30 px). Tag row below the title. **Underline tabs** (accent 1 px, mono counts) instead of boxed tabs. Scrollable body 22/26 px padding. Lists inside dialogs are hairline-divided rows with 20–40 px logos; two-column lists (`mods`) keep the dashed→solid hairline pattern. Maximised = full screen, 0 radius.

**ListViewer** (`src/components/ui/listviewer.tsx`) is rewritten with the same props and modes:
- Controls: chip row → search + SegmentedControl on one line (mobile: chips scroll horizontally in one row, filter toggle button removed since chips fit; search full width above the switcher).
- `small-card`: Tile 42 px logo + 12 px label, major items brighter with an accent dot; grid 8/6/3 columns (desktop/tablet/phone).
- `card`: Tile 52 top-left, Tag top-right, title, mono meta (subtitle · date), 3-line description, bottom row of quiet tags (first skills + `+n`); grid 3/2/1.
- `list`: 52 px Tile, title + meta, description, mono date on the right (→ on hover); max-width 1120.
- `carousel`: flat 3-up as above, 1-up on phones.
- Show-more: secondary button "Show all (n)" / "Show less". Loading: 6 skeleton surfaces. Empty: mono message.

## 6. Sections

Order and ids unchanged: hero, (ticker), about, experience, domains, skills, portfolio, customers, references, education, map, timeline, contact, footer. Every data section keeps its repository calls and dialogs.

| Section | Layout and behaviour |
|---|---|
| **Hero** | Left-aligned, max 800 px. Eyebrow = mono accent with the existing Typewriter cycling the four roles (caret is a 7 px cyan block). Display headline (§7). Lede. Buttons: primary "View portfolio" (scrolls to #portfolio), secondary "Download CV ▾" dropdown. Byline: 36 px square portrait, mono "● Available for new opportunities", hairline separator, text links GitHub · LinkedIn · Email · Phone. Scroll cue. No background photo (`hero-bg.jpg` dropped), no badge pill, no bouncing mouse. |
| **Ticker** | §4. Hairline top/bottom, 16 px padding, 22 px logos, mono names, square accent separators. |
| **About** | Header. Two columns: "My journey" prose (keep the three paragraphs; highlights become plain `fg` weight 500 instead of coloured) + "Get in touch" quiet panel with ContactRows; right: "Positions" as a hairline list with mono indexes `01–04`. Below: four highlight StatTile-style surfaces with 16 px icons (keep the four items). |
| **Experience** | Header + four StatTiles (companies, positions, years, projects from data). TimelineRail list, newest first: card = Tile 48 (company logo) · company name 16 px · meta row (location, Website, LinkedIn links) · right column mono duration + date range. Positions as hairline-divided blocks: title 14.5 px 500 + mono date range; description paragraphs and quiet skill tags are hidden in the compact state and shown on hover (desktop) / tap (touch). "Current" = accent Tag. Click opens ExperienceDetailDialog (tap on touch toggles expand; a mono "details →" link in the expanded state opens the dialog). |
| **Domains** | Header (no lede). 3/2/1 grid of `spot` surfaces: 46 px round-cornered Tile with the domain icon, title, mono "n projects · n companies" computed from projects/experiences data. Click opens DomainDetailDialog. |
| **Skills** | ListViewer, default `small-card`, modes small-card/card/list, category chips, search, show-more 32. Major = brighter label + accent dot. |
| **Portfolio** | Header + three StatTiles (projects, categories, technologies = distinct skill codes across projects, not hard-coded). ListViewer card/list/carousel, default `card`, chips with counts, search, show-more 21. |
| **Customers** | Header + four StatTiles (customers, industries, countries = distinct company countries, years). ListViewer small-card/card/list/carousel with **LogoWell** images (light wells); default `small-card`, 6/4/2 columns. |
| **References** | Header. ListViewer carousel/card/list, default `carousel`; carousel item = QuoteCard (20 px quote with `em` highlights kept from the data's `<span>`s rendered as accent text, 44 px square portrait, name, mono "position at company · date", quiet icon buttons for the first three contacts). Footer CTA: "Want to add a reference?" + secondary button. |
| **Education** | Header. Same TimelineRail as Experience (single column, no zig-zag): level Tag (edu colour), department 16 px, university in accent, meta row (period, city) as mono; graduation/GPA, summary and skill tags appear on hover/tap. The "Continuous learning" card becomes a single mono line under the list. Dashed/overlapping layout and `education-bg.svg` are removed. |
| **Map** | Header. Row: four entity Chips with coloured dots and counts (left) + SegmentedControl map/grid (right). Surface with the Leaflet map: **CARTO Dark Matter** tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, attribution "© OpenStreetMap contributors © CARTO"), markers = 30 px LogoWell with a 2 px outline in the entity colour, hover scale 1.18; maximise button as a secondary sm button. Grid view = restyled Table (mono dates, entity Tags). |
| **Timeline** | Header. Row: category Chips (icons + counts) left; zoom out / "view: years" / zoom in + list/timeline SegmentedControl right. Timeline view: surface, mono year axis with a strong hairline, bars 22 px with 4 px radius in entity colours, 11.5 px labels in `--background` colour, hover brighten + 1 px lift, `title` tooltip kept. List view: TimelineRail rows with Tags. |
| **Contact** | Header (lede = existing sentence). Two columns: ContactRows (icon in a 38 px surface square, mono label, value) + a row of secondary sm social buttons; right: quiet panel "Ready to start a project?" with hairline list and one primary "Start a conversation" + ghost "CV · Compact" / "CV · Detailed". The availability card is dropped (the byline, footer and nav already say it). |
| **Footer** | New, §5. |

Index page keeps the back-to-top button (secondary icon button, bottom-right, appears after the hero). The fixed name pill is removed (its job moves to the nav wordmark).

## 7. Copy

| Where | New text |
|---|---|
| Hero eyebrow | typewriter roles unchanged |
| Hero headline | `Twenty-five years of building <em>enterprise & SaaS systems</em> that last.` |
| Hero lede | `I lead R&D teams and architect cloud platforms that blend startup speed with enterprise reliability, from hospital information systems used nationally to AI-powered SaaS products.` |
| 01 / about | `Leadership and architecture, <em>in equal measure.</em>` · lede: existing about sentence |
| 02 / experience | `Fourteen companies, twenty-six years, <em>one thread:</em> systems that have to work.` (numbers rendered from data) · lede: `A journey through enterprise software development, team leadership and architecture.` |
| 03 / domains | `Industries I have <em>built for.</em>` |
| 04 / skills | `The toolbox, from <em>.NET to Kubernetes.</em>` · lede: existing skills sentence |
| 05 / projects | `Selected work across <em>healthcare, construction and AI.</em>` · lede: existing portfolio sentence |
| 06 / clients | `Organisations that <em>trusted the work.</em>` · lede: existing customers sentence |
| 07 / references | `In <em>colleagues' words.</em>` · lede: existing references sentence |
| 08 / education | `Where the <em>foundations</em> were laid.` · lede: `general.summary` from education.json |
| 09 / footprint | `Where the work has <em>taken me.</em>` · lede: existing map sentence |
| 10 / timeline | `The whole journey <em>on one axis.</em>` · lede: existing timeline sentence |
| 11 / contact | `Let's build something <em>that lasts.</em>` · lede: existing contact sentence |
| Nav labels | About · Experience · Domains · Skills · Projects · Clients · References · Education · Footprint · Timeline · Contact |
| 404 | mono `404 / not found`, title `This page does not exist.`, secondary button "Back to home" |

Eyebrow labels are lowercase mono (`02 / experience`); nav labels keep capitals.

## 8. Responsive rules

- Breakpoints: 640 (phone), 1024 (tablet), 1100 (nav collapse).
- ≤ 1024: 2-column card grids, 6-column small tiles, 4-column wells, stacked section headers and contact, timeline rail 96 px, horizontal drift off.
- ≤ 640: 1-column cards, 3-column small tiles, 2-column wells, 2×2 stats, section padding 64, hero display 38 px, buttons 44 px, chips 38 px, segmented items 42×38, search 44; timeline rail hidden (year label above each card); experience card logo 44 px with the duration under the title; carousel 1-up without arrows (swipe + bars); dialog header 44 px tile, tabs scroll horizontally, single-column module lists; footer stacked; map 240 px tall.
- Chips rows scroll horizontally on phones instead of wrapping into many lines.

## 9. Accessibility and performance

- Contrast: muted text ≥ 4.5:1, labels ≥ 3:1 on `#09090b`/`#0f0f12`.
- Keyboard: all clickable surfaces are buttons or have `role="button"` + `tabIndex`; visible focus ring (2 px accent, 2 px offset); sheet traps focus and closes on Escape; segmented controls are `role="radiogroup"`.
- `prefers-reduced-motion` honoured everywhere (§3, §4).
- One rAF loop for cursor/scroll/canvas; transforms and opacity only; passive listeners; IntersectionObservers for reveals/counters/nav; canvas work skipped when the cursor is off-screen and on touch devices; fonts preloaded (`<link rel="preload">` is emitted by fontsource CSS imports via Vite; verify in the build).
- Bundle: no new runtime dependencies beyond the two font packages.

## 10. Files

Remove: `src/components/BackgroundAnimation.tsx`, `src/App.css` (unused), `src/assets/hero-bg.jpg` usage, `public/assets/backgrounds/education-bg.svg` usage, all `glass`, `aurora`, `portfolio-*`, `btn-shine`, `text-gradient*`, `gradient-*`, `bg-grid`, `education-bg` CSS. Rewrite: `index.css`, `tailwind.config.ts`, `App.tsx`, `pages/Index.tsx`, `pages/NotFound.tsx`, `components/Navigation.tsx` → `system/SiteNav.tsx`, `components/HeroSection.tsx`, `AboutSection.tsx`, every `components/<entity>/*Section.tsx`, `ui/listviewer.tsx`, `ui/reveal.tsx`, `ui/animated-counter.tsx`, `ui/typewriter.tsx` (caret style), `ui/button.tsx`, `ui/badge.tsx`, `ui/dialog.tsx`, `ui/tabs.tsx`, `ui/input.tsx`, `ui/table.tsx`, `lib/colors.ts`. Re-skin (logic kept): the eight `*DetailDialog.tsx` files via `DetailDialogShell`. Add: `components/system/*` (§5), `components/TickerSection.tsx`, `components/Footer.tsx`.

## 11. Verification

1. `npm run lint` and `npm run build` pass; `npm run dev` serves the site with no console errors.
2. Headless screenshot pass (the brainstorm's `shoot.cjs` approach, kept at `docs/superpowers/tools/shoot.cjs`) at 1440×900, 1024×768 and 390×844: every section, every ListViewer mode, the open project/experience/skill dialogs, the mobile sheet. Reviewed against the mockup.
3. Manual checklist: each view mode in each ListViewer section; filters + search + show-more; experience/education hover (desktop) and tap (touch emulation) expand; carousel swipe; dialogs open from every entry point (section, map marker, map row, timeline item, nested dialog links) and maximise; map filters/views/maximise; timeline filters/zoom/views; CV downloads from nav, hero, sheet and contact; back-to-top; privacy page unchanged.
4. Reduced-motion emulation: no animation, all content visible.
5. Keyboard pass through nav, chips, segmented controls, cards and dialogs.

## 12. Out of scope

Light theme, new content or data changes, i18n, changes to the privacy page design, SEO/meta changes, analytics.
