import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, Clock, FolderKanban, GraduationCap } from "lucide-react";
import type SkillItem from '@/models/Skills';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import type { Education } from '@/models/Education';
import DetailDialog, { DetailEmpty, DetailMeta, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatPeriod } from '@/lib/format';
import { parseDate } from '@/lib/datetimeutils';

interface SkillDetailDialogProps {
  skill: SkillItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenExperience?: (experience: Experience) => void;
  onOpenProject?: (project: ProjectEntry) => void;
  onOpenEducation?: (education: Education) => void;
}

const SkillDetailDialog: React.FC<SkillDetailDialogProps> = ({ 
  skill, 
  isOpen, 
  onClose,
  onOpenExperience,
  onOpenProject,
  onOpenEducation
}) => {
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});

  const loadRelatedData = async () => {
    if (!skill) return;
    
    setIsLoadingData(true);
    try {
      // Use SkillsRepo methods to load related data
      const filteredExperiences = await skillsRepo.getExperiencesBySkillCode(skill.code);
      
      // Sort experiences by end date (most recent first)
      const sortedExperiences = filteredExperiences.sort((a, b) => {
        const aEndDate = a.positions?.[0]?.endDate || '';
        const bEndDate = b.positions?.[0]?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setExperiences(sortedExperiences);

      const filteredProjects = await skillsRepo.getProjectsBySkillCode(skill.code);
      
      // Sort projects by end date (most recent first)
      const sortedProjects = filteredProjects.sort((a, b) => {
        const aEndDate = a.datePeriod?.endDate || '';
        const bEndDate = b.datePeriod?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setProjects(sortedProjects);

      const filteredEducations = await skillsRepo.getEducationsBySkillCode(skill.code);
      
      // Sort educations by end date (most recent first)
      const sortedEducations = filteredEducations.sort((a, b) => {
        const aEndDate = a.datePeriod?.endDate || '';
        const bEndDate = b.datePeriod?.endDate || '';
        
        // Treat empty end dates as current (most recent)
        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return -1; // a is current, so it comes first
        if (!bEndDate) return 1; // b is current, so it comes first
        
        const aDate = parseDate(aEndDate);
        const bDate = parseDate(bEndDate);
        
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        return bDate.getTime() - aDate.getTime(); // Descending order
      });
      setEducations(sortedEducations);

      // Load companies for experiences, projects, and educations
      const companyCodes = new Set<string>();
      sortedExperiences.forEach(exp => {
        if (exp.companyCode) companyCodes.add(exp.companyCode);
      });
      sortedProjects.forEach(project => {
        if (project.companyCode) companyCodes.add(project.companyCode);
      });
      sortedEducations.forEach(edu => {
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
    onClose();
  };

  if (!skill) return null;

  const logoPath = skill.photoUrl || "";

  // Calculate total experience duration using min start date and max end date
  const calculateTotalExperience = (): string => {
    let minStartDate: Date | null = null;
    let maxEndDate: Date | null = null;

    // Process experiences
    experiences.forEach(exp => {
      exp.positions?.forEach(pos => {
        if (pos.startDate) {
          const start = parseDate(pos.startDate);
          if (start && !isNaN(start.getTime())) {
            if (!minStartDate || start < minStartDate) {
              minStartDate = start;
            }
          }

          const end = pos.endDate ? parseDate(pos.endDate) : new Date();
          if (end && !isNaN(end.getTime())) {
            if (!maxEndDate || end > maxEndDate) {
              maxEndDate = end;
            }
          }
        }
      });
    });

    // Process projects
    projects.forEach(project => {
      if (project.datePeriod?.startDate) {
        const start = parseDate(project.datePeriod.startDate);
        if (start && !isNaN(start.getTime())) {
          if (!minStartDate || start < minStartDate) {
            minStartDate = start;
          }
        }

        const end = project.datePeriod.endDate ? parseDate(project.datePeriod.endDate) : new Date();
        if (end && !isNaN(end.getTime())) {
          if (!maxEndDate || end > maxEndDate) {
            maxEndDate = end;
          }
        }
      }
    });

    // Process educations
    educations.forEach(edu => {
      if (edu.datePeriod?.startDate) {
        const start = parseDate(edu.datePeriod.startDate);
        if (start && !isNaN(start.getTime())) {
          if (!minStartDate || start < minStartDate) {
            minStartDate = start;
          }
        }

        const end = edu.datePeriod?.endDate ? parseDate(edu.datePeriod.endDate) : new Date();
        if (end && !isNaN(end.getTime())) {
          if (!maxEndDate || end > maxEndDate) {
            maxEndDate = end;
          }
        }
      }
    });

    // Calculate duration between min start and max end
    if (!minStartDate || !maxEndDate) return '';

    const months = (maxEndDate.getFullYear() - minStartDate.getFullYear()) * 12 + 
                   (maxEndDate.getMonth() - minStartDate.getMonth());
    
    if (months <= 0) return '';

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
  };

  const totalExperience = calculateTotalExperience();

  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      icon={<LogoTile src={logoPath} alt={skill.title} size={52} />}
      title={skill.title}
      meta={[
        totalExperience ? (
          <>
            <Clock aria-hidden="true" />
            {totalExperience} total experience
          </>
        ) : null,
      ]}
      tags={
        <>
          <Tag tone="accent">skill</Tag>
          {skill.group && <Tag>{String(skill.group)}</Tag>}
        </>
      }
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
          <TabsTrigger value="educations">
            <GraduationCap aria-hidden="true" />
            Educations
            <TabCount>{educations.length}</TabCount>
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
            <DetailEmpty>No projects use this skill.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="experiences">
          {isLoadingData ? (
            <DetailEmpty>Loading experiences…</DetailEmpty>
          ) : experiences.length > 0 ? (
            <DetailRows>
              {experiences.map((experience) => {
                const company = companies[experience.companyCode || ''];
                const position = experience.positions?.[0];
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
            <DetailEmpty>No experiences use this skill.</DetailEmpty>
          )}
        </TabsContent>

        <TabsContent value="educations">
          {isLoadingData ? (
            <DetailEmpty>Loading education…</DetailEmpty>
          ) : educations.length > 0 ? (
            <DetailRows>
              {educations.map((education) => {
                const company = companies[education.companyCode || ''];
                const period =
                  formatPeriod(education.datePeriod?.startDate, education.datePeriod?.endDate) || education.period;
                return (
                  <DetailRow
                    key={education.code}
                    icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? education.companyCode ?? ''} size={40} />}
                    title={company?.title || education.companyCode}
                    subtitle={education.department}
                    onClick={onOpenEducation ? () => onOpenEducation(education) : undefined}
                  >
                    <DetailMeta>{[education.level, period].filter(Boolean).join(' · ')}</DetailMeta>
                  </DetailRow>
                );
              })}
            </DetailRows>
          ) : (
            <DetailEmpty>No education used this skill.</DetailEmpty>
          )}
        </TabsContent>
      </Tabs>
    </DetailDialog>
  );
};

export default SkillDetailDialog;
