import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Clock, MapPin, ExternalLink, Linkedin, Briefcase, Wrench, FolderKanban } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { domainsRepo } from '@/repositories/DomainsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange, stripHtml } from '@/lib/format';

import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { SkillItem } from '@/models/Skills';
import type { Domain } from '@/models/Domain';
import type { Company } from '@/models/Companies';

interface ExperienceDetailDialogProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProject?: (project: ProjectEntry) => void;
}

const ExperienceDetailDialog: React.FC<ExperienceDetailDialogProps> = ({
  experience,
  isOpen,
  onClose,
  onOpenProject
}) => {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [domains, setDomains] = useState<Record<string, Domain[]>>({});
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);

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

  const totalTechCount = skills.length;

  const location = [company?.city, company?.country].filter(Boolean).join(', ');

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={52} />}
        title={company?.title || experience.companyCode || 'Company'}
        meta={[
          <>
            <Clock aria-hidden="true" />
            {calculateTotalDuration()}
          </>,
          location ? (
            <>
              <MapPin aria-hidden="true" />
              {location}
            </>
          ) : null,
        ]}
        tags={<Tag tone="exp">experience</Tag>}
        headerExtra={
          company?.websiteUrl || company?.linkedinUrl ? (
            <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
              {company.websiteUrl && (
                <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Website
                </a>
              )}
              {company.linkedinUrl && (
                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                  LinkedIn
                </a>
              )}
            </div>
          ) : null
        }
      >
        <Tabs defaultValue="positions">
          <TabsList>
            <TabsTrigger value="positions">
              <Briefcase aria-hidden="true" />
              Positions
              <TabCount>{experience.positions.length}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{totalTechCount}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="projects">
              <FolderKanban aria-hidden="true" />
              Projects
              <TabCount>{projects.length}</TabCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <div className="detail-list">
              {experience.positions.map((position, index) => (
                <div key={index} className="py-4 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[15px] font-medium text-foreground">{position.title}</h3>
                    <span className="flex items-center gap-2 font-mono text-xs text-faint">
                      {formatMonthRange(position.startDate, position.endDate)}
                      {!position.endDate && <Tag tone="accent">current</Tag>}
                    </span>
                  </div>
                  <div
                    className="mt-2 text-sm leading-relaxed text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: position.summary }}
                  />
                  {domains[position.title] && domains[position.title].length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {domains[position.title].map((domain) => (
                        <Tag key={domain.code}>{domain.title}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="technologies">
            {isLoadingData ? (
              <DetailEmpty>Loading skills…</DetailEmpty>
            ) : skills.length > 0 ? (
              <DetailRows columns={2}>
                {skills.map((skill) => (
                  <DetailRow
                    key={skill.code}
                    icon={
                      skill.photoUrl ? (
                        <img src={skill.photoUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
                      ) : undefined
                    }
                    title={skill.title}
                    onClick={() => {
                      setSelectedSkill(skill);
                      setIsSkillDialogOpen(true);
                    }}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No skills listed for this experience.</DetailEmpty>
            )}
          </TabsContent>

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
                    subtitle={stripHtml(project.summary)}
                    onClick={onOpenProject ? () => onOpenProject(project) : undefined}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No specific projects listed for this experience.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
        onOpenProject={onOpenProject}
      />
    </>
  );
};

export default ExperienceDetailDialog;