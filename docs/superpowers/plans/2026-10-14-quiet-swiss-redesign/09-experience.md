# Task 9: Experience section — year rail with expandable company cards

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Create: `src/components/experiences/ExperienceCard.tsx`
- Rewrite: `src/components/experiences/ExperienceSection.tsx`

**Interfaces:**
- Consumes: Task 2 `experienceSpan`, `sortExperiencesDesc`, `sortPositionsDesc`, `Span`, `capitalize`, `numberToWords`, `formatMonthRange`, `formatYearRange`, `splitSummary`; existing `calculateDuration` from `src/lib/datetimeutils.ts` (returns e.g. "3 yrs 4 mos"); Task 3 `useExpandableCard`; Task 4 `Surface`, `LogoTile`, `Tag`, `Collapsible`, `ExpandHint`, `RailItem`, `StatTile`/`StatGrid`, `Section`, `SectionHeader`; Task 5 `CAREER`; existing `ExperienceDetailDialog` (`experience, isOpen, onClose, onOpenProject?`) and `ProjectDetailDialog` (`project, isOpen, onClose`).
- Produces: `ExperienceSection` (default, `<section id="experience">`); `ExperienceCard` (default) and `type CompanyEntry = { experience: Experience; company: Company | null; span: Span | null; positions: Position[] }`.

Behaviour:
- Companies are listed newest first on a year rail (label = `formatYearRange(span.start, span.end)`, e.g. "2022 — 2026" or "2023 — now").
- Compact card: logo, company name (+ cyan "current" tag while a position is open), location / Website / LinkedIn, and on the right the total duration and month range; every position title with its month range.
- Expanded (hover or keyboard focus on desktop, tap on touch): each position's description lines and up to 6 skill tags slide open. Desktop click opens `ExperienceDetailDialog`; on touch, "details →" opens it.
- Opening a project inside the experience dialog now opens `ProjectDetailDialog` (it did nothing before).

Copy (exact): `02 / experience` — title `{Companies in words, capitalised} companies, {years in words} years, <em>one thread:</em> systems that have to work.` (today: "Fourteen companies, twenty-six years, one thread: systems that have to work."); lede `A journey through enterprise software development, team leadership and architecture.` Stat labels: companies, positions, years (with "+"), projects.

---

- [ ] **Step 1: Create `src/components/experiences/ExperienceCard.tsx`**

