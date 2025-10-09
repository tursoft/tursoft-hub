import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
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
  Mail,
  Phone,
  Globe,
  Linkedin
} from "lucide-react";
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import type { Person } from '@/models/People';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';

interface PeopleDetailDialogProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

const PeopleDetailDialog: React.FC<PeopleDetailDialogProps> = ({
  person,
  isOpen,
  onClose
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});
  const [projectLogos, setProjectLogos] = useState<Record<string, string>>({});
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Fetch experiences and projects related to this person
  useEffect(() => {
    const fetchData = async () => {
      if (!person?.code) return;

      try {
        // Fetch all projects
        const allProjects = await projectsRepo.getList();
        
        // Filter projects where this person is a team member
        const personProjects = allProjects.filter(project => 
          project.team?.some(member => member.personCode === person.code)
        );
        setProjects(personProjects);

        // Get distinct company codes from person's projects
        const companyCodes = new Set<string>();
        personProjects.forEach(project => {
          if (project.companyCode) companyCodes.add(project.companyCode);
        });

        // Fetch all experiences and filter by company codes from person's projects
        const allExperiences = await experienceRepo.getList();
        const personExperiences = allExperiences.filter(experience => 
          experience.companyCode && companyCodes.has(experience.companyCode)
        );
        
        // Remove duplicates based on experience code
        const uniqueExperiences = Array.from(
          new Map(personExperiences.map(exp => [exp.code, exp])).values()
        );
        setExperiences(uniqueExperiences);

        // Load companies for projects and experiences
        const companiesData: { [key: string]: Company } = {};
        for (const code of companyCodes) {
          const company = await companiesRepo.getByCode(code);
          if (company) companiesData[code] = company;
        }
        setCompanies(companiesData);

        // Fetch project logos
        const logos: Record<string, string> = {};
        for (const project of personProjects) {
          if (project.code) {
            const logo = await projectsRepo.getPhotoUrlByCode(project.code);
            if (logo) logos[project.code] = logo;
          }
        }
        setProjectLogos(logos);

      } catch (error) {
        console.error('Failed to load person data:', error);
      }
    };

    if (person && isOpen) {
      fetchData();
    }
  }, [person, isOpen]);

  const handleClose = () => {
    setIsMaximized(false);
    onClose();
  };

  if (!person) return null;

  // Get contact information
  const linkedinContact = person.contacts?.find(c => c.code === 'linkedin');
  const emailContact = person.contacts?.find(c => c.code === 'email');
  const phoneContact = person.contacts?.find(c => c.code === 'phone');
  const websiteContact = person.contacts?.find(c => c.code === 'website');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent 
          className={`transition-all duration-300 ${
            isMaximized 
              ? 'max-w-[95vw] h-[95vh]' 
              : 'max-w-4xl max-h-[90vh]'
          } overflow-hidden flex flex-col`}
        >
          {/* Logo/Photo */}
          {person.photoUrl && (
            <div className="absolute top-4 left-8 z-10 w-16 h-16">
              <img 
                src={person.photoUrl} 
                alt={`${person.title} photo`} 
                className="w-full h-full object-cover rounded-full border-2 border-border"
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
                  {person.title}
                </DialogTitle>
                {person.company && (
                  <p className="text-muted-foreground mt-2 text-base">
                    {person.company}
                  </p>
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

          {/* Type Badge */}
          <div className="absolute top-14 right-4 z-10">
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
              Person
            </Badge>
          </div>

          {/* Contact Information */}
          {person.contacts && person.contacts.length > 0 && (
            <div className="flex-shrink-0 pl-24 pb-4">
              <div className="flex flex-wrap gap-3">
                {linkedinContact?.value && (
                  <a
                    href={linkedinContact.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {emailContact?.value && (
                  <a
                    href={`mailto:${emailContact.value}`}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {emailContact.value}
                  </a>
                )}
                {phoneContact?.value && (
                  <a
                    href={`tel:${phoneContact.value}`}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {phoneContact.value}
                  </a>
                )}
                {websiteContact?.value && (
                  <a
                    href={websiteContact.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden pl-24 pt-2">
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
                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-3 min-h-[400px] mt-0 h-full overflow-y-auto">
                  <div className="px-4 py-2">
                    {projects.length > 0 ? (
                      <div className="space-y-3">
                        {projects.map((project) => {
                          const company = companies[project.companyCode || ''];
                          const logoPath = projectLogos[project.code] || project.photoUrl || "";
                          const teamMember = project.team?.find(m => m.personCode === person.code);
                          
                          return (
                            <Card 
                              key={project.code}
                              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                              onClick={() => {
                                setSelectedProject(project);
                                setIsProjectDialogOpen(true);
                              }}
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
                                    {teamMember?.position && (
                                      <p className="text-sm text-primary mb-1">
                                        {teamMember.position}
                                      </p>
                                    )}
                                    {project.summary && (
                                      <CardDescription className="text-sm line-clamp-2">
                                        {project.summary}
                                      </CardDescription>
                                    )}
                                    {company && (
                                      <div className="mt-2">
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
                      <p className="text-muted-foreground text-center py-8">No projects found.</p>
                    )}
                  </div>
                </TabsContent>

                {/* Experiences Tab */}
                <TabsContent value="experiences" className="space-y-3 min-h-[400px] mt-0 h-full overflow-y-auto">
                  <div className="px-4 py-2">
                    {experiences.length > 0 ? (
                      <div className="space-y-3">
                        {experiences.map((experience) => {
                          const company = companies[experience.companyCode || ''];
                          const logoPath = company?.photoUrl || "";
                          
                          // Find the person's position(s) from projects at this company
                          const personPositions = projects
                            .filter(project => project.companyCode === experience.companyCode)
                            .map(project => {
                              const teamMember = project.team?.find(member => member.personCode === person.code);
                              return teamMember?.position;
                            })
                            .filter(Boolean); // Remove undefined values
                          
                          // Get unique positions
                          const uniquePositions = [...new Set(personPositions)];
                          const positionText = uniquePositions.length > 0 
                            ? uniquePositions.join(', ') 
                            : 'Team Member';
                          
                          return (
                            <Card 
                              key={experience.code}
                              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                              onClick={() => {
                                setSelectedExperience(experience);
                                setIsExperienceDialogOpen(true);
                              }}
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
                                    <CardDescription className="text-sm line-clamp-2">
                                      {positionText}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No experiences found.</p>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Experience Detail Dialog */}
      <ExperienceDetailDialog
        experience={selectedExperience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
      />

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
        projectIcon={selectedProject?.photoUrl}
      />
    </>
  );
};

export default PeopleDetailDialog;
