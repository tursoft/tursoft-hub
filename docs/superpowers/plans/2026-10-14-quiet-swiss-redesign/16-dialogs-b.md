# Task 16: Skill, Domain and Education dialogs

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first, then the **Re-skin rules** at the top of [Task 15](15-dialogs-a.md). Depends on Task 15 (`DetailDialog`).

**Files:**
- Modify: `src/components/skills/SkillDetailDialog.tsx`
- Modify: `src/components/domains/DomainDetailDialog.tsx`
- Modify: `src/components/educations/EducationDetailDialog.tsx`

**Interfaces:**
- Consumes: Task 2 `formatMonthRange`, `formatPeriod`, `plural`; Task 4 `Tabs*`/`TabCount`, `LogoTile`, `Tag`/`TagTone`; Task 15 `DetailDialog`, `DetailEmpty`, `DetailMeta`, `DetailRow`, `DetailRows`.
- Produces: the same three dialogs with unchanged props:
  - `SkillDetailDialog({ skill, isOpen, onClose, onOpenExperience?, onOpenProject?, onOpenEducation? })`
  - `DomainDetailDialog({ domain, isOpen, onClose, onOpenExperience?, onOpenProject? })`
  - `EducationDetailDialog({ education, isOpen, onClose, educationIcon? })`

The skill and domain dialogs drop their list-mode `ListViewer`s for `DetailRows`, so every dialog lists related items the same way: a 40px logo tile, the title, a muted subtitle and a mono meta line ("Jan 2012 — Mar 2014 · 2 yrs 2 mos"). A row is clickable only when the caller passed the matching `onOpen…` handler; without one it renders as plain text instead of a dead link.

---

### Skill dialog (`src/components/skills/SkillDetailDialog.tsx`)

- [ ] **Step 1: Replace the imports**

Replace everything from the first line down to and including `import { parseDate, calculateDuration, type DateRange } from '@/lib/datetimeutils';` with:

```tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, Clock, FolderKanban, GraduationCap } from "lucide-react";
import type SkillItem from '@/models/Skills';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import type { Education } from '@/models/Education';
import DetailDialog, { DetailEmpty, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatPeriod } from '@/lib/format';
import { parseDate } from '@/lib/datetimeutils';
```

- [ ] **Step 2: Delete the maximise state**

Delete the line `  const [isMaximized, setIsMaximized] = useState(false);` and, inside `handleClose`, the line `    setIsMaximized(false);`.

