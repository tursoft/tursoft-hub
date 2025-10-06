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
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import {
  Building2, 
  User,
  Clock,
  Linkedin
} from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { peopleRepo } from '@/repositories/PeopleRepo';
import type { ProjectEntry } from '@/models/Project';
import type { Person } from '@/models/People';

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

  // Fetch technology logos when project changes
  useEffect(() => {
    const fetchLogos = async () => {
      if (!project?.skillCodes) return;
      
      const logos: Record<string, string> = {};
      for (const techCode of project.skillCodes) {
        if (techCode) {
          const logo = await skillsRepo.getPhotoUrlByCode(techCode);
          if (logo) {
            logos[techCode] = logo;
          }
        }
      }
      setTechnologyLogos(logos);
    };

    if (project?.skillCodes && project.skillCodes.length > 0) {
      fetchLogos();
    }
  }, [project?.skillCodes]);

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
      <DialogContent className="max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg overflow-hidden">
        <DialogHeader className="pb-6 pl-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {project.title}
                </DialogTitle>
                <Badge variant="outline" className="text-xs">
                  {project.group}
                </Badge>
              </div>
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
            {(projectIcon || project.photoUrl) && (
              <div className="w-16 h-16 flex-shrink-0">
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
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className={`grid w-full ${project.customerCodes && project.customerCodes.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.skillCodes?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
            {project.customerCodes && project.customerCodes.length > 0 && (
              <TabsTrigger value="customers">
                <span className="flex items-center gap-2">
                  Customers
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    {project.customerCodes.length}
                  </Badge>
                </span>
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <span className="flex items-center gap-2">
                Team
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {project.team?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-3 min-h-[400px]">
              {/* Project Summary */}
              <div className="px-4 py-2">
                <CardDescription 
                  className="text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: project.summary }}
                />
              </div>

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

            <TabsContent value="technologies" className="space-y-2 min-h-[400px]">
              <div className="px-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {(project.skillCodes || []).map((techCode, index) => {
                    const logoPath = technologyLogos[techCode] || "";
                    const isEven = index % 2 === 0;
                    const isLastInColumn = index === (project.skillCodes || []).length - 1 || 
                      (isEven && index === (project.skillCodes || []).length - 2 && (project.skillCodes || []).length % 2 === 0);
                    
                    return (
                      <div key={techCode}>
                        <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                          {logoPath && (
                            <img 
                              src={logoPath} 
                              alt={`${techCode} logo`} 
                              className="w-5 h-5 object-contain flex-shrink-0" 
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {techCode}
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
              <TabsContent value="customers" className="space-y-2 min-h-[400px]">
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

            <TabsContent value="team" className="space-y-6 min-h-[400px]">
              <div className="p-4">

                {teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map((member, index) => {
                      // Find LinkedIn contact if available
                      const linkedinContact = member.person?.contacts?.find(
                        contact => contact.code === 'linkedin'
                      );
                      
                      return (
                        <div key={member.personCode || index} className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
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
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;