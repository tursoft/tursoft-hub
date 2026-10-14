# Quiet Swiss Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the look and motion of tursoft.net on the approved "Quiet Swiss" design system (spec: `docs/superpowers/specs/2026-10-13-quiet-swiss-redesign-design.md`, reference mockup: `docs/superpowers/specs/assets/2026-10-13-quiet-swiss-mockup.html`) while keeping every section, view mode, filter and dialog working.

**Architecture:** One token/CSS layer (`src/index.css` + `tailwind.config.ts`) defines colours, type, surfaces and every component class. Pure logic (formatting, career stats, list filtering, motion maths) lives in `src/lib` and is unit-tested with vitest. A single shared `requestAnimationFrame` engine (`src/lib/motion/engine.ts`) drives the ambient backdrop, scroll skew, title drift and the ticker; small hooks expose it to components. Reusable presentational pieces live in `src/components/system`, and every section/dialog is rebuilt on top of them. Data models, repositories and JSON data are unchanged.

**Tech Stack:** React 18, TypeScript 5 (non-strict), Vite 5, Tailwind 3.4 + tailwindcss-animate, shadcn/Radix primitives, lucide-react 0.462, react-leaflet 4, vitest 3.2.7 (new, dev), `@fontsource-variable/geist` + `@fontsource-variable/geist-mono` 5.3.0 (new).

## Global Constraints

- Work on branch `feat/quiet-swiss-redesign` (worktree created at execution time). Never commit to `prod` or `main`.
- Feature parity: all 12 sections stay, in this order and with these ids: `hero`, `about`, `experience`, `domains`, `skills`, `portfolio`, `customers`, `references`, `education`, `map`, `timeline`, `contact`. ListViewer keeps view modes `small-card | card | list | carousel`, category filter, search and show-more. Experience and Education keep hover-to-expand (plus tap-to-expand on touch). Map keeps map/grid views, filters, maximise. Timeline keeps list/timeline views, filters, zoom. All 8 detail dialogs keep their logic and cross-links. CV downloads stay (compact + detailed from `src/data/cv.json`).
- Do not change files under `src/models` (except the two type fixes in Task 1), `src/repositories`, `src/data`, `public/`, or `src/pages/AmelBookPrivacy.tsx`.
- No new runtime dependencies other than `@fontsource-variable/geist@5.3.0` and `@fontsource-variable/geist-mono@5.3.0`. Dev dependency allowed: `vitest@3.2.7`.
- Colours (hex is the source of truth): background `#09090b`, surface `#0f0f12`, surface-2 `#17171b`, well `#f4f4f5`, line `#1f1f23`, line-strong `#2a2a30`, foreground `#fafafa`, muted text `#cdcdd4`, faint text `#94949f`, accent `#5ec8f2`, accent-deep `#0ea5e9`, success `#4ade80`. Entities: experience `#7cc4ff`, project `#5ec8f2`, education `#f5c66b`, customer `#f87b9b`, partner `#5fd6bd`.
- Fonts: Geist Sans (`"Geist Variable"`) for everything, Geist Mono (`"Geist Mono Variable"`) for labels, counts, meta, dates, eyebrows and the wordmark.
- Radii: cards 10px, controls/buttons/chips 6px, tags 5px, logo tiles 8px, light logo wells 6px, avatars 8px (square), dialogs 14px. No pill shapes.
- Container: 1120px content + 24px side padding (20px ≤ 640px). Section padding 96px (64px ≤ 640px). Breakpoints: 640 (phone), 1024 (tablet), 1180 (nav collapses to a menu button).
- Motion easing `cubic-bezier(0.2, 0.7, 0.2, 1)`. Every animation honours `prefers-reduced-motion: reduce` (no movement, all content visible). Cursor-driven effects (tilt, magnetic, lines, flashlight, spotlight) only on `(hover: hover) and (pointer: fine)`.
- Never put `will-change` or a resting `transform` on `<main>`: it would break `position: fixed` descendants (the maximised map).
- Copy: section eyebrows are `NN / label` in lowercase mono; titles and ledes exactly as listed in each task. Biographical paragraphs, project texts, testimonials and data are unchanged.
- Quality gates for every task (run from the repo root, all must pass before committing):
  - `npm run typecheck` → exits 0 with no errors
  - `npm run lint` → exits 0 with 0 errors (pre-existing warnings in untouched shadcn files are allowed)
  - `npm test` → all tests pass
  - `npm run build` → succeeds (takes about 2 minutes; the static-copy step copies ~3000 files)
- Commit after each task with a conventional message ending in the trailer line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Visual checks use `node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-NN http://localhost:5199/` against a running dev server (`npm run dev -- --port 5199 --strictPort`); it writes desktop (1440×900) and phone (390×844) screenshots plus a project-dialog and experience-hover capture (Task 18 adds a tablet pass and more dialogs). Always write screenshots under `.superpowers/`, which is git-ignored, so they are never committed; stop the dev server when the task is done.
- Bug fixes folded into this plan (keep them, they are intentional): the project dialog's Customers tab resolves client names/logos and its Partners tab matches partners by `partnerCode` (Task 15); partner projects match codes case-insensitively and a client without projects no longer shows stale ones (Task 17); an education opened from a skill resolves its institution (Task 16).

