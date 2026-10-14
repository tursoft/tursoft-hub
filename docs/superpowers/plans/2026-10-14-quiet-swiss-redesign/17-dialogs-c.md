# Task 17: Customer, Partner and People dialogs

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first, then the **Re-skin rules** at the top of [Task 15](15-dialogs-a.md). Depends on Task 15 (`DetailDialog`).

**Files:**
- Modify: `src/components/customers/CustomerDetailDialog.tsx`
- Modify: `src/components/partners/PartnerDetailDialog.tsx`
- Modify: `src/components/people/PeopleDetailDialog.tsx`

**Interfaces:**
- Consumes: Task 2 `formatMonthRange`, `stripHtml`; Task 4 `Tabs*`/`TabCount`, `LogoTile`, `Tag`; Task 15 `DetailDialog`, `DetailEmpty`, `DetailHeading`, `DetailMeta`, `DetailRow`, `DetailRows`; the `.quote-text` class from Task 1.
- Produces: the same three dialogs with unchanged props:
  - `CustomerDetailDialog({ customer, isOpen, onClose, customerLogo?, companyTitle? })`
  - `PartnerDetailDialog({ partner, isOpen, onClose, partnerLogo?, companyTitle?, onOpenProject? })`
  - `PeopleDetailDialog({ person, isOpen, onClose })`

Client and partner logos sit in light wells (`variant="logo-light"`), the same as the Clients section. People get a square photo tile (`variant="photo"`).

---

### Customer dialog (`src/components/customers/CustomerDetailDialog.tsx`)

- [ ] **Step 1: Replace the imports**

Replace everything from the first line down to and including `import type { ProjectEntry } from '@/models/Project';` with:

```tsx
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Clock, Info, Wrench, Cog } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { referencesRepo } from '@/repositories/ReferencesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailHeading, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
import type { Customer } from '@/models/Customer';
import type { Company } from '@/models/Companies';
import type { Reference } from '@/models/Reference';
import type SkillItem from '@/models/Skills';
import type { ProjectEntry } from '@/models/Project';
```

- [ ] **Step 2: Delete the maximise state and dead helpers, and clear stale projects**

Delete:
- the line `  const [isMaximized, setIsMaximized] = useState(false);`;
- the never-read `technologyLogos` state: the line `  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});` and, in the skills effect (`// Fetch technology objects and logos when customer changes`), the line `const logos: Record<string, string> = {};`, the `if (skill.photoUrl) { logos[skillCode] = skill.photoUrl; }` block inside the loop, and the line `setTechnologyLogos(logos);` (keep `skillItems` and `setSkills`; leave the projects effect and `projectLogos` alone, the new markup uses them);
- the helpers `formatDate` and `formatPartnershipPeriod` with their `// Helper function …` comments: the header now uses `formatMonthRange`.

Nine clients have no `projectCodes`; opening one after a client with projects kept the previous client's project list in state. In the project-loading effect replace

```tsx
    if (customer?.projectCodes && customer.projectCodes.length > 0) {
      fetchProjects();
    }
  }, [customer?.projectCodes]);
```

with

```tsx
    if (customer?.projectCodes && customer.projectCodes.length > 0) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [customer?.projectCodes]);
```

