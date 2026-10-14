# Task 15: Detail dialog shell + Project and Experience dialogs

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first. Depends on Task 8 (the new ListViewer is used inside the Project dialog).

**Files:**
- Create: `src/components/system/DetailDialog.tsx`
- Modify: `src/components/projects/ProjectDetailDialog.tsx`
- Modify: `src/components/experiences/ExperienceDetailDialog.tsx`

**Interfaces:**
- Consumes: Task 1 CSS (`detail-dialog*`, `detail-heading`, `detail-empty`, `detail-row`, `detail-list`, `detail-grid-2`); Task 4 `Button`, `Tabs*`/`TabCount`, `LogoTile`, `Tag`.
- Produces (used by Tasks 16–17):
  - `DetailDialog` (default): `{ open: boolean; onOpenChange(open: boolean): void; title: ReactNode; icon?: ReactNode; meta?: ReactNode[]; tags?: ReactNode; headerExtra?: ReactNode; children: ReactNode }`. Owns the maximise state (reset on close); phones get a full-screen sheet without the maximise button.
  - `DetailHeading({ children })` — mono lowercase section label inside a tab.
  - `DetailEmpty({ children })` — centred mono empty/loading message.
  - `DetailMeta({ children })` — mono meta line inside a row (dates, durations); renders nothing when empty.
  - `DetailRow({ icon?, title, subtitle?, clampSubtitle = true, trailing?, onClick?, children? })` — list row; with `onClick` it is a keyboard-accessible `div role="button"` (so rows can contain their own links).
  - `DetailRows({ columns = 1 | 2, children })` — hairline-separated list (`detail-list`) or two-column grid (`detail-grid-2`).
- Dialog props are unchanged, so every caller keeps working.

### Re-skin rules (apply to every dialog in Tasks 15–17)

1. The old `<Dialog>` + `<DialogContent>` + absolutely positioned logo + `DialogHeader` + maximise button + floating type badges are replaced by one `<DetailDialog …>` (exact props given per dialog). Its `onOpenChange` is `(open) => { if (!open) close(); }` where `close` is what the old `onOpenChange` called.
2. Delete the dialog's own `isMaximized` state and every use of it; where a class depended on it, keep the non-maximised class.
3. Nested detail dialogs that were rendered inside the old `<Dialog>` root move after `</DetailDialog>`; the component returns a fragment `<> … </>`.
4. `Tabs` and `TabsList` get no `className`. Each trigger becomes `<Icon aria-hidden="true" />Label<TabCount>{n}</TabCount>` (no wrapping span, no `Badge`).
5. Remove scroll and padding wrappers (`max-h-[60vh] overflow-y-auto`, `min-h-[400px]`, `h-full overflow-y-auto`, `px-4 py-2`, `p-4`): the dialog body scrolls and is padded.
6. Inside tabs use `DetailHeading`, `DetailRows`/`DetailRow`, `DetailEmpty`, `LogoTile` and `Tag` instead of `Card`, `CardDescription`, `Badge`, hand-rolled rows and dashed separators, exactly as in the code below.
7. Keep all data loading, effects and handlers as they are unless a step says otherwise.

---

- [ ] **Step 1: Create `src/components/system/DetailDialog.tsx`**

