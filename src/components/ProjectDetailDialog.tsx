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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  Building2, 
  Code, 
  Target, 
  Layers, 
  ExternalLink,
  User,
  Phone,
  Globe,
  Clock
} from "lucide-react";

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
  if (!project) return null;

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-start gap-4">
            {projectIcon && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={projectIcon} 
                  alt={`${project.title} icon`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
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
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technologies">Technologies</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-6">
              {/* Project Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Project Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription 
                    className="text-sm leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: project.summary }}
                  />
                </CardContent>
              </Card>

              {/* Full Description */}
              {project.fulltext && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Detailed Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
                      dangerouslySetInnerHTML={{ 
                        __html: Array.isArray(project.fulltext) 
                          ? project.fulltext.join('') 
                          : project.fulltext 
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Domains */}
              {project.domains && project.domains.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Domains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.domains.map((domain, index) => (
                        <Badge key={index} variant="secondary">
                          {domain.title}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Properties */}
              {project.props && project.props.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="w-5 h-5" />
                      Platform & Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {project.props.map((prop, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="font-medium capitalize">{prop.name}:</span>
                          <Badge variant="outline">{prop.title}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="technologies" className="space-y-6">
              {Object.entries(groupedTechnologies).map(([type, techs]) => (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      {type}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {techs.map((tech, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="hover:bg-primary/10 transition-colors"
                        >
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                            {member.contactNo !== "0" && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Phone className="w-3 h-3" />
                                {member.contactNo}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No team information available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              {/* Modules */}
              {project.modules && project.modules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.modules.map((module, index) => (
                        <Badge key={index} variant="outline">{module}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customers */}
              {project.customers && project.customers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.customers.map((customer, index) => (
                        <Badge key={index} variant="secondary">{customer}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Partners */}
              {project.partners && project.partners.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Partners</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {project.partners.map((partner, index) => (
                        <Badge key={index} variant="outline">{partner}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Project ID</div>
                      <div className="text-lg font-semibold">#{project.id}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Project Value</div>
                      <div className="text-lg font-semibold">{project.value}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Category</div>
                      <Badge variant="secondary">{project.group}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Duration</div>
                      <div className="text-sm">{formatDatePeriod(project.datePeriod)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;