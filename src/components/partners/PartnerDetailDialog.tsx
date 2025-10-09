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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Globe, 
  MapPin, 
  Briefcase,
  ExternalLink,
  Rocket,
  Maximize2,
  Minimize2,
  Info,
  FolderKanban
} from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import type { Partner } from '@/models/Partner';
import type { Company } from '@/models/Companies';
import type { ProjectEntry } from '@/models/Project';

interface PartnerDetailDialogProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
  partnerLogo?: string;
  companyTitle?: string;
  onOpenProject?: (project: ProjectEntry) => void;
}

const PartnerDetailDialog: React.FC<PartnerDetailDialogProps> = ({
  partner,
  isOpen,
  onClose,
  partnerLogo,
  companyTitle,
  onOpenProject
}) => {
  const [projectLogos, setProjectLogos] = useState<Record<string, string>>({});
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [partnerProjects, setPartnerProjects] = useState<ProjectEntry[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);

  // Fetch company data when partner changes
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!partner?.companyCode) return;
      
      const company = await companiesRepo.getByCode(partner.companyCode);
      setCompanyData(company);
    };

    if (partner?.companyCode) {
      fetchCompanyData();
    }
  }, [partner?.companyCode]);

  // Fetch projects that include this partner
  useEffect(() => {
    const fetchProjects = async () => {
      if (!partner?.partnerCode) return;
      
      const allProjects = await projectsRepo.getList();
      // Filter projects that include this partner in partnerCodes array
      const relatedProjects = allProjects.filter(
        project => project.partnerCodes?.includes(partner.partnerCode)
      );
      setPartnerProjects(relatedProjects);
    };

    if (partner?.partnerCode) {
      fetchProjects();
    }
  }, [partner?.partnerCode]);

  // Fetch project logos when partner projects change
  useEffect(() => {
    const fetchLogos = async () => {
      if (!partnerProjects.length) return;
      
      const logos: Record<string, string> = {};
      for (const project of partnerProjects) {
        if (project.code) {
          const logo = await projectsRepo.getPhotoUrlByCode(project.code);
          if (logo) {
            logos[project.code] = logo;
          }
        }
      }
      setProjectLogos(logos);
    };

    if (partnerProjects.length > 0) {
      fetchLogos();
    }
  }, [partnerProjects]);

  if (!partner) return null;

  // Helper function to format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      // Assume format is dd.mm.yyyy or similar
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-full max-h-full w-full h-full rounded-none' : 'max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg'} overflow-hidden`}>
        <DialogHeader className="pb-6 pl-6">
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
          {/* Logo positioned on the far left */}
          {partnerLogo && (
            <div className="absolute top-4 left-8 z-10 w-16 h-16">
              <img 
                src={partnerLogo} 
                alt={`${companyTitle || partner.companyCode} logo`}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  // Try with /src/assets/ prefix for development fallback
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                    e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                  } else {
                    // Hide image if it fails to load even with fallback
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            </div>
          )}
          <div className="flex items-start gap-4 pl-24">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {companyTitle || companyData?.title || partner.companyCode}
              </DialogTitle>
              <div className="text-base text-muted-foreground">
                {companyData?.city && companyData?.country && (
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{companyData.city}, {companyData.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Type badge positioned below action buttons */}
        <div className="absolute top-14 right-4 z-10">
          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20">
            Partner
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="projects">
              <span className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Projects
                {partnerProjects.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {partnerProjects.length}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 h-full overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  About Partnership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {partner.description}
                  </p>
                )}

                {companyData && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm">Partner Information</h4>
                    
                    {companyData.websiteUrl && (
                      <a
                        href={companyData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Visit Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {companyData.linkedinUrl && (
                      <a
                        href={companyData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Briefcase className="w-4 h-4" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4 h-full overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Collaborative Projects
                </CardTitle>
                <CardDescription>
                  Projects we've worked on together with this partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnerProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No projects found for this partnership yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {partnerProjects.map((project) => (
                      <div
                        key={project.code}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (onOpenProject) {
                            onOpenProject(project);
                          } else {
                            setSelectedProject(project);
                            setIsProjectDialogOpen(true);
                          }
                        }}
                      >
                        {projectLogos[project.code] && (
                          <div className="w-12 h-12 flex-shrink-0">
                            <img
                              src={projectLogos[project.code]}
                              alt={project.title}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                const currentSrc = e.currentTarget.src;
                                if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                                  e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                                } else {
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">
                            {project.title}
                          </h4>
                          {project.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.summary}
                            </p>
                          )}
                          {project.datePeriod && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(project.datePeriod.startDate)} 
                              {project.datePeriod.endDate ? ` - ${formatDate(project.datePeriod.endDate)}` : ' - Present'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </Dialog>
  );
};

export default PartnerDetailDialog;
