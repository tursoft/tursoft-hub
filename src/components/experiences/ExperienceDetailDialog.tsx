import React, { useEffect, useState } from 'react';
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
import { CardDescription } from "@/components/ui/card";
import { 
  Calendar, 
  Clock,
  MapPin,
  ExternalLink,
  Linkedin,
  Briefcase,
  Maximize2,
  Minimize2
} from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { domainsRepo } from '@/repositories/DomainsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';


import type { Experience, Position } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { SkillItem } from '@/models/Skills';
import type { Domain } from '@/models/Domain';
import type { Company } from '@/models/Companies';

interface ExperienceDetailDialogProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExperienceDetailDialog: React.FC<ExperienceDetailDialogProps> = ({
  experience,
  isOpen,
  onClose
}) => {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [domains, setDomains] = useState<Record<string, Domain[]>>({});
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  // Resolve all codes to actual objects when experience changes
  useEffect(() => {
    const loadData = async () => {
      if (!experience) {
        setProjects([]);
        setSkills([]);
        setDomains({});
        setCompany(null);
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      try {
        // Resolve company code to company object
        if (experience.companyCode) {
          const companyData = await companiesRepo.getByCode(experience.companyCode);
          setCompany(companyData);
        } else {
          setCompany(null);
        }

        // Collect all unique project codes
        const projectCodesSet = new Set<string>();
        experience.positions.forEach(position => {
          position.projectCodes?.forEach(code => projectCodesSet.add(code));
        });

        // Resolve project codes to project objects
        const projectsArray: ProjectEntry[] = [];
        for (const code of projectCodesSet) {
          const project = await projectsRepo.getByCode(code);
          if (project) {
            projectsArray.push(project);
          }
        }
        setProjects(projectsArray);

        // Collect all unique skill codes
        const skillCodesSet = new Set<string>();
        experience.positions.forEach(position => {
          position.skillCodes?.forEach(code => skillCodesSet.add(code));
        });

        // Resolve skill codes to skill objects
        const skillsArray: SkillItem[] = [];
        for (const code of skillCodesSet) {
          const skill = await skillsRepo.getByCode(code);
          if (skill) {
            skillsArray.push(skill);
          }
        }
        setSkills(skillsArray);

        // Resolve domain codes for each position
        const domainsMap: Record<string, Domain[]> = {};
        for (const position of experience.positions) {
          if (position.domainCodes && position.domainCodes.length > 0) {
            const positionDomains: Domain[] = [];
            for (const code of position.domainCodes) {
              const domain = await domainsRepo.getByCode(code);
              if (domain) {
                positionDomains.push(domain);
              }
            }
            domainsMap[position.title] = positionDomains;
          }
        }
        setDomains(domainsMap);
      } catch (error) {
        console.error('Failed to load experience data:', error);
        setProjects([]);
        setSkills([]);
        setDomains({});
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [experience]);
  
  if (!experience) return null;

  // Helper function to format date period
  const formatDatePeriod = (startDate: string, endDate: string | null) => {
    if (!startDate) return '';
    
    const formatDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    };
    
    const startFormatted = formatDate(startDate);
    
    if (!endDate) {
      return `${startFormatted} - Present`;
    }
    
    const endFormatted = formatDate(endDate);
    return `${startFormatted} - ${endFormatted}`;
  };

  // Calculate total experience duration
  const calculateTotalDuration = () => {
    if (!experience.positions.length) return '';
    
    const sortedPositions = [...experience.positions].sort((a, b) => 
      new Date(a.startDate.split('.').reverse().join('-')).getTime() - 
      new Date(b.startDate.split('.').reverse().join('-')).getTime()
    );
    
    const firstPosition = sortedPositions[0];
    const lastPosition = sortedPositions[sortedPositions.length - 1];
    
    const start = new Date(firstPosition.startDate.split('.').reverse().join('-'));
    const end = lastPosition.endDate ? 
      new Date(lastPosition.endDate.split('.').reverse().join('-')) : 
      new Date();
    
    const years = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    let duration = '';
    if (years > 0) duration += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) duration += `${duration ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
    
    return duration || '< 1 month';
  };

  // Group all skills by group
  const groupedSkills = skills.reduce((acc, skill) => {
    const group = skill.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(skill);
    return acc;
  }, {} as Record<string, SkillItem[]>);

  const totalTechCount = skills.length;
  const hasCurrentPosition = experience.positions.some(pos => !pos.endDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-full max-h-full w-full h-full rounded-none' : 'max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg'} overflow-hidden`}>
        <DialogHeader className="pb-6 pl-6">
          {/* Maximize/Minimize Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="absolute top-4 right-12 z-10 h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {/* Logo positioned below buttons */}
          {company?.photoUrl && (
            <div className="absolute top-14 right-4 z-10 w-16 h-16">
              <img 
                src={company.photoUrl} 
                alt={`${company.title} logo`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {company?.title || experience.code || 'Company'}
                </DialogTitle>
                {hasCurrentPosition && (
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-base text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>{calculateTotalDuration()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Turkey</span>
                </div>
                {(company?.websiteUrl || company?.linkedinUrl) && (
                  <div className="flex items-center gap-3 mt-3">
                    {company.websiteUrl && (
                      <a 
                        href={company.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {company.linkedinUrl && (
                      <a 
                        href={company.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="positions">
              <span className="flex items-center gap-2">
                Positions
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {experience.positions.length}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {totalTechCount}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="projects">
              <span className="flex items-center gap-2">
                Projects
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {projects.length}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="positions" className="space-y-3 min-h-[400px]">
              {experience.positions.map((position, index) => (
                <div key={index} className="px-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">{position.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDatePeriod(position.startDate, position.endDate)}</span>
                        {!position.endDate && (
                          <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <CardDescription 
                    className="text-sm leading-relaxed text-foreground mb-3"
                    dangerouslySetInnerHTML={{ __html: position.summary.replace(/<br\/>/g, '<br/>') }}
                  />
                  
                  {domains[position.title] && domains[position.title].length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {domains[position.title].map((domain) => (
                          <Badge key={domain.code} variant="secondary" className="text-xs">
                            {domain.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}                
                  
                  {index < experience.positions.length - 1 && (
                    <div className="border-b border-border/30 mt-4"></div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="technologies" className="space-y-2 min-h-[400px]">
              <div className="px-4 py-2">
                {isLoadingData ? (
                  <div className="text-center text-muted-foreground py-8">Loading skills...</div>
                ) : skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    {skills.map((skill, index, allSkills) => {
                      const logoPath = skill.photoUrl || "";
                      const isEven = index % 2 === 0;
                      const isLastInColumn = index === allSkills.length - 1 || 
                        (isEven && index === allSkills.length - 2 && allSkills.length % 2 === 0);
                      
                      return (
                        <div key={skill.code}>
                          <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                            {logoPath && (
                              <img 
                                src={logoPath} 
                                alt={`${skill.title} logo`} 
                                className="w-5 h-5 object-contain flex-shrink-0" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {skill.title}
                            </span>
                          </div>
                          {!isLastInColumn && (
                            <div className="border-b border-dashed border-border/50 mx-4"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No skills listed for this experience.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-3 min-h-[400px]">
              <div className="px-4 py-2">
                {isLoadingData ? (
                  <div className="text-center text-muted-foreground py-8">Loading projects...</div>
                ) : projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project) => {
                      const logoPath = project.photoUrl || "";

                      return (
                        <div key={project.code} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          {logoPath ? (
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                              <img
                                src={logoPath}
                                alt={`${project.title} logo`}
                                className="w-7 h-7 object-contain rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-primary" />
                            </div>
                          )}

                          <div>
                            <div className="font-medium">{project.title}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specific projects listed for this experience.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceDetailDialog;