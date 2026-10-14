# Task 11: Education section — year rail

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first. Depends on Task 9 (same rail and card pattern).

**Files:**
- Create: `src/components/educations/EducationCard.tsx`
- Rewrite: `src/components/educations/EducationSection.tsx`

**Interfaces:**
- Consumes: Task 2 `formatYearRange`; existing `parseDate`; Task 3 `useExpandableCard`, `Reveal`; Task 4 `Surface`, `LogoTile`, `Tag`, `Collapsible`, `ExpandHint`, `RailItem`, `Section`, `SectionHeader`; repositories `educationRepo`, `companiesRepo`; `/data/education.json` (`general.summary`); existing `EducationDetailDialog` (`education, isOpen, onClose, educationIcon?`).
- Produces: `EducationSection` (default, `<section id="education">`); `EducationCard` (default) and `type ProcessedEducation = Education & { companyName?: string; companyPhotoUrl?: string | null; companyCity?: string | null }`.

Behaviour: newest first on the same year rail as Experience (label from `datePeriod`). Compact card: university logo, edu-coloured level tag, department, university name in cyan, city. Expanded (hover/focus on desktop, tap on touch): graduation date and GPA, summary, up to 8 skill tags (+n). Desktop click / touch "details →" opens `EducationDetailDialog`. The old zig-zag layout, dashed centre line, `education-bg` texture and "Continuous Learning" card are gone; a single mono line replaces the card.

Copy (exact): `08 / education` — title `Where the <em>foundations</em> were laid.`; lede = `general.summary` from `education.json`; closing line `// continuous learning — courses, certifications and daily practice keep the toolbox current.`

---

- [ ] **Step 1: Create `src/components/educations/EducationCard.tsx`**

```tsx
import type { Education } from "@/models/Education";
import Collapsible from "@/components/system/Collapsible";
import ExpandHint from "@/components/system/ExpandHint";
import LogoTile from "@/components/system/LogoTile";
import Surface from "@/components/system/Surface";
import Tag from "@/components/system/Tag";
import { useExpandableCard } from "@/lib/motion/hooks";

export type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
};

interface EducationCardProps {
  education: ProcessedEducation;
  onOpen: () => void;
}

export default function EducationCard({ education, onOpen }: EducationCardProps) {
  const { expanded, fine, surfaceProps } = useExpandableCard(onOpen);
  const skills = education.skillCodes ?? [];
  const graduation = [
    education.graduateDate && `graduated ${education.graduateDate}`,
    education.graduateScore && `gpa ${education.graduateScore}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Surface interactive aria-expanded={expanded} className="mb-4 p-5 sm:p-6" {...surfaceProps}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <LogoTile src={education.companyPhotoUrl} alt={education.companyName ?? education.department} size={48} />
        <div className="min-w-0">
          <Tag tone="edu">{education.level}</Tag>
          <h3 className="mt-2 text-base font-medium leading-snug tracking-[-0.02em]">{education.department}</h3>
          <p className="mt-0.5 text-sm text-accent">{education.companyName}</p>
          {education.companyCity && <p className="type-meta mt-2">{education.companyCity}</p>}

          <Collapsible open={expanded}>
            {graduation && <p className="type-meta pt-3 text-muted-foreground">{graduation}</p>}
            {education.summary && (
              <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{education.summary}</p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {skills.slice(0, 8).map((code) => (
                  <Tag key={code}>{code}</Tag>
                ))}
                {skills.length > 8 && <Tag>+{skills.length - 8}</Tag>}
              </div>
            )}
          </Collapsible>

          {!fine && <ExpandHint expanded={expanded} onOpen={onOpen} />}
        </div>
      </div>
    </Surface>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/educations/EducationSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { educationRepo } from "@/repositories/EducationRepo";
import type { EducationData } from "@/models/Education";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import RailItem from "@/components/system/TimelineRail";
import { parseDate } from "@/lib/datetimeutils";
import { formatYearRange } from "@/lib/format";
import EducationCard, { type ProcessedEducation } from "./EducationCard";
import EducationDetailDialog from "./EducationDetailDialog";

const startTime = (education: ProcessedEducation) => parseDate(education.datePeriod?.startDate)?.getTime() ?? 0;

const EducationSection = () => {
  const [educations, setEducations] = useState<ProcessedEducation[]>([]);
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ProcessedEducation | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, response] = await Promise.all([educationRepo.getList(), fetch("/data/education.json")]);
        const data = (await response.json()) as EducationData;
        setSummary(data.general?.summary ?? "");
        const processed = await Promise.all(
          list.map(async (education) => {
            const company = await companiesRepo.getByCode(education.companyCode);
            return {
              ...education,
              companyName: company?.title,
              companyPhotoUrl: company?.photoUrl,
              companyCity: company?.city,
            };
          }),
        );
        setEducations(processed.sort((a, b) => startTime(b) - startTime(a)));
      } catch (error) {
        console.error("Failed to load education data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="education">
      <SectionHeader
        index="08"
        label="education"
        title={
          <>
            Where the <em>foundations</em> were laid.
          </>
        }
        lede={summary || undefined}
      />

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="surface h-[132px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {educations.map((education, index) => (
            <RailItem
              key={education.code}
              index={index}
              label={formatYearRange(education.datePeriod?.startDate, education.datePeriod?.endDate)}
            >
              <EducationCard education={education} onOpen={() => setSelected(education)} />
            </RailItem>
          ))}
        </div>
      )}

      <Reveal>
        <p className="type-meta mt-6">
          // continuous learning — courses, certifications and daily practice keep the toolbox current.
        </p>
      </Reveal>

      <EducationDetailDialog
        education={selected}
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        educationIcon={selected?.companyPhotoUrl ?? undefined}
      />
    </Section>
  );
};

export default EducationSection;
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

Screenshot the page and find `#education`: header "08 / education" with "Where the foundations were laid." ("foundations" muted) and the summary as lede; five cards on the year rail, newest first (2012 — 2013 at the top), each with logo, amber level tag, department, cyan university name and city. Hovering a card opens graduation/GPA, summary and skill tags. Below the list: the mono "// continuous learning — …" line.

- [ ] **Step 5: Commit**

```bash
git add src/components/educations/EducationCard.tsx src/components/educations/EducationSection.tsx
git commit -m "feat(education): rebuild education on the year rail with expandable cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