```tsx
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Usually a 52px LogoTile. */
  icon?: ReactNode;
  /** Mono meta items under the title (icon + text); empty items are skipped. */
  meta?: ReactNode[];
  /** Tags under the meta row. */
  tags?: ReactNode;
  /** Extra header content, e.g. contact links. */
  headerExtra?: ReactNode;
  children: ReactNode;
}

/** Shared shell for all detail dialogs: logo, title, meta, tags, maximise and close; a scrollable body. */
export default function DetailDialog({
  open,
  onOpenChange,
  title,
  icon,
  meta = [],
  tags,
  headerExtra,
  children,
}: DetailDialogProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!open) setMaximized(false);
  }, [open]);

  const metaItems = meta.filter(Boolean);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="detail-dialog-overlay" />
        <DialogPrimitive.Content className={cn("detail-dialog", maximized && "is-maximized")} aria-describedby={undefined}>
          <header className="detail-dialog-head">
            {icon ?? <span />}
            <div className="min-w-0">
              <DialogPrimitive.Title className="detail-dialog-title">{title}</DialogPrimitive.Title>
              {metaItems.length > 0 && (
                <div className="detail-dialog-meta">
                  {metaItems.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>
              )}
              {tags && <div className="mt-3 flex flex-wrap gap-1.5">{tags}</div>}
              {headerExtra}
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="icon-sm"
                className="max-sm:hidden"
                aria-label={maximized ? "Restore size" : "Maximize"}
                onClick={() => setMaximized((value) => !value)}
              >
                {maximized ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <DialogPrimitive.Close asChild>
                <Button variant="secondary" size="icon-sm" aria-label="Close">
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </header>
          <div className="detail-dialog-body">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Mono lowercase label for a block inside a dialog tab. */
export function DetailHeading({ children }: { children: ReactNode }) {
  return <h4 className="detail-heading">{children}</h4>;
}

/** Centred mono message for empty or loading tabs. */
export function DetailEmpty({ children }: { children: ReactNode }) {
  return <p className="detail-empty">{children}</p>;
}

/** Mono meta line inside a DetailRow (dates, durations, counts). Renders nothing when empty. */
export function DetailMeta({ children }: { children?: ReactNode }) {
  if (children === null || children === undefined || children === false || children === "") return null;
  return <p className="type-meta mt-1">{children}</p>;
}

interface DetailRowProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Clamp the subtitle to two lines (default true). */
  clampSubtitle?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}

/** One row in a dialog list. With onClick it is a keyboard-accessible button-like row. */
export function DetailRow({ icon, title, subtitle, clampSubtitle = true, trailing, onClick, children }: DetailRowProps) {
  const interactive = Boolean(onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className="detail-row"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className={cn("mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground", clampSubtitle && "line-clamp-2")}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
      {trailing}
    </div>
  );
}

/** Hairline-separated list of rows, or a two-column grid of rows. */
export function DetailRows({ columns = 1, children }: { columns?: 1 | 2; children: ReactNode }) {
  return <div className={columns === 2 ? "detail-grid-2" : "detail-list"}>{children}</div>;
}
```

---

### Project dialog (`src/components/projects/ProjectDetailDialog.tsx`)

- [ ] **Step 2: Replace the imports**

Replace everything from the first line down to and including `import type { ScreenshotItem } from '@/models/ProjectFiles';` with:

```tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Building2,
  User,
  Clock,
  Linkedin,
  Minimize2,
  Info,
  Wrench,
  Users,
  UserCheck,
  Image,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { peopleRepo } from '@/repositories/PeopleRepo';
import { partnersRepo } from '@/repositories/PartnersRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectFilesRepo } from '@/repositories/ProjectFilesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import PartnerDetailDialog from '../partners/PartnerDetailDialog';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import PeopleDetailDialog from '../people/PeopleDetailDialog';
import ListViewer from '@/components/ui/listviewer';
import DetailDialog, { DetailEmpty, DetailHeading, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
import type { ProjectEntry } from '@/models/Project';
import type { Person } from '@/models/People';
import type SkillItem from '@/models/Skills';
import type { Partner } from '@/models/Partner';
import type { Company } from '@/models/Companies';
import type { Experience } from '@/models/Experience';
import type { ScreenshotItem } from '@/models/ProjectFiles';
```

- [ ] **Step 3: Delete the maximise state and dead helpers**

Delete:
- the line `  const [isMaximized, setIsMaximized] = useState(false);`;
- the never-read `technologyLogos` state: the line `  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});` and, in the skills effect (`// Fetch technology logos and skill objects when project changes`), the line `const logos: Record<string, string> = {};`, the `if (skill.photoUrl) { logos[skillCode] = skill.photoUrl; }` block inside the loop, and the line `setTechnologyLogos(logos);` (keep `skillItems` and `setSkills`);
- the `formatDatePeriod` helper (the `// Helper function to format date period` comment and the function after it): the new header formats dates with `formatMonthRange`.

