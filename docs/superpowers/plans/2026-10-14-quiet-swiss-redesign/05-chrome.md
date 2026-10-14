# Task 5: Chrome — site constants, navigation + menu sheet, CV menu, footer, back-to-top, page shell, 404

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Create: `src/lib/site.ts`, `src/lib/site.test.ts`
- Create: `src/components/system/CvMenu.tsx`, `src/components/system/SiteNav.tsx`, `src/components/system/Footer.tsx`, `src/components/system/BackToTop.tsx`
- Rewrite: `src/pages/Index.tsx`, `src/pages/NotFound.tsx`
- Delete: `src/components/Navigation.tsx`

**Interfaces:**
- Consumes: Task 2 `computeCareerStats`; Task 3 `useScrollSkew`; Task 4 `Button`, dropdown menu; CSS classes `site-nav`, `site-nav-progress`, `nav-link`, `is-active`, `container-page`, `type-*`.
- Produces:
  - `src/lib/site.ts`: `OWNER { name, email, phone, phoneHref, website, websiteHref, location }`, `SOCIAL_LINKS` (`github`, `linkedin`, `twitter` with `label`, `href`), `CV_LINKS { compact, detailed }`, `NavItem`, `NAV_ITEMS`, `ROLES`, `CAREER: CareerStats` (projects = 0; companies/positions/years from `experiences.json`), `scrollToSection(id)`.
  - `CvMenu` (default): `{ variant?: ButtonProps["variant"]; size?: ButtonProps["size"]; className?: string; magnetic?: boolean }`.
  - `SiteNav`, `Footer`, `BackToTop` (default, no props).
  - `Index` renders, in order: `SiteNav`, `<main>` (scroll skew) with Hero, About, Experience, Domains, Skills, Portfolio, Customers, References, Education, Map, Timeline, Contact, Footer; then `BackToTop`. Task 6 inserts the ticker band after Hero.

---

- [ ] **Step 1: Write the failing test `src/lib/site.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import experiencesData from "@/data/experiences.json";
import { CAREER, CV_LINKS, NAV_ITEMS } from "./site";

describe("site constants", () => {
  it("links to every page section in page order", () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      "about",
      "experience",
      "domains",
      "skills",
      "portfolio",
      "customers",
      "references",
      "education",
      "map",
      "timeline",
      "contact",
    ]);
  });

  it("derives career numbers from experiences.json", () => {
    const items = experiencesData.items;
    expect(CAREER.companies).toBe(items.length);
    expect(CAREER.positions).toBe(items.reduce((total, item) => total + item.positions.length, 0));
    expect(CAREER.years).toBeGreaterThanOrEqual(26);
  });

  it("exposes both CV downloads", () => {
    expect(CV_LINKS.compact).toMatch(/\.pdf$/);
    expect(CV_LINKS.detailed).toMatch(/\.pdf$/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/site.test.ts`
Expected: FAIL — `Failed to resolve import "./site"`.

- [ ] **Step 3: Implement `src/lib/site.ts`**

```ts
import cvData from "@/data/cv.json";
import experiencesData from "@/data/experiences.json";
import type { Experience } from "@/models/Experience";
import { computeCareerStats } from "./career";

export const OWNER = {
  name: "Muhammet Turşak",
  email: "tursoft@gmail.com",
  phone: "+90 554 200 78 29",
  phoneHref: "tel:+905542007829",
  website: "tursoft.net",
  websiteHref: "https://tursoft.net",
  location: "Turkey",
} as const;

export const SOCIAL_LINKS = [
  { id: "github", label: "GitHub", href: "https://github.com/tursoft" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/tursoft/" },
  { id: "twitter", label: "Twitter", href: "https://twitter.com/muhammettursak" },
] as const;

export const CV_LINKS = {
  compact: cvData.general.compactDownloadUrl,
  detailed: cvData.general.downloadUrl,
} as const;

export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "domains", label: "Domains" },
  { id: "skills", label: "Skills" },
  { id: "portfolio", label: "Projects" },
  { id: "customers", label: "Clients" },
  { id: "references", label: "References" },
  { id: "education", label: "Education" },
  { id: "map", label: "Footprint" },
  { id: "timeline", label: "Timeline" },
  { id: "contact", label: "Contact" },
];

export const ROLES = [
  "Senior Software Architect",
  "Director of Technology",
  ".NET & Web Expert",
  "Cloud & SaaS Solution Builder",
];

/** Companies, positions and years from experiences.json (project counts are loaded where they are shown). */
export const CAREER = computeCareerStats((experiencesData as unknown as { items: Experience[] }).items, 0);

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/lib/site.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/components/system/CvMenu.tsx`**