```tsx
import type { MouseEvent } from "react";
import { MapPin } from "lucide-react";
import type { Company } from "@/models/Companies";
import type { Experience, Position } from "@/models/Experience";
import Collapsible from "@/components/system/Collapsible";
import ExpandHint from "@/components/system/ExpandHint";
import LogoTile from "@/components/system/LogoTile";
import Surface from "@/components/system/Surface";
import Tag from "@/components/system/Tag";
import type { Span } from "@/lib/career";
import { calculateDuration } from "@/lib/datetimeutils";
import { formatMonthRange, splitSummary } from "@/lib/format";
import { useExpandableCard } from "@/lib/motion/hooks";

export interface CompanyEntry {
  experience: Experience;
  company: Company | null;
  span: Span | null;
  positions: Position[];
}

/** Links inside the card must not also activate the card. */
const stopPropagation = (event: MouseEvent) => event.stopPropagation();

interface ExperienceCardProps {
  entry: CompanyEntry;
  onOpen: () => void;
}

export default function ExperienceCard({ entry, onOpen }: ExperienceCardProps) {
  const { expanded, fine, surfaceProps } = useExpandableCard(onOpen);
  const { experience, company, span, positions } = entry;
  const name = company?.title ?? experience.companyCode ?? "Company";
  const location = [company?.city, company?.country].filter(Boolean).join(", ");
  const current = span !== null && span.end === null;
  const duration = span ? calculateDuration([{ startDate: span.start, endDate: span.end }]) : "";

  return (
    <Surface interactive aria-expanded={expanded} className="mb-4 p-5 sm:p-6" {...surfaceProps}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[48px_minmax(0,1fr)_auto]">
        <LogoTile src={company?.photoUrl} alt={name} size={48} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium tracking-[-0.02em]">{name}</h3>
            {current && <Tag tone="accent">current</Tag>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {location}
              </span>
            )}
            {company?.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet"
                onClick={stopPropagation}
              >
                Website
              </a>
            )}
            {company?.linkedinUrl && (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet"
                onClick={stopPropagation}
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
        <div className="col-span-2 font-mono text-xs text-faint sm:col-span-1 sm:text-right">
          {duration && <b className="mr-2 font-medium text-foreground sm:mr-0 sm:block">{duration}</b>}
          {span && formatMonthRange(span.start, span.end)}
        </div>
      </div>

      {positions.map((position) => (
        <div key={`${position.title}-${position.startDate}`} className="mt-4 border-t border-line pt-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h4 className="text-[14.5px] font-medium">{position.title}</h4>
            <span className="font-mono text-xs text-faint">{formatMonthRange(position.startDate, position.endDate)}</span>
          </div>
          <Collapsible open={expanded}>
            <div className="space-y-2 pt-2 text-sm leading-relaxed text-muted-foreground">
              {splitSummary(position.summary).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            {position.skillCodes && position.skillCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {position.skillCodes.slice(0, 6).map((code) => (
                  <Tag key={code}>{code}</Tag>
                ))}
              </div>
            )}
          </Collapsible>
        </div>
      ))}

      {!fine && <ExpandHint expanded={expanded} onOpen={onOpen} />}
    </Surface>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/experiences/ExperienceSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { experienceRepo } from "@/repositories/ExperienceRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import RailItem from "@/components/system/TimelineRail";
import { experienceSpan, sortExperiencesDesc, sortPositionsDesc } from "@/lib/career";
import { capitalize, formatYearRange, numberToWords } from "@/lib/format";
import { CAREER } from "@/lib/site";
import ExperienceCard, { type CompanyEntry } from "./ExperienceCard";
import ExperienceDetailDialog from "./ExperienceDetailDialog";

const ExperienceSection = () => {
  const [entries, setEntries] = useState<CompanyEntry[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [experiences, projects] = await Promise.all([experienceRepo.getList(), projectsRepo.getList()]);
        const resolved = await Promise.all(
          sortExperiencesDesc(experiences).map(async (experience) => ({
            experience,
            company: experience.companyCode ? await companiesRepo.getByCode(experience.companyCode) : null,
            span: experienceSpan(experience),
            positions: sortPositionsDesc(experience.positions ?? []),
          })),
        );
        if (cancelled) return;
        setEntries(resolved);
        setProjectCount(projects.length);
      } catch (error) {
        console.error("Failed to load experiences:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section id="experience">
      <SectionHeader
        index="02"
        label="experience"
        title={
          <>
            {capitalize(numberToWords(CAREER.companies))} companies, {numberToWords(CAREER.years)} years,{" "}
            <em>one thread:</em> systems that have to work.
          </>
        }
        lede="A journey through enterprise software development, team leadership and architecture."
      />

      <StatGrid>
        <StatTile value={CAREER.companies} label="companies" />
        <StatTile value={CAREER.positions} label="positions" />
        <StatTile value={CAREER.years} suffix="+" label="years" />
        <StatTile value={projectCount} label="projects" />
      </StatGrid>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="surface h-[132px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {entries.map((entry, index) => (
            <RailItem
              key={entry.experience.companyCode ?? entry.experience.code ?? index}
              index={index}
              label={entry.span ? formatYearRange(entry.span.start, entry.span.end) : ""}
            >
              <ExperienceCard entry={entry} onOpen={() => setSelectedExperience(entry.experience)} />
            </RailItem>
          ))}
        </div>
      )}

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

export default ExperienceSection;
```

- [ ] **Step 3: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 4: Visual check**

With the dev server running, run the screenshot tool. Expected:
- `desktop_0x.png` showing `#experience`: header "02 / experience" with "Fourteen companies, twenty-six years, one thread: systems that have to work." ("one thread:" muted), four stat tiles, then the rail: mono year labels on the left ("2022 — 2026"), a cyan square dot on a hairline, and compact cards with logo, name, location/Website/LinkedIn, duration + month range on the right and position titles with month ranges.
- `desktop_hover_experience.png`: the hovered card is tilted slightly, its border glows near the cursor, and the position descriptions and skill tags are open.
- `mobile_*.png`: rail labels sit above each card, cards show "tap to expand".

- [ ] **Step 5: Commit**

```bash
git add src/components/experiences
git commit -m "feat(experience): rebuild experience as a year rail with expandable company cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