Three projects (JENGAIAPP, CERTIFY.HEALTH, AIS) list a skill code twice, which rendered the skill twice and logged duplicate React keys. In the same skills effect change `for (const skillCode of project.skillCodes) {` to `for (const skillCode of new Set(project.skillCodes)) {`.

- [ ] **Step 4: Fix the Customers tab data (names and logos were blank)**

`customers.json` items have no `title` or `logoPath`, so the Customers tab rendered empty names. In the customer-loading effect, replace the block from the comment `// Filter customers by customer codes` through `setCustomersData(projectCustomers);` with:

```tsx
          // Filter customers by customer codes and resolve each one's company name and logo.
          const projectCustomers: Customer[] = await Promise.all(
            data.items
              .filter((customer: Customer & { companyCode?: string }) =>
                project.customerCodes?.some((customerCode) => customer.code?.toLowerCase() === customerCode.toLowerCase()),
              )
              .map(async (customer: Customer & { companyCode?: string }) => {
                const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
                return {
                  ...customer,
                  title: company?.title ?? customer.companyCode ?? customer.code,
                  logoPath: company?.photoUrl ?? '',
                };
              }),
          );

          setCustomersData(projectCustomers);
```

- [ ] **Step 5: Fix the partner lookup (the Partners tab never appeared)**

`partners.json` items have no `code`, so `partnersRepo.getByCode()` always returned `null` and the Partners tab of "ProEmpower" never showed. Project data also spells partner codes in mixed case ("Gnomon" vs "GNOMON"). In the partner-loading effect, replace the whole `for (const partnerCode of project.partnerCodes) { … }` loop (it ends just before `setPartners(partnerItems);`) with:

```tsx
      // partners.json items have no `code`, so match on partnerCode, ignoring case.
      const allPartners = await partnersRepo.getList();
      for (const partnerCode of project.partnerCodes) {
        const partner = allPartners.find((item) => item.partnerCode?.toLowerCase() === partnerCode?.toLowerCase());
        if (partner) {
          partnerItems.push(partner);
          if (partner.companyCode) {
            const company = await companiesRepo.getByCode(partner.companyCode);
            if (company) {
              companies[partner.partnerCode] = company;
            }
          }
        }
      }
```

Now that partners resolve, the effect must also clear them for projects without partners (otherwise every project opened after "ProEmpower" shows its partners). At the end of the same effect replace

```tsx
    if (project?.partnerCodes && project.partnerCodes.length > 0) {
      fetchPartners();
    }
  }, [project?.partnerCodes]);
```

with

```tsx
    if (project?.partnerCodes && project.partnerCodes.length > 0) {
      fetchPartners();
    } else {
      setPartners([]);
      setPartnerCompanies({});
    }
  }, [project?.partnerCodes]);
```

