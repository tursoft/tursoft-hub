import React, { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  Building2, 
  Code, 
  User,
  Phone,
  Clock,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { getTechnologyLogo } from "@/lib/technologyLogos";

interface ProjectItem {
  id: number;
  name: string;
  title: string;
  group: string;
  company: string;
  value: number;
  icon: string;
  summary: string;
  fulltext?: string | string[];
  datePeriod: { startDate: string; endDate: string | null };
  props: { name: string; title: string }[];
  domains?: { name: string; title: string; value: number; iconCss: string }[];
  team: { position: string; name: string; contactNo: string }[];
  modules?: string[];
  customers?: string[];
  partners?: string[];
  technologies: { name: string; type: string }[];
}

interface ProjectDetailDialogProps {
  project: ProjectItem | null;
  isOpen: boolean;
  onClose: () => void;
  projectIcon?: string;
}

const ProjectDetailDialog: React.FC<ProjectDetailDialogProps> = ({
  project,
  isOpen,
  onClose,
  projectIcon
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Initialize all groups as expanded when dialog opens
  React.useEffect(() => {
    if (isOpen && project) {
      const initialExpandedState: Record<string, boolean> = {};
      project.technologies.forEach(tech => {
        initialExpandedState[tech.type] = true;
      });
      setExpandedGroups(initialExpandedState);
    }
  }, [isOpen, project]);

  if (!project) return null;

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Helper function to format date period
  const formatDatePeriod = (datePeriod: { startDate: string; endDate: string | null }) => {
    if (!datePeriod?.startDate) return '';
    
    const formatDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    };
    
    const startFormatted = formatDate(datePeriod.startDate);
    
    if (!datePeriod.endDate) {
      return `${startFormatted} - Present`;
    }
    
    const endFormatted = formatDate(datePeriod.endDate);
    return `${startFormatted} - ${endFormatted}`;
  };

  // Group technologies by type
  const groupedTechnologies = project.technologies.reduce((acc, tech) => {
    if (!acc[tech.type]) {
      acc[tech.type] = [];
    }
    acc[tech.type].push(tech);
    return acc;
  }, {} as Record<string, typeof project.technologies>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-6 pl-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {project.title}
                </DialogTitle>
                <Badge variant="outline" className="text-xs">
                  {project.group}
                </Badge>
              </div>
              <DialogDescription className="text-base text-muted-foreground">
                {project.company && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>{project.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDatePeriod(project.datePeriod)}</span>
                </div>
              </DialogDescription>
            </div>
            {projectIcon && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={projectIcon} 
                  alt={`${project.title} icon`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.technologies.length}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="team">
              <span className="flex items-center gap-2">
                Team
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.team.length}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-3 min-h-[400px]">
              {/* Project Summary */}
              <div className="px-4 py-2">
                <CardDescription 
                  className="text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: project.summary }}
                />
              </div>

              {/* Full Description */}
              {project.fulltext && (
                <div className="px-4 py-2">
                  <div 
                    className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
                    dangerouslySetInnerHTML={{ 
                      __html: Array.isArray(project.fulltext) 
                        ? project.fulltext.join('') 
                        : project.fulltext 
                    }}
                  />
                </div>
              )}

              {/* Domains */}
              {project.domains && project.domains.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {project.domains.map((domain, index) => (
                      <Badge key={index} variant="secondary">
                        {domain.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties */}
              {project.props && project.props.length > 0 && (
                <div className="px-4 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {project.props.map((prop, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <span className="font-medium capitalize">{prop.name}:</span>
                        <Badge variant="outline">{prop.title}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technologies" className="space-y-2 min-h-[400px]">
              {Object.entries(groupedTechnologies).map(([type, techs]) => {
                const isExpanded = expandedGroups[type] ?? true; // Default to expanded
                return (
                  <div key={type} className="px-4 py-1">
                    <button
                      onClick={() => toggleGroup(type)}
                      className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 transition-colors border-t border-b border-border/30"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {type}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({techs.length})
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                        {techs.map((tech, index) => {
                          const logoPath = getTechnologyLogo(tech.name);
                          return (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="text-xs px-2 py-1 hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                            >
                              {logoPath && (
                                <img 
                                  src={logoPath} 
                                  alt={`${tech.name} logo`} 
                                  className="w-4 h-4 object-contain" 
                                  onError={(e) => {
                                    // Hide image if it fails to load
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              {tech.name}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="team" className="space-y-6 min-h-[400px]">
              <div className="p-4">

                {project.team.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {project.team.map((member, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team information available.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;