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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ListViewer from "@/components/ui/listviewer";
import {
  Maximize2,
  Minimize2,
  Briefcase,
  FolderKanban
} from "lucide-react";
import type { Domain } from '@/models/Domain';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';

interface DomainDetailDialogProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
}

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

  const logoPath = domain.photoUrl || "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`transition-all duration-300 ${
          isMaximized 
            ? 'max-w-[95vw] h-[95vh]' 
            : 'max-w-4xl max-h-[90vh]'
        } overflow-hidden flex flex-col z-[100] h-[80%]`}
      >
        {/* Logo */}
        {logoPath && (
          <div className="absolute top-4 left-8 z-10 w-16 h-16">
            <img 
              src={logoPath} 
              alt={`${domain.title} icon`} 
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Header */}
        <DialogHeader className="flex-shrink-0 pl-24">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold pr-4">
                {domain.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {domain.code}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-8 w-8 hover:bg-accent"
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Type Badge - positioned below buttons */}
        <div className="absolute top-14 right-4 z-10">
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">
            Domain
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden pl-2 pt-2">
          <Tabs defaultValue="projects" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="projects">
                <span className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4" />
                  Projects
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {projects.length}
                  </Badge>
                </span>
              </TabsTrigger>

              <TabsTrigger value="experiences">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Experiences
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {experiences.length}
                  </Badge>
                </span>
              </TabsTrigger>

            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="experiences" className="space-y-3 min-h-[400px] mt-0 h-full overflow-y-auto">
                <div className="px-4 py-2">
                  {isLoadingData ? (
                    <div className="text-center text-muted-foreground py-8">Loading experiences...</div>
                  ) : experiences.length > 0 ? (
                    <ListViewer<Experience> 
                      data={experiences}
                      defaultViewMode="list"
                      enabledModes={['list']}
                      onItemClick={(experience) => onOpenExperience?.(experience)}
                      fieldMapping={{
                        code: (e) => e.code || '',
                        title: (e: Experience) => companies[e.companyCode || '']?.title || e.companyCode,
                        subtitle: (e: Experience) => e.positions && e.positions.length > 0 ? e.positions[0].title : '',
                        description: (e) => '',
                        image: (e) => companies[e.companyCode || '']?.photoUrl || '',
                        date: (e) => ''
                      }}
                      imageRounded={false}
                    />
                  ) : (
                    <p className="text-muted-foreground">No experiences found.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-3 min-h-[400px] mt-0 h-full overflow-y-auto">
                <div className="px-4 py-2">
                  {isLoadingData ? (
                    <div className="text-center text-muted-foreground py-8">Loading projects...</div>
                  ) : projects.length > 0 ? (
                    <ListViewer<ProjectEntry>
                      data={projects}
                      defaultViewMode="list"
                      enabledModes={['list']}
                      onItemClick={(project) => onOpenProject?.(project)}
                      fieldMapping={{
                        code: (p) => p.code || '',
                        title: (p) => p.title || '',
                        subtitle: (p) => '',
                        description: (p) => '',
                        image: (p) => p.photoUrl || '',
                        date: (p) => ''
                      }}
                      imageRounded={false}
                    />
                  ) : (
                    <p className="text-muted-foreground">No projects found.</p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DomainDetailDialog;