- [ ] **Step 6: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={onClose}>` down to the matching `  );` before `};`) with the code below. The fullscreen screenshot viewer block — `{isScreenshotFullscreen && selectedScreenshot && ( <Dialog …> … </Dialog> )}` — is moved **unchanged** to the marked place.

```tsx
  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={projectIcon || project.photoUrl} alt={project.title} size={52} />}
        title={project.title}
        meta={[
          companyName ? (
            <>
              <Building2 aria-hidden="true" />
              {companyName}
            </>
          ) : null,
          project.datePeriod?.startDate ? (
            <>
              <Clock aria-hidden="true" />
              {formatMonthRange(project.datePeriod.startDate, project.datePeriod.endDate)}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="proj">project</Tag>
            {project.group && <Tag>{project.group}</Tag>}
            {project.code === 'AMELBOOK' && (
              <a href="/privacy/amelbook" target="_blank" rel="noopener noreferrer">
                <Tag tone="success">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  privacy policy
                </Tag>
              </a>
            )}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{new Set(project.skillCodes ?? []).size}</TabCount>
            </TabsTrigger>
            {project.customerCodes && project.customerCodes.length > 0 && (
              <TabsTrigger value="customers">
                <Users aria-hidden="true" />
                Customers
                <TabCount>{project.customerCodes.length}</TabCount>
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <UserCheck aria-hidden="true" />
              Team
              <TabCount>{project.team?.length || 0}</TabCount>
            </TabsTrigger>
            {screenshots.length > 0 && (
              <TabsTrigger value="screenshots">
                <Image aria-hidden="true" />
                Screenshots
                <TabCount>{screenshots.length}</TabCount>
              </TabsTrigger>
            )}
            {partners.length > 0 && (
              <TabsTrigger value="partners">
                <Building2 aria-hidden="true" />
                Partners
                <TabCount>{partners.length}</TabCount>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {project.summary && (
              <div
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.summary }}
              />
            )}

            {experience && experienceCompany && (
              <div>
                <DetailHeading>experience</DetailHeading>
                <DetailRow
                  icon={<LogoTile src={experienceCompany.photoUrl} alt={experienceCompany.title} size={40} />}
                  title={experienceCompany.title}
                  subtitle={
                    experience.positions && experience.positions.length > 0
                      ? `${experience.positions.length} position${experience.positions.length > 1 ? 's' : ''}`
                      : undefined
                  }
                  trailing={<Tag tone="exp">experience</Tag>}
                  onClick={() => setIsExperienceDialogOpen(true)}
                />
              </div>
            )}

            {project.modules && project.modules.length > 0 && (
              <div>
                <DetailHeading>modules · {project.modules.length}</DetailHeading>
                <DetailRows columns={2}>
                  {project.modules.map((module, index) => (
                    <DetailRow
                      key={`${module}-${index}`}
                      icon={<span className="h-[5px] w-[5px] shrink-0 rounded-[1px] bg-accent" aria-hidden="true" />}
                      title={module}
                    />
                  ))}
                </DetailRows>
              </div>
            )}

            {project.fulltext && (
              <div
                className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-accent prose-strong:text-foreground prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: Array.isArray(project.fulltext) ? project.fulltext.join('') : project.fulltext,
                }}
              />
            )}

            {project.domainCodes && project.domainCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.domainCodes.map((domainCode) => (
                  <Tag key={domainCode}>{domainCode}</Tag>
                ))}
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
              <DetailEmpty>No skills listed for this project.</DetailEmpty>
            )}
          </TabsContent>

          {project.customerCodes && project.customerCodes.length > 0 && (
            <TabsContent value="customers">
              {isLoadingCustomers ? (
                <DetailEmpty>Loading customers…</DetailEmpty>
              ) : customersData.length > 0 ? (
                <DetailRows columns={2}>
                  {customersData.map((customer) => (
                    <DetailRow
                      key={customer.code}
                      icon={<LogoTile src={customer.logoPath} alt={customer.title} size={40} variant="logo-light" />}
                      title={customer.title}
                      subtitle={customer.location}
                    >
                      {customer.industry && (
                        <div className="mt-1.5">
                          <Tag>{customer.industry}</Tag>
                        </div>
                      )}
                    </DetailRow>
                  ))}
                </DetailRows>
              ) : (
                <DetailEmpty>No customer information available.</DetailEmpty>
              )}
            </TabsContent>
          )}

          <TabsContent value="team">
            {teamMembers.length > 0 ? (
              <DetailRows columns={2}>
                {teamMembers.map((member, index) => {
                  const linkedinUrl = member.person?.contacts?.find((contact) => contact.code === 'linkedin')?.value;
                  return (
                    <DetailRow
                      key={member.personCode || index}
                      icon={
                        <LogoTile
                          src={member.person?.photoUrl}
                          alt={member.person?.title ?? member.personCode}
                          size={40}
                          variant="photo"
                          fallback={<User className="h-4 w-4" />}
                        />
                      }
                      title={member.person?.title || member.personCode}
                      subtitle={member.position}
                      trailing={
                        linkedinUrl ? (
                          <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn profile"
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-line text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        ) : undefined
                      }
                      onClick={
                        member.person
                          ? () => {
                              setSelectedPerson(member.person);
                              setIsPeopleDialogOpen(true);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No team information available.</DetailEmpty>
            )}
          </TabsContent>

          {partners.length > 0 && (
            <TabsContent value="partners">
              <DetailRows>
                {partners.map((partner) => {
                  const company = partnerCompanies[partner.partnerCode];
                  return (
                    <DetailRow
                      key={partner.partnerCode}
                      icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? partner.code} size={40} variant="logo-light" />}
                      title={company?.title || partner.code}
                      subtitle={partner.description}
                      onClick={() => {
                        setSelectedPartner(partner);
                        setIsPartnerDialogOpen(true);
                      }}
                    />
                  );
                })}
              </DetailRows>
            </TabsContent>
          )}

          {screenshots.length > 0 && (
            <TabsContent value="screenshots">
              <ListViewer<ScreenshotItem>
                data={screenshots}
                defaultViewMode="card"
                enabledModes={['card', 'list']}
                fieldMapping={{
                  code: (item) => item.file_small || item.file_big || `screenshot-${screenshots.indexOf(item)}`,
                  title: (item) => item.title || `Screenshot ${screenshots.indexOf(item) + 1}`,
                  image: (item) => item.file_small || item.file_big || '/placeholder.svg',
                  description: (item) => (item.title ? '' : 'Click to view full size'),
                }}
                gridCols={{ sm: 1, md: 2, lg: 3 }}
                ariaLabel="Screenshots"
                onItemClick={(screenshot) => {
                  const index = screenshots.indexOf(screenshot);
                  setCurrentScreenshotIndex(index);
                  setSelectedScreenshot(screenshot.file_big || screenshot.file_small || '');
                  setIsScreenshotFullscreen(true);
                }}
                renderCardContent={(screenshot) => (
                  <div className="group">
                    <div className="relative aspect-video overflow-hidden bg-surface-2">
                      <img
                        src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'}
                        alt={screenshot.title || 'Screenshot'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    {screenshot.title && <p className="px-3 py-2.5 text-xs text-muted-foreground line-clamp-2">{screenshot.title}</p>}
                  </div>
                )}
                renderListContent={(screenshot) => (
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-[6px] bg-surface-2">
                      <img
                        src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'}
                        alt={screenshot.title || 'Screenshot'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium">
                        {screenshot.title || `Screenshot ${screenshots.indexOf(screenshot) + 1}`}
                      </h4>
                      <p className="type-meta mt-1">click to view full size</p>
                    </div>
                  </div>
                )}
              />
            </TabsContent>
          )}
        </Tabs>
      </DetailDialog>

      {/* Fullscreen screenshot viewer — moved here unchanged:
          {isScreenshotFullscreen && selectedScreenshot && ( <Dialog …> … </Dialog> )} */}

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />

      <PartnerDetailDialog
        partner={selectedPartner}
        isOpen={isPartnerDialogOpen}
        onClose={() => {
          setIsPartnerDialogOpen(false);
          setSelectedPartner(null);
        }}
      />

      <ExperienceDetailDialog
        experience={experience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
        }}
      />

      <PeopleDetailDialog
        person={selectedPerson}
        isOpen={isPeopleDialogOpen}
        onClose={() => {
          setIsPeopleDialogOpen(false);
          setSelectedPerson(null);
        }}
      />
    </>
  );
```

Replace the placeholder comment with the original `{isScreenshotFullscreen && selectedScreenshot && ( … )}` block, character for character.

---

### Experience dialog (`src/components/experiences/ExperienceDetailDialog.tsx`)

- [ ] **Step 7: Replace the imports**

Replace everything from the first line down to and including `import type { Company } from '@/models/Companies';` with:

```tsx
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Clock, MapPin, ExternalLink, Linkedin, Briefcase, Wrench, FolderKanban } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { domainsRepo } from '@/repositories/DomainsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange, stripHtml } from '@/lib/format';

import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { SkillItem } from '@/models/Skills';
import type { Domain } from '@/models/Domain';
import type { Company } from '@/models/Companies';
```

- [ ] **Step 8: Delete the maximise state and dead helpers**

Delete:
- the line `  const [isMaximized, setIsMaximized] = useState(false);`;
- the `formatDatePeriod` helper (the `// Helper function to format date period` comment and the function after it): positions now use `formatMonthRange`;
- the unused `groupedSkills` reduce (the `// Group all skills by group` comment and the statement after it) and the unused line `  const hasCurrentPosition = experience.positions.some(pos => !pos.endDate);`.

- [ ] **Step 9: Replace the rendered markup**

Replace the component's `return ( … );` (from `  return (` with `<Dialog open={isOpen} onOpenChange={onClose}>` to the matching `  );`) with:

```tsx
  const location = [company?.city, company?.country].filter(Boolean).join(', ');

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={52} />}
        title={company?.title || experience.companyCode || 'Company'}
        meta={[
          <>
            <Clock aria-hidden="true" />
            {calculateTotalDuration()}
          </>,
          location ? (
            <>
              <MapPin aria-hidden="true" />
              {location}
            </>
          ) : null,
        ]}
        tags={<Tag tone="exp">experience</Tag>}
        headerExtra={
          company?.websiteUrl || company?.linkedinUrl ? (
            <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
              {company.websiteUrl && (
                <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Website
                </a>
              )}
              {company.linkedinUrl && (
                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                  LinkedIn
                </a>
              )}
            </div>
          ) : null
        }
      >
        <Tabs defaultValue="positions">
          <TabsList>
            <TabsTrigger value="positions">
              <Briefcase aria-hidden="true" />
              Positions
              <TabCount>{experience.positions.length}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{totalTechCount}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban aria-hidden="true" />
              Projects
              <TabCount>{projects.length}</TabCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <div className="detail-list">
              {experience.positions.map((position, index) => (
                <div key={index} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[15px] font-medium text-foreground">{position.title}</h3>
                    <span className="flex items-center gap-2 font-mono text-xs text-faint">
                      {formatMonthRange(position.startDate, position.endDate)}
                      {!position.endDate && <Tag tone="accent">current</Tag>}
                    </span>
                  </div>
                  <div
                    className="mt-2 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: position.summary }}
                  />
                  {domains[position.title] && domains[position.title].length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {domains[position.title].map((domain) => (
                        <Tag key={domain.code}>{domain.title}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="technologies">
            {isLoadingData ? (
              <DetailEmpty>Loading skills…</DetailEmpty>
            ) : skills.length > 0 ? (
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
              <DetailEmpty>No skills listed for this experience.</DetailEmpty>
            )}
          </TabsContent>

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
                    subtitle={stripHtml(project.summary)}
                    onClick={onOpenProject ? () => onOpenProject(project) : undefined}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No specific projects listed for this experience.</DetailEmpty>
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
        onOpenProject={onOpenProject}
      />
    </>
  );
```

The old hard-coded "Turkey" location is replaced by the company's real city and country. The no-op `onOpenExperience={() => {}}` is dropped: in the re-skinned skill dialog (Task 16) rows are only clickable when a handler exists, so experience rows there no longer pretend to be links.

- [ ] **Step 10: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. Confirm nothing refers to the deleted helpers: `git grep -nE "formatDatePeriod|technologyLogos|groupedSkills|hasCurrentPosition|isMaximized" -- src/components/projects/ProjectDetailDialog.tsx src/components/experiences/ExperienceDetailDialog.tsx` prints nothing.

- [ ] **Step 11: Visual check**

With the dev server running, run the screenshot tool and open `desktop_dialog_project.png`: a 780px-wide dark dialog with a 52px logo tile, 22px title, mono meta row (company, dates), tags ("project", group), maximise and close icon buttons, underline tabs with mono counts, and the overview body (summary, experience row, two-column modules list with cyan square bullets, prose). In a real browser also check: the Customers tab of a project with customers (e.g. "Avicenna Hospital Information System") now shows client names and logos; "ProEmpower - DM4All" now has a Partners tab with five partners, each with its own logo; the Team tab rows open the person dialog while the LinkedIn button opens LinkedIn only; the Experience dialog (open any experience card) shows the real city/country and its Projects tab opens the project dialog; on a 390px wide window both dialogs are full-screen sheets.

- [ ] **Step 12: Commit**

```bash
git add src/components/system/DetailDialog.tsx src/components/projects/ProjectDetailDialog.tsx src/components/experiences/ExperienceDetailDialog.tsx
git commit -m "feat(dialogs): add shared detail dialog shell and re-skin project and experience dialogs

Also resolves client names and logos in the project dialog's Customers tab,
matches partners by partner code so the Partners tab appears again (and
clears it for projects without partners), and lists a repeated skill once.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
