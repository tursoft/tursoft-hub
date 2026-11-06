import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useSnapshotState, type SnapshotCodec } from '@/hooks/use-snapshot-state';
import SectionHeader from '@/components/SectionHeader';
import { Button } from '@/components/ui/button';
import { ChevronDown, List, ChartNoAxesGantt, ZoomIn, ZoomOut } from 'lucide-react';
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
import { cn } from '@/lib/utils';

type TimelineItemType = 'project' | 'experience' | 'education';
type ViewMode = 'list' | 'timeline';
type ZoomLevel = 'year' | 'month' | 'day';

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  /** Company or school name */
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string | null;
  dateObj: Date;
  endDateObj: Date | null;
  category?: string;
  data: ProjectEntry | Experience | Education;
}

type EncodedTimelineItem = Omit<TimelineItem, 'dateObj' | 'endDateObj'> & {
  dateObj: string;
  endDateObj: string | null;
};

// Timeline items hold Date objects. The prerender snapshot stores the dates as ISO
// strings. The full record in `data` is only needed by the detail dialogs and arrives
// with the live data right after load, so it is left out of the snapshot to keep the
// page small.
const timelineCodec: SnapshotCodec<TimelineItem[]> = {
  encode: (items) =>
    items.map(({ dateObj, endDateObj, data, ...rest }): EncodedTimelineItem => ({
      ...rest,
      data: null as unknown as TimelineItem['data'],
      dateObj: dateObj.toISOString(),
      endDateObj: endDateObj ? endDateObj.toISOString() : null,
    })),
  decode: (data) =>
    (data as EncodedTimelineItem[]).map((it) => ({
      ...it,
      dateObj: new Date(it.dateObj),
      endDateObj: it.endDateObj ? new Date(it.endDateObj) : null,
    })),
};

const TYPE_LABEL: Record<TimelineItemType, string> = {
  project: 'Project',
  experience: 'Experience',
  education: 'Education',
};

const CATEGORIES = [
  { value: 'All', label: 'All' },
  { value: 'project', label: 'Projects' },
  { value: 'experience', label: 'Experience' },
  { value: 'education', label: 'Education' },
] as const;

const ZOOM_LABEL: Record<ZoomLevel, string> = { year: 'Years', month: 'Months', day: 'Days' };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "01.05.2026" becomes "May 2026" */
const formatMonth = (value: string): string => {
  const date = parseDate(value);
  return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : value;
};

/** "May 2026 – present", "Sep 2012 – Feb 2013", or one month when it starts and ends in it */
const formatDateRange = (startDate: string, endDate: string | null): string => {
  const start = formatMonth(startDate);
  const end = endDate ? formatMonth(endDate) : 'present';
  return start === end ? start : `${start} – ${end}`;
};

/** The position held now: the one entry printed in red. */
const isCurrent = (item: TimelineItem) => item.type === 'experience' && !item.endDate;

// Chart geometry: the year axis, then one lane per type (education, experience, projects),
// each with as many rows as its overlapping entries need
const START_YEAR = 1995;
const AXIS_H = 32;
const ROW_H = 20;
const BAR_H = 16;
const LANE_GAP = 16;
const LANES: { type: TimelineItemType; label: string }[] = [
  { type: 'education', label: 'Education' },
  { type: 'experience', label: 'Experience' },
  { type: 'project', label: 'Projects' },
];
const PX_PER_YEAR: Record<ZoomLevel, number> = { year: 100, month: 600, day: 730 };