- [ ] **Step 3: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={handleClose}>` down to the matching `  );` before `};`) with:

```tsx
  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      icon={<LogoTile src={logoPath} alt={skill.title} size={52} />}
      title={skill.title}
      meta={[
        totalExperience ? (
          <>
            <Clock aria-hidden="true" />
            {totalExperience} total experience
          </>
        ) : null,
      ]}
      tags={
        <>
          <Tag tone="accent">skill</Tag>
          {skill.group && <Tag>{String(skill.group)}</Tag>}
        </>
      }
    >
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            <FolderKanban aria-hidden="true" />
            Projects
            <TabCount>{projects.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="experiences">
            <Briefcase aria-hidden="true" />
            Experiences
            <TabCount>{experiences.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="educations">
            <GraduationCap aria-hidden="true" />
            Educations
            <TabCount>{educations.length}</TabCount>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {isLoadingData ? (
            <DetailEmpty>Loading projects…</DetailEmpty>
          ) : projects.length > 0 ? (
            <DetailRows>
              {projects.map((project) => (
                <DetailRow
                  key={project.code}
                  icon={<LogoTile src={project.photoUrl} alt={project.title} size={40} />}
                  title={project.title}
                  subtitle={companies[project.companyCode || '']?.title}
                  onClick={onOpenProject ? () => onOpenProject(project) : undefined}
                >
                  <DetailMeta>{formatPeriod(project.datePeriod?.startDate, project.datePeriod?.endDate)}</DetailMeta>
                </DetailRow>
              ))}
            </DetailRows>
          ) : (
            <DetailEmpty>No projects use this skill.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="experiences">
          {isLoadingData ? (
            <DetailEmpty>Loading experiences…</DetailEmpty>
          ) : experiences.length > 0 ? (
            <DetailRows>
              {experiences.map((experience) => {
                const company = companies[experience.companyCode || ''];
                const position = experience.positions?.[0];
                return (
                  <DetailRow
                    key={experience.code || experience.companyCode}
                    icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={40} />}
                    title={company?.title || experience.companyCode}
                    subtitle={position?.title}
                    onClick={onOpenExperience ? () => onOpenExperience(experience) : undefined}
                  >
                    <DetailMeta>{formatPeriod(position?.startDate, position?.endDate)}</DetailMeta>
                  </DetailRow>
                );
              })}
            </DetailRows>
          ) : (
            <DetailEmpty>No experiences use this skill.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="educations">
          {isLoadingData ? (
            <DetailEmpty>Loading education…</DetailEmpty>
          ) : educations.length > 0 ? (
            <DetailRows>
              {educations.map((education) => {
                const company = companies[education.companyCode || ''];
                const period =
                  formatPeriod(education.datePeriod?.startDate, education.datePeriod?.endDate) || education.period;
                return (
                  <DetailRow
                    key={education.code}
                    icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? education.companyCode ?? ''} size={40} />}
                    title={company?.title || education.companyCode}
                    subtitle={education.department}
                    onClick={onOpenEducation ? () => onOpenEducation(education) : undefined}
                  >
                    <DetailMeta>{[education.level, period].filter(Boolean).join(' · ')}</DetailMeta>
                  </DetailRow>
                );
              })}
            </DetailRows>
          ) : (
            <DetailEmpty>No education used this skill.</DetailEmpty>
          )}
        </TabsContent>
      </Tabs>
    </DetailDialog>
  );
```

---

### Domain dialog (`src/components/domains/DomainDetailDialog.tsx`)

- [ ] **Step 4: Replace the imports**

Replace everything from the first line down to and including `import { calculateDuration } from '@/lib/datetimeutils';` with:

```tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, FolderKanban } from "lucide-react";
import type { Domain } from '@/models/Domain';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import DetailDialog, { DetailEmpty, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatPeriod, plural } from '@/lib/format';
```

- [ ] **Step 5: Delete the maximise state**

Delete the line `  const [isMaximized, setIsMaximized] = useState(false);` and, inside `handleClose`, the line `    setIsMaximized(false);`.

- [ ] **Step 6: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={handleClose}>` down to the matching `  );` before `};`) with the code below. The domain code that used to sit under the title is an internal key and is no longer shown; the header now says how many projects and companies the domain covers, matching the domain cards (`experiences` holds one entry per company, filtered exactly like `countDomainUsage` in Task 10).