```tsx
import { ChevronDown, Download, FileDown, FileText } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CV_LINKS } from "@/lib/site";

interface CvMenuProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  magnetic?: boolean;
}

const openInNewTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** "Download CV" button with a menu for the compact and detailed PDFs. */
export default function CvMenu({ variant = "default", size = "default", className, magnetic }: CvMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} magnetic={magnetic}>
          <Download aria-hidden="true" />
          Download CV
          <ChevronDown aria-hidden="true" className="opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => openInNewTab(CV_LINKS.compact)}>
          <FileDown aria-hidden="true" />
          Compact version
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openInNewTab(CV_LINKS.detailed)}>
          <FileText aria-hidden="true" />
          Detailed version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Create `src/components/system/SiteNav.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import profilePhoto from "@/assets/profile-photo.jpg";
import { Button } from "@/components/ui/button";
import { CV_LINKS, NAV_ITEMS, OWNER, scrollToSection } from "@/lib/site";
import { cn } from "@/lib/utils";
import CvMenu from "./CvMenu";

const openInNewTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** Id of the section currently crossing the upper third of the viewport. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState("hero");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -60% 0px", threshold: 0 },
    );
    ["hero", ...ids].forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/** Drives the 1px progress bar and reports whether the hero has been scrolled past. */
function useScrollProgress() {
  const progressRef = useRef<HTMLDivElement>(null);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      const hero = document.getElementById("hero");
      setPastHero(window.scrollY > (hero ? hero.offsetHeight - 120 : 400));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return { progressRef, pastHero };
}

/** Sticky top bar: wordmark, section links (≥1181px) or a full-screen menu, and the CV menu. */
export default function SiteNav() {
  const ids = useMemo(() => NAV_ITEMS.map((item) => item.id), []);
  const active = useActiveSection(ids);
  const { progressRef, pastHero } = useScrollProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);

  // From the menu sheet, scroll only after it has closed and released the scroll lock.
  const goTo = (id: string) => {
    if (menuOpen) {
      pendingTarget.current = id;
      setMenuOpen(false);
    } else {
      scrollToSection(id);
    }
  };

  return (
    <header className="site-nav">
      <div ref={progressRef} className="site-nav-progress" aria-hidden="true" />
      <div className="container-page flex h-[var(--nav-height)] items-center justify-between gap-6">
        <a
          href="#hero"
          className="group flex items-center gap-2.5 font-mono text-[13px] text-foreground"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <img
            src={profilePhoto}
            alt=""
            className={cn(
              "h-[26px] w-[26px] rounded-[6px] object-cover outline outline-1 outline-line-strong transition-[opacity,transform] duration-500 ease-smooth group-hover:-rotate-6 group-hover:scale-110",
              pastHero ? "opacity-100" : "-translate-x-1 opacity-0",
            )}
          />
          <span className="whitespace-nowrap">{OWNER.name}</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-[18px] min-[1181px]:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={cn("nav-link", active === item.id && "is-active")}
              onClick={(event) => {
                event.preventDefault();
                goTo(item.id);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CvMenu size="sm" className="hidden min-[1181px]:inline-flex" />

          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button variant="secondary" size="icon" className="h-[42px] w-[42px] min-[1181px]:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
              <DialogPrimitive.Content
                className="fixed inset-0 z-[81] flex flex-col overflow-y-auto px-6 pb-8 pt-[76px] focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
                onCloseAutoFocus={(event) => {
                  const target = pendingTarget.current;
                  if (!target) return;
                  event.preventDefault();
                  pendingTarget.current = null;
                  scrollToSection(target);
                }}
              >
                <DialogPrimitive.Title className="sr-only">Site menu</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Jump to a section or download the CV.
                </DialogPrimitive.Description>
                <DialogPrimitive.Close asChild>
                  <Button variant="secondary" size="icon" className="absolute right-6 top-2 h-[42px] w-[42px]" aria-label="Close menu">
                    <X />
                  </Button>
                </DialogPrimitive.Close>

                <nav aria-label="Sections" className="flex flex-col">
                  {NAV_ITEMS.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center justify-between border-b border-line py-3.5 text-[21px] font-medium tracking-[-0.02em] text-foreground"
                      onClick={(event) => {
                        event.preventDefault();
                        goTo(item.id);
                      }}
                    >
                      {item.label}
                      <span className="font-mono text-[11px] font-normal text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </a>
                  ))}
                </nav>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  <Button onClick={() => openInNewTab(CV_LINKS.compact)}>CV · Compact</Button>
                  <Button variant="secondary" onClick={() => openInNewTab(CV_LINKS.detailed)}>
                    CV · Detailed
                  </Button>
                  <Button variant="secondary" className="col-span-2" onClick={() => goTo("contact")}>
                    Get in touch
                  </Button>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Create `src/components/system/Footer.tsx`**

```tsx
import { OWNER, SOCIAL_LINKS } from "@/lib/site";

const FOOTER_LINKS = [
  ...SOCIAL_LINKS.filter((link) => link.id !== "twitter").map((link) => ({ label: link.label, href: link.href })),
  { label: "Email", href: `mailto:${OWNER.email}` },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center gap-3 py-9 text-center font-mono text-xs text-faint sm:flex-row sm:justify-between sm:text-left">
        <span className="text-[13px] text-muted-foreground">{OWNER.name}</span>
        <span>
          © {new Date().getFullYear()} · Senior Software Architect · <span className="text-success">●</span> available
        </span>
        <span className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="lowercase transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: Create `src/components/system/BackToTop.tsx`**

```tsx
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 700);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-5 right-5 z-40 h-11 w-11 transition-[opacity,transform] duration-300",
        visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp />
    </Button>
  );
}
```

- [ ] **Step 9: Rewrite `src/pages/Index.tsx`**

```tsx
import { useRef } from "react";
import SiteNav from "@/components/system/SiteNav";
import Footer from "@/components/system/Footer";
import BackToTop from "@/components/system/BackToTop";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/experiences/ExperienceSection";
import DomainsSection from "@/components/domains/DomainsSection";
import SkillsSection from "@/components/skills/SkillsSection";
import PortfolioSection from "@/components/projects/PortfolioSection";
import CustomersSection from "@/components/customers/CustomersSection";
import ReferencesSection from "@/components/references/ReferencesSection";
import EducationSection from "@/components/educations/EducationSection";
import MapSection from "@/components/map/MapSection";
import TimelineSection from "@/components/timeline/TimelineSection";
import ContactSection from "@/components/contact/ContactSection";
import { useScrollSkew } from "@/lib/motion/hooks";

