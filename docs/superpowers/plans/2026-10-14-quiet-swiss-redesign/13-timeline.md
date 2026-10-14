# Task 13: Timeline restyle

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Modify: `src/components/timeline/TimelineSection.tsx` (presentation only; data loading, filtering, zoom maths, row assignment and dialogs stay as they are)

**Interfaces:**
- Consumes: Task 1 `getEntityHexColor`, `ENTITY_TAG_TONE`; Task 3 `Reveal`; Task 4 `Button`, `Chip`/`ChipRow`, `LogoTile`, `SegmentedControl`, `Surface`, `Tag`, `Section`, `SectionHeader`.
- Produces: `TimelineSection` (default, `<section id="timeline">`).

Behaviour changes: section header; category chips with icons and counts; zoom out / "view · years|months|days" / zoom in as compact icon buttons (timeline view only); a segmented control for timeline/list; the timeline sits in a surface with a mono year axis and bars coloured by entity (dark text), scrolled to the most recent years when shown; the list view is a stack of interactive rows with logo tiles, entity tags and a "show more" toggle.

Copy (exact): `10 / timeline` — title `The whole journey <em>on one axis.</em>`; lede `A chronological overview of my professional journey, education, and key projects.`

---

- [ ] **Step 1: Replace the imports**

Replace the import block at the top of the file (from `import { useState, useEffect, useRef } from 'react';` through `import { getEntityColors, getEntityHexColor } from '@/lib/colors';`) with:

```tsx
import { useState, useEffect, useRef } from 'react';
import { Calendar, Briefcase, GraduationCap, Code, ChevronRight, List, BarChart3, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chip, { ChipRow } from '@/components/system/Chip';
import LogoTile from '@/components/system/LogoTile';
import Reveal from '@/components/system/Reveal';
import Section from '@/components/system/Section';
import SectionHeader from '@/components/system/SectionHeader';
import SegmentedControl from '@/components/system/SegmentedControl';
import Surface from '@/components/system/Surface';
import Tag from '@/components/system/Tag';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { educationRepo } from '@/repositories/EducationRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog';
import ExperienceDetailDialog from '@/components/experiences/ExperienceDetailDialog';
import EducationDetailDialog from '@/components/educations/EducationDetailDialog';
import type { ProjectEntry } from '@/models/Project';
import type { Experience } from '@/models/Experience';
import type { Education } from '@/models/Education';
import { parseDate } from '@/lib/datetimeutils';
import { ENTITY_TAG_TONE, getEntityColors, getEntityHexColor } from '@/lib/colors';
import { cn } from '@/lib/utils';
```

- [ ] **Step 2: Scroll the timeline to the most recent years**

Directly after the data-loading `useEffect` (the one ending with `    loadData();\n  }, []);`), add:

```tsx
  // Show the most recent years first when the timeline view opens or the zoom changes.
  useEffect(() => {
    if (viewMode !== 'timeline' || isLoading) return;
    const scroller = timelineRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [viewMode, zoomLevel, isLoading]);
```

- [ ] **Step 3: Remove the unused badge helper**

Delete the whole `getTypeBadgeVariant` function (`const getTypeBadgeVariant = (type: TimelineItemType): … => { … };`). It is no longer used.

- [ ] **Step 4: Restyle the axis**

Replace the whole `renderTimelineAxis` function with:

```tsx
  const renderTimelineAxis = () => {
    const metrics = getTimelineMetrics();
    const markers: JSX.Element[] = [];
    const label = (text: number, strong = false) => (
      <div className={cn('absolute -top-6 left-1 font-mono text-[11px]', strong ? 'text-muted-foreground' : 'text-faint')}>
        {text}
      </div>
    );

    if (zoomLevel === 'year') {
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        const position = ((year - metrics.startYear) / metrics.totalYears) * metrics.totalWidth;
        markers.push(
          <div key={`year-${year}`} className="absolute top-0 h-full border-l border-line/70" style={{ left: `${position}px` }}>
            {label(year)}
          </div>,
        );
      }
    } else if (zoomLevel === 'month') {
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        for (let month = 0; month < 12; month++) {
          const totalMonths = (year - metrics.startYear) * 12 + month;
          const position = (totalMonths / metrics.unitCount) * metrics.totalWidth;
          markers.push(
            <div
              key={`month-${year}-${month}`}
              className={cn('absolute top-0 h-full border-l', month === 0 ? 'border-line-strong' : 'border-line/40')}
              style={{ left: `${position}px` }}
            >
              {month === 0 && label(year, true)}
            </div>,
          );
        }
      }
    } else {
      // Day zoom: year markers only (a marker per day would be far too dense).
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        const totalDays = (year - metrics.startYear) * 365;
        const position = (totalDays / metrics.unitCount) * metrics.totalWidth;
        markers.push(
          <div key={`day-${year}`} className="absolute top-0 h-full border-l border-line-strong" style={{ left: `${position}px` }}>
            {label(year, true)}
          </div>,
        );
      }
    }

    return markers;
  };
```