---

## File structure

```
src/index.css                         tokens, base, every component class, keyframes, Leaflet overrides   (Task 1)
tailwind.config.ts                    tokens → Tailwind colours/fonts/radii                               (Task 1)
vitest.config.ts                      unit-test runner (node env, @ alias)                                (Task 1)
src/lib/colors.ts                     entity colours + tag tones                                          (Task 1)
src/lib/format.ts                     numberToWords, plural, date/year range formatting                   (Task 2)
src/lib/career.ts                     career stats, spans, sorting                                        (Task 2)
src/lib/listview.ts                   ListViewer filtering/category helpers                               (Task 2)
src/lib/motion/math.ts                pure motion maths                                                   (Task 2)
src/lib/motion/engine.ts              shared rAF loop: pointer, scroll velocity, time                     (Task 3)
src/lib/motion/hooks.ts               media queries, useFrame, skew, drift, in-view, pointer effects      (Task 3)
src/lib/site.ts                       owner/contact constants, nav items, roles, career numbers           (Task 5)
src/lib/domains.ts                    per-domain project/company counts                                   (Task 10)
src/components/system/*              design-system components (see Tasks 3–5, 8, 9, 15)
src/components/*Section.tsx, */*      section components rebuilt on the system                            (Tasks 6–14)
src/components/*/*DetailDialog.tsx    dialogs re-skinned on DetailDialog                                  (Tasks 15–17)
docs/superpowers/tools/shoot.cjs      headless screenshot tool                                            (Task 1)
```

## Tasks

| # | File | Deliverable | Depends on |
|---|------|-------------|------------|
| 1 | [01-foundations.md](2026-10-14-quiet-swiss-redesign/01-foundations.md) | fonts, vitest, tokens, Tailwind, all component CSS, entity colours, clean gates | – |
| 2 | [02-pure-helpers.md](2026-10-14-quiet-swiss-redesign/02-pure-helpers.md) | `format`, `career`, `listview`, `motion/math` + tests | 1 |
| 3 | [03-motion-system.md](2026-10-14-quiet-swiss-redesign/03-motion-system.md) | engine, hooks, Reveal, CountUp, AmbientBackdrop | 2 |
| 4 | [04-ui-primitives.md](2026-10-14-quiet-swiss-redesign/04-ui-primitives.md) | restyled shadcn primitives + system atoms | 3 |
| 5 | [05-chrome.md](2026-10-14-quiet-swiss-redesign/05-chrome.md) | site constants, SiteNav + menu sheet, CvMenu, Footer, BackToTop, Index, 404 | 4 |
| 6 | [06-hero-ticker.md](2026-10-14-quiet-swiss-redesign/06-hero-ticker.md) | Hero + scroll-linked ticker band | 5 |
| 7 | [07-about.md](2026-10-14-quiet-swiss-redesign/07-about.md) | About section | 5 |
| 8 | [08-list-viewer.md](2026-10-14-quiet-swiss-redesign/08-list-viewer.md) | ListViewer, Carousel, QuoteCard; Skills, Projects, Clients, References, People sections | 5 |
| 9 | [09-experience.md](2026-10-14-quiet-swiss-redesign/09-experience.md) | Experience rail + expandable cards | 5 |
| 10 | [10-domains.md](2026-10-14-quiet-swiss-redesign/10-domains.md) | Domains grid with computed counts | 5 |
| 11 | [11-education.md](2026-10-14-quiet-swiss-redesign/11-education.md) | Education rail | 9 |
| 12 | [12-map.md](2026-10-14-quiet-swiss-redesign/12-map.md) | Footprint map restyle (dark tiles, pins, chips) | 5 |
| 13 | [13-timeline.md](2026-10-14-quiet-swiss-redesign/13-timeline.md) | Timeline restyle | 5 |
| 14 | [14-contact.md](2026-10-14-quiet-swiss-redesign/14-contact.md) | Contact section | 5 |
| 15 | [15-dialogs-a.md](2026-10-14-quiet-swiss-redesign/15-dialogs-a.md) | DetailDialog shell; Project + Experience dialogs | 8 |
| 16 | [16-dialogs-b.md](2026-10-14-quiet-swiss-redesign/16-dialogs-b.md) | Skill, Domain, Education dialogs | 15 |
| 17 | [17-dialogs-c.md](2026-10-14-quiet-swiss-redesign/17-dialogs-c.md) | Customer, Partner, People dialogs | 15 |
| 18 | [18-cleanup-verify.md](2026-10-14-quiet-swiss-redesign/18-cleanup-verify.md) | dead-code removal, full verification pass | all |

Tasks 6, 7, 9, 10, 12, 13 and 14 touch disjoint files and may run in parallel once Task 5 is merged; Task 8 must land before Tasks 15–17 (dialogs use the new ListViewer API).

