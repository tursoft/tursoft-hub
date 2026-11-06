import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@design/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@design/components/ui/tabs";
import { Button } from "@design/components/ui/button";
import { ArrowUpRight, Globe, Linkedin, Maximize2, Minimize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { sheet } from '@design/components/domains/sheet';
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
      <DialogContent
        className={cn(
          sheet.content,
          'h-full max-h-full w-full max-w-full rounded-none',
          !isMaximized && 'sm:h-auto sm:max-h-[90vh] sm:max-w-[36rem] sm:rounded-lg',
        )}
      >
        {/* Header: kicker, logo on its plate, serif title, place */}
        <DialogHeader className={sheet.head}>
          <p className={sheet.kicker}>Partner</p>
          <div className="mt-3 flex items-start gap-4">
            {partnerLogo && (
              <div className="logo-plate h-14 w-20 flex-shrink-0 p-2">
                <img loading="lazy" decoding="async"
                  src={partnerLogo}
                  alt={`${companyTitle || partner.companyCode} logo`}
                  className="logo-plate-img"
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
            <div className="min-w-0 flex-1">
              <DialogTitle className={sheet.title}>
                {companyTitle || companyData?.title || partner.companyCode}
              </DialogTitle>
              {companyData?.city && companyData?.country && (
                <DialogDescription className={cn(sheet.meta, 'mt-1')}>
                  {companyData.city}, {companyData.country}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMaximized(!isMaximized)}
          className={sheet.cornerButton}
          aria-label={isMaximized ? 'Restore size' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        </Button>

        <Tabs defaultValue="overview" className={sheet.tabs}>
          <TabsList className={sheet.tabList}>
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projects
              {partnerProjects.length > 0 && <span className={sheet.tabCount}>{partnerProjects.length}</span>}
            </TabsTrigger>
          </TabsList>

          <div className={cn(sheet.body, 'sm:max-h-[60vh]')}>
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-8 pt-5">
              <section>
                <h3 className={sheet.sectionTitle}>About the partnership</h3>
                {partner.description && (
                  <p className="mt-3 text-[15px] leading-6 text-foreground [text-wrap:pretty]">
                    {partner.description}
                  </p>
                )}
              </section>

              {companyData && (companyData.websiteUrl || companyData.linkedinUrl) && (
                <section>
                  <h4 className={cn(sheet.sectionTitle, 'border-t border-border pt-4')}>Partner information</h4>
                  <ul className="mt-3 space-y-2">
                    {companyData.websiteUrl && (
                      <li>
                        <a
                          href={companyData.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-sm"
                        >
                          <Globe className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                          <span className="ink-link">Visit website</span>
                          <ArrowUpRight className="h-4 w-4 text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      </li>
                    )}
                    {companyData.linkedinUrl && (
                      <li>
                        <a
                          href={companyData.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-sm"
                        >
                          <Linkedin className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                          <span className="ink-link">LinkedIn profile</span>
                          <ArrowUpRight className="h-4 w-4 text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      </li>
                    )}
                  </ul>
                </section>
              )}
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-0 pt-5">
              <h3 className={sheet.sectionTitle}>Collaborative projects</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                Projects we&apos;ve worked on together with this partner
              </p>
              {partnerProjects.length === 0 ? (
                <p className={sheet.empty}>No projects found for this partnership yet</p>
              ) : (
                <ul className="mt-4 divide-y divide-border border-y border-border">
                  {partnerProjects.map((project) => (
                    <li key={project.code}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 px-2 py-4 text-left transition-colors duration-150 ease-dossier hover:bg-secondary/60"
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
                          <img loading="lazy" decoding="async"
                            src={projectLogos[project.code]}
                            alt=""
                            className="h-10 w-10 flex-shrink-0 rounded-sm object-contain"
                            onError={(e) => {
                              const currentSrc = e.currentTarget.src;
                              if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                                e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                              } else {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-5 text-foreground">
                            {project.title}
                          </span>
                          {project.summary && (
                            <span className="mt-1 line-clamp-2 block text-[13px] leading-5 text-muted-foreground">
                              {project.summary}
                            </span>
                          )}
                          {project.datePeriod && (
                            <span className="mt-1 block text-xs leading-4 text-faint tnum">
                              {formatDate(project.datePeriod.startDate)}
                              {project.datePeriod.endDate ? ` – ${formatDate(project.datePeriod.endDate)}` : ' – Present'}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </div>
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