const TimelineSection = () => {
  const [items, setItems] = useSnapshotState<TimelineItem[]>('timeline.items', [], timelineCodec);
  const [isLoading, setIsLoading] = useSnapshotState('timeline.isLoading', true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('year');
  const timelineRef = useRef<HTMLDivElement>(null);
  // Where the middle of the chart sat before a zoom, as a share of its width
  const zoomAnchor = useRef<number | null>(null);

  // Dialog states
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, experiences, educations] = await Promise.all([
          projectsRepo.getList(),
          experienceRepo.getList(),
          educationRepo.getList(),
        ]);

        const timelineItems: TimelineItem[] = [];

        // Company and school names, printed under each entry
        const companyCodes = new Set<string>();
        [...projects, ...experiences, ...educations].forEach((entry) => {
          if (entry.companyCode) companyCodes.add(entry.companyCode);
        });

        const companyTitles: { [key: string]: string } = {};
        await Promise.all(
          Array.from(companyCodes).map(async (code) => {
            const company = await companiesRepo.getByCode(code);
            if (company?.title) {
              companyTitles[code] = company.title;
            }
          })
        );
        const companyName = (code?: string | null) => (code ? companyTitles[code] || code : undefined);

        // Add projects
        projects.forEach((project) => {
          if (project.datePeriod?.startDate) {
            const startDate = parseDate(project.datePeriod.startDate);
            const endDate = project.datePeriod.endDate ? parseDate(project.datePeriod.endDate) : null;

            if (startDate) {
              timelineItems.push({
                id: `project-${project.code}`,
                type: 'project',
                title: project.title || '',
                subtitle: companyName(project.companyCode),
                description: project.summary,
                startDate: project.datePeriod.startDate,
                endDate: project.datePeriod.endDate || null,
                dateObj: startDate,
                endDateObj: endDate || new Date(),
                category: project.group,
                data: project,
              });
            }
          }
        });

        // Add experiences (positions)
        experiences.forEach((experience) => {
          experience.positions?.forEach((position, index) => {
            if (position.startDate) {
              const startDate = parseDate(position.startDate);
              const endDate = position.endDate ? parseDate(position.endDate) : null;

              if (startDate) {
                timelineItems.push({
                  id: `experience-${experience.companyCode}-${index}`,
                  type: 'experience',
                  title: position.title || '',
                  subtitle: companyName(experience.companyCode),
                  description: position.summary,
                  startDate: position.startDate,
                  endDate: position.endDate || null,
                  dateObj: startDate,
                  endDateObj: endDate || new Date(),
                  data: experience,
                });
              }
            }
          });
        });

        // Add educations
        educations.forEach((education) => {
          if (education.datePeriod?.startDate) {
            const startDate = parseDate(education.datePeriod.startDate);
            const endDate = education.datePeriod.endDate ? parseDate(education.datePeriod.endDate) : null;

            if (startDate) {
              timelineItems.push({
                id: `education-${education.code}`,
                type: 'education',
                title: education.department || '',
                subtitle: companyName(education.companyCode),
                description: education.summary,
                startDate: education.datePeriod.startDate,
                endDate: education.datePeriod.endDate || null,
                dateObj: startDate,
                endDateObj: endDate || new Date(),
                category: education.level,
                data: education,
              });
            }
          }
        });

        // Sort by date (most recent first for list mode)
        timelineItems.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

        setItems(timelineItems);
      } catch (error) {
        console.error('Failed to load timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setIsLoading, setItems]);

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.type === selectedCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return items.length;
    return items.filter((item) => item.type === category).length;
  };

  const handleItemClick = (item: TimelineItem) => {
    if (!item.data) return; // full record not loaded yet (prerender snapshot)
    switch (item.type) {
      case 'project':
        setSelectedProject(item.data as ProjectEntry);
        setIsProjectDialogOpen(true);
        break;
      case 'experience':
        setSelectedExperience(item.data as Experience);
        setIsExperienceDialogOpen(true);
        break;
      case 'education':
        setSelectedEducation(item.data as Education);
        setIsEducationDialogOpen(true);
        break;
    }
  };

  // The chronology: entries grouped under the year they started, most recent first
  const yearGroups = useMemo(() => {
    const groups: { year: number; entries: TimelineItem[] }[] = [];
    for (const item of filteredItems) {
      const year = item.dateObj.getFullYear();
      const last = groups[groups.length - 1];
      if (last && last.year === year) last.entries.push(item);
      else groups.push({ year, entries: [item] });
    }
    return groups;
  }, [filteredItems]);

  // One scale for the axis and the bars: 1 Jan 1995 to the end of this year
  const metrics = useMemo(() => {
    const endYear = new Date().getFullYear();
    const totalYears = endYear - START_YEAR + 1;
    const start = new Date(START_YEAR, 0, 1).getTime();
    const end = new Date(endYear + 1, 0, 1).getTime();
    const totalWidth = PX_PER_YEAR[zoomLevel] * totalYears;
    const x = (time: number) => ((time - start) / (end - start)) * totalWidth;
    return { endYear, totalWidth, x };
  }, [zoomLevel]);

  const renderTimelineAxis = () => {
    const ticks: JSX.Element[] = [];
    for (let year = START_YEAR; year <= metrics.endYear; year++) {
      ticks.push(
        <div
          key={`year-${year}`}
          className={cn('tl-tick', year % 10 === 0 && 'is-decade')}
          style={{ left: `${metrics.x(new Date(year, 0, 1).getTime())}px` }}
        >
          <span className="tl-year">{year}</span>
        </div>
      );
      if (zoomLevel !== 'year') {
        for (let month = 1; month < 12; month++) {
          ticks.push(
            <div
              key={`month-${year}-${month}`}
              className="tl-tick is-minor"
              style={{ left: `${metrics.x(new Date(year, month, 1).getTime())}px`, top: `${AXIS_H}px` }}
            />
          );
        }
      }
    }
    return ticks;
  };

  // Bars: each entry takes the first row of its lane where it overlaps nothing, so no bar
  // is printed over another; lanes without entries (under a filter) are left out.
  const chart = useMemo(() => {
    type Pos = { left: number; width: number };
    const overlaps = (a: Pos, b: Pos) => !(a.left + a.width <= b.left || b.left + b.width <= a.left);

    const bars: { item: TimelineItem; top: number; left: number; width: number }[] = [];
    const lanes: { type: TimelineItemType; label: string; top: number }[] = [];
    const rules: number[] = [];
    let top = AXIS_H + 12;

    for (const lane of LANES) {
      const entries = filteredItems.filter((item) => item.type === lane.type);
      if (!entries.length) continue;
      if (lanes.length) {
        rules.push(top - LANE_GAP / 2 - (ROW_H - BAR_H) / 2);
      }
      const rows: Pos[][] = [];
      for (const item of entries) {
        const left = metrics.x(item.dateObj.getTime());
        const end = item.endDateObj ? item.endDateObj.getTime() : Date.now();
        const pos = { left, width: Math.max(metrics.x(end) - left, 20) }; // Minimum 20px
        let row = rows.findIndex((occupied) => !occupied.some((other) => overlaps(pos, other)));
        if (row < 0) row = rows.push([]) - 1;
        rows[row].push(pos);
        bars.push({ item, top: top + row * ROW_H, ...pos });
      }
      lanes.push({ type: lane.type, label: lane.label, top });
      top += rows.length * ROW_H + LANE_GAP;
    }

    const height = Math.max(top - LANE_GAP - (ROW_H - BAR_H) + 16, AXIS_H + 48);
    return { bars, lanes, rules, height };
  }, [filteredItems, metrics]);

  // The chart opens on the latest years (the scroller runs right to left, see below);
  // after a zoom, the date that was in the middle stays in the middle.
  useLayoutEffect(() => {
    const el = timelineRef.current;
    const anchor = zoomAnchor.current;
    zoomAnchor.current = null;
    if (!el || anchor === null) return;
    const leftEdge = anchor * el.scrollWidth - el.clientWidth / 2;
    el.scrollLeft = leftEdge - (el.scrollWidth - el.clientWidth);
  }, [zoomLevel]);

  const changeZoom = (next: ZoomLevel) => {
    const el = timelineRef.current;
    if (el) {
      const leftEdge = el.scrollWidth - el.clientWidth + el.scrollLeft;
      zoomAnchor.current = (leftEdge + el.clientWidth / 2) / el.scrollWidth;
    }
    setZoomLevel(next);
  };

  const handleZoomIn = () => {
    if (zoomLevel === 'year') changeZoom('month');
    else if (zoomLevel === 'month') changeZoom('day');
  };

  const handleZoomOut = () => {
    if (zoomLevel === 'day') changeZoom('month');
    else if (zoomLevel === 'month') changeZoom('year');
  };

  const firstYear = items.length ? items[items.length - 1].dateObj.getFullYear() : START_YEAR;

  const header = (
    <SectionHeader
      id="timeline"
      title="Career, education and projects"
      description="A chronological overview of my professional journey, education and key projects."
      aside={
        isLoading ? undefined : (
          <>
            <span className="tabular-nums">
              {items.length} entries since {firstYear}
            </span>
            <div className="pl-seg" role="group" aria-label="View">
              <button type="button" className="pl-seg-btn" aria-pressed={viewMode === 'timeline'} onClick={() => setViewMode('timeline')}>
                <ChartNoAxesGantt strokeWidth={1.5} aria-hidden="true" />
                Timeline
              </button>
              <button type="button" className="pl-seg-btn" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}>
                <List strokeWidth={1.5} aria-hidden="true" />
                List
              </button>
            </div>
          </>
        )
      }
    />
  );

  if (isLoading) {
    return (
      <section id="timeline" className="places py-16 lg:py-24">
        <div className="container">
          {header}
          <p className="text-sm text-faint">Loading the timeline…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="timeline" className="places py-16 lg:py-24">
      <div className="container">
        {header}

        {/* Type filter, and the scale of the chart */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="pl-seg" role="group" aria-label="Show">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                className="pl-seg-btn"
                aria-pressed={selectedCategory === category.value}
                onClick={() => setSelectedCategory(category.value)}
                data-cat={category.value === 'All' ? undefined : category.value}
              >
                {category.value !== 'All' && <span className="cat-dot" aria-hidden="true" />}
                {category.label}
                <span className="pl-seg-count">{getCategoryCount(category.value)}</span>
              </button>
            ))}
          </div>

          {viewMode === 'timeline' && (
            <div className="flex items-center gap-1" role="group" aria-label="Scale">
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel === 'year'}
                aria-label="Zoom out"
                className="h-8 w-8"
              >
                <ZoomOut strokeWidth={1.5} />
              </Button>
              <span className="w-16 text-center text-[13px] leading-5 text-muted-foreground" aria-live="polite">
                {ZOOM_LABEL[zoomLevel]}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel === 'day'}
                aria-label="Zoom in"
                className="h-8 w-8"
              >
                <ZoomIn strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>

        {/* Content - List or Timeline View */}
        {viewMode === 'list' ? (
          // LIST VIEW: a printed chronology
          <div className="chrono max-w-[960px]">
            <div className="chrono-now">
              <span className="col-start-2 text-[13px] font-medium leading-4 text-primary md:col-start-1">Now</span>
            </div>
            <ol>
              {yearGroups.map(({ year, entries }) => (
                <li key={year}>
                  <div className="chrono-year">
                    <span className="col-start-2 font-serif text-[28px] leading-8 text-foreground tabular-nums md:col-start-1">
                      {year}
                    </span>
                  </div>
                  <ol>
                    {entries.map((item) => {
                      const isExpanded = expandedItems.has(item.id);
                      const range = formatDateRange(item.startDate, item.endDate);
                      const current = isCurrent(item);
                      const meta = [item.subtitle, TYPE_LABEL[item.type], item.category].filter(Boolean).join(' · ');

                      return (
                        <li key={item.id} className="chrono-row" data-cat={item.type} data-current={current ? '' : undefined}>
                          <div
                            className={cn(
                              'hidden pt-3 text-[13px] leading-6 tabular-nums md:block',
                              current ? 'text-foreground' : 'text-faint'
                            )}
                          >
                            {range}
                          </div>
                          <span className="chrono-dot" aria-hidden="true" />
                          <div className="chrono-body">
                            <div className={cn('text-[13px] leading-5 tabular-nums md:hidden', current ? 'text-foreground' : 'text-faint')}>
                              {range}
                            </div>
                            <h3 className="text-[15px] font-medium leading-6 text-foreground">
                              <button
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className="text-left after:absolute after:inset-0 after:rounded-[4px] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
                              >
                                {item.title}
                              </button>
                            </h3>
                            {meta && <p className="text-[13px] leading-5 text-muted-foreground">{meta}</p>}

                            {item.description && (
                              <>
                                <p className={cn('mt-2 max-w-[44rem] text-sm leading-[22px] text-muted-foreground', !isExpanded && 'line-clamp-2')}>
                                  {item.description}
                                </p>
                                {item.description.length > 150 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(item.id)}
                                    aria-expanded={isExpanded}
                                    className="relative z-10 mt-1 inline-flex items-center gap-1 text-[13px] leading-5 text-muted-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 ease-dossier hover:text-foreground hover:decoration-foreground"
                                  >
                                    {isExpanded ? 'Show less' : 'Show more'}
                                    <ChevronDown
                                      className={cn('h-4 w-4 text-faint transition-transform duration-150 ease-dossier', isExpanded && 'rotate-180')}
                                      strokeWidth={1.5}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>

            {filteredItems.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No entries of this type</p>
            )}
          </div>
        ) : (
          // TIMELINE VIEW: the same entries on a printed time scale
          <div>
            <div className="tl-chart">
              <div className="tl-lanes" style={{ height: `${chart.height}px` }}>
                <div className="tl-rule" style={{ top: `${AXIS_H}px` }} />
                {chart.lanes.map((lane) => (
                  <div key={lane.type} className="tl-lane" style={{ top: `${lane.top}px` }} data-cat={lane.type}>
                    <span className="cat-dot" aria-hidden="true" />
                    {lane.label}
                  </div>
                ))}
                {chart.rules.map((y) => (
                  <div key={y} className="tl-rule" style={{ top: `${y}px` }} />
                ))}
              </div>

              {/* Right to left, so the chart opens on the latest years even before scripts run */}
              <div ref={timelineRef} className="tl-scroll" dir="rtl" tabIndex={0} aria-label="Timeline chart, scroll for earlier years">
                <div dir="ltr" className="relative" style={{ width: `${metrics.totalWidth}px`, height: `${chart.height}px` }}>
                  {renderTimelineAxis()}
                  <div className="tl-rule" style={{ top: `${AXIS_H}px` }} />
                  {chart.rules.map((y) => (
                    <div key={y} className="tl-rule" style={{ top: `${y}px` }} />
                  ))}

                  {chart.bars.map(({ item, top, left, width }) => {
                    // Build tooltip content
                    const tooltipContent = [
                      item.title,
                      item.subtitle ? `(${item.subtitle})` : '',
                      formatDateRange(item.startDate, item.endDate),
                      item.category ? `Category: ${item.category}` : '',
                      item.description ? `\n${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}` : '',
                    ]
                      .filter(Boolean)
                      .join('\n');

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="tl-bar"
                        data-cat={item.type}
                        data-current={isCurrent(item) ? '' : undefined}
                        style={{ left: `${left}px`, width: `${width}px`, top: `${top}px` }}
                        title={tooltipContent}
                        onClick={() => handleItemClick(item)}
                      >
                        <span>{item.title}</span>
                      </button>
                    );
                  })}

                  <div className="tl-now" style={{ left: `${metrics.x(Date.now())}px` }} aria-hidden="true">
                    <span>Now</span>
                  </div>
                </div>
              </div>
            </div>

            {filteredItems.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No entries of this type</p>
            )}
          </div>
        )}
      </div>

      {/* Detail Dialogs */}
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
    </section>
  );
};

export default TimelineSection;