## Shared interfaces (contract between tasks)

```ts
// src/lib/format.ts (Task 2)
export function numberToWords(n: number): string;                // 26 → "twenty-six", 0–99 only
export function capitalize(text: string): string;
export function plural(count: number, singular: string, pluralForm?: string): string; // "1 project", "2 projects"
export function formatMonthYear(value: string | null | undefined): string;            // "01.06.2023" → "Jun 2023"
export function formatMonthRange(start: string | null | undefined, end: string | null | undefined, presentLabel?: string): string; // "Jun 2023 — present"; "" without a start
export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string;  // "Jan 2012 — Mar 2014 · 2 yrs 2 mos"
export function formatYearRange(start: string | null | undefined, end: string | null | undefined, presentLabel?: string): string;  // "2015 — 2019" | "2015" | "2023 — now"
export function splitSummary(summary: string | null | undefined): string[];          // split on <br/>, trimmed, non-empty
export function stripHtml(html: string | null | undefined): string;                  // "a<br/>b" → "a b" (for one-line subtitles)

// src/lib/career.ts (Task 2)
export interface CareerStats { companies: number; positions: number; years: number; projects: number }
export interface Span { start: string; end: string | null }
export function careerYears(experiences: Experience[], now?: Date): number;
export function computeCareerStats(experiences: Experience[], projectCount: number, now?: Date): CareerStats;
export function sortPositionsDesc(positions: Position[]): Position[];
export function sortExperiencesDesc(experiences: Experience[]): Experience[];
export function experienceSpan(experience: Experience): Span | null;

// src/lib/listview.ts (Task 2)
export const ALL_CATEGORY = 'All';
export type FieldAccessor<T> = string | ((item: T) => string | null | undefined);
export function getFieldValue<T>(item: T, field?: FieldAccessor<T>): string;
export function buildCategories<T>(data: T[], field: FieldAccessor<T>, order?: string[]): string[];
export function countForCategory<T>(data: T[], field: FieldAccessor<T> | undefined, category: string): number;
export function filterItems<T>(data: T[], options: FilterOptions<T>): T[];

// src/lib/motion/math.ts (Task 2)
clamp, lerp, easeOutCubic, skewFromVelocity, driftOffset, linePush, lineWave, tiltFromPointer, magneticOffset, countUpValue, wrap

// src/lib/motion/engine.ts (Task 3)
export interface MotionState { pointerX; pointerY; targetX; targetY; pointerActive; scrollY; velocity; time; delta; width; height }
export function subscribeFrame(listener: (state: Readonly<MotionState>) => void): () => void;

// src/lib/motion/hooks.ts (Task 3)
useMediaQuery(query), usePrefersReducedMotion(), useFinePointer(), useFrame(listener, enabled?),
useScrollSkew(ref), useDrift(ref, amplitude), useInView(ref, { threshold?, once?, rootMargin? }),
useSurfacePointer(ref, { enabled?, tilt? }), useMagnetic(ref, enabled?), useExpandableCard(onOpen)

// src/components/system (default exports unless noted)
Reveal({ children, className?, index? })            CountUp({ end, suffix?, duration?, className? })
AmbientBackdrop()                                     Surface({ interactive?, tilt?, onActivate?, ...div props })  (forwardRef)
LogoTile({ src?, alt, size?, variant?: 'logo'|'logo-light'|'photo', className?, fallback? })
Tag({ tone?: 'quiet'|'accent'|'exp'|'proj'|'edu'|'cust'|'part'|'success', ...span props })
Chip({ selected?, count?, dotColor?, icon?, ...button props }) + named ChipRow
SegmentedControl<V>({ options: {value,label,icon}[], value, onChange, ariaLabel, className? })
SearchField({ value, onChange, placeholder?, className?, ariaLabel? })
StatTile({ value, label, suffix? }) + named StatGrid({ children, columns?: 3|4 })
Section({ id, children, className? })                SectionHeader({ index, label, title, lede? })
RailItem({ label, children, index? })                 Collapsible({ open, children })      ExpandHint({ expanded, onOpen })
ContactRow({ icon, label, value, href? })             CvMenu({ variant?, size?, className?, magnetic? })
SiteNav() Footer() BackToTop()                        Carousel<T>({ items, getKey, renderItem, ariaLabel, slideWidth? })
QuoteCard({ quote, name, role, date?, photo?, actions? })
DetailDialog({ open, onOpenChange, title, icon?, meta?, tags?, headerExtra?, children }) + named DetailHeading, DetailEmpty, DetailMeta, DetailRow, DetailRows

// src/components/ui/button.tsx (Task 4): variants default|secondary|outline|ghost|destructive|link, sizes default|sm|lg|icon|icon-sm, prop magnetic?: boolean
// src/components/ui/tabs.tsx (Task 4): underline TabsList/TabsTrigger + named TabCount({ children })
// src/components/ui/listviewer.tsx (Task 8): see Task 8 for ListViewerProps
```
