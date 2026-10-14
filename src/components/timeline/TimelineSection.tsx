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

type TimelineItemType = 'project' | 'experience' | 'education';
type ViewMode = 'list' | 'timeline';
type ZoomLevel = 'year' | 'month' | 'day';

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string | null;
  dateObj: Date;
  endDateObj: Date | null;
  category?: string;
  icon: typeof Briefcase;
  color: string;
  logoUrl?: string;
  data: ProjectEntry | Experience | Education;
}

const TimelineSection = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('year');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

  const categories = [
    { value: 'All', label: 'All', icon: Calendar },
    { value: 'project', label: 'Projects', icon: Code },
    { value: 'experience', label: 'Experience', icon: Briefcase },
    { value: 'education', label: 'Education', icon: GraduationCap },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projects, experiences, educations] = await Promise.all([
          projectsRepo.getList(),
          experienceRepo.getList(),
          educationRepo.getList(),
        ]);

        const timelineItems: TimelineItem[] = [];

        // Collect all company codes
        const companyCodes = new Set<string>();
        experiences.forEach(exp => {
          if (exp.companyCode) companyCodes.add(exp.companyCode);
        });
        educations.forEach(edu => {
          if (edu.companyCode) companyCodes.add(edu.companyCode);
        });

        // Load company data
        const companyLogos: { [key: string]: string } = {};
        await Promise.all(
          Array.from(companyCodes).map(async (code) => {
            const company = await companiesRepo.getByCode(code);
            if (company?.photoUrl) {
              companyLogos[code] = company.photoUrl;
            }
          })
        );

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
                subtitle: project.companyCode,
                description: project.summary,
                startDate: project.datePeriod.startDate,
                endDate: project.datePeriod.endDate || null,
                dateObj: startDate,
                endDateObj: endDate || new Date(),
                category: project.group,
                icon: Code,
                color: getEntityColors('project').text,
                logoUrl: project.photoUrl,
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
                  subtitle: experience.companyCode,
                  description: position.summary,
                  startDate: position.startDate,
                  endDate: position.endDate || null,
                  dateObj: startDate,
                  endDateObj: endDate || new Date(),
                  icon: Briefcase,
                  color: getEntityColors('experience').text,
                  logoUrl: companyLogos[experience.companyCode || ''],
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
                subtitle: education.companyCode,
                description: education.summary,
                startDate: education.datePeriod.startDate,
                endDate: education.datePeriod.endDate || null,
                dateObj: startDate,
                endDateObj: endDate || new Date(),
                category: education.level,
                icon: GraduationCap,
                color: getEntityColors('education').text,
                logoUrl: companyLogos[education.companyCode || ''],
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
  }, []);

  // Show the most recent years first when the timeline view opens or the zoom changes.
  useEffect(() => {
    if (viewMode !== 'timeline' || isLoading) return;
    const scroller = timelineRef.current;
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
  }, [viewMode, zoomLevel, isLoading]);

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

  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = startDate.split('.')[2] || startDate;
    const end = endDate ? (endDate.split('.')[2] || endDate) : 'Present';
    return start === end ? start : `${start} - ${end}`;
  };

  const getCategoryCount = (category: string) => {
    if (category === 'All') return items.length;
    return items.filter((item) => item.type === category).length;
  };

  const getTypeLabel = (type: TimelineItemType) => {
    switch (type) {
      case 'project':
        return 'Project';
      case 'experience':
        return 'Experience';
      case 'education':
        return 'Education';
      default:
        return type;
    }
  };

  const handleItemClick = (item: TimelineItem) => {
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

  // Timeline mode calculations
  const getTimelineMetrics = () => {
    const startYear = 1995;
    const currentDate = new Date();
    const endYear = currentDate.getFullYear();
    const totalYears = endYear - startYear + 1;

    let pixelsPerUnit = 100; // Base pixels per year
    let timeUnit = 'year';
    let unitCount = totalYears;

    if (zoomLevel === 'month') {
      pixelsPerUnit = 50; // pixels per month
      timeUnit = 'month';
      unitCount = totalYears * 12;
    } else if (zoomLevel === 'day') {
      pixelsPerUnit = 2; // pixels per day
      timeUnit = 'day';
      unitCount = totalYears * 365;
    }

    const totalWidth = pixelsPerUnit * unitCount;

    return {
      startYear,
      endYear,
      totalYears,
      pixelsPerUnit,
      timeUnit,
      unitCount,
      totalWidth,
      startDate: new Date(startYear, 0, 1),
      endDate: currentDate,
    };
  };

  const calculateItemPosition = (item: TimelineItem, metrics: ReturnType<typeof getTimelineMetrics>) => {
    const startTime = item.dateObj.getTime();
    const endTime = item.endDateObj ? item.endDateObj.getTime() : new Date().getTime();
    const timelineStart = metrics.startDate.getTime();
    const timelineEnd = metrics.endDate.getTime();

    const totalTimelineMs = timelineEnd - timelineStart;
    const itemStartMs = startTime - timelineStart;
    const itemDurationMs = endTime - startTime;

    const left = (itemStartMs / totalTimelineMs) * metrics.totalWidth;
    const width = Math.max((itemDurationMs / totalTimelineMs) * metrics.totalWidth, 20); // Minimum 20px

    return { left, width };
  };

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

  const handleZoomIn = () => {
    if (zoomLevel === 'year') setZoomLevel('month');
    else if (zoomLevel === 'month') setZoomLevel('day');
  };

  const handleZoomOut = () => {
    if (zoomLevel === 'day') setZoomLevel('month');
    else if (zoomLevel === 'month') setZoomLevel('year');
  };

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
                          className="group absolute cursor-pointer rounded-[4px]"
                          style={{ left: `${left}px`, width: `${width}px`, top: `${row * 34}px` }}
                          title={tooltipContent}
                          role="button"
                          tabIndex={0}
                          aria-label={`${item.title}, ${getTypeLabel(item.type)}, ${formatDateRange(item.startDate, item.endDate)}`}
                          onClick={() => handleItemClick(item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleItemClick(item);
                            }
                          }}
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
};

export default TimelineSection;
