# Dossier: design system for tursoft.net

Branch `template/dossier`. The site reads like a printed profile in a serious business magazine, or a consultant's bound dossier: warm paper, black ink, one red ink. It came out of an unslop review of the Midnight Aurora theme (gradient text, aurora blobs, glows, uppercase tracked labels, highlighted words). Method: the unslop skill in `.claude/skills/unslop/` (`SKILL.md`, `references/tokens.md`, `references/signs.md`); its rules apply in full.

## Direction

- **Product:** the personal site of Muhammet Turşak, an AI-enabled senior software architect in Ankara with 25+ years in enterprise software, read by CTOs, founders and hiring managers.
- **Character:** considered, plainspoken, senior.
- **World:** a printed magazine profile, a bound dossier. Paper, ink, rules, footnotes, captions.
- **Moments:** the printed portrait with its caption in the hero; serif pull quotes from clients in References. Elsewhere the content itself (figures, dates, names, project images) carries the page, set well.
- **Signature:** footnotes. Small red superscript numerals after claims, resolved in a footnote block. Used in the hero and on pull quotes only. Sections also carry printed numbers in the kicker ("09 References"), set by `SectionHeader`.

## Tokens (Tailwind classes, never raw hex)

| Role | Class | Value |
|---|---|---|
| Page paper | `bg-background` | #f7f4ee |
| Sheet (cards, dialogs, popovers) | `bg-card` | #fdfbf7 |
| Raised paper (hover, selected, tracks) | `bg-secondary`, hover step `bg-secondary-hover` | #efe9df |
| Ink, primary text | `text-foreground` | #1f1b16 |
| Secondary text | `text-muted-foreground` | #5e554a |
| Meta, captions, icons | `text-faint` | #6f665a |
| Hairline rule | `border-border` | ink at ~10% |
| Control edge | `border-input` | ink at ~20% |
| Ink rule (section openers, footnote rules) | `border-foreground` | ink |
| Printer's red | `bg-primary` / `text-primary`, hover `bg-primary-dark` | #b3261e |

Red is rare: the one primary button in a view, section numbers (SectionHeader does this), footnote numerals, and at most one key figure or the selected state in a section. No other hues in the chrome. `accent` is mapped to ink-2, so `text-accent` reads as grey ink: replace it with `text-muted-foreground` anyway. The legacy names (`primary-light`, `primary-glow`, `navy-deep`, gradient and glow shadow variables) are flattened so unconverted code stays on theme; remove them as you convert. Semantic `text-success` / `text-warning` only when they carry meaning. Data visualisations (map, timeline) may use a small muted set of category colors when each color means a category.

## Type

- `font-serif` (Newsreader 400/500): section titles (SectionHeader), quotes and pull quotes, dialog titles, large display figures. Never labels, buttons or body copy.
- `font-sans` (Instrument Sans): everything else. Weights 400 and 500; 600 only for rare emphasis. No `font-bold`, `font-extrabold`.
- Sentence case everywhere. No `uppercase` + `tracking-wide` labels: `CURRENT` becomes `Current`.
- No gradient text, no highlighted phrases inside paragraphs (`<span className="text-primary font-semibold">` becomes plain text), no italic for emphasis.
- Figures and dates use tabular numerals (`tnum` or `tabular-nums`) and one format.
- Small text never below 12px (11px only for dense meta on phones); no negative tracking on small text.

## Shared pieces (already built, do not edit; ask the lead for changes)

- `src/components/SectionHeader.tsx`: `<SectionHeader id="references" title="What colleagues say" description="…" aside={…} />`. Renders the ink rule, the red section number and label from `src/lib/sections.ts`, the serif `h2`, the description, and an optional right column (`aside`) for quiet meta and controls such as the view-mode switch.
- `src/components/ui/button.tsx`: `default` = red primary, `outline` = paper with ink edge, `secondary`, `ghost`, `link`. Sizes `sm` 36, `default` 40, `lg` 48. 4px radius, press scale 0.98.
- `src/components/ui/badge.tsx`: quiet labels on raised paper, 2px radius.
- CSS vocabulary in `src/index.css`: `.kicker` / `.kicker-num`, `.section-head` (SectionHeader), `.fn-ref` + `.footnote` + `.footnote-num` + `.footnote-rule` (footnotes), `.print-photo` (people photographs printed on the paper: warm greyscale, multiplied), `.ink-link` (text link in running copy), `.tnum`, `.hero-rise` (one entrance with `--rise-delay`), `Reveal` classes.
- `ease-dossier` timing class = cubic-bezier(0.22, 1, 0.36, 1).

## Section anatomy

```tsx
<section id="experience" className="py-16 lg:py-24">
  <div className="container">
    <SectionHeader id="experience" title="25+ years of enterprise software leadership" description="…" />
    {/* content */}
  </div>
</section>
```

- `container` only (no `mx-auto px-6`): 16 / 32 / 48px margins, 1440px max.
- Rewrite each gradient-split headline into one plain sentence-case headline that keeps its words and keywords ("Case Studies: AI Products and Architecture" becomes "AI products and architecture", with "Case studies" in the kicker). Keep every fact, item, feature, view mode, dialog, link and id.
- Rules over cards. Lists are rows divided by hairlines; groups sit in columns like a magazine page. A card (`rounded-lg border border-border bg-card`) only when the whole item is one click target; its hover is `hover:bg-secondary` or `hover:shadow-[var(--shadow-card-hover)]`, never a lift, scale or glow.
- Radius: controls `rounded-md` (4px), cards and dialogs `rounded-lg` (6px). No `rounded-xl/2xl/3xl`. `rounded-full` only for dots and small avatars.
- Icons: lucide, `h-4 w-4` with `strokeWidth={1.5}`, `text-faint` or the text role they sit with. No colored icon tiles or orbs; drop icons that only decorate a heading.
- People photos: square or round, `print-photo`, no rings or glows. Logos on a plain `bg-card` plate with a hairline.
- Spacing on the 4px grid (Tailwind steps). Inside a group smaller than between groups.

## Motion (the owner likes rich but tasteful motion)

- Keep: scroll reveal (`Reveal`), count-up figures, carousel swipe and keys, split-view transitions, dialog open/close, hover steps.
- Hover and focus: a 150ms color or surface step (`transition-colors duration-150 ease-dossier`). Buttons press to 0.98.
- Remove: `hover:scale`, `hover:-translate-y`, glow and shine sweeps, `animate-ping/pulse/bounce`, infinite loops, `animate-slide-in`/`animate-scale-in` leftovers.
- Respect `prefers-reduced-motion` (global rule already in index.css).

## Copy

Sentence case, no exclamation marks, no hype words, no emoji, labels without trailing periods. Do not invent facts; use only what the data files and existing copy say.

## Do not break

- Prerender and hydration: `useSnapshotState`, `isPrerender`, `startsStatic`, `.section-boundary`, `.lv-collapsed`. Server and client must render the same markup.
- The ListViewer API and its view modes, section ids, hash links, `scrollToSection`, SEO text meaning (h2/h3 content), JSON-LD. Data files stay untouched.
- No new dependencies: `node_modules` is a junction to the main checkout, never run `npm install`.
