import React, { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
import { LogoPlate } from "@/components/ui/logo-plate";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Maximize2,
  Minimize2,
  ShieldCheck,
  User,
} from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { peopleRepo } from '@/repositories/PeopleRepo';
import { partnersRepo } from '@/repositories/PartnersRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectFilesRepo } from '@/repositories/ProjectFilesRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { domainsRepo } from '@/repositories/DomainsRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import PartnerDetailDialog from '../partners/PartnerDetailDialog';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import PeopleDetailDialog from '../people/PeopleDetailDialog';
import ListViewer from '@/components/ui/listviewer';
import ProjectLogo from './ProjectLogo';
import { cn } from '@/lib/utils';
import type { ProjectEntry } from '@/models/Project';
import type { Person } from '@/models/People';
import type SkillItem from '@/models/Skills';
import type { Partner } from '@/models/Partner';
import type { Company } from '@/models/Companies';
import type { Experience } from '@/models/Experience';
import type { ScreenshotItem } from '@/models/ProjectFiles';

interface Customer {
  code: string;
  name: string;
  title: string;
  logoPath: string;
  description?: string;
  location?: string;
  industry?: string;
}

interface ProjectDetailDialogProps {
  project: ProjectEntry | null;
  isOpen: boolean;
  onClose: () => void;
  projectIcon?: string;
}

type TabValue = 'overview' | 'technologies' | 'customers' | 'team' | 'screenshots' | 'partners';

/** "Feb 2015 – Sep 2019", or "Feb 2015 – present" when the project has no end date. */
const formatDatePeriod = (datePeriod?: { startDate?: string; endDate?: string | null }) => {
  if (!datePeriod?.startDate) return '';

  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const startFormatted = formatDate(datePeriod.startDate);
  if (!datePeriod.endDate) return `${startFormatted} – present`;
  return `${startFormatted} – ${formatDate(datePeriod.endDate)}`;
};