```tsx
  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      icon={<LogoTile src={logoPath} alt={domain.title ?? domain.code} size={52} className="domain-tile" />}
      title={domain.title || domain.code}
      meta={
        isLoadingData
          ? []
          : [
              <>
                <FolderKanban aria-hidden="true" />
                {plural(projects.length, 'project')}
              </>,
              <>
                <Briefcase aria-hidden="true" />
                {plural(experiences.length, 'company', 'companies')}
              </>,
            ]
      }
      tags={<Tag tone="accent">domain</Tag>}
    >
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            <FolderKanban aria-hidden="true" />
            Projects
            <TabCount>{projects.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="experiences">
            <Briefcase aria-hidden="true" />
            Experiences
            <TabCount>{experiences.length}</TabCount>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {isLoadingData ? (
            <DetailEmpty>Loading projects…</DetailEmpty>
          ) : projects.length > 0 ? (
            <DetailRows>
              {projects.map((project) => (
                <DetailRow
                  key={project.code}
                  icon={<LogoTile src={project.photoUrl} alt={project.title} size={40} />}
                  title={project.title}
                  subtitle={companies[project.companyCode || '']?.title}
                  onClick={onOpenProject ? () => onOpenProject(project) : undefined}
                >
                  <DetailMeta>{formatPeriod(project.datePeriod?.startDate, project.datePeriod?.endDate)}</DetailMeta>
                </DetailRow>
              ))}
            </DetailRows>
          ) : (
            <DetailEmpty>No projects found.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="experiences">
          {isLoadingData ? (
            <DetailEmpty>Loading experiences…</DetailEmpty>
          ) : experiences.length > 0 ? (
            <DetailRows>
              {experiences.map((experience) => {
                const company = companies[experience.companyCode || ''];
                // The position that worked in this domain, else the latest one.
                const position =
                  experience.positions?.find((item) => item.domainCodes?.includes(domain.code)) ??
                  experience.positions?.[0];
                return (
                  <DetailRow
                    key={experience.code || experience.companyCode}
                    icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={40} />}
                    title={company?.title || experience.companyCode}
                    subtitle={position?.title}
                    onClick={onOpenExperience ? () => onOpenExperience(experience) : undefined}
                  >
                    <DetailMeta>{formatPeriod(position?.startDate, position?.endDate)}</DetailMeta>
                  </DetailRow>
                );
              })}
            </DetailRows>
          ) : (
            <DetailEmpty>No experiences found.</DetailEmpty>
          )}
        </TabsContent>
      </Tabs>
    </DetailDialog>
  );
```

---

### Education dialog (`src/components/educations/EducationDetailDialog.tsx`)

- [ ] **Step 7: Replace the imports**

Replace everything from the first line down to and including `import type SkillItem from '@/models/Skills';` with:

```tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Building2, BookOpen, Clock, Info, Wrench } from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag, { type TagTone } from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Education } from '@/models/Education';
import type SkillItem from '@/models/Skills';
import type { Company } from '@/models/Companies';

/** Tag tone for a course grade: AA in green, BB in the education colour, anything else quiet. */
const scoreTone = (score: string): TagTone => (score === 'AA' ? 'success' : score === 'BB' ? 'edu' : 'quiet');
```

- [ ] **Step 8: Delete the maximise state and dead helpers, then resolve the institution**

Delete:
- the line `  const [isMaximized, setIsMaximized] = useState(false);`;
- the never-read `technologyLogos` state: the line `  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});` and, in the skills effect, the line `const logos: Record<string, string> = {};`, the `if (skill.photoUrl) { logos[skillCode] = skill.photoUrl; }` block inside the loop, and the line `setTechnologyLogos(logos);` (keep `skillItems` and `setSkills`);
- the helpers `formatDatePeriod`, `getGPAColor` and `getScoreBadgeColor` with their `// Helper function …` comments: the new markup uses `formatMonthRange`, the `highGrade` check and `scoreTone`.

The skills section opens this dialog with plain `Education` items that carry no institution name, logo or city. Add this state on the line after `  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);`:

```tsx
  const [company, setCompany] = useState<Company | null>(null);
```

and this effect directly after the skills effect (after the line `  }, [education?.skillCodes]);`, before `if (!education) return null;`):

```tsx
  // Education items opened from the skill dialog arrive without company details; look them up.
  useEffect(() => {
    let cancelled = false;
    setCompany(null);
    if (education?.companyCode && !education.companyName) {
      companiesRepo.getByCode(education.companyCode).then((result) => {
        if (!cancelled) setCompany(result);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [education?.companyCode, education?.companyName]);
```