- [ ] **Step 3: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={onClose}>` down to the matching `  );` before `};`) with:

```tsx
  const title = companyTitle || companyData?.title || customer.companyCode || customer.code;

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={customerLogo || companyData?.photoUrl} alt={title} size={52} variant="logo-light" />}
        title={title}
        meta={[
          customer.location ? (
            <>
              <MapPin aria-hidden="true" />
              {customer.location}
            </>
          ) : null,
          customer.partnership?.startDate ? (
            <>
              <Clock aria-hidden="true" />
              {formatMonthRange(customer.partnership.startDate, customer.partnership.endDate)}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="cust">customer</Tag>
            {customer.category && <Tag>{customer.category}</Tag>}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
              {customer.projectCodes && customer.projectCodes.length > 0 && (
                <TabCount>{customer.projectCodes.length}</TabCount>
              )}
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              {customer.skillCodes && <TabCount>{customer.skillCodes.length}</TabCount>}
            </TabsTrigger>
            <TabsTrigger value="services">
              <Cog aria-hidden="true" />
              Services
              {customer.serviceCodes && <TabCount>{customer.serviceCodes.length}</TabCount>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {customer.description && (
              <div
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: customer.description }}
              />
            )}

            {(customer.industry || customer.relationship) && (
              <div className="flex flex-wrap gap-1.5">
                {customer.industry && <Tag>{customer.industry}</Tag>}
                {customer.relationship && <Tag>{customer.relationship}</Tag>}
              </div>
            )}

            {customerReferences.length > 0 && (
              <div>
                <DetailHeading>testimonials · {customerReferences.length}</DetailHeading>
                <div className="detail-list">
                  {customerReferences.map((reference, index) => (
                    <figure key={index} className="py-4 first:pt-0">
                      <blockquote
                        className="quote-text text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: `“${reference.testimonial}”` }}
                      />
                      <figcaption className="mt-3 flex items-center gap-3">
                        <LogoTile src={reference.photoUrl} alt={reference.title} size={32} variant="photo" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-foreground">{reference.title}</div>
                          <div className="type-meta">
                            {reference.position} at {reference.company}
                          </div>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {customer.projectCodes && customer.projectCodes.length > 0 && projects.length > 0 && (
              <div>
                <DetailHeading>related projects · {projects.length}</DetailHeading>
                <DetailRows>
                  {projects.map((project) => (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsProjectDialogOpen(true);
                      }}
                    />
                  ))}
                </DetailRows>
              </div>
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

          <TabsContent value="services">
            {customer.serviceCodes && customer.serviceCodes.length > 0 ? (
              <DetailRows columns={2}>
                {customer.serviceCodes.map((serviceCode, index) => (
                  <DetailRow
                    key={`${serviceCode}-${index}`}
                    icon={<span className="h-[5px] w-[5px] shrink-0 rounded-[1px] bg-accent" aria-hidden="true" />}
                    title={serviceCode}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No service information available.</DetailEmpty>
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
        onOpenProject={(project) => {
          setSelectedProject(project);
          setIsProjectDialogOpen(true);
        }}
      />

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </>
  );
```

The title now falls back to the company's real name, so clients opened from the map (which passes no `companyTitle`) no longer show a raw code.

---

### Partner dialog (`src/components/partners/PartnerDetailDialog.tsx`)

- [ ] **Step 4: Replace the imports**

Replace everything from the first line down to and including `import type { ProjectEntry } from '@/models/Project';` with:

```tsx
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Globe, Linkedin, Info, FolderKanban } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailHeading, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange, stripHtml } from '@/lib/format';
import type { Partner } from '@/models/Partner';
import type { Company } from '@/models/Companies';
import type { ProjectEntry } from '@/models/Project';
```

- [ ] **Step 5: Delete the maximise state and dead code, and match projects regardless of case**

Delete:
- the line `  const [isMaximized, setIsMaximized] = useState(false);`;
- the unused line `  const [projects, setProjects] = useState<ProjectEntry[]>([]);` (the dialog lists `partnerProjects`);
- the `formatDate` helper with its `// Helper function to format dates` comment: project dates now use `formatMonthRange`.

Projects spell partner codes in mixed case ("Gnomon", "Promptly") while `partners.json` uses upper case, so every partner's Projects tab was empty. In the project-loading effect replace

```tsx
      const relatedProjects = allProjects.filter(
        project => project.partnerCodes?.includes(partner.partnerCode)
      );
```

with

```tsx
      const partnerCode = partner.partnerCode.toLowerCase();
      const relatedProjects = allProjects.filter((project) =>
        project.partnerCodes?.some((code) => code?.toLowerCase() === partnerCode),
      );
```

- [ ] **Step 6: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={onClose}>` down to the matching `  );` before `};`) with:

```tsx
  const title = companyTitle || companyData?.title || partner.companyCode;
  const location = [companyData?.city, companyData?.country].filter(Boolean).join(', ');

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={partnerLogo || companyData?.photoUrl} alt={title} size={52} variant="logo-light" />}
        title={title}
        meta={[
          location ? (
            <>
              <MapPin aria-hidden="true" />
              {location}
            </>
          ) : null,
        ]}
        tags={<Tag tone="part">partner</Tag>}
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban aria-hidden="true" />
              Projects
              {partnerProjects.length > 0 && <TabCount>{partnerProjects.length}</TabCount>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {partner.description && (
              <div>
                <DetailHeading>about the partnership</DetailHeading>
                <p className="text-sm leading-relaxed text-muted-foreground">{partner.description}</p>
              </div>
            )}

            {(companyData?.websiteUrl || companyData?.linkedinUrl) && (
              <div>
                <DetailHeading>partner information</DetailHeading>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                  {companyData.websiteUrl && (
                    <a
                      href={companyData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-quiet inline-flex items-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      Visit website
                    </a>
                  )}
                  {companyData.linkedinUrl && (
                    <a
                      href={companyData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-quiet inline-flex items-center gap-1.5"
                    >
                      <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                      LinkedIn profile
                    </a>
                  )}
                </div>
              </div>
            )}

            {!partner.description && !companyData?.websiteUrl && !companyData?.linkedinUrl && (
              <DetailEmpty>No partnership details available.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="projects">
            {partnerProjects.length > 0 ? (
              <div>
                <DetailHeading>collaborative projects · {partnerProjects.length}</DetailHeading>
                <DetailRows>
                  {partnerProjects.map((project) => (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      subtitle={stripHtml(project.summary)}
                      onClick={() => {
                        if (onOpenProject) {
                          onOpenProject(project);
                        } else {
                          setSelectedProject(project);
                          setIsProjectDialogOpen(true);
                        }
                      }}
                    >
                      <DetailMeta>
                        {formatMonthRange(project.datePeriod?.startDate, project.datePeriod?.endDate)}
                      </DetailMeta>
                    </DetailRow>
                  ))}
                </DetailRows>
              </div>
            ) : (
              <DetailEmpty>No projects found for this partnership yet.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </>
  );
```

---

### People dialog (`src/components/people/PeopleDetailDialog.tsx`)

- [ ] **Step 7: Replace the imports**

Replace everything from the first line down to and including `import type { Company } from '@/models/Companies';` with:

```tsx
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, Building2, FolderKanban, Mail, Phone, Globe, Linkedin } from "lucide-react";
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { stripHtml } from '@/lib/format';
import type { Person } from '@/models/People';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
```

- [ ] **Step 8: Delete the maximise state and list every experience**

Delete the line `  const [isMaximized, setIsMaximized] = useState(false);` and, inside `handleClose`, the line `    setIsMaximized(false);`.

Experience entries have no `code`, so de-duplicating by `exp.code` collapsed every experience into one and the Experiences tab only ever listed a single company. In the data-loading effect replace

```tsx
        // Remove duplicates based on experience code
        const uniqueExperiences = Array.from(
          new Map(personExperiences.map(exp => [exp.code, exp])).values()
        );
```

with

```tsx
        // Remove duplicates by company (experience entries carry no code)
        const uniqueExperiences = Array.from(
          new Map(personExperiences.map(exp => [exp.companyCode, exp])).values()
        );
```

- [ ] **Step 9: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` followed by `    <>` and `      <Dialog open={isOpen} onOpenChange={handleClose}>`, down to the matching `  );` before `};`) with:

```tsx
  const contactLinks =
    linkedinContact?.value || emailContact?.value || phoneContact?.value || websiteContact?.value ? (
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        {linkedinContact?.value && (
          <a
            href={linkedinContact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link-quiet inline-flex items-center gap-1.5"
          >
            <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
            LinkedIn
          </a>
        )}
        {emailContact?.value && (
          <a href={`mailto:${emailContact.value}`} className="link-quiet inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {emailContact.value}
          </a>
        )}
        {phoneContact?.value && (
          <a href={`tel:${phoneContact.value}`} className="link-quiet inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {phoneContact.value}
          </a>
        )}
        {websiteContact?.value && (
          <a
            href={websiteContact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link-quiet inline-flex items-center gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            Website
          </a>
        )}
      </div>
    ) : null;

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        icon={<LogoTile src={person.photoUrl} alt={person.title} size={52} variant="photo" />}
        title={person.title}
        meta={[
          person.company ? (
            <>
              <Building2 aria-hidden="true" />
              {person.company}
            </>
          ) : null,
        ]}
        tags={<Tag tone="accent">person</Tag>}
        headerExtra={contactLinks}
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
            {projects.length > 0 ? (
              <DetailRows>
                {projects.map((project) => {
                  const company = companies[project.companyCode || ''];
                  const teamMember = project.team?.find((member) => member.personCode === person.code);
                  return (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      subtitle={stripHtml(project.summary)}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsProjectDialogOpen(true);
                      }}
                    >
                      {(teamMember?.position || company) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {teamMember?.position && <Tag tone="accent">{teamMember.position}</Tag>}
                          {company && <Tag>{company.title}</Tag>}
                        </div>
                      )}
                    </DetailRow>
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No projects found.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="experiences">
            {experiences.length > 0 ? (
              <DetailRows>
                {experiences.map((experience) => {
                  const company = companies[experience.companyCode || ''];
                  // The person's roles on projects at this company.
                  const positions = [
                    ...new Set(
                      projects
                        .filter((project) => project.companyCode === experience.companyCode)
                        .map((project) => project.team?.find((member) => member.personCode === person.code)?.position)
                        .filter(Boolean),
                    ),
                  ];
                  return (
                    <DetailRow
                      key={experience.companyCode}
                      icon={
                        <LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={40} />
                      }
                      title={company?.title || experience.companyCode}
                      subtitle={positions.length > 0 ? positions.join(', ') : 'Team Member'}
                      onClick={() => {
                        setSelectedExperience(experience);
                        setIsExperienceDialogOpen(true);
                      }}
                    />
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No experiences found.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <ExperienceDetailDialog
        experience={selectedExperience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
      />

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
        projectIcon={selectedProject?.photoUrl}
      />
    </>
  );
```

- [ ] **Step 10: Confirm no dialog still uses the old pieces**

Run:

```bash
git grep -nE "isMaximized|DialogHeader|from \"@/components/ui/card\"|from '@/components/ui/card'" -- src/components/*/*DetailDialog.tsx
```

Expected: no output. (The project dialog's fullscreen screenshot viewer keeps `Dialog`/`DialogContent` on purpose.)

- [ ] **Step 11: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. Confirm nothing refers to removed code — both commands print nothing:

```bash
git grep -nE "isMaximized|technologyLogos|formatDate\b|formatPartnershipPeriod" -- src/components/customers/CustomerDetailDialog.tsx src/components/partners/PartnerDetailDialog.tsx src/components/people/PeopleDetailDialog.tsx
git grep -n "setProjects" -- src/components/partners/PartnerDetailDialog.tsx
```

- [ ] **Step 12: Visual check**

With the dev server running (`npm run dev -- --port 5199 --strictPort`), open `http://localhost:5199/` and check:
1. **Customer dialog** — in Clients, open "Ministry of Health" (any client tile works). Header: light logo well, company name, mono meta (city, "Mon YYYY — present"), tags "customer" and the category. Overview: description, industry and relationship tags, testimonials as 15px quotes with a square photo, then related-project rows that open the project dialog. Skills: two columns of rows that open the skill dialog. Services: rows with cyan square bullets. Open a client with projects, close it, then open one without projects: no related projects are shown.
2. **Partner dialog** — in Footprint, switch to the table, filter to partners and open "Gnomon" (or click its pin). The Projects tab now lists "ProEmpower - DM4All", and the row opens the project dialog.
3. **People dialog** — open the "Account Manager for Claude" project, Team tab, click a member. Header: square photo tile, company meta, "person" tag and quiet contact links. Projects rows show the role as an accent tag and the company as a quiet tag; Experiences rows open the experience dialog.
4. At 390px wide all three dialogs are full-screen sheets.

- [ ] **Step 13: Commit**

```bash
git add src/components/customers/CustomerDetailDialog.tsx src/components/partners/PartnerDetailDialog.tsx src/components/people/PeopleDetailDialog.tsx
git commit -m "feat(dialogs): re-skin customer, partner and people dialogs

Partner projects now match regardless of code case, a client without
projects no longer shows the previous client's project list, and the people
dialog lists every company instead of collapsing them into one.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
