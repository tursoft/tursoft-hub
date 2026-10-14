# Task 6: Hero + ticker band

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Rewrite: `src/components/HeroSection.tsx`
- Create: `src/components/TickerBand.tsx`
- Modify: `src/pages/Index.tsx` (insert the ticker band after the hero)

**Interfaces:**
- Consumes: Task 2 `capitalize`, `numberToWords`, `wrap`; Task 3 `useFrame`, `usePrefersReducedMotion`; Task 4 `Button` (`magnetic`); Task 5 `CvMenu`, `CAREER`, `OWNER`, `ROLES`, `SOCIAL_LINKS`, `scrollToSection`; repositories `skillsRepo`, `companiesRepo`; `/data/customers.json`. CSS: `hero`, `hero-rise`, `hero-display`, `type-*`, `scroll-cue*`, `ticker*`.
- Produces: `HeroSection` (default, `<section id="hero">`) and `TickerBand` (default).

Copy (exact):
- Eyebrow: the existing typewriter cycling `ROLES`.
- Headline: `{Years in words, capitalised} years of building <em>enterprise & SaaS systems</em> that last.` — years come from `CAREER.years` (26 today, so "Twenty-six years …").
- Lede: `I lead R&D teams and architect cloud platforms that blend startup speed with enterprise reliability, from hospital information systems used nationally to AI-powered SaaS products.`
- Byline: `Available for new opportunities` and links GitHub · LinkedIn · Email · Phone.

---

- [ ] **Step 1: Rewrite `src/components/HeroSection.tsx`**

```tsx
import type { CSSProperties } from "react";
import profilePhoto from "@/assets/profile-photo.jpg";
import { Button } from "@/components/ui/button";
import Typewriter from "@/components/ui/typewriter";
import CvMenu from "@/components/system/CvMenu";
import { capitalize, numberToWords } from "@/lib/format";
import { CAREER, OWNER, ROLES, SOCIAL_LINKS, scrollToSection } from "@/lib/site";

const BYLINE_LINKS = [
  { label: "GitHub", href: SOCIAL_LINKS[0].href },
  { label: "LinkedIn", href: SOCIAL_LINKS[1].href },
  { label: "Email", href: `mailto:${OWNER.email}` },
  { label: "Phone", href: OWNER.phoneHref },
];

/** Start delay for one step of the staggered hero entrance. */
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

const HeroSection = () => (
  <section id="hero" className="hero">
    <div className="container-page">
      <p className="type-eyebrow hero-rise min-h-[1.4em]" style={delay(0.15)}>
        <Typewriter phrases={ROLES} />
      </p>

      <h1 className="type-display hero-display hero-rise mt-[18px] max-w-[820px]" style={delay(0.28)}>
        {capitalize(numberToWords(CAREER.years))} years of building <em>enterprise &amp; SaaS systems</em> that
        last.
      </h1>

      <p className="type-lede hero-rise mt-[22px] max-w-[600px] text-[16.5px]" style={delay(0.42)}>
        I lead R&amp;D teams and architect cloud platforms that blend startup speed with enterprise reliability, from
        hospital information systems used nationally to AI-powered SaaS products.
      </p>

      <div className="hero-rise mt-[30px] flex flex-wrap gap-2.5" style={delay(0.54)}>
        <Button magnetic onClick={() => scrollToSection("portfolio")}>
          View portfolio
        </Button>
        <CvMenu variant="secondary" magnetic />
      </div>

      <div
        className="hero-rise mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 text-[13px] text-muted-foreground"
        style={delay(0.66)}
      >
        <img
          src={profilePhoto}
          alt={OWNER.name}
          className="h-9 w-9 rounded-[8px] object-cover outline outline-1 outline-line-strong"
        />
        <span className="inline-flex items-center gap-2 font-mono text-xs">
          <span
            className="h-[7px] w-[7px] rounded-[2px] bg-success shadow-[0_0_0_3px_hsl(var(--success)/0.15)]"
            aria-hidden="true"
          />
          Available for new opportunities
        </span>
        <span className="hidden h-[18px] w-px bg-line-strong sm:block" aria-hidden="true" />
        <span className="flex flex-wrap gap-x-3.5 gap-y-1">
          {BYLINE_LINKS.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <a
                key={link.label}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            );
          })}
        </span>
      </div>

      <button
        type="button"
        className="scroll-cue hero-rise mt-14"
        style={delay(0.9)}
        onClick={() => scrollToSection("about")}
      >
        <span className="scroll-cue-line" aria-hidden="true" />
        scroll
      </button>
    </div>
  </section>
);

export default HeroSection;
```

