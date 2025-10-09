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
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Maximize2,
  Minimize2,
  Info,
  Briefcase,
  FolderKanban
} from "lucide-react";
import type SkillItem from '@/models/Skills';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';

interface SkillDetailDialogProps {
  skill: SkillItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
}

const SkillDetailDialog: React.FC<SkillDetailDialogProps> = ({ 
  skill, 
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
    if (!skill) return;
    
    setIsLoadingData(true);
    try {
      // Load experiences that use this skill
      const allExperiences = await experienceRepo.getList();
      const filteredExperiences = allExperiences.filter(exp => 
        exp.positions?.some(pos => pos.skillCodes?.includes(skill.code || ''))
      );
      setExperiences(filteredExperiences);

      // Load projects that use this skill
      const allProjects = await projectsRepo.getList();
      const filteredProjects = allProjects.filter(project => 
        project.skillCodes?.includes(skill.code || '')
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`transition-all duration-300 ${
          isMaximized 
            ? 'max-w-[95vw] h-[95vh]' 
            : 'max-w-4xl max-h-[90vh]'
        } overflow-hidden flex flex-col z-[100] pr-16`}
      >
        {/* Logo */}
        {logoPath && (
          <div className="absolute top-4 left-8 z-10 w-16 h-16">
            <img 
              src={logoPath} 
              alt={`${skill.title} logo`} 
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
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                  Skill
                </Badge>
                {skill.isMajor && (
                  <Badge variant="default" className="text-xs">
                    Major
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold pr-4">
                {skill.title}
              </DialogTitle>
              {skill.code && (
                <DialogDescription className="mt-2 text-base">
                  {skill.code}
                </DialogDescription>
              )}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden pl-24">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mb-4">
              <TabsTrigger value="overview">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Overview
                </span>
              </TabsTrigger>
              {experiences.length > 0 && (
                <TabsTrigger value="experiences">
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Experiences
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {experiences.length}
                    </Badge>
                  </span>
                </TabsTrigger>
              )}
              {projects.length > 0 && (
                <TabsTrigger value="projects">
                  <span className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" />
                    Projects
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {projects.length}
                    </Badge>
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="overview" className="space-y-4 min-h-[400px] mt-0">
                <div className="px-4 py-2">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {experiences.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Experience{experiences.length !== 1 ? 's' : ''}</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary mb-2">
                            {projects.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Project{projects.length !== 1 ? 's' : ''}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Info */}
                  {skill.value && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Proficiency</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all duration-500"
                            style={{ width: `${skill.value}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{skill.value}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="experiences" className="space-y-3 min-h-[400px] mt-0">
                <div className="px-4 py-2">
                  {isLoadingData ? (
                    <div className="text-center text-muted-foreground py-8">Loading experiences...</div>
                  ) : experiences.length > 0 ? (
                    <div className="space-y-3">
                      {experiences.map((experience) => {
                        const company = companies[experience.companyCode || ''];
                        const logoPath = company?.photoUrl || "";
                        
                        return (
                          <Card 
                            key={experience.companyCode}
                            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                            onClick={() => onOpenExperience?.(experience)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {logoPath && (
                                  <div className="w-12 h-12 flex-shrink-0 bg-background rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                                    <img 
                                      src={logoPath} 
                                      alt={`${company?.title} logo`} 
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground mb-1">
                                    {company?.title || experience.companyCode}
                                  </h3>
                                  {experience.positions && experience.positions.length > 0 && (
                                    <CardDescription className="text-sm line-clamp-2">
                                      {experience.positions[0].title}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No experiences found.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-3 min-h-[400px] mt-0">
                <div className="px-4 py-2">
                  {isLoadingData ? (
                    <div className="text-center text-muted-foreground py-8">Loading projects...</div>
                  ) : projects.length > 0 ? (
                    <div className="space-y-3">
                      {projects.map((project) => {
                        const company = companies[project.companyCode || ''];
                        const logoPath = project.photoUrl || "";
                        
                        return (
                          <Card 
                            key={project.code}
                            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                            onClick={() => onOpenProject?.(project)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {logoPath && (
                                  <div className="w-12 h-12 flex-shrink-0 bg-background rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                                    <img 
                                      src={logoPath} 
                                      alt={`${project.title} logo`} 
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground mb-1">
                                    {project.title}
                                  </h3>
                                  {project.summary && (
                                    <CardDescription className="text-sm line-clamp-2">
                                      {project.summary}
                                    </CardDescription>
                                  )}
                                  {company && (
                                    <div className="mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {company.title}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
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

export default SkillDetailDialog;
