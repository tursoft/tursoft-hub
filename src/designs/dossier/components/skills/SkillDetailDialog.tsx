import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@design/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@design/components/ui/tabs";
import { SkillStats } from "@design/components/skills/SkillStats";
import { Button } from "@design/components/ui/button";
import { LogoPlate } from "@design/components/ui/logo-plate";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { sheet } from '@design/components/domains/sheet';
import type SkillItem from '@/models/Skills';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import type { Education } from '@/models/Education';
import ListViewer from '@design/components/ui/listviewer';
import { parseDate, calculateDuration, type DateRange } from '@/lib/datetimeutils';

interface SkillDetailDialogProps {
  skill: SkillItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
  onOpenEducation?: (education: Education) => void;
}

const SkillDetailDialog: React.FC<SkillDetailDialogProps> = ({ 
  skill, 
  isOpen, 
  onClose,
  onOpenExperience,
  onOpenProject,
  onOpenEducation
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});

  const loadRelatedData = async () => {
    if (!skill) return;
    
    setIsLoadingData(true);
    try {
      // Use SkillsRepo methods to load related data
      const filteredExperiences = await skillsRepo.getExperiencesBySkillCode(skill.code);
      
      // Sort experiences by end date (most recent first)
      const sortedExperiences = filteredExperiences.sort((a, b) => {
        const aEndDate = a.positions?.[0]?.endDate || '';
        const bEndDate = b.positions?.[0]?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setExperiences(sortedExperiences);

      const filteredProjects = await skillsRepo.getProjectsBySkillCode(skill.code);
      
      // Sort projects by end date (most recent first)
      const sortedProjects = filteredProjects.sort((a, b) => {
        const aEndDate = a.datePeriod?.endDate || '';
        const bEndDate = b.datePeriod?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setProjects(sortedProjects);

      const filteredEducations = await skillsRepo.getEducationsBySkillCode(skill.code);
      
      // Sort educations by end date (most recent first)
      const sortedEducations = filteredEducations.sort((a, b) => {
        const aEndDate = a.datePeriod?.endDate || '';
        const bEndDate = b.datePeriod?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setEducations(sortedEducations);

      // Load companies for experiences, projects, and educations
      const companyCodes = new Set<string>();
      sortedExperiences.forEach(exp => {
        if (exp.companyCode) companyCodes.add(exp.companyCode);
      });
      sortedProjects.forEach(project => {
        if (project.companyCode) companyCodes.add(project.companyCode);
      });
      sortedEducations.forEach(edu => {
        if (edu.companyCode) companyCodes.add(edu.companyCode);
      });

      const companiesData: { [key: string]: Company } = {};
      for (const code of companyCodes) {
        const company = await companiesRepo.getByCode(code);
        if (company) companiesData[code] = company;
      }
      setCompanies(companiesData);

    } catch (error) {
      console.error('Error loading skill data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (skill && isOpen) {
      loadRelatedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill, isOpen]);

  const handleClose = () => {
    setIsMaximized(false);
    onClose();
  };

  if (!skill) return null;

  const logoPath = skill.photoUrl || "";

  // Calculate total experience duration using min start date and max end date
  const calculateTotalExperience = (): string => {
    let minStartDate: Date | null = null;
    let maxEndDate: Date | null = null;

    // Process experiences
    experiences.forEach(exp => {
      exp.positions?.forEach(pos => {
        if (pos.startDate) {
          const start = parseDate(pos.startDate);
          if (start && !isNaN(start.getTime())) {
            if (!minStartDate || start < minStartDate) {
              minStartDate = start;
            }
          }

          const end = pos.endDate ? parseDate(pos.endDate) : new Date();
          if (end && !isNaN(end.getTime())) {
            if (!maxEndDate || end > maxEndDate) {
              maxEndDate = end;
            }
          }
        }
      });
    });

    // Process projects
    projects.forEach(project => {
      if (project.datePeriod?.startDate) {
        const start = parseDate(project.datePeriod.startDate);
        if (start && !isNaN(start.getTime())) {
          if (!minStartDate || start < minStartDate) {
            minStartDate = start;
          }
        }

        const end = project.datePeriod.endDate ? parseDate(project.datePeriod.endDate) : new Date();
        if (end && !isNaN(end.getTime())) {
          if (!maxEndDate || end > maxEndDate) {
            maxEndDate = end;
          }
        }
      }
    });

    // Process educations
    educations.forEach(edu => {
      if (edu.datePeriod?.startDate) {
        const start = parseDate(edu.datePeriod.startDate);
        if (start && !isNaN(start.getTime())) {
          if (!minStartDate || start < minStartDate) {
            minStartDate = start;
          }
        }

        const end = edu.datePeriod?.endDate ? parseDate(edu.datePeriod.endDate) : new Date();
        if (end && !isNaN(end.getTime())) {
          if (!maxEndDate || end > maxEndDate) {
            maxEndDate = end;
          }
        }
      }
    });

    // Calculate duration between min start and max end
    if (!minStartDate || !maxEndDate) return '';

    const months = (maxEndDate.getFullYear() - minStartDate.getFullYear()) * 12 + 
                   (maxEndDate.getMonth() - minStartDate.getMonth());
    
    if (months <= 0) return '';

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} yr${years > 1 ? 's' : ''}`;
    } else if (remainingMonths > 0) {
      return `${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
    }
    return '';
  };

  const totalExperience = calculateTotalExperience();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          sheet.content,
          'z-[100]',
          'h-full max-h-full w-full max-w-full rounded-none sm:rounded-lg',
          isMaximized ? 'sm:h-[95vh] sm:max-h-[95vh] sm:max-w-[95vw]' : 'sm:h-[80vh] sm:max-h-[90vh] sm:max-w-4xl',
        )}
      >
        {/* Header: kicker, logo and serif title, total experience, competency */}
        <DialogHeader className={sheet.head}>
          <p className={sheet.kicker}>
            Skill{skill.group ? ` · ${String(skill.group)}` : ''}
          </p>
          <div className="mt-3 flex items-start gap-4">
            {logoPath && (
              <LogoPlate src={logoPath} alt={`${skill.title} logo`} className="h-14 w-14 flex-shrink-0 p-2" />
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className={sheet.title}>{skill.title}</DialogTitle>
              <DialogDescription className={cn(sheet.meta, 'tnum mt-1', !totalExperience && 'sr-only')}>
                {totalExperience
                  ? `Total experience ${totalExperience}`
                  : `Projects, experiences and education with ${skill.title}`}
              </DialogDescription>
              <SkillStats skill={skill} compact className="mt-4 max-w-sm" />
            </div>
          </div>
        </DialogHeader>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMaximized(!isMaximized)}
          className={sheet.cornerButton}
          aria-label={isMaximized ? 'Restore size' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        </Button>

        {/* Content */}
        <Tabs defaultValue="projects" className={sheet.tabs}>
          <TabsList className={sheet.tabList}>
            <TabsTrigger value="projects">
              Projects
              <span className={sheet.tabCount}>{projects.length}</span>
            </TabsTrigger>
            <TabsTrigger value="experiences">
              Experiences
              <span className={sheet.tabCount}>{experiences.length}</span>
            </TabsTrigger>
            <TabsTrigger value="educations">
              Education
              <span className={sheet.tabCount}>{educations.length}</span>
            </TabsTrigger>
          </TabsList>

            <div className={sheet.body}>
              <TabsContent value="projects" className="mt-0">
                <ListViewer<ProjectEntry>
                  data={projects}
                  isLoading={isLoadingData}
                  loadingMessage="Loading projects"
                  emptyMessage=""
                  defaultViewMode="list"
                  enabledModes={['list']}
                  fieldMapping={{
                    code: (project) => project.code || '',
                    title: (project) => project.title || '',
                    subtitle: (project) => {
                      const company = companies[project.companyCode || ''];
                      return company?.title || '';
                    },
                    description: () => '',
                    image: (project) => project.photoUrl || '',
                    date: (project) => {
                      if (project.datePeriod) {
                        const start = project.datePeriod.startDate || '';
                        const end = project.datePeriod.endDate || 'Present';
                        const dateRange = start && end ? `${start} – ${end}` : '';
                        
                        if (dateRange && project.datePeriod.startDate) {
                          const duration = calculateDuration([{
                            startDate: project.datePeriod.startDate,
                            endDate: project.datePeriod.endDate
                          }]);
                          return duration ? `${dateRange}\n${duration}` : dateRange;
                        }
                        return dateRange;
                      }
                      return '';
                    },
                  }}
                  onItemClick={(project) => onOpenProject?.(project)}
                />
              </TabsContent>

              <TabsContent value="experiences" className="mt-0">
                <ListViewer<Experience>
                  data={experiences}
                  isLoading={isLoadingData}
                  loadingMessage="Loading experiences"
                  emptyMessage=""
                  defaultViewMode="list"
                  enabledModes={['list']}
                  fieldMapping={{
                    code: (exp) => exp.code || exp.companyCode || '',
                    title: (exp) => {
                      const company = companies[exp.companyCode || ''];
                      return company?.title || exp.companyCode || '';
                    },
                    subtitle: (exp) => {
                      if (exp.positions && exp.positions.length > 0) {
                        return exp.positions[0].title || '';
                      }
                      return '';
                    },
                    description: () => '',
                    image: (exp) => {
                      const company = companies[exp.companyCode || ''];
                      return company?.photoUrl || '';
                    },
                    date: (exp) => {
                      if (exp.positions && exp.positions.length > 0) {
                        const position = exp.positions[0];
                        const start = position.startDate || '';
                        const end = position.endDate || 'Present';
                        const dateRange = start && end ? `${start} – ${end}` : '';
                        
                        if (dateRange && position.startDate) {
                          const duration = calculateDuration([{
                            startDate: position.startDate,
                            endDate: position.endDate
                          }]);
                          return duration ? `${dateRange}\n${duration}` : dateRange;
                        }
                        return dateRange;
                      }
                      return '';
                    },
                  }}
                  onItemClick={(experience) => onOpenExperience?.(experience)}
                />
              </TabsContent>

              <TabsContent value="educations" className="mt-0">
                <ListViewer<Education>
                  data={educations}
                  isLoading={isLoadingData}
                  loadingMessage="Loading education"
                  emptyMessage=""
                  defaultViewMode="list"
                  enabledModes={['list']}
                  fieldMapping={{
                    code: (edu) => edu.code || '',
                    title: (edu) => {
                      const company = companies[edu.companyCode || ''];
                      return company?.title || edu.companyCode || '';
                    },
                    subtitle: (edu) => edu.department || '',
                    description: () => '',
                    image: (edu) => {
                      const company = companies[edu.companyCode || ''];
                      return company?.photoUrl || '';
                    },
                    badge: (edu) => edu.level || '',
                    date: (edu) => {
                      if (edu.datePeriod) {
                        const start = edu.datePeriod.startDate || '';
                        const end = edu.datePeriod.endDate || '';
                        const dateRange = start && end ? `${start} – ${end}` : edu.period || '';
                        
                        if (dateRange && edu.datePeriod.startDate) {
                          const duration = calculateDuration([{
                            startDate: edu.datePeriod.startDate,
                            endDate: edu.datePeriod.endDate
                          }]);
                          return duration ? `${dateRange}\n${duration}` : dateRange;
                        }
                        return dateRange;
                      }
                      return edu.period || '';
                    },
                  }}
                  onItemClick={(education) => onOpenEducation?.(education)}
                />
              </TabsContent>
            </div>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SkillDetailDialog;
