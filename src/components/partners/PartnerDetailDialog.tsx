import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Globe, Linkedin, Info, FolderKanban } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailHeading, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange, stripHtml } from '@/lib/format';
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
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [partnerProjects, setPartnerProjects] = useState<ProjectEntry[]>([]);

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
      const partnerCode = partner.partnerCode.toLowerCase();
      const relatedProjects = allProjects.filter((project) =>
        project.partnerCodes?.some((code) => code?.toLowerCase() === partnerCode),
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

  const title = companyTitle || companyData?.title || partner.companyCode;
  const location = [companyData?.city, companyData?.country].filter(Boolean).join(', ');

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={partnerLogo || companyData?.photoUrl} alt={title} size={52} variant="logo-light" />}
        title={title}
        meta={[
          location ? (
            <>
              <MapPin aria-hidden="true" />
              {location}
            </>
          ) : null,
        ]}
        tags={<Tag tone="part">partner</Tag>}
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban aria-hidden="true" />
              Projects
              {partnerProjects.length > 0 && <TabCount>{partnerProjects.length}</TabCount>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {partner.description && (
              <div>
                <DetailHeading>about the partnership</DetailHeading>
                <p className="text-sm leading-relaxed text-muted-foreground">{partner.description}</p>
              </div>
            )}

            {(companyData?.websiteUrl || companyData?.linkedinUrl) && (
              <div>
                <DetailHeading>partner information</DetailHeading>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                  {companyData.websiteUrl && (
                    <a
                      href={companyData.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-quiet inline-flex items-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      Visit website
                    </a>
                  )}
                  {companyData.linkedinUrl && (
                    <a
                      href={companyData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-quiet inline-flex items-center gap-1.5"
                    >
                      <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                      LinkedIn profile
                    </a>
                  )}
                </div>
              </div>
            )}

            {!partner.description && !companyData?.websiteUrl && !companyData?.linkedinUrl && (
              <DetailEmpty>No partnership details available.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="projects">
            {partnerProjects.length > 0 ? (
              <div>
                <DetailHeading>collaborative projects · {partnerProjects.length}</DetailHeading>
                <DetailRows>
                  {partnerProjects.map((project) => (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      subtitle={stripHtml(project.summary)}
                      onClick={() => {
                        if (onOpenProject) {
                          onOpenProject(project);
                        } else {
                          setSelectedProject(project);
                          setIsProjectDialogOpen(true);
                        }
                      }}
                    >
                      <DetailMeta>
                        {formatMonthRange(project.datePeriod?.startDate, project.datePeriod?.endDate)}
                      </DetailMeta>
                    </DetailRow>
                  ))}
                </DetailRows>
              </div>
            ) : (
              <DetailEmpty>No projects found for this partnership yet.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </>
  );
};

export default PartnerDetailDialog;