- [ ] **Step 5: Restyle the loading state**

Replace the `if (isLoading) { return ( … ); }` block with:

```tsx
  const header = (
    <SectionHeader
      index="10"
      label="timeline"
      title={
        <>
          The whole journey <em>on one axis.</em>
        </>
      }
      lede="A chronological overview of my professional journey, education, and key projects."
    />
  );

  if (isLoading) {
    return (
      <Section id="timeline">
        {header}
        <div className="surface h-[400px] animate-pulse" aria-busy="true" />
      </Section>
    );
  }
```

- [ ] **Step 6: Replace the rendered markup**

Replace the main `return ( … );` of the component (from `  return (` with `<section id="timeline"` down to the matching `  );` before the component's closing `};`) with:

```tsx
  return (
    <Section id="timeline">
      {header}

      <Reveal className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <ChipRow aria-label="Filter the timeline">
          {categories.map((category) => (
            <Chip
              key={category.value}
              selected={selectedCategory === category.value}
              count={getCategoryCount(category.value)}
              icon={<category.icon aria-hidden="true" />}
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </Chip>
          ))}
        </ChipRow>

        <div className="flex items-center gap-2">
          {viewMode === 'timeline' && (
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="icon-sm" aria-label="Zoom out" disabled={zoomLevel === 'year'} onClick={handleZoomOut}>
                <ZoomOut />
              </Button>
              <span className="min-w-[96px] text-center font-mono text-xs text-faint">
                view · {zoomLevel === 'year' ? 'years' : zoomLevel === 'month' ? 'months' : 'days'}
              </span>
              <Button variant="secondary" size="icon-sm" aria-label="Zoom in" disabled={zoomLevel === 'day'} onClick={handleZoomIn}>
                <ZoomIn />
              </Button>
            </div>
          )}
          <SegmentedControl
            ariaLabel="Timeline view"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'timeline', label: 'Timeline view', icon: <BarChart3 /> },
              { value: 'list', label: 'List view', icon: <List /> },
            ]}
          />
        </div>
      </Reveal>

      {viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const Icon = item.icon;
            return (
              <Reveal key={item.id} index={index}>
                <Surface
                  interactive
                  tilt={false}
                  onActivate={() => handleItemClick(item)}
                  className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 p-5"
                >
                  <LogoTile src={item.logoUrl} alt={item.title} size={52} fallback={<Icon className="h-5 w-5" />} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15.5px] font-medium tracking-[-0.02em]">{item.title}</h3>
                          <Tag tone={ENTITY_TAG_TONE[item.type]}>{getTypeLabel(item.type)}</Tag>
                        </div>
                        {item.subtitle && <p className="type-meta mt-1">{item.subtitle}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-faint">{formatDateRange(item.startDate, item.endDate)}</span>
                        {item.category && <Tag>{item.category}</Tag>}
                      </div>
                    </div>
                    {item.description && (
                      <>
                        <p className={cn('mt-2 text-sm leading-relaxed text-muted-foreground', !isExpanded && 'line-clamp-2')}>
                          {item.description}
                        </p>
                        {item.description.length > 150 && (
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-accent"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpand(item.id);
                            }}
                          >
                            {isExpanded ? 'show less' : 'show more'}
                            <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </Surface>
              </Reveal>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="type-meta py-12 text-center">No items found for the selected category.</p>
          )}
        </div>
      ) : (
        <Reveal>
          <Surface>
            <div ref={timelineRef} className="relative overflow-x-auto overflow-y-hidden p-8 pt-12" style={{ height: '400px' }}>
              <div className="relative" style={{ width: `${getTimelineMetrics().totalWidth}px`, height: '100%' }}>
                <div className="absolute left-0 right-0 top-8 h-px bg-line-strong" />
                {renderTimelineAxis()}

                <div className="absolute left-0 right-0 top-20">
                  {(() => {
                    const educationItems = filteredItems.filter((item) => item.type === 'education');
                    const experienceItems = filteredItems.filter((item) => item.type === 'experience');
                    const projectItems = filteredItems.filter((item) => item.type === 'project');

                    const doItemsOverlap = (a: { left: number; width: number }, b: { left: number; width: number }) =>
                      !(a.left + a.width <= b.left || b.left + b.width <= a.left);

                    const findBestRow = (
                      itemPos: { left: number; width: number },
                      rowsOccupied: Array<Array<{ left: number; width: number }>>,
                      startRow: number,
                      maxRows: number,
                    ) => {
                      for (let row = startRow; row < startRow + maxRows; row++) {
                        const itemsInRow = rowsOccupied[row] || [];
                        if (!itemsInRow.some((occupied) => doItemsOverlap(itemPos, occupied))) return row;
                      }
                      return startRow + maxRows - 1;
                    };

                    const metrics = getTimelineMetrics();
                    const rowsOccupied: Array<Array<{ left: number; width: number }>> = [];

                    // Education on row 0, experience on row 1, projects on rows 2–4.
                    const itemsWithRows = [...educationItems, ...experienceItems, ...projectItems].map((item) => {
                      const { left, width } = calculateItemPosition(item, metrics);
                      const itemPos = { left, width };
                      let row = 0;
                      if (item.type === 'education') row = findBestRow(itemPos, rowsOccupied, 0, 1);
                      else if (item.type === 'experience') row = findBestRow(itemPos, rowsOccupied, 1, 1);
                      else row = findBestRow(itemPos, rowsOccupied, 2, 3);
                      if (!rowsOccupied[row]) rowsOccupied[row] = [];
                      rowsOccupied[row].push(itemPos);
                      return { item, row, left, width };
                    });

                    return itemsWithRows.map(({ item, row, left, width }) => {
                      const tooltipContent = [
                        item.title,
                        item.subtitle ? `(${item.subtitle})` : '',
                        formatDateRange(item.startDate, item.endDate),
                        item.category ? `Category: ${item.category}` : '',
                        item.description
                          ? `\n${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join('\n');

                      return (
                        <div
                          key={item.id}
                          className="group absolute cursor-pointer"
                          style={{ left: `${left}px`, width: `${width}px`, top: `${row * 34}px` }}
                          title={tooltipContent}
                          onClick={() => handleItemClick(item)}
                        >
                          <div
                            className="flex h-[22px] items-center overflow-hidden rounded-[4px] px-2 transition-[filter,transform] duration-200 hover:-translate-y-px hover:brightness-110"
                            style={{ backgroundColor: getEntityHexColor(item.type) }}
                          >
                            <span className="truncate whitespace-nowrap text-[11px] font-medium text-[#09090b]">{item.title}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </Surface>
          {filteredItems.length === 0 && (
            <p className="type-meta py-12 text-center">No items found for the selected category.</p>
          )}
        </Reveal>
      )}

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />

      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
      />

      <EducationDetailDialog
        education={selectedEducation}
        isOpen={isEducationDialogOpen}
        onClose={() => {
          setIsEducationDialogOpen(false);
          setSelectedEducation(null);
        }}
      />
    </Section>
  );
```

`getEntityColors` is still used where timeline items are built (their `color` field); keep that import.

- [ ] **Step 7: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. If lint flags `Code`, `Calendar`, `Briefcase` or `GraduationCap` as unused, they are not — they are used in the `categories` array and when building items; leave them.

- [ ] **Step 8: Visual check**

Screenshot the page and find `#timeline`: header "10 / timeline"; chips with icons and counts; zoom buttons with the mono "view · years" label and the segmented control on the right; a surface with the mono year axis (recent years visible at first), a hairline axis, and rows of rounded bars — amber education, blue experience, cyan projects — with dark labels. Switching to the list view shows interactive rows with logo tiles, coloured type tags and "show more" for long descriptions.

- [ ] **Step 9: Commit**

```bash
git add src/components/timeline/TimelineSection.tsx
git commit -m "feat(timeline): restyle timeline with entity-coloured bars and quiet controls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
