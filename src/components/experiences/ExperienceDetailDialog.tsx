import React, { useEffect, useState } from 'react';
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
import { Button } from "@/components/ui/button";
import { Globe, Linkedin, Maximize2, Minimize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { domainsRepo } from '@/repositories/DomainsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import CareerPlate from './CareerPlate';
import { formatDuration, formatRange, parseDate } from './career-dates';

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

const tabCount = "tnum ml-1.5 text-faint";

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
  const [isMaximized, setIsMaximized] = useState(false);
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

  // The whole stay at the company, from the first start to the last end (or today)
  const calculateTotalDuration = () => {
    if (!experience.positions.length) return '';
    const isCurrent = experience.positions.some((position) => !position.endDate);
    const sorted = [...experience.positions].sort(
      (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime(),
    );
    const lastEnd = sorted.reduce<string | null>(
      (latest, position) =>
        position.endDate && (!latest || parseDate(position.endDate) > parseDate(latest)) ? position.endDate : latest,
      null,
    );
    return formatDuration(sorted[0].startDate, isCurrent ? null : lastEnd);
  };

  const companyTitle = company?.title || experience.code || 'Company';
  const location = company?.city && company?.country ? `${company.city}, ${company.country}` : 'Turkey';
  const totalTechCount = skills.length;
  const linkClass =
    "inline-flex items-center gap-1.5 text-[13px] leading-5 text-muted-foreground transition-colors duration-150 ease-dossier hover:text-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 overflow-hidden bg-card p-0',
          isMaximized
            ? 'h-full max-h-full w-full max-w-full rounded-none sm:rounded-none'
            : 'h-full max-h-full w-full max-w-full rounded-none sm:h-[min(46rem,90vh)] sm:w-[calc(100vw-4rem)] sm:max-w-2xl sm:rounded-lg',
        )}
      >
        {/* Maximize / restore, beside the close button; phones already get the full screen */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="absolute right-14 top-4 z-10 hidden h-8 w-8 p-0 sm:inline-flex"
          aria-label={isMaximized ? 'Restore size' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        </Button>

        {/* The sheet's head, set like a byline: logo plate beside the label and the serif title */}
        <DialogHeader className="flex-shrink-0 space-y-0 border-b border-border px-6 pb-5 pt-6 text-left sm:text-left">
          <div className="flex items-start gap-4">
            {company?.photoUrl && (
              <CareerPlate src={company.photoUrl} alt={`${company.title} logo`} className="h-12 w-12 p-1.5 sm:h-14 sm:w-14 sm:p-2" />
            )}
            <div className="min-w-0 flex-1">
              <p className="pr-12 text-[13px] leading-4 text-faint sm:pr-20">Experience</p>
              <DialogTitle className="mt-2 font-serif text-2xl font-normal leading-8 tracking-[-0.01em] text-foreground [text-wrap:balance] sm:text-[28px]">
                {companyTitle}
              </DialogTitle>
              <DialogDescription className="tnum mt-1 text-sm leading-5 text-muted-foreground">
                {calculateTotalDuration()}
                <span aria-hidden="true" className="px-1.5 text-faint">·</span>
                {location}
              </DialogDescription>
              {(company?.websiteUrl || company?.linkedinUrl) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {company.websiteUrl && (
                    <a href={company.websiteUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <Globe className="h-4 w-4 text-faint" strokeWidth={1.5} />
                      Website
                    </a>
                  )}
                  {company.linkedinUrl && (
                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      <Linkedin className="h-4 w-4 text-faint" strokeWidth={1.5} />
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="positions" className="flex min-h-0 flex-1 flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="positions">
                Positions<span className={tabCount}>{experience.positions.length}</span>
              </TabsTrigger>
              <TabsTrigger value="technologies">
                Skills<span className={tabCount}>{totalTechCount}</span>
              </TabsTrigger>
              <TabsTrigger value="projects">
                Projects<span className={tabCount}>{projects.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="positions" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
            <ol className="divide-y divide-border">
              {experience.positions.map((position, index) => (
                <li key={index} className="py-5 first:pt-0 last:pb-0">
                  <h3 className="text-base font-medium leading-6 text-foreground">{position.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="tnum text-[13px] leading-5 text-faint">
                      {formatRange(position.startDate, position.endDate)}
                    </span>
                    {!position.endDate && <Badge>Current</Badge>}
                  </div>

                  <div className="mt-3 space-y-3 text-sm leading-[22px] text-foreground [text-wrap:pretty]">
                    {position.summary
                      .split('<br/>')
                      .map((part) => part.trim())
                      .filter(Boolean)
                      .map((part, i) => (
                        <p key={i}>{part}</p>
                      ))}
                  </div>

                  {domains[position.title] && domains[position.title].length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {domains[position.title].map((domain) => (
                        <Badge key={domain.code} variant="secondary">
                          {domain.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="technologies" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">
            {isLoadingData ? (
              <p className="py-8 text-center text-sm text-faint">Loading skills…</p>
            ) : skills.length > 0 ? (
              <ul className={cn('grid grid-cols-1 gap-x-6', isMaximized ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'sm:grid-cols-2')}>
                {skills.map((skill) => (
                  <li key={skill.code} className="border-b border-border">
                    <button
                      type="button"
                      className="-mx-2 flex h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 text-left text-sm text-foreground transition-colors duration-150 ease-dossier hover:bg-secondary"
                      onClick={() => {
                        setSelectedSkill(skill);
                        setIsSkillDialogOpen(true);
                      }}
                    >
                      {skill.photoUrl && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={skill.photoUrl}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="truncate">{skill.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-sm text-faint">No skills listed for this experience</p>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">
            {isLoadingData ? (
              <p className="py-8 text-center text-sm text-faint">Loading projects…</p>
            ) : projects.length > 0 ? (
              <ul>
                {projects.map((project) => {
                  const content = (
                    <>
                      {project.photoUrl ? (
                        <CareerPlate src={project.photoUrl} alt="" className="h-9 w-9 p-1" />
                      ) : (
                        <span className="h-9 w-9 flex-shrink-0 rounded-md border border-border bg-card" aria-hidden="true" />
                      )}
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">{project.title}</span>
                    </>
                  );

                  return (
                    <li key={project.code} className="border-b border-border">
                      {onOpenProject ? (
                        <button
                          type="button"
                          className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150 ease-dossier hover:bg-secondary"
                          onClick={() => onOpenProject(project)}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex min-h-14 items-center gap-3 py-2.5">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-2 text-sm text-faint">No specific projects listed for this experience</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Skill Detail Dialog */}
      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
        onOpenExperience={() => {}}
        onOpenProject={onOpenProject}
      />
    </Dialog>
  );
};

export default ExperienceDetailDialog;
