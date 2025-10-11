import { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Briefcase, GraduationCap, Code, ChevronRight, List, BarChart3, ZoomIn, ZoomOut } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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
                color: 'text-blue-500',
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
                  color: 'text-blue-500',
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
                color: 'text-purple-500',
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

  const getTypeBadgeVariant = (type: TimelineItemType): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'project':
        return 'default';
      case 'experience':
        return 'secondary';
      case 'education':
        return 'outline';
      default:
        return 'outline';
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

    if (zoomLevel === 'year') {
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        const position = ((year - metrics.startYear) / metrics.totalYears) * metrics.totalWidth;
        markers.push(
          <div
            key={`year-${year}`}
            className="absolute top-0 h-full border-l border-border/30"
            style={{ left: `${position}px` }}
          >
            <div className="absolute -top-6 left-1 text-xs text-muted-foreground font-medium">
              {year}
            </div>
          </div>
        );
      }
    } else if (zoomLevel === 'month') {
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        for (let month = 0; month < 12; month++) {
          const totalMonths = (year - metrics.startYear) * 12 + month;
          const position = (totalMonths / metrics.unitCount) * metrics.totalWidth;
          
          if (month === 0) {
            markers.push(
              <div
                key={`month-${year}-${month}`}
                className="absolute top-0 h-full border-l border-border"
                style={{ left: `${position}px` }}
              >
                <div className="absolute -top-6 left-1 text-xs text-muted-foreground font-bold">
                  {year}
                </div>
              </div>
            );
          } else {
            markers.push(
              <div
                key={`month-${year}-${month}`}
                className="absolute top-0 h-full border-l border-border/20"
                style={{ left: `${position}px` }}
              />
            );
          }
        }
      }
    } else if (zoomLevel === 'day') {
      // Show only year markers for day view (too many to show all)
      for (let year = metrics.startYear; year <= metrics.endYear; year++) {
        const totalDays = (year - metrics.startYear) * 365;
        const position = (totalDays / metrics.unitCount) * metrics.totalWidth;
        markers.push(
          <div
            key={`day-${year}`}
            className="absolute top-0 h-full border-l border-border"
            style={{ left: `${position}px` }}
          >
            <div className="absolute -top-6 left-1 text-xs text-muted-foreground font-bold">
              {year}
            </div>
          </div>
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

  if (isLoading) {
    return (
      <section id="timeline" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading timeline...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="timeline" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <Badge variant="outline" className="mb-4">Career Journey</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Professional
            <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Timeline</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A chronological overview of my professional journey, education, and key projects
          </p>
        </div>

        {/* Category Filter and View Mode Toggle */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex flex-wrap gap-4 justify-between items-center ml-16">
            {/* Category Filter - Left Aligned */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="gap-2"
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                  <Badge variant={selectedCategory === category.value ? 'secondary' : 'outline'}>
                    {getCategoryCount(category.value)}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* View Mode Toggle and Zoom Controls - Right Aligned */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Zoom Controls (only visible in timeline mode) */}
              {viewMode === 'timeline' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel === 'year'}
                    className="gap-2"
                  >
                    <ZoomOut className="w-4 h-4" />
                    Zoom Out
                  </Button>
                  <Badge variant="secondary" className="px-4 py-2">
                    View: {zoomLevel === 'year' ? 'Years' : zoomLevel === 'month' ? 'Months' : 'Days'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel === 'day'}
                    className="gap-2"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Zoom In
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                </>
              )}
              
              {/* View Mode Toggle */}
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                List View
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Timeline View
              </Button>
            </div>
          </div>
        </div>

        {/* Content - List or Timeline View */}
        {viewMode === 'list' ? (
          // LIST VIEW
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

              {/* Timeline items */}
              <div className="space-y-8">
                {filteredItems.map((item, index) => {
                  const isExpanded = expandedItems.has(item.id);
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="relative animate-slide-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-8 -translate-x-1/2 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />

                      {/* Content card */}
                      <div className="ml-16">
                        <Card 
                          className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
                          onClick={() => handleItemClick(item)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Logo or Icon */}
                              {item.logoUrl ? (
                                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={item.logoUrl} 
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className={`flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center ${item.color}`}>
                                  <Icon className="w-8 h-8" />
                                </div>
                              )}

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {item.title}
                                      </h3>
                                      <Badge variant={getTypeBadgeVariant(item.type)} className="text-xs">
                                        {getTypeLabel(item.type)}
                                      </Badge>
                                    </div>
                                    {item.subtitle && (
                                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {formatDateRange(item.startDate, item.endDate)}
                                    </Badge>
                                    {item.category && (
                                      <Badge variant="secondary" className="text-xs">
                                        {item.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {item.description && (
                                  <>
                                    <p className={`text-sm text-muted-foreground mt-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                      {item.description}
                                    </p>
                                    {item.description.length > 150 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpand(item.id)}
                                        className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
                                      >
                                        {isExpanded ? 'Show less' : 'Show more'}
                                        <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No items found for the selected category.
                </div>
              )}
            </div>
          </div>
        ) : (
          // TIMELINE VIEW
          <div className="w-full">
            <div
              ref={timelineRef}
              className="relative overflow-x-auto overflow-y-hidden bg-card rounded-lg border border-border p-8"
              style={{ height: '600px' }}
            >
              <div className="relative" style={{ width: `${getTimelineMetrics().totalWidth}px`, height: '100%' }}>
                {/* Timeline axis */}
                <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary" />
                {renderTimelineAxis()}

                {/* Timeline items */}
                <div className="absolute top-20 left-0 right-0">
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const metrics = getTimelineMetrics();
                    const { left, width } = calculateItemPosition(item, metrics);
                    const row = index % 3; // Distribute items across 3 rows

                    return (
                      <div
                        key={item.id}
                        className="absolute group cursor-pointer"
                        style={{
                          left: `${left}px`,
                          width: `${width}px`,
                          top: `${row * 140}px`,
                        }}
                        title={`${item.title} (${formatDateRange(item.startDate, item.endDate)})`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className={`h-24 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:z-10 ${item.color} bg-card border-current p-2 overflow-hidden`}>
                          <div className="flex items-start gap-2 h-full">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold truncate text-foreground">{item.title}</h4>
                              {item.subtitle && (
                                <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                              )}
                              {item.category && (
                                <Badge variant="secondary" className="text-[10px] mt-1 px-1 py-0">
                                  {item.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No items found for the selected category.
              </div>
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
