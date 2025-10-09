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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Building2, 
  User,
  Clock,
  Linkedin,
  Maximize2,
  Minimize2,
  Info,
  Wrench,
  Users,
  UserCheck,
  Image
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
import ListViewer from '@/components/ui/ListViewer';
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
  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});
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

  // Fetch technology logos and skill objects when project changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!project?.skillCodes) return;
      
      const logos: Record<string, string> = {};
      const skillItems: SkillItem[] = [];
      
      for (const skillCode of project.skillCodes) {
        if (skillCode) {
          const skill = await skillsRepo.getByCode(skillCode);
          if (skill) {
            skillItems.push(skill);
            if (skill.photoUrl) {
              logos[skillCode] = skill.photoUrl;
            }
          }
        }
      }
      
      setSkills(skillItems);
      setTechnologyLogos(logos);
    };

    if (project?.skillCodes && project.skillCodes.length > 0) {
      fetchSkills();
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

  if (!project) return null;

  // Helper function to format date period
  const formatDatePeriod = (datePeriod?: { startDate?: string; endDate?: string }) => {
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
          {(projectIcon || project.photoUrl) && (
            <div className="absolute top-4 left-8 z-10 w-16 h-16">
              <img 
                src={projectIcon || project.photoUrl} 
                alt={`${project.title} logo`}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex items-start gap-4 pl-24">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {project.title}
              </DialogTitle>
              <div className="text-base text-muted-foreground">
                {companyName && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>{companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDatePeriod(project.datePeriod)}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Type badges positioned below action buttons */}
        <div className="absolute top-14 right-4 flex gap-2 flex-wrap justify-end z-10">
          <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
            Project
          </Badge>
          <Badge variant="outline" className="text-xs">
            {project.group}
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full pt-2">
          <TabsList className={`grid w-full ${
            screenshots.length > 0 
              ? (project.customerCodes && project.customerCodes.length > 0 ? 'grid-cols-5' : 'grid-cols-4')
              : (project.customerCodes && project.customerCodes.length > 0 ? 'grid-cols-4' : 'grid-cols-3')
          }`}>
            <TabsTrigger value="overview">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Skills
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.skillCodes?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
            {project.customerCodes && project.customerCodes.length > 0 && (
              <TabsTrigger value="customers">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customers
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {project.customerCodes.length}
                  </Badge>
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Team
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.team?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
            {screenshots.length > 0 && (
              <TabsTrigger value="screenshots">
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Screenshots
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {screenshots.length}
                  </Badge>
                </span>
              </TabsTrigger>
            )}
            {partners.length > 0 && (
              <TabsTrigger value="partners">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Partners
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {partners.length}
                  </Badge>
                </span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-3 min-h-[400px] h-full overflow-y-auto">
              {/* Project Summary */}
              <div className="px-4 py-2">
                <CardDescription 
                  className="text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: project.summary }}
                />
              </div>

              {/* Experience/Company Box */}
              {experience && experienceCompany && (
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Experience</span>
                  </h4>
                  <div 
                    className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-pointer border border-border/50"
                    onClick={() => setIsExperienceDialogOpen(true)}
                  >
                    {experienceCompany.photoUrl && (
                      <img 
                        src={experienceCompany.photoUrl} 
                        alt={`${experienceCompany.title} logo`} 
                        className="w-10 h-10 object-contain flex-shrink-0 rounded" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {experienceCompany.title}
                      </div>
                      {experience.positions && experience.positions.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {experience.positions.length} position{experience.positions.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Experience
                    </Badge>
                  </div>
                </div>
              )}

              {/* Modules */}
              {project.modules && project.modules.length > 0 && (
                <div className="px-4 py-2">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span>Modules</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {project.modules.length}
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    {project.modules.map((module, index) => {
                      const isEven = index % 2 === 0;
                      const isLastInColumn = index === project.modules.length - 1 || 
                        (isEven && index === project.modules.length - 2 && project.modules.length % 2 === 0);
                      
                      return (
                        <div key={`${module}-${index}`}>
                          <div className="flex items-start gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                            <div className="w-2 h-2 bg-primary/60 rounded-full flex-shrink-0 mt-2" />
                            <span className="text-sm text-foreground leading-relaxed">
                              {module}
                            </span>
                          </div>
                          {!isLastInColumn && (
                            <div className="border-b border-dashed border-border/50 mx-4"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Description */}
              {project.fulltext && (
                <div className="px-4 py-2">
                  <div 
                    className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
                    dangerouslySetInnerHTML={{ 
                      __html: Array.isArray(project.fulltext) 
                        ? project.fulltext.join('') 
                        : project.fulltext 
                    }}
                  />
                </div>
              )}

              {/* Domains */}
              {project.domainCodes && project.domainCodes.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {project.domainCodes.map((domainCode, index) => (
                      <Badge key={domainCode} variant="secondary">
                        {domainCode}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technologies" className="space-y-2 min-h-[400px] h-full overflow-y-auto">
              <div className="px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {skills.map((skill, index) => {
                    const logoPath = skill.photoUrl || "";
                    const isEven = index % 2 === 0;
                    const isLastInColumn = index === skills.length - 1 || 
                      (isEven && index === skills.length - 2 && skills.length % 2 === 0);
                    
                    return (
                      <div key={skill.code}>
                        <div 
                          className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-pointer"
                          onClick={() => {
                            setSelectedSkill(skill);
                            setIsSkillDialogOpen(true);
                          }}
                        >
                          {logoPath && (
                            <img 
                              src={logoPath} 
                              alt={`${skill.title} logo`} 
                              className="w-5 h-5 object-contain flex-shrink-0" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {skill.title}
                          </span>
                        </div>
                        {!isLastInColumn && (
                          <div className="border-b border-dashed border-border/50 mx-4"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {project.customerCodes && project.customerCodes.length > 0 && (
              <TabsContent value="customers" className="space-y-2 min-h-[400px] h-full overflow-y-auto">
                <div className="px-4 py-2">
                  {isLoadingCustomers ? (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-muted-foreground">Loading customers...</p>
                    </div>
                  ) : customersData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customersData.map((customer, index) => (
                        <div key={customer.code} className="flex items-center gap-3 p-4 bg-muted/20 rounded-lg border border-border/30 hover:bg-muted/30 hover:shadow-sm transition-all duration-200">
                          {/* Customer Logo */}
                          {customer.logoPath && (
                            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                              <img 
                                src={customer.logoPath}
                                alt={`${customer.title} logo`}
                                className="w-10 h-10 object-contain rounded"
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
                          
                          {/* Customer Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {customer.title}
                            </div>
                            {customer.location && (
                              <div className="text-xs text-muted-foreground truncate">
                                {customer.location}
                              </div>
                            )}
                            {customer.industry && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {customer.industry}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No customer information available.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="team" className="space-y-6 min-h-[400px] h-full overflow-y-auto">
              <div className="p-4">

                {teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map((member, index) => {
                      // Find LinkedIn contact if available
                      const linkedinContact = member.person?.contacts?.find(
                        contact => contact.code === 'linkedin'
                      );
                      
                      return (
                        <div 
                          key={member.personCode || index} 
                          className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 hover:border-primary/50 border border-transparent"
                          onClick={() => {
                            if (member.person) {
                              setSelectedPerson(member.person);
                              setIsPeopleDialogOpen(true);
                            }
                          }}
                        >
                          {member.person?.photoUrl ? (
                            <div className="w-10 h-10 flex-shrink-0 relative">
                              <img
                                src={member.person.photoUrl}
                                alt={member.person.title}
                                className="w-full h-full object-cover rounded-full border-2 border-primary/20"
                                onError={(e) => {
                                  // Replace with fallback User icon if image fails to load
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.person?.title || member.personCode}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.position}</div>
                          </div>
                          {linkedinContact?.value && (
                            <a
                              href={linkedinContact.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                              title="LinkedIn Profile"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Linkedin className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No team information available.</p>
                )}
              </div>
            </TabsContent>

            {/* Partners Tab */}
            {partners.length > 0 && (
              <TabsContent value="partners" className="space-y-3 min-h-[400px] h-full overflow-y-auto">
                <div className="px-4 py-2">
                  <div className="space-y-3">
                    {partners.map((partner) => {
                      const company = partnerCompanies[partner.code || ''];
                      const logoPath = company?.photoUrl || "";
                      
                      return (
                        <Card 
                          key={partner.code}
                          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsPartnerDialogOpen(true);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {logoPath && (
                                <div className="w-12 h-12 flex-shrink-0 bg-background rounded-lg overflow-hidden border border-border/50 flex items-center justify-center">
                                  <img 
                                    src={logoPath} 
                                    alt={`${company?.title} logo`} 
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground mb-1">
                                  {company?.title || partner.code}
                                </h3>
                                {partner.description && (
                                  <CardDescription className="text-sm line-clamp-2">
                                    {partner.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Screenshots Tab */}
            {screenshots.length > 0 && (
              <TabsContent value="screenshots" className="h-full overflow-y-auto">
                <ListViewer<ScreenshotItem>
                  data={screenshots}
                  defaultViewMode="card"
                  enabledModes={['card', 'list']}
                  fieldMapping={{
                    code: (item) => item.file_small || item.file_big || `screenshot-${screenshots.indexOf(item)}`,
                    title: (item) => item.title || `Screenshot ${screenshots.indexOf(item) + 1}`,
                    image: (item) => item.file_small || item.file_big || '/placeholder.svg',
                    description: (item) => item.title ? '' : 'Click to view full size',
                  }}
                  gridCols={{ sm: 1, md: 2, lg: 3 }}
                  onItemClick={(screenshot) => {
                    setSelectedScreenshot(screenshot.file_big || screenshot.file_small || '');
                    setIsScreenshotFullscreen(true);
                  }}
                  renderCardContent={(screenshot) => (
                    <div className="cursor-pointer group">
                      <div className="relative aspect-video bg-muted overflow-hidden">
                        <img 
                          src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'} 
                          alt={screenshot.title || 'Screenshot'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        {screenshot.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-white text-xs line-clamp-1">{screenshot.title}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  renderListContent={(screenshot) => (
                    <div className="flex items-center gap-4 cursor-pointer">
                      <div className="w-32 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                        <img 
                          src={screenshot.file_small || screenshot.file_big || '/placeholder.svg'} 
                          alt={screenshot.title || 'Screenshot'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">
                          {screenshot.title || `Screenshot ${screenshots.indexOf(screenshot) + 1}`}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>

      {/* Fullscreen Screenshot Modal */}
      {isScreenshotFullscreen && selectedScreenshot && (
        <Dialog open={isScreenshotFullscreen} onOpenChange={setIsScreenshotFullscreen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsScreenshotFullscreen(false)}
                className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              >
                <Minimize2 className="h-6 w-6" />
              </Button>
              <img 
                src={selectedScreenshot} 
                alt="Full screen screenshot"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
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