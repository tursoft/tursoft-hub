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
import { skillsRepo } from '@/repositories/SkillsRepo';
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

  // Helper function to calculate duration between two dates
  const calculateDuration = (startDate: string | undefined, endDate: string | null | undefined): string => {
    if (!startDate) return '';
    
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
      
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
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
    } catch (error) {
      return '';
    }
  };

  const loadRelatedData = async () => {
    if (!skill) return;
    
    setIsLoadingData(true);
    try {
      // Use SkillsRepo methods to load related data
      const filteredExperiences = await skillsRepo.getExperiencesBySkillCode(skill.code);
      setExperiences(filteredExperiences);

      const filteredProjects = await skillsRepo.getProjectsBySkillCode(skill.code);
      setProjects(filteredProjects);

      const filteredEducations = await skillsRepo.getEducationsBySkillCode(skill.code);
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

            <div>
              <TabsContent value="projects" className="max-h-[60vh] overflow-y-auto">
                <ListViewer<ProjectEntry>
                  data={projects}
                  isLoading={isLoadingData}
                  loadingMessage="Loading projects..."
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
                    description: (project) => '',
                    image: (project) => project.photoUrl || '',
                    date: (project) => {
                      if (project.datePeriod) {
                        const start = project.datePeriod.startDate || '';
                        const end = project.datePeriod.endDate || 'Present';
                        const dateRange = start && end ? `${start} - ${end}` : '';
                        
                        if (dateRange && project.datePeriod.startDate) {
                          const duration = calculateDuration(
                            project.datePeriod.startDate,
                            project.datePeriod.endDate
                          );
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

              <TabsContent value="experiences" className="max-h-[60vh] overflow-y-auto">
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
                    description: (exp) => '',
                    image: (exp) => {
                      const company = companies[exp.companyCode || ''];
                      return company?.photoUrl || '';
                    },
                    date: (exp) => {
                      if (exp.positions && exp.positions.length > 0) {
                        const position = exp.positions[0];
                        const start = position.startDate || '';
                        const end = position.endDate || 'Present';
                        const dateRange = start && end ? `${start} - ${end}` : '';
                        
                        if (dateRange && position.startDate) {
                          const duration = calculateDuration(position.startDate, position.endDate);
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

              <TabsContent value="educations" className="max-h-[60vh] overflow-y-auto">
                <ListViewer<Education>
                  data={educations}
                  isLoading={isLoadingData}
                  loadingMessage="Loading educations..."
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
                    description: (edu) => '',
                    image: (edu) => {
                      const company = companies[edu.companyCode || ''];
                      return company?.photoUrl || '';
                    },
                    date: (edu) => {
                      if (edu.datePeriod) {
                        const start = edu.datePeriod.startDate || '';
                        const end = edu.datePeriod.endDate || '';
                        const dateRange = start && end ? `${start} - ${end}` : edu.period || '';
                        
                        if (dateRange && edu.datePeriod.startDate) {
                          const duration = calculateDuration(
                            edu.datePeriod.startDate,
                            edu.datePeriod.endDate
                          );
                          return duration ? `${dateRange}\n${duration}` : dateRange;
                        }
                        return dateRange;
                      }
                      return edu.period || '';
                    },
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SkillDetailDialog;