- [ ] **Step 2: Create `src/components/TickerBand.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { skillsRepo } from "@/repositories/SkillsRepo";
import type { CustomerData } from "@/models/Customer";
import { useFrame, usePrefersReducedMotion } from "@/lib/motion/hooks";
import { wrap } from "@/lib/motion/math";
import { cn } from "@/lib/utils";

interface TickerItem {
  key: string;
  label: string;
  image?: string | null;
  /** Logos that need a light background to stay visible (client logos). */
  lightLogo?: boolean;
}

/** Copies of the item list laid side by side so the row never shows a gap while wrapping. */
const COPIES = 3;
/** How far a row slides per pixel of page scroll. */
const SCROLL_FACTOR = 0.35;

interface TickerRowProps {
  items: TickerItem[];
  /** 1: drifts left and slides right while scrolling down; -1: the opposite. */
  direction: 1 | -1;
  /** Idle drift speed in px per second. */
  speed: number;
}

function TickerRow({ items, direction, speed }: TickerRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const copyWidth = useRef(0);
  const phase = useRef(0);
  const hovered = useRef(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const measure = () => {
      copyWidth.current = copy.offsetWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [items]);

  useFrame((state) => {
    const row = rowRef.current;
    const width = copyWidth.current;
    if (!row || width === 0) return;
    if (!hovered.current) phase.current += state.delta * speed;
    const offset = direction * (state.scrollY * SCROLL_FACTOR - phase.current);
    row.style.transform = `translate3d(${(wrap(offset, width) - width).toFixed(1)}px, 0, 0)`;
  }, !reduce);

  return (
    <div
      ref={rowRef}
      className="ticker-row"
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      {Array.from({ length: COPIES }, (_, copyIndex) => (
        <div
          key={copyIndex}
          ref={copyIndex === 0 ? copyRef : undefined}
          className="ticker-copy"
          aria-hidden={copyIndex > 0 ? true : undefined}
        >
          {items.map((item) => (
            <span key={item.key} className="ticker-item">
              {item.image && (
                <img src={item.image} alt="" loading="lazy" className={cn(item.lightLogo && "ticker-logo-light")} />
              )}
              {item.label}
              <i className="ticker-sep" aria-hidden="true" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Two endless rows under the hero: major skills, then clients. They slide in opposite directions with scroll. */
export default function TickerBand() {
  const [rows, setRows] = useState<TickerItem[][]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [skills, response] = await Promise.all([skillsRepo.getList(), fetch("/data/customers.json")]);
        const customers = ((await response.json()) as CustomerData).items;
        const skillItems: TickerItem[] = skills
          .filter((skill) => skill.isMajor)
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((skill) => ({ key: skill.code, label: skill.title, image: skill.photoUrl }));
        const clientItems: TickerItem[] = await Promise.all(
          customers.map(async (customer) => {
            const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
            return {
              key: customer.code,
              label: company?.title ?? customer.companyCode ?? customer.code,
              image: company?.photoUrl,
              lightLogo: true,
            };
          }),
        );
        if (!cancelled) setRows([skillItems, clientItems]);
      } catch (error) {
        console.error("Failed to load ticker data:", error);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows.length === 0) return <div className="ticker min-h-[92px]" aria-hidden="true" />;

  return (
    <div className="ticker" role="region" aria-label="Core technologies and clients">
      <TickerRow items={rows[0]} direction={1} speed={24} />
      <TickerRow items={rows[1]} direction={-1} speed={20} />
    </div>
  );
}
```

- [ ] **Step 3: Insert the ticker band in `src/pages/Index.tsx`**

Add the import below the `HeroSection` import:

```tsx
import TickerBand from "@/components/TickerBand";
```

and render it directly after `<HeroSection />`:

```tsx
        <HeroSection />
        <TickerBand />
        <AboutSection />
```

- [ ] **Step 4: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 5: Visual check**

With the dev server running, run `node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-06 http://localhost:5199/`.
Expected in `desktop_00.png`: left-aligned hero — mono cyan eyebrow with a block caret, headline "Twenty-six years of building enterprise & SaaS systems that last." with the middle phrase in cyan, the lede, a white "View portfolio" button and a dark "Download CV" button, the byline (square portrait, green square dot, "Available for new opportunities", links), the "scroll" cue, and the ticker band (skill logos row above client logos row on light chips) at the bottom of the first screen. `mobile_00.png`: headline about 38px, buttons wrap, ticker below. In a real browser, scrolling down moves the two ticker rows in opposite directions, and hovering a row pauses its drift. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(hero): rebuild hero and add scroll-linked skills/clients ticker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
