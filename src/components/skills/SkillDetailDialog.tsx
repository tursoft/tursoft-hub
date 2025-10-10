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
  Briefcase,
  FolderKanban,
  GraduationCap
} from "lucide-react";
import type SkillItem from '@/models/Skills';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { educationRepo } from '@/repositories/EducationRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import type { Education } from '@/models/Education';
import ListViewer from '@/components/ui/listviewer';

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
  const [educations, setEducations] = useState<Education[]>([]);
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

      // Load educations that use this skill
      const allEducations = await educationRepo.getList();
      const filteredEducations = allEducations.filter(edu => 
        edu.skillCodes?.includes(skill.code || '')
      );
      setEducations(filteredEducations);

      // Load companies for experiences, projects, and educations
      const companyCodes = new Set<string>();
      filteredExperiences.forEach(exp => {
        if (exp.companyCode) companyCodes.add(exp.companyCode);
      });
      filteredProjects.forEach(project => {
        if (project.companyCode) companyCodes.add(project.companyCode);
      });
      filteredEducations.forEach(edu => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`transition-all duration-300 ${
          isMaximized 
            ? 'max-w-[95vw] h-[95vh]' 
            : 'max-w-4xl max-h-[90vh]'
        } overflow-hidden flex flex-col z-[100] h-[80%]`}
      >
        {/* Top Panel - Logo and Header */}
        <div className="flex-shrink-0 min-h-[80px] relative">
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
          <DialogHeader className="pl-24 pr-16 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-bold pr-4">
                  {skill.title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
        </div>

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
        <div className="absolute top-14 right-4 flex gap-2 flex-wrap justify-end z-10">
          <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
            Skill
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 pt-2">
          <Tabs defaultValue="experiences" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 mb-4 grid w-full grid-cols-3">

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
              <TabsTrigger value="educations">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Educations
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {educations.length}
                  </Badge>
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="projects" className="h-[55%] overflow-y-auto">
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
                    <p className="text-muted-foreground"></p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="experiences" className="h-[55%] overflow-y-auto">
                <ListViewer<Experience>
                  data={experiences}
                  isLoading={isLoadingData}
                  loadingMessage="Loading experiences..."
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
                    description: (exp) => {
                      return '';
                    },
                    image: (exp) => {
                      const company = companies[exp.companyCode || ''];
                      return company?.photoUrl || '';
                    },
                  }}
                  onItemClick={(experience) => onOpenExperience?.(experience)}
                />
              </TabsContent>

              <TabsContent value="educations" className="h-[55%] overflow-y-auto">
                <div className="px-4 py-2">
                  {isLoadingData ? (
                    <div className="text-center text-muted-foreground py-8">Loading educations...</div>
                  ) : educations.length > 0 ? (
                    <div className="space-y-3">
                      {educations.map((education) => {
                        const company = companies[education.companyCode || ''];
                        const logoPath = company?.photoUrl || "";
                        
                        return (
                          <Card 
                            key={education.code}
                            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
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
                                    {company?.title || education.companyCode}
                                  </h3>
                                  <CardDescription className="text-sm">
                                    {education.department}
                                  </CardDescription>
                                  <CardDescription className="text-xs text-muted-foreground mt-1">
                                    {education.level} • {education.period}
                                  </CardDescription>
                                  {education.courses && education.courses.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">Courses:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {education.courses.slice(0, 3).map((course, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {course.title}
                                          </Badge>
                                        ))}
                                        {education.courses.length > 3 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{education.courses.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
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
                    <p className="text-muted-foreground"></p>
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
