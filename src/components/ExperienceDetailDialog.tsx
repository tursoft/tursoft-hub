import React from 'react';
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
import { CardDescription } from "@/components/ui/card";
import { 
  Calendar, 
  Building2, 
  Clock,
  MapPin,
  ExternalLink,
  Linkedin,
  Briefcase
} from "lucide-react";
import { getTechnologyLogo } from "@/lib/technologyLogos";

interface Technology {
  name: string;
  type: string;
}

interface Project {
  name: string;
  title: string;
}

interface Domain {
  name: string;
  title: string;
  value: number;
  iconCss: string;
}

interface Position {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  domains?: Domain[];
  projects?: Project[];
  technologies: Technology[];
}

interface ExperienceItem {
  id: number;
  orderIndex: number;
  icon: string;
  companyCode: string;
  companyName: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  positions: Position[];
}

interface ExperienceDetailDialogProps {
  experience: ExperienceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExperienceDetailDialog: React.FC<ExperienceDetailDialogProps> = ({
  experience,
  isOpen,
  onClose
}) => {
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

  // Group all technologies from all positions by type
  const getAllTechnologies = () => {
    const allTechs: Technology[] = [];
    experience.positions.forEach(position => {
      allTechs.push(...position.technologies);
    });
    
    // Remove duplicates
    const uniqueTechs = allTechs.filter((tech, index, self) => 
      index === self.findIndex(t => t.name === tech.name && t.type === tech.type)
    );
    
    return uniqueTechs.reduce((acc, tech) => {
      if (!acc[tech.type]) {
        acc[tech.type] = [];
      }
      acc[tech.type].push(tech);
      return acc;
    }, {} as Record<string, Technology[]>);
  };

  // Get all projects from all positions
  const getAllProjects = () => {
    const allProjects: Project[] = [];
    experience.positions.forEach(position => {
      if (position.projects) {
        allProjects.push(...position.projects);
      }
    });
    return allProjects;
  };

  const groupedTechnologies = getAllTechnologies();
  const allProjects = getAllProjects();
  const totalTechCount = Object.values(groupedTechnologies).flat().length;
  const hasCurrentPosition = experience.positions.some(pos => !pos.endDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-6 pl-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {experience.companyName}
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
                {(experience.websiteUrl || experience.linkedinUrl) && (
                  <div className="flex items-center gap-3 mt-3">
                    {experience.websiteUrl && (
                      <a 
                        href={experience.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                    {experience.linkedinUrl && (
                      <a 
                        href={experience.linkedinUrl} 
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
            <div className="w-16 h-16 flex-shrink-0">
              <img 
                src={`/assets/logos/companies/${experience.icon}`} 
                alt={`${experience.companyName} logo`}
                className="w-full h-full object-contain rounded-lg"
              />
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
                  {allProjects.length}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="positions" className="space-y-3 min-h-[400px]">
              {experience.positions.map((position, index) => (
                <div key={position.id} className="px-4 py-2">
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
                  
                  {position.domains && position.domains.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {position.domains.map((domain, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {Object.values(groupedTechnologies).flat().map((tech, index, allTechs) => {
                    const logoPath = getTechnologyLogo(tech.name);
                    const isEven = index % 2 === 0;
                    const isLastInColumn = index === allTechs.length - 1 || 
                      (isEven && index === allTechs.length - 2 && allTechs.length % 2 === 0);
                    
                    return (
                      <div key={index}>
                        <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                          {logoPath && (
                            <img 
                              src={logoPath} 
                              alt={`${tech.name} logo`} 
                              className="w-5 h-5 object-contain flex-shrink-0" 
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {tech.name}
                          </span>
                        </div>
                        {!isLastInColumn && (
                          <div className="border-b border-dashed border-border/50 mx-4"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-3 min-h-[400px]">
              <div className="px-4 py-2">
                {allProjects.length > 0 ? (
                  <div className="space-y-3">
                    {allProjects.map((project, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground">{project.name}</div>
                        </div>
                      </div>
                    ))}
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