/** Data-driven text may carry target=_blank links; make sure they carry rel=noopener. */
const withSafeLinks = (html: string) =>
  html.replace(/<a\s(?![^>]*\brel=)([^>]*target=['"]_blank['"][^>]*)>/gi, '<a rel="noopener noreferrer" $1>');

const screenshotSrc = (shot: ScreenshotItem) => shot.file_small || shot.file_big || '/placeholder.svg';

// One label and a quiet count per tab; the shared Tabs component draws the segment
const TabLabel = ({ label, count }: { label: string; count?: number }) => (
  <span className="inline-flex items-baseline gap-1.5">
    {label}
    {count !== undefined && <span className="tnum font-normal text-faint">{count}</span>}
  </span>
);

// A row inside the sheet that opens another dialog: hairline under it, raised paper on hover
const rowButton =
  'group flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150 ease-dossier hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const ProjectDetailDialog: React.FC<ProjectDetailDialogProps> = ({
  project,
  isOpen,
  onClose,
  projectIcon
}) => {
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<Array<{ person: Person | null; position: string; personCode: string }>>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [partnerCompanies, setPartnerCompanies] = useState<{ [key: string]: Company }>({});
  const [experience, setExperience] = useState<Experience | null>(null);
  const [experienceCompany, setExperienceCompany] = useState<Company | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState<number>(0);
  const [isScreenshotFullscreen, setIsScreenshotFullscreen] = useState(false);
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [domainTitles, setDomainTitles] = useState<string[]>([]);
  const [tab, setTab] = useState<TabValue>('overview');

  // Every project opens on its overview
  useEffect(() => {
    if (isOpen) setTab('overview');
  }, [isOpen, project?.code]);

  // Load company name from companyCode
  useEffect(() => {
    if (project?.companyCode) {
      const loadCompany = async () => {
        const company = await companiesRepo.getByCode(project.companyCode);
        if (company) {
          setCompanyName(company.title);
        }
      };
      loadCompany();
    } else {
      setCompanyName('');
    }
  }, [project?.companyCode]);

  // Category name from the project groups ("RD" reads "Research")
  useEffect(() => {
    if (!project?.group) {
      setGroupTitle('');
      return;
    }
    const group = project.group;
    setGroupTitle(group);
    projectsRepo
      .getFullData()
      .then((data) => {
        const match = data?.general?.groups?.find((g) => g.code === group);
        if (match?.title) setGroupTitle(match.title);
      })
      .catch(() => {});
  }, [project?.group]);

  // Domain names for the facts ("healthcareit" reads "Healthcare IT")
  useEffect(() => {
    const codes = project?.domainCodes ?? [];
    setDomainTitles(codes);
    if (codes.length === 0) return;
    let cancelled = false;
    Promise.all(codes.map((code) => domainsRepo.getByCode(code).catch(() => null)))
      .then((domains) => {
        if (!cancelled) setDomainTitles(codes.map((code, i) => domains[i]?.title || code));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [project?.domainCodes]);

  // Load customers data when dialog opens
  useEffect(() => {
    if (isOpen && project?.customerCodes && project.customerCodes.length > 0) {
      const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
          const response = await fetch('/data/customers.json');
          const data = await response.json();

          // Filter customers by customer codes
          const projectCustomers = data.items.filter((customer: Customer & { code: string }) =>
            project.customerCodes?.some(customerCode =>
              customer.code?.toLowerCase() === customerCode.toLowerCase()
            )
          );

          setCustomersData(projectCustomers);
        } catch (error) {
          console.error('Failed to load customers:', error);
          setCustomersData([]);
        } finally {
          setIsLoadingCustomers(false);
        }
      };

      loadCustomers();
    } else {
      setCustomersData([]);
    }
  }, [isOpen, project?.customerCodes]);

  // Fetch skill objects when project changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!project?.skillCodes) return;

      const skillItems: SkillItem[] = [];

      for (const skillCode of project.skillCodes) {
        if (skillCode) {
          const skill = await skillsRepo.getByCode(skillCode);
          if (skill) skillItems.push(skill);
        }
      }

      setSkills(skillItems);
    };

    if (project?.skillCodes && project.skillCodes.length > 0) {
      fetchSkills();
    } else {
      setSkills([]);
    }
  }, [project?.skillCodes]);

  // Load partners when project changes
  useEffect(() => {
    const fetchPartners = async () => {
      if (!project?.partnerCodes) return;

      const partnerItems: Partner[] = [];
      const companies: { [key: string]: Company } = {};

      for (const partnerCode of project.partnerCodes) {
        if (partnerCode) {
          const partner = await partnersRepo.getByCode(partnerCode);
          if (partner) {
            partnerItems.push(partner);
            // Load company data for the partner
            if (partner.companyCode) {
              const company = await companiesRepo.getByCode(partner.companyCode);
              if (company) {
                companies[partner.code || ''] = company;
              }
            }
          }
        }
      }

      setPartners(partnerItems);
      setPartnerCompanies(companies);
    };

    if (project?.partnerCodes && project.partnerCodes.length > 0) {
      fetchPartners();
    } else {
      setPartners([]);
      setPartnerCompanies({});
    }
  }, [project?.partnerCodes]);

  // Resolve team member names from personCodes
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!project?.team || project.team.length === 0) {
        setTeamMembers([]);
        return;
      }

      const resolvedTeam = await Promise.all(
        project.team.map(async (member) => {
          const person = member.personCode
            ? await peopleRepo.getByCode(member.personCode)
            : null;

          return {
            person,
            position: member.position || 'Team member',
            personCode: member.personCode || 'Unknown'
          };
        })
      );

      setTeamMembers(resolvedTeam);
    };

    loadTeamMembers();
  }, [project?.team]);

  // Fetch experience data based on project's companyCode
  useEffect(() => {
    const fetchExperience = async () => {
      if (!project?.companyCode) {
        setExperience(null);
        setExperienceCompany(null);
        return;
      }

      try {
        // Fetch all experiences
        const allExperiences = await experienceRepo.getList();

        // Find the experience that matches the project's companyCode
        const matchedExperience = allExperiences.find(
          exp => exp.companyCode?.toLowerCase() === project.companyCode?.toLowerCase()
        );

        if (matchedExperience) {
          setExperience(matchedExperience);

          // Fetch the company details
          if (matchedExperience.companyCode) {
            const company = await companiesRepo.getByCode(matchedExperience.companyCode);
            setExperienceCompany(company);
          }
        } else {
          setExperience(null);
          setExperienceCompany(null);
        }
      } catch (error) {
        console.error('Failed to fetch experience:', error);
        setExperience(null);
        setExperienceCompany(null);
      }
    };

    fetchExperience();
  }, [project?.companyCode]);

  // Fetch screenshots for the project
  useEffect(() => {
    const fetchScreenshots = async () => {
      if (!project?.code) {
        setScreenshots([]);
        return;
      }

      try {
        // The files are keyed by project code in its own case ("HIS2x"); match without case
        const all = await projectFilesRepo.getAllProjects();
        const key = Object.keys(all).find((k) => k.toUpperCase() === project.code.toUpperCase());
        const projectFiles = key ? all[key] : null;
        if (projectFiles?.screenshoots) {
          // Sort by orderindex
          const sorted = [...projectFiles.screenshoots].sort(
            (a, b) => (a.orderindex || 0) - (b.orderindex || 0)
          );
          setScreenshots(sorted);
        } else {
          setScreenshots([]);
        }
      } catch (error) {
        console.error('Failed to fetch screenshots:', error);
        setScreenshots([]);
      }
    };

    fetchScreenshots();
  }, [project?.code]);

  // Keyboard navigation for fullscreen screenshots
  useEffect(() => {
    if (!isScreenshotFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentScreenshotIndex > 0) {
        const newIndex = currentScreenshotIndex - 1;
        setCurrentScreenshotIndex(newIndex);
        setSelectedScreenshot(screenshots[newIndex].file_big || screenshots[newIndex].file_small || '');
      } else if (e.key === 'ArrowRight' && currentScreenshotIndex < screenshots.length - 1) {
        const newIndex = currentScreenshotIndex + 1;
        setCurrentScreenshotIndex(newIndex);
        setSelectedScreenshot(screenshots[newIndex].file_big || screenshots[newIndex].file_small || '');
      } else if (e.key === 'Escape') {
        setIsScreenshotFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScreenshotFullscreen, currentScreenshotIndex, screenshots]);

  if (!project) return null;

  const period = formatDatePeriod(project.datePeriod);
  const logo = projectIcon || project.photoUrl || '';
  const hasCustomers = !!project.customerCodes && project.customerCodes.length > 0;
  const screenshotTitle = (shot: ScreenshotItem) => shot.title || `Screenshot ${screenshots.indexOf(shot) + 1}`;

  const openScreenshot = (index: number) => {
    const shot = screenshots[index];
    if (!shot) return;
    setCurrentScreenshotIndex(index);
    setSelectedScreenshot(shot.file_big || shot.file_small || '');
    setIsScreenshotFullscreen(true);
  };

  const stepScreenshot = (delta: 1 | -1) => openScreenshot(currentScreenshotIndex + delta);

  const facts = [
    { term: 'Company', detail: companyName || project.companyCode },
    { term: 'Period', detail: period },
    { term: 'Category', detail: groupTitle },
    { term: domainTitles.length === 1 ? 'Domain' : 'Domains', detail: domainTitles.join(', ') },
  ].filter((fact) => fact.detail);

  const fulltext = project.fulltext
    ? Array.isArray(project.fulltext) ? project.fulltext.join('') : project.fulltext
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        // The sheet itself takes focus on open, so no control starts out ringed
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'z-[100] flex flex-col gap-0 overflow-hidden p-0 focus-visible:outline-none',
          isMaximized ? 'h-[95vh] max-h-[95vh] max-w-[95vw]' : 'h-[88vh] max-h-[88vh] max-w-5xl',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMaximized(!isMaximized)}
          aria-label={isMaximized ? 'Restore size' : 'Maximize'}
          className="absolute right-14 top-4 z-10 hidden h-8 w-8 text-faint sm:inline-flex"
        >
          {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        </Button>

        {/* Title block: the project's logo plate, the kicker and the serif title */}
        <DialogHeader className="flex-none space-y-0 px-5 pb-5 pt-6 text-left sm:px-8 sm:pb-6 sm:pt-8">
          <div className="flex items-start gap-4 pr-10 sm:gap-5 sm:pr-24">
            {logo && (
              <ProjectLogo src={logo} alt={`${project.title} logo`} className="h-14 w-14 flex-none p-1.5 sm:h-16 sm:w-16" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-4 text-muted-foreground">
                Project
                {groupTitle && (
                  <>
                    <span className="px-1.5 text-faint" aria-hidden="true">·</span>
                    {groupTitle}
                  </>
                )}
              </p>
              <DialogTitle className="mt-2 text-[28px] leading-8 tracking-[-0.01em] [text-wrap:balance] sm:text-[34px] sm:leading-10">
                {project.title}
              </DialogTitle>
              {/* Company and period are in the facts on the overview; read out with the title */}
              <DialogDescription className="sr-only">
                {[companyName || project.companyCode, period].filter(Boolean).join(', ')}
              </DialogDescription>
              {project.code === 'AMELBOOK' && (
                <a
                  href="/privacy/amelbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ink-link mt-2 inline-flex items-center gap-1.5 text-sm"
                >
                  <ShieldCheck className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                  Privacy policy
                </a>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-none border-b border-border px-5 pb-4 sm:px-8">
            <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none]">
              <TabsTrigger value="overview">
                <TabLabel label="Overview" />
              </TabsTrigger>
              <TabsTrigger value="technologies">
                <TabLabel label="Skills" count={project.skillCodes?.length || 0} />
              </TabsTrigger>
              {hasCustomers && (
                <TabsTrigger value="customers">
                  <TabLabel label="Customers" count={project.customerCodes?.length || 0} />
                </TabsTrigger>
              )}
              <TabsTrigger value="team">
                <TabLabel label="Team" count={project.team?.length || 0} />
              </TabsTrigger>
              {screenshots.length > 0 && (
                <TabsTrigger value="screenshots">
                  <TabLabel label="Screenshots" count={screenshots.length} />
                </TabsTrigger>
              )}
              {partners.length > 0 && (
                <TabsTrigger value="partners">
                  <TabLabel label="Partners" count={partners.length} />
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
                {/* Facts: hairline-ruled, first on phones, a side column from md up */}
                <aside className="space-y-8 md:order-2">
                  {facts.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-6 border-t border-foreground md:grid-cols-1">
                      {facts.map((fact) => (
                        <div key={fact.term} className="border-b border-border py-3">
                          <dt className="text-xs leading-4 text-faint">{fact.term}</dt>
                          <dd className="tnum mt-1 text-sm leading-5 text-foreground [text-wrap:pretty]">{fact.detail}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {experience && experienceCompany && (
                    <section>
                      <h3 className="sheet-heading">Experience</h3>
                      <button type="button" className={cn(rowButton, '-mx-2 w-[calc(100%+1rem)]')} onClick={() => setIsExperienceDialogOpen(true)}>
                        <LogoPlate
                          src={experienceCompany.photoUrl || undefined}
                          alt={`${experienceCompany.title} logo`}
                          className="h-10 w-10 flex-none p-1"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-5 text-foreground">{experienceCompany.title}</span>
                          {experience.positions && experience.positions.length > 0 && (
                            <span className="tnum block text-[13px] leading-5 text-faint">
                              {experience.positions.length} position{experience.positions.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </span>
                        <ArrowUpRight className="h-4 w-4 flex-none text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </section>
                  )}
                </aside>

                <div className="min-w-0 space-y-10">
                  {/* Project Summary */}
                  {project.summary && (
                    <p
                      className="max-w-[68ch] text-base leading-[26px] text-foreground [text-wrap:pretty] sm:text-[17px] sm:leading-7"
                      dangerouslySetInnerHTML={{ __html: withSafeLinks(project.summary) }}
                    />
                  )}

                  {/* The first plates of the gallery, each opens full size */}
                  {screenshots.length > 0 && (
                    <section aria-label="Screenshots">
                      <div className="grid grid-cols-3 gap-3">
                        {screenshots.slice(0, 3).map((shot, index) => (
                          <button
                            key={screenshotSrc(shot)}
                            type="button"
                            onClick={() => openScreenshot(index)}
                            aria-label={`Open screenshot ${index + 1}: ${screenshotTitle(shot)}`}
                            className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="work-plate aspect-[4/3] w-full p-1.5">
                              <img
                                loading="lazy"
                                decoding="async"
                                src={screenshotSrc(shot)}
                                alt=""
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="work-caption min-w-0">
                          <span className="font-medium text-foreground">
                            Fig. {screenshots.length > 1 ? `1–${Math.min(3, screenshots.length)}` : '1'}
                          </span>
                          {screenshots.length > 3 && ` of ${screenshots.length}`}
                          <span className="px-1.5" aria-hidden="true">·</span>
                          Select a screenshot to view it full size
                        </p>
                        {screenshots.length > 3 && (
                          <button type="button" onClick={() => setTab('screenshots')} className="ink-link tnum flex-none text-sm">
                            All {screenshots.length} screenshots
                          </button>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Full Description */}
                  {fulltext && (
                    <div className="sheet-prose" dangerouslySetInnerHTML={{ __html: withSafeLinks(fulltext) }} />
                  )}

                  {/* Modules */}
                  {project.modules && project.modules.length > 0 && (
                    <section>
                      <h3 className="sheet-heading">
                        Modules
                        <span className="tnum font-normal text-faint">{project.modules.length}</span>
                      </h3>
                      <ul className="grid gap-x-8 sm:grid-cols-2">
                        {project.modules.map((module, index) => (
                          <li key={`${module}-${index}`} className="border-b border-border py-2.5 text-[15px] leading-6 text-foreground">
                            {module}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="technologies" className="mt-0">
              {skills.length > 0 ? (
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {skills.map((skill) => (
                    <li key={skill.code} className="border-b border-border py-1">
                      <button
                        type="button"
                        className={cn(rowButton, '-mx-2 w-[calc(100%+1rem)]')}
                        onClick={() => {
                          setSelectedSkill(skill);
                          setIsSkillDialogOpen(true);
                        }}
                      >
                        <span className="flex h-5 w-5 flex-none items-center justify-center">
                          {skill.photoUrl && (
                            <img
                              loading="lazy"
                              decoding="async"
                              src={skill.photoUrl}
                              alt=""
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px] leading-6 text-foreground">{skill.title}</span>
                        <ArrowUpRight className="h-4 w-4 flex-none text-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed for this project.</p>
              )}
            </TabsContent>

            {hasCustomers && (
              <TabsContent value="customers" className="mt-0">
                {isLoadingCustomers ? (
                  <p className="text-sm text-muted-foreground">Loading customers…</p>
                ) : customersData.length > 0 ? (
                  <ul className="grid gap-x-8 sm:grid-cols-2">
                    {customersData.map((customer) => (
                      <li key={customer.code} className="flex items-center gap-3 border-b border-border py-3">
                        {customer.logoPath && (
                          <div className="logo-plate h-11 w-11 flex-none p-1">
                            <img
                              loading="lazy"
                              decoding="async"
                              src={customer.logoPath}
                              alt={`${customer.title} logo`}
                              className="logo-plate-img"
                              onError={(e) => {
                                // Try with /src/assets/ prefix for development fallback
                                const currentSrc = e.currentTarget.src;
                                if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                                  e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                                } else {
                                  // Hide image if it fails to load
                                  e.currentTarget.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] leading-6 text-foreground">{customer.title}</p>
                          {(customer.location || customer.industry) && (
                            <p className="truncate text-[13px] leading-5 text-faint">
                              {[customer.location, customer.industry].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No customer information available.</p>
                )}
              </TabsContent>
            )}

            <TabsContent value="team" className="mt-0">
              {teamMembers.length > 0 ? (
                <ul className="grid gap-x-8 sm:grid-cols-2">
                  {teamMembers.map((member, index) => {
                    // Find LinkedIn contact if available
                    const linkedinContact = member.person?.contacts?.find(
                      contact => contact.code === 'linkedin'
                    );
                    const name = member.person?.title || member.personCode;
                    const openPerson = () => {
                      if (member.person) {
                        setSelectedPerson(member.person);
                        setIsPeopleDialogOpen(true);
                      }
                    };

                    return (
                      <li key={member.personCode || index} className="border-b border-border py-1">
                        <div
                          role={member.person ? 'button' : undefined}
                          tabIndex={member.person ? 0 : undefined}
                          className={cn(rowButton, '-mx-2 w-[calc(100%+1rem)]', member.person ? 'cursor-pointer' : 'cursor-default hover:bg-transparent')}
                          onClick={openPerson}
                          onKeyDown={(e) => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              openPerson();
                            }
                          }}
                        >
                          {member.person?.photoUrl ? (
                            <div className="h-10 w-10 flex-none">
                              <img
                                loading="lazy"
                                decoding="async"
                                src={member.person.photoUrl}
                                alt={member.person.title}
                                className="print-photo h-full w-full rounded-full object-cover"
                                onError={(e) => {
                                  // Replace with fallback User icon if image fails to load
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-faint"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-secondary text-faint">
                              <User className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium leading-6 text-foreground">{name}</p>
                            <p className="truncate text-[13px] leading-5 text-muted-foreground">{member.position}</p>
                          </div>
                          {linkedinContact?.value && (
                            <a
                              href={linkedinContact.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-faint transition-colors duration-150 ease-dossier hover:bg-secondary-hover hover:text-foreground"
                              title="LinkedIn profile"
                              aria-label={`${name} on LinkedIn`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="h-4 w-4" strokeWidth={1.5} />
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No team information available.</p>
              )}
            </TabsContent>

            {/* Partners Tab */}
            {partners.length > 0 && (
              <TabsContent value="partners" className="mt-0">
                <ul className="max-w-3xl">
                  {partners.map((partner) => {
                    const company = partnerCompanies[partner.code || ''];
                    return (
                      <li key={partner.code} className="border-b border-border py-1">
                        <button
                          type="button"
                          className={cn(rowButton, '-mx-2 w-[calc(100%+1rem)] items-start py-3')}
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsPartnerDialogOpen(true);
                          }}
                        >
                          <LogoPlate
                            src={company?.photoUrl || undefined}
                            alt={`${company?.title || partner.code} logo`}
                            className="h-12 w-12 flex-none p-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium leading-6 text-foreground">
                              {company?.title || partner.code}
                            </span>
                            {partner.description && (
                              <span className="mt-0.5 line-clamp-2 block text-sm leading-[22px] text-muted-foreground">
                                {partner.description}
                              </span>
                            )}
                          </span>
                          <ArrowUpRight className="mt-1 h-4 w-4 flex-none text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
            )}

            {/* Screenshots Tab: the gallery, every screenshot as a captioned plate */}
            {screenshots.length > 0 && (
              <TabsContent value="screenshots" className="mt-0">
                <ListViewer<ScreenshotItem>
                  data={screenshots}
                  defaultViewMode="card"
                  enabledModes={['card', 'list']}
                  fieldMapping={{
                    code: (item) => item.file_small || item.file_big || `screenshot-${screenshots.indexOf(item)}`,
                    title: (item) => screenshotTitle(item),
                    image: (item) => screenshotSrc(item),
                    description: (item) => item.title ? '' : 'Click to view full size',
                  }}
                  gridCols={{ sm: 1, md: 2, lg: 3 }}
                  onItemClick={(screenshot) => openScreenshot(screenshots.indexOf(screenshot))}
                  renderCardContent={(screenshot) => (
                    <figure className="group p-3">
                      <div className="work-plate aspect-[16/10] w-full p-1.5">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={screenshotSrc(screenshot)}
                          alt={screenshotTitle(screenshot)}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <figcaption className="mt-3 flex gap-2 text-[13px] leading-5">
                        <span className="tnum flex-none font-medium text-foreground">Fig. {screenshots.indexOf(screenshot) + 1}</span>
                        <span className="line-clamp-2 text-muted-foreground">{screenshot.title || 'Click to view full size'}</span>
                      </figcaption>
                    </figure>
                  )}
                  renderListContent={(screenshot) => (
                    <figure className="group flex items-center gap-4 p-3">
                      <div className="work-plate h-20 w-32 flex-none p-1">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={screenshotSrc(screenshot)}
                          alt={screenshotTitle(screenshot)}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <figcaption className="min-w-0 flex-1">
                        <p className="text-[15px] leading-6 text-foreground">{screenshotTitle(screenshot)}</p>
                        <p className="work-caption mt-0.5">
                          Fig. {screenshots.indexOf(screenshot) + 1}
                          <span className="px-1.5" aria-hidden="true">·</span>
                          Click to view full size
                        </p>
                      </figcaption>
                    </figure>
                  )}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>

      {/* Full size screenshot: a plate on the paper with its caption and next/back */}
      {isScreenshotFullscreen && selectedScreenshot && (
        <Dialog open={isScreenshotFullscreen} onOpenChange={setIsScreenshotFullscreen}>
          <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
            <DialogHeader className="flex-none flex-row items-center gap-3 space-y-0 border-b border-border px-5 py-4 pr-16 text-left">
              {logo && <ProjectLogo src={logo} alt="" className="h-10 w-10 flex-none p-1" />}
              <div className="min-w-0">
                <DialogTitle className="truncate text-xl leading-7">{project.title}</DialogTitle>
                <DialogDescription className="tnum truncate text-[13px] leading-5 text-faint">
                  {[companyName, period].filter(Boolean).join(' · ')}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-4 sm:p-8">
              <img
                decoding="async"
                src={selectedScreenshot}
                alt={screenshots[currentScreenshotIndex] ? screenshotTitle(screenshots[currentScreenshotIndex]) : 'Screenshot'}
                className="max-h-full max-w-full border border-border object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="flex flex-none items-center gap-4 border-t border-border px-5 py-3">
              <p className="min-w-0 flex-1 text-sm leading-5">
                <span className="tnum font-medium text-foreground">
                  Fig. {currentScreenshotIndex + 1}
                  {screenshots.length > 1 && <span className="font-normal text-faint"> of {screenshots.length}</span>}
                </span>
                {screenshots[currentScreenshotIndex]?.title && (
                  <>
                    <span className="px-2 text-faint" aria-hidden="true">·</span>
                    <span className="text-muted-foreground">{screenshots[currentScreenshotIndex].title}</span>
                  </>
                )}
              </p>
              {screenshots.length > 1 && (
                <div className="flex flex-none gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => stepScreenshot(-1)}
                    disabled={currentScreenshotIndex === 0}
                    aria-label="Previous screenshot"
                  >
                    <ChevronLeft strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => stepScreenshot(1)}
                    disabled={currentScreenshotIndex === screenshots.length - 1}
                    aria-label="Next screenshot"
                  >
                    <ChevronRight strokeWidth={1.5} />
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Skill Detail Dialog */}
      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />

      {/* Partner Detail Dialog */}
      <PartnerDetailDialog
        partner={selectedPartner}
        isOpen={isPartnerDialogOpen}
        onClose={() => {
          setIsPartnerDialogOpen(false);
          setSelectedPartner(null);
        }}
      />

      {/* Experience Detail Dialog */}
      <ExperienceDetailDialog
        experience={experience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
        }}
      />

      {/* People Detail Dialog */}
      <PeopleDetailDialog
        person={selectedPerson}
        isOpen={isPeopleDialogOpen}
        onClose={() => {
          setIsPeopleDialogOpen(false);
          setSelectedPerson(null);
        }}
      />
    </Dialog>
  );
};

export default ProjectDetailDialog;