const Index = () => {
  // Content leans slightly with scroll velocity; the transform is cleared at rest (never set will-change here).
  const mainRef = useRef<HTMLElement>(null);
  useScrollSkew(mainRef);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main ref={mainRef}>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <DomainsSection />
        <SkillsSection />
        <PortfolioSection />
        <CustomersSection />
        <ReferencesSection />
        <EducationSection />
        <MapSection />
        <TimelineSection />
        <ContactSection />
        <Footer />
      </main>
      <BackToTop />
    </div>
  );
};

export default Index;
```

- [ ] **Step 10: Rewrite `src/pages/NotFound.tsx`**

```tsx
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="container-page flex min-h-screen flex-col items-start justify-center gap-5 py-24">
      <p className="type-eyebrow">
        <span className="type-eyebrow-index">404</span>
        not found
      </p>
      <h1 className="type-display max-w-[16ch]">
        This page does not <em>exist.</em>
      </h1>
      <p className="type-lede max-w-md">
        Nothing lives at <span className="font-mono text-foreground">{location.pathname}</span>.
      </p>
      <Button asChild variant="secondary">
        <Link to="/">
          <ArrowLeft aria-hidden="true" />
          Back to home
        </Link>
      </Button>
    </main>
  );
};

export default NotFound;
```

- [ ] **Step 11: Delete the old navigation**

```bash
git rm src/components/Navigation.tsx
```

Confirm `git grep -n "components/Navigation" -- src` prints nothing.

- [ ] **Step 12: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 13: Visual check**

With `npm run dev -- --port 5199 --strictPort` running, run `node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-05 http://localhost:5199/`.
Expected in `desktop_00.png`: a 56px sticky bar with "Muhammet Turşak" in mono on the left, the 11 section links in the middle and a white "Download CV" button on the right. In `desktop_01.png`: the 26px square portrait has faded in next to the name and the 1px cyan progress line is visible at the very top. In `mobile_00.png`: only the name and a 42px menu button. Also open `http://localhost:5199/does-not-exist` and confirm the 404 page shows "This page does not exist." with a "Back to home" button. Stop the server.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(layout): add site navigation with menu sheet, CV menu, footer, back-to-top and 404 page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