- [ ] **Step 9: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={onClose}>` down to the matching `  );` before `};`) with:

```tsx
  const institution = education.companyName || company?.title || education.companyCode;
  const logo = educationIcon || education.companyPhotoUrl || company?.photoUrl;
  const city = education.companyCity || company?.city;
  const period =
    formatMonthRange(education.datePeriod?.startDate, education.datePeriod?.endDate) || education.period;
  const score = education.graduateScore || '';
  const highGrade = score.includes('AA') || score.includes('4.00') || parseFloat(score) >= 3.5;
  const facts: Array<{ label: string; value?: string | null; highlight?: boolean }> = [
    { label: 'degree level', value: education.level },
    { label: 'department', value: education.department },
    { label: 'institution', value: institution },
    { label: 'graduation date', value: education.graduateDate },
    { label: 'gpa / grade', value: score, highlight: highGrade },
    { label: 'location', value: city },
  ].filter((fact) => Boolean(fact.value));

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={logo} alt={institution || education.department} size={52} />}
        title={education.department}
        meta={[
          institution ? (
            <>
              <Building2 aria-hidden="true" />
              {institution}
            </>
          ) : null,
          period ? (
            <>
              <Clock aria-hidden="true" />
              {period}
            </>
          ) : null,
          city ? (
            <>
              <MapPin aria-hidden="true" />
              {city}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="edu">education</Tag>
            {education.level && <Tag>{education.level}</Tag>}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen aria-hidden="true" />
              Courses
              <TabCount>{education.courses?.length || 0}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{education.skillCodes?.length || 0}</TabCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-b border-line py-3.5">
                  <dt className="type-meta">{fact.label}</dt>
                  <dd className={cn('mt-1 text-[15px] font-medium', fact.highlight ? 'text-success' : 'text-foreground')}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </TabsContent>

          <TabsContent value="courses">
            {education.courses && education.courses.length > 0 ? (
              <DetailRows>
                {education.courses.map((course, index) => (
                  <DetailRow
                    key={`course-${index}`}
                    icon={<BookOpen className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />}
                    title={course.title}
                    subtitle={course.content ? `Topics: ${course.content}` : undefined}
                    clampSubtitle={false}
                    trailing={course.score ? <Tag tone={scoreTone(course.score)}>{course.score}</Tag> : undefined}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No detailed course information available.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="technologies">
            {skills.length > 0 ? (
              <DetailRows columns={2}>
                {skills.map((skill) => (
                  <DetailRow
                    key={skill.code}
                    icon={
                      skill.photoUrl ? (
                        <img src={skill.photoUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
                      ) : undefined
                    }
                    title={skill.title}
                    onClick={() => {
                      setSelectedSkill(skill);
                      setIsSkillDialogOpen(true);
                    }}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No technology information available.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />
    </>
  );
```

- [ ] **Step 10: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. Confirm nothing refers to removed code: `git grep -nE "isMaximized|technologyLogos|formatDatePeriod|getGPAColor|getScoreBadgeColor|ListViewer" -- src/components/skills/SkillDetailDialog.tsx src/components/domains/DomainDetailDialog.tsx src/components/educations/EducationDetailDialog.tsx` prints nothing.

- [ ] **Step 11: Visual check**

With the dev server running (`npm run dev -- --port 5199 --strictPort`), open `http://localhost:5199/` in a browser and check:
1. **Skill dialog** — click a skill tile (e.g. "C#"). Header: logo tile, title, mono "… total experience", tags "skill" and the group (e.g. "programming languages"). Projects, Experiences and Educations tabs list rows with 40px logos, a muted subtitle and a mono date line; clicking a project row opens the project dialog on top. Opened from inside a project dialog's Skills tab, the same rows are plain (no hover background, not focusable).
2. **Domain dialog** — click a domain card (e.g. "Healthcare IT"). Header meta reads "N projects · M companies" with the same numbers as the card; Experiences rows show the position that worked in that domain.
3. **Education dialog** — click an education card. Overview is a two-column list of mono labels and values with the grade in green; Courses rows show grade tags (AA green, BB amber); Skills rows open the skill dialog. Then open a skill's Educations tab from the skills section and click an education row: the education dialog now shows the institution name, logo and city.
4. At 390px wide every dialog is a full-screen sheet and the tab strip scrolls sideways.

- [ ] **Step 12: Commit**

```bash
git add src/components/skills/SkillDetailDialog.tsx src/components/domains/DomainDetailDialog.tsx src/components/educations/EducationDetailDialog.tsx
git commit -m "feat(dialogs): re-skin skill, domain and education dialogs

Lists use the shared detail rows; rows are only clickable when a handler
exists, and education opened from a skill now resolves its institution.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
