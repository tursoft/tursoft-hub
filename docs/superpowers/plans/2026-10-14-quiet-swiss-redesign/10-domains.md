# Task 10: Domains section with computed counts

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Create: `src/lib/domains.ts`, `src/lib/domains.test.ts`
- Rewrite: `src/components/domains/DomainsSection.tsx`

**Interfaces:**
- Consumes: Task 2 `plural`; Task 3 `Reveal`; Task 4 `Surface`, `LogoTile`, `Section`, `SectionHeader`; repositories `domainsRepo`, `projectsRepo`, `experienceRepo`; existing dialogs `DomainDetailDialog` (`domain, isOpen, onClose, onOpenExperience?, onOpenProject?`), `ExperienceDetailDialog`, `ProjectDetailDialog`.
- Produces: `countDomainUsage(domainCode, projects, experiences): DomainUsage` with `DomainUsage = { projects: number; companies: number }`; `DomainsSection` (default, `<section id="domains">`).

Copy (exact): `03 / domains` — title `Industries I have <em>built for.</em>`; lede `Specialized expertise across diverse industries and technology domains.` Each card: domain icon, title, mono "N projects · M companies" (singular for 1).

---

- [ ] **Step 1: Write the failing test `src/lib/domains.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import { countDomainUsage } from "./domains";

const project = (code: string, domainCodes: string[]): ProjectEntry => ({
  id: 0,
  code,
  orderIndex: 0,
  title: code,
  domainCodes,
});

const experience = (companyCode: string, positionDomains: string[][]): Experience => ({
  code: companyCode,
  orderIndex: 0,
  companyCode,
  positions: positionDomains.map((domainCodes) => ({
    title: "Engineer",
    startDate: "01.01.2000",
    endDate: null,
    summary: "",
    domainCodes,
  })),
});

describe("countDomainUsage", () => {
  const projects = [project("A", ["healthcareit"]), project("B", ["healthcareit", "elearning"]), project("C", [])];
  const experiences = [
    experience("DATASEL", [["healthcareit"], ["elearning"]]),
    experience("HALICI", [["elearning"]]),
    experience("ERC", [[]]),
  ];

  it("counts projects and companies that list the domain", () => {
    expect(countDomainUsage("healthcareit", projects, experiences)).toEqual({ projects: 2, companies: 1 });
    expect(countDomainUsage("elearning", projects, experiences)).toEqual({ projects: 1, companies: 2 });
  });

  it("returns zeros for an unused domain", () => {
    expect(countDomainUsage("gaming", projects, experiences)).toEqual({ projects: 0, companies: 0 });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/domains.test.ts`
Expected: FAIL — `Failed to resolve import "./domains"`.

- [ ] **Step 3: Implement `src/lib/domains.ts`**

```ts
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";

export interface DomainUsage {
  projects: number;
  companies: number;
}

/** How many projects, and how many companies (through any of their positions), list a domain. */
export function countDomainUsage(domainCode: string, projects: ProjectEntry[], experiences: Experience[]): DomainUsage {
  const projectCount = projects.filter((project) => project.domainCodes?.includes(domainCode)).length;
  const companies = new Set(
    experiences
      .filter((experience) => experience.positions?.some((position) => position.domainCodes?.includes(domainCode)))
      .map((experience) => experience.companyCode ?? experience.code),
  );
  return { projects: projectCount, companies: companies.size };
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/lib/domains.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `src/components/domains/DomainsSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { domainsRepo } from "@/repositories/DomainsRepo";
import { experienceRepo } from "@/repositories/ExperienceRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { Domain } from "@/models/Domain";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import ExperienceDetailDialog from "@/components/experiences/ExperienceDetailDialog";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import LogoTile from "@/components/system/LogoTile";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import Surface from "@/components/system/Surface";
import { countDomainUsage, type DomainUsage } from "@/lib/domains";
import { plural } from "@/lib/format";
import DomainDetailDialog from "./DomainDetailDialog";

type DomainWithUsage = Domain & DomainUsage;

const DomainsSection = () => {
  const [domains, setDomains] = useState<DomainWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [domainList, projects, experiences] = await Promise.all([
          domainsRepo.getList(),
          projectsRepo.getList(),
          experienceRepo.getList(),
        ]);
        setDomains(
          domainList
            .map((domain) => ({ ...domain, ...countDomainUsage(domain.code, projects, experiences) }))
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
      } catch (error) {
        console.error("Failed to load domains:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="domains">
      <SectionHeader
        index="03"
        label="domains"
        title={
          <>
            Industries I have <em>built for.</em>
          </>
        }
        lede="Specialized expertise across diverse industries and technology domains."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="surface h-[88px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain, index) => (
            <Reveal key={domain.code} index={index}>
              <Surface
                interactive
                onActivate={() => setSelectedDomain(domain)}
                className="flex h-full items-center gap-4 p-5"
              >
                <LogoTile src={domain.photoUrl} alt={domain.title} size={46} className="domain-tile" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium">{domain.title}</h3>
                  <p className="type-meta mt-0.5">
                    {plural(domain.projects, "project")} · {plural(domain.companies, "company", "companies")}
                  </p>
                </div>
              </Surface>
            </Reveal>
          ))}
        </div>
      )}

      <DomainDetailDialog
        domain={selectedDomain}
        isOpen={selectedDomain !== null}
        onClose={() => setSelectedDomain(null)}
        onOpenExperience={setSelectedExperience}
        onOpenProject={setSelectedProject}
      />
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
        onOpenProject={setSelectedProject}
      />
      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
    </Section>
  );
};

export default DomainsSection;
```

- [ ] **Step 6: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 7: Visual check**

Screenshot the page and find `#domains`: header "03 / domains", six cards in a 3-column grid (2 on tablet, 1 on phones), each with the domain icon in a dark tile, the title and a mono "N projects · M companies" line with real counts (none should read "0 projects · 0 companies" unless the data really has none). Hovering a card tilts it and rings the icon tile in cyan.

- [ ] **Step 8: Commit**

```bash
git add src/lib/domains.ts src/lib/domains.test.ts src/components/domains/DomainsSection.tsx
git commit -m "feat(domains): rebuild domains grid with computed project and company counts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
