import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Building2,
  User,
  Clock,
  Linkedin,
  Info,
  Wrench,
  Users,
  UserCheck,
  Image,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { peopleRepo } from '@/repositories/PeopleRepo';
import { partnersRepo } from '@/repositories/PartnersRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectFilesRepo } from '@/repositories/ProjectFilesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import PartnerDetailDialog from '../partners/PartnerDetailDialog';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import PeopleDetailDialog from '../people/PeopleDetailDialog';
import ListViewer from '@/components/ui/listviewer';
import DetailDialog, { DetailEmpty, DetailHeading, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
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

  // Load customers data when dialog opens
  useEffect(() => {
    if (isOpen && project?.customerCodes && project.customerCodes.length > 0) {
      const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
          const response = await fetch('/data/customers.json');
          const data = await response.json();
          
          // Filter customers by customer codes and resolve each one's company name and logo.
          const projectCustomers: Customer[] = await Promise.all(
            data.items
              .filter((customer: Customer & { companyCode?: string }) =>
                project.customerCodes?.some((customerCode) => customer.code?.toLowerCase() === customerCode.toLowerCase()),
              )
              .map(async (customer: Customer & { companyCode?: string }) => {
                const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
                return {
                  ...customer,
                  title: company?.title ?? customer.companyCode ?? customer.code,
                  logoPath: company?.photoUrl ?? '',
                };
              }),
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

  // Fetch technology logos and skill objects when project changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!project?.skillCodes) return;
      
      const skillItems: SkillItem[] = [];
      
      for (const skillCode of new Set(project.skillCodes)) {
        if (skillCode) {
          const skill = await skillsRepo.getByCode(skillCode);
          if (skill) {
            skillItems.push(skill);
          }
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
      
      // partners.json items have no `code`, so match on partnerCode, ignoring case.
      const allPartners = await partnersRepo.getList();
      for (const partnerCode of project.partnerCodes) {
        const partner = allPartners.find((item) => item.partnerCode?.toLowerCase() === partnerCode?.toLowerCase());
        if (partner) {
          partnerItems.push(partner);
          if (partner.companyCode) {
            const company = await companiesRepo.getByCode(partner.companyCode);
            if (company) {
              companies[partner.partnerCode] = company;
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
            position: member.position || 'Team Member',
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
        const projectFiles = await projectFilesRepo.getByProjectCode(project.code);
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

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={projectIcon || project.photoUrl} alt={project.title} size={52} />}
        title={project.title}
        meta={[
          companyName ? (
            <>
              <Building2 aria-hidden="true" />
              {companyName}
            </>
          ) : null,
          project.datePeriod?.startDate ? (
            <>
              <Clock aria-hidden="true" />
              {formatMonthRange(project.datePeriod.startDate, project.datePeriod.endDate)}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="proj">project</Tag>
            {project.group && <Tag>{project.group}</Tag>}
            {project.code === 'AMELBOOK' && (
              <a href="/privacy/amelbook" target="_blank" rel="noopener noreferrer">
                <Tag tone="success">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  privacy policy
                </Tag>
              </a>
            )}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{new Set(project.skillCodes ?? []).size}</TabCount>
            </TabsTrigger>
            {project.customerCodes && project.customerCodes.length > 0 && (
              <TabsTrigger value="customers">
                <Users aria-hidden="true" />
                Customers
                <TabCount>{project.customerCodes.length}</TabCount>
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <UserCheck aria-hidden="true" />
              Team
              <TabCount>{project.team?.length || 0}</TabCount>
            </TabsTrigger>
            {screenshots.length > 0 && (
              <TabsTrigger value="screenshots">
                <Image aria-hidden="true" />
                Screenshots
                <TabCount>{screenshots.length}</TabCount>
              </TabsTrigger>
            )}
            {partners.length > 0 && (
              <TabsTrigger value="partners">
                <Building2 aria-hidden="true" />
                Partners
                <TabCount>{partners.length}</TabCount>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {project.summary && (
              <div
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: project.summary }}
              />
            )}

            {experience && experienceCompany && (
              <div>
                <DetailHeading>experience</DetailHeading>
                <DetailRow
                  icon={<LogoTile src={experienceCompany.photoUrl} alt={experienceCompany.title} size={40} />}
                  title={experienceCompany.title}
                  subtitle={
                    experience.positions && experience.positions.length > 0
                      ? `${experience.positions.length} position${experience.positions.length > 1 ? 's' : ''}`
                      : undefined
                  }
                  trailing={<Tag tone="exp">experience</Tag>}
                  onClick={() => setIsExperienceDialogOpen(true)}
                />
              </div>
            )}

            {project.modules && project.modules.length > 0 && (
              <div>
                <DetailHeading>modules · {project.modules.length}</DetailHeading>
                <DetailRows columns={2}>
                  {project.modules.map((module, index) => (
                    <DetailRow
                      key={`${module}-${index}`}
                      icon={<span className="h-[5px] w-[5px] shrink-0 rounded-[1px] bg-accent" aria-hidden="true" />}
                      title={module}
                    />
                  ))}
                </DetailRows>
              </div>
            )}

            {project.fulltext && (
              <div
                className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-accent prose-strong:text-foreground prose-li:text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: Array.isArray(project.fulltext) ? project.fulltext.join('') : project.fulltext,
                }}
              />
            )}

            {project.domainCodes && project.domainCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.domainCodes.map((domainCode) => (
                  <Tag key={domainCode}>{domainCode}</Tag>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="technologies">
            {skills.length > 0 ? (
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
              <DetailEmpty>No skills listed for this project.</DetailEmpty>
            )}
          </TabsContent>

          {project.customerCodes && project.customerCodes.length > 0 && (
            <TabsContent value="customers">
              {isLoadingCustomers ? (
                <DetailEmpty>Loading customers…</DetailEmpty>
              ) : customersData.length > 0 ? (
                <DetailRows columns={2}>
                  {customersData.map((customer) => (
                    <DetailRow
                      key={customer.code}
                      icon={<LogoTile src={customer.logoPath} alt={customer.title} size={40} variant="logo-light" />}
                      title={customer.title}
                      subtitle={customer.location}
                    >
                      {customer.industry && (
                        <div className="mt-1.5">
                          <Tag>{customer.industry}</Tag>
                        </div>
                      )}
                    </DetailRow>
                  ))}
                </DetailRows>
              ) : (
                <DetailEmpty>No customer information available.</DetailEmpty>
              )}
            </TabsContent>
          )}

          <TabsContent value="team">
            {teamMembers.length > 0 ? (
              <DetailRows columns={2}>
                {teamMembers.map((member, index) => {
                  const linkedinUrl = member.person?.contacts?.find((contact) => contact.code === 'linkedin')?.value;
                  const displayName = member.person?.title || member.personCode;
                  return (
                    <DetailRow
                      key={member.personCode || index}
                      icon={
                        <LogoTile
                          src={member.person?.photoUrl}
                          alt={member.person?.title ?? member.personCode}
                          size={40}
                          variant="photo"
                          fallback={<User className="h-4 w-4" />}
                        />
                      }
                      title={displayName}
                      subtitle={member.position}
                      trailing={
                        linkedinUrl ? (
                          <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${displayName} on LinkedIn`}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-line text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        ) : undefined
                      }
                      onClick={
                        member.person
                          ? () => {
                              setSelectedPerson(member.person);
                              setIsPeopleDialogOpen(true);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No team information available.</DetailEmpty>
            )}
          </TabsContent>

          {partners.length > 0 && (
            <TabsContent value="partners">
              <DetailRows>
                {partners.map((partner) => {
                  const company = partnerCompanies[partner.partnerCode];
                  return (
                    <DetailRow
                      key={partner.partnerCode}
                      icon={<LogoTile src={company?.photoUrl} alt={company?.title ?? partner.partnerCode} size={40} variant="logo-light" />}
                      title={company?.title || partner.partnerCode}
                      subtitle={partner.description}
                      onClick={() => {
                        setSelectedPartner(partner);
                        setIsPartnerDialogOpen(true);
                      }}
                    />
                  );
                })}
              </DetailRows>
            </TabsContent>
          )}

          {screenshots.length > 0 && (
            <TabsContent value="screenshots">
              <ListViewer<ScreenshotItem>
                data={screenshots}
                defaultViewMode="card"
                enabledModes={['card', 'list']}
                fieldMapping={{
                  code: (item) => item.file_small || item.file_big || `screenshot-${screenshots.indexOf(item)}`,
                  title: (item) => item.title || `Screenshot ${screenshots.indexOf(item) + 1}`,
                  image: (item) => item.file_small || item.file_big || '/placeholder.svg',
                  description: (item) => (item.title ? '' : 'Click to view full size'),
                }}
                gridCols={{ sm: 1, md: 2, lg: 3 }}
                ariaLabel="Screenshots"
                onItemClick={(screenshot) => {
                  const index = screenshots.indexOf(screenshot);
                  setCurrentScreenshotIndex(index);
                  setSelectedScreenshot(screenshot.file_big || screenshot.file_small || '');
                  setIsScreenshotFullscreen(true);
                }}
                renderCardContent={(screenshot) => (
                  <div className="group">
                    <div className="relative aspect-video overflow-hidden bg-surface-2">
                      <img
                        src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'}
                        alt={screenshot.title || 'Screenshot'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    {screenshot.title && <p className="px-3 py-2.5 text-xs text-muted-foreground line-clamp-2">{screenshot.title}</p>}
                  </div>
                )}
                renderListContent={(screenshot) => (
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-[6px] bg-surface-2">
                      <img
                        src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'}
                        alt={screenshot.title || 'Screenshot'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium">
                        {screenshot.title || `Screenshot ${screenshots.indexOf(screenshot) + 1}`}
                      </h4>
                      <p className="type-meta mt-1">click to view full size</p>
                    </div>
                  </div>
                )}
              />
            </TabsContent>
          )}
        </Tabs>
      </DetailDialog>

      {isScreenshotFullscreen && selectedScreenshot && (
        <Dialog open={isScreenshotFullscreen} onOpenChange={setIsScreenshotFullscreen}>
          {/* DialogContent's built-in close button is the viewer's one close control. */}
          <DialogContent aria-describedby={undefined} className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background">
            <DialogTitle className="sr-only">
              {screenshots[currentScreenshotIndex]?.title ||
                `${project.title} screenshot ${currentScreenshotIndex + 1} of ${screenshots.length}`}
            </DialogTitle>
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Project Info at Top */}
              {project && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-background/90 via-background/60 to-transparent p-6 pb-12 z-10">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center gap-4">
                      {projectIcon && (
                        <div className="w-12 h-12 flex-shrink-0 rounded-[8px] overflow-hidden bg-surface-2 border border-line-strong">
                          <img 
                            src={projectIcon} 
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      )}
                      <div className="text-foreground text-lg font-medium tracking-[-0.02em]">
                        {project.title}
                      </div>
                    </div>
                    {/* Company and Date Range */}
                    <div className="type-meta flex items-center gap-3">
                      {companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{companyName}</span>
                        </div>
                      )}
                      {project.datePeriod && (project.datePeriod.startDate || project.datePeriod.endDate) && (
                        <>
                          {companyName && <span>•</span>}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {project.datePeriod.startDate || '...'}
                              {' - '}
                              {project.datePeriod.endDate || 'Present'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Button */}
              {screenshots.length > 1 && currentScreenshotIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Previous screenshot"
                  onClick={() => {
                    const newIndex = currentScreenshotIndex - 1;
                    setCurrentScreenshotIndex(newIndex);
                    setSelectedScreenshot(screenshots[newIndex].file_big || screenshots[newIndex].file_small || '');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20"
                >
                  <ChevronLeft />
                </Button>
              )}

              {/* Next Button */}
              {screenshots.length > 1 && currentScreenshotIndex < screenshots.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Next screenshot"
                  onClick={() => {
                    const newIndex = currentScreenshotIndex + 1;
                    setCurrentScreenshotIndex(newIndex);
                    setSelectedScreenshot(screenshots[newIndex].file_big || screenshots[newIndex].file_small || '');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20"
                >
                  <ChevronRight />
                </Button>
              )}

              {/* Image */}
              <img 
                src={selectedScreenshot} 
                alt="Full screen screenshot"
                className="max-w-full max-h-[75vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Screenshot Title and Counter */}
              {(screenshots[currentScreenshotIndex]?.title || screenshots.length > 1) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-6 pt-12">
                  <div className="text-center">
                    {screenshots[currentScreenshotIndex]?.title && (
                      <div className="text-foreground text-base font-medium mb-2">
                        {screenshots[currentScreenshotIndex].title}
                      </div>
                    )}
                    {screenshots.length > 1 && (
                      <p className="type-meta">
                        <span aria-live="polite">
                          {currentScreenshotIndex + 1} / {screenshots.length}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />

      <PartnerDetailDialog
        partner={selectedPartner}
        isOpen={isPartnerDialogOpen}
        onClose={() => {
          setIsPartnerDialogOpen(false);
          setSelectedPartner(null);
        }}
      />

      <ExperienceDetailDialog
        experience={experience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
        }}
      />

      <PeopleDetailDialog
        person={selectedPerson}
        isOpen={isPeopleDialogOpen}
        onClose={() => {
          setIsPeopleDialogOpen(false);
          setSelectedPerson(null);
        }}
      />
    </>
  );
};

export default ProjectDetailDialog;