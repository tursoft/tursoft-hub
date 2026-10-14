import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, FolderKanban } from "lucide-react";
import type { Domain } from '@/models/Domain';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import DetailDialog, { DetailEmpty, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatPeriod, plural } from '@/lib/format';

interface DomainDetailDialogProps {
  domain: Domain | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
}

const DomainDetailDialog: React.FC<DomainDetailDialogProps> = ({ 
  domain, 
  isOpen, 
  onClose,
  onOpenExperience,
  onOpenProject
}) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});

  const loadRelatedData = async () => {
    if (!domain) return;
    
    setIsLoadingData(true);
    try {
      // Load experiences in this domain
      const allExperiences = await experienceRepo.getList();
      const filteredExperiences = allExperiences.filter(exp => 
        exp.positions?.some(pos => pos.domainCodes?.includes(domain.code || ''))
      );
      setExperiences(filteredExperiences);

      // Load projects in this domain
      const allProjects = await projectsRepo.getList();
      const filteredProjects = allProjects.filter(project => 
        project.domainCodes?.includes(domain.code || '')
      );
      setProjects(filteredProjects);

      // Load companies for experiences and projects
      const companyCodes = new Set<string>();
      filteredExperiences.forEach(exp => {
        if (exp.companyCode) companyCodes.add(exp.companyCode);
      });
      filteredProjects.forEach(project => {
        if (project.companyCode) companyCodes.add(project.companyCode);
      });

      const companiesData: { [key: string]: Company } = {};
      for (const code of companyCodes) {
        const company = await companiesRepo.getByCode(code);
        if (company) companiesData[code] = company;
      }
      setCompanies(companiesData);

    } catch (error) {
      console.error('Error loading domain data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (domain && isOpen) {
      loadRelatedData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!domain) return null;

  const logoPath = domain.photoUrl || "";

  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      icon={<LogoTile src={logoPath} alt={domain.title ?? domain.code} size={52} className="domain-tile" />}
      title={domain.title || domain.code}
      meta={
        isLoadingData
          ? []
          : [
              <>
                <FolderKanban aria-hidden="true" />
                {plural(projects.length, 'project')}
              </>,
              <>
                <Briefcase aria-hidden="true" />
                {plural(experiences.length, 'company', 'companies')}
              </>,
            ]
      }
      tags={<Tag tone="accent">domain</Tag>}
    >
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">
            <FolderKanban aria-hidden="true" />
            Projects
            <TabCount>{projects.length}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="experiences">
            <Briefcase aria-hidden="true" />
            Experiences
            <TabCount>{experiences.length}</TabCount>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {isLoadingData ? (
            <DetailEmpty>Loading projects…</DetailEmpty>
          ) : projects.length > 0 ? (
            <DetailRows>
              {projects.map((project) => (
                <DetailRow
                  key={project.code}
                  icon={<LogoTile src={project.photoUrl} alt={project.title} size={40} />}
                  title={project.title}
                  subtitle={companies[project.companyCode || '']?.title}
                  onClick={onOpenProject ? () => onOpenProject(project) : undefined}
                >
                  <DetailMeta>{formatPeriod(project.datePeriod?.startDate, project.datePeriod?.endDate)}</DetailMeta>
                </DetailRow>
              ))}
            </DetailRows>
          ) : (
            <DetailEmpty>No projects found.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="experiences">
          {isLoadingData ? (
            <DetailEmpty>Loading experiences…</DetailEmpty>
          ) : experiences.length > 0 ? (
            <DetailRows>
              {experiences.map((experience) => {
                const company = companies[experience.companyCode || ''];
                // The position that worked in this domain, else the latest one.
                const position =
                  experience.positions?.find((item) => item.domainCodes?.includes(domain.code)) ??
                  experience.positions?.[0];
                return (
                  <DetailRow
                    key={experience.code || experience.companyCode}
                    icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={40} />}
                    title={company?.title || experience.companyCode}
                    subtitle={position?.title}
                    onClick={onOpenExperience ? () => onOpenExperience(experience) : undefined}
                  >
                    <DetailMeta>{formatPeriod(position?.startDate, position?.endDate)}</DetailMeta>
                  </DetailRow>
                );
              })}
            </DetailRows>
          ) : (
            <DetailEmpty>No experiences found.</DetailEmpty>
          )}
        </TabsContent>
      </Tabs>
    </DetailDialog>
  );
};

export default DomainDetailDialog;
