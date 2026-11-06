import { DomainIcon } from './DomainIcon';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ListViewer from "@/components/ui/listviewer";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import type { Domain } from '@/models/Domain';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import { calculateDuration } from '@/lib/datetimeutils';
import { sheet } from './sheet';

interface DomainDetailDialogProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const DomainDetailDialog: React.FC<DomainDetailDialogProps> = ({
  domain,
  isOpen,
  onClose,
  onOpenExperience,
  onOpenProject
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});

  const loadRelatedData = async () => {
    if (!domain) return;

    setIsLoadingData(true);
    try {
      // Load experiences in this domain
      const allExperiences = await experienceRepo.getList();
      const filteredExperiences = allExperiences.filter(exp =>
        exp.positions?.some(pos => pos.domainCodes?.includes(domain.code || ''))
      );
      setExperiences(filteredExperiences);

      // Load projects in this domain
      const allProjects = await projectsRepo.getList();
      const filteredProjects = allProjects.filter(project =>
        project.domainCodes?.includes(domain.code || '')
      );
      setProjects(filteredProjects);

      // Load companies for experiences and projects
      const companyCodes = new Set<string>();
      filteredExperiences.forEach(exp => {
        if (exp.companyCode) companyCodes.add(exp.companyCode);
      });
      filteredProjects.forEach(project => {
        if (project.companyCode) companyCodes.add(project.companyCode);
      });

      const companiesData: { [key: string]: Company } = {};
      for (const code of companyCodes) {
        const company = await companiesRepo.getByCode(code);
        if (company) companiesData[code] = company;
      }
      setCompanies(companiesData);

    } catch (error) {
      console.error('Error loading domain data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (domain && isOpen) {
      loadRelatedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, isOpen]);

  const handleClose = () => {
    setIsMaximized(false);
    onClose();
  };

  if (!domain) return null;

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
        {/* Header: kicker, line icon and serif title, counts */}
        <DialogHeader className={sheet.head}>
          <p className={sheet.kicker}>Domain</p>
          <div className="mt-3 flex items-center gap-3">
            <DomainIcon code={domain.code} title={domain.title} photoUrl={domain.photoUrl} size="md" />
            <DialogTitle className={sheet.title}>{domain.title}</DialogTitle>
          </div>
          <DialogDescription className={cn(sheet.meta, 'tnum mt-2')}>
            {isLoadingData
              ? 'Loading projects and experiences'
              : `${plural(projects.length, 'project')} and ${plural(experiences.length, 'experience')}`}
          </DialogDescription>
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
          </TabsList>

          <div className={sheet.body}>
            <TabsContent value="experiences" className="mt-0">
              {isLoadingData ? (
                <p className={sheet.empty}>Loading experiences</p>
              ) : experiences.length > 0 ? (
                <ListViewer<Experience>
                  data={experiences}
                  defaultViewMode="list"
                  enabledModes={['list']}
                  onItemClick={(experience) => onOpenExperience?.(experience)}
                  fieldMapping={{
                    code: (e) => e.companyCode || '',
                    title: (e: Experience) => companies[e.companyCode || '']?.title || e.companyCode,
                    subtitle: (e: Experience) => e.positions && e.positions.length > 0 ? e.positions[0].title : '',
                    description: () => '',
                    image: (e) => companies[e.companyCode || '']?.photoUrl || '',
                    date: () => ''
                  }}
                  imageRounded={false}
                />
              ) : (
                <p className={sheet.empty}>No experiences in this domain</p>
              )}
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              {isLoadingData ? (
                <p className={sheet.empty}>Loading projects</p>
              ) : projects.length > 0 ? (
                <ListViewer<ProjectEntry>
                  data={projects}
                  defaultViewMode="list"
                  enabledModes={['list']}
                  onItemClick={(project) => onOpenProject?.(project)}
                  fieldMapping={{
                    code: (p) => p.code || '',
                    title: (p) => p.title || '',
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
                  imageRounded={false}
                />
              ) : (
                <p className={sheet.empty}>No projects in this domain</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DomainDetailDialog;
