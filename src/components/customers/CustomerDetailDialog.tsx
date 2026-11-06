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
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { sheet } from '@/components/domains/sheet';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { referencesRepo } from '@/repositories/ReferencesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import type { Customer } from '@/models/Customer';
import type { Company } from '@/models/Companies';
import type { Reference } from '@/models/Reference';
import type SkillItem from '@/models/Skills';
import type { ProjectEntry } from '@/models/Project';

interface CustomerDetailDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  customerLogo?: string;
  companyTitle?: string;
}

const CustomerDetailDialog: React.FC<CustomerDetailDialogProps> = ({
  customer,
  isOpen,
  onClose,
  customerLogo,
  companyTitle
}) => {
  const [projectLogos, setProjectLogos] = useState<Record<string, string>>({});
  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [customerReferences, setCustomerReferences] = useState<Reference[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Fetch project objects and logos when customer changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!customer?.projectCodes) return;
      
      const logos: Record<string, string> = {};
      const projectItems: ProjectEntry[] = [];
      
      for (const projectCode of customer.projectCodes) {
        if (projectCode) {
          const project = await projectsRepo.getByCode(projectCode);
          if (project) {
            projectItems.push(project);
            if (project.photoUrl) {
              logos[projectCode] = project.photoUrl;
            }
          }
        }
      }
      
      setProjects(projectItems);
      setProjectLogos(logos);
    };

    if (customer?.projectCodes && customer.projectCodes.length > 0) {
      fetchProjects();
    }
  }, [customer?.projectCodes]);

  // Fetch technology objects and logos when customer changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!customer?.skillCodes) return;
      
      const logos: Record<string, string> = {};
      const skillItems: SkillItem[] = [];
      
      for (const skillCode of customer.skillCodes) {
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

    if (customer?.skillCodes && customer.skillCodes.length > 0) {
      fetchSkills();
    }
  }, [customer?.skillCodes]);

  // Fetch company data when customer changes
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!customer?.companyCode) return;
      
      const company = await companiesRepo.getByCode(customer.companyCode);
      setCompanyData(company);
    };

    if (customer?.companyCode) {
      fetchCompanyData();
    }
  }, [customer?.companyCode]);

  // Fetch testimonials/references related to customer's company
  useEffect(() => {
    const fetchReferences = async () => {
      if (!customer?.companyCode) return;
      
      const allReferences = await referencesRepo.getList();
      // Find references from people who worked at this company
      const relatedRefs = allReferences.filter(
        ref => ref.isActive && 
        ref.company.toLowerCase().includes(companyData?.title.toLowerCase() || customer.companyCode?.toLowerCase() || '')
      );
      setCustomerReferences(relatedRefs.slice(0, 3)); // Show up to 3 testimonials
    };

    if (customer?.companyCode && companyData) {
      fetchReferences();
    }
  }, [customer?.companyCode, companyData]);

  if (!customer) return null;

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

  // Helper function to format partnership period
  const formatPartnershipPeriod = () => {
    if (!customer.partnership?.startDate) return '';
    
    const startFormatted = formatDate(customer.partnership.startDate);
    
    if (!customer.partnership.endDate) {
      return `${startFormatted} – Present`;
    }
    
    const endFormatted = formatDate(customer.partnership.endDate);
    return `${startFormatted} – ${endFormatted}`;
  };

  /** "healthcare-information-systems" -> "Healthcare information systems" */
  const serviceLabel = (code: string) => {
    const words = code.replace(/[-_]+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  const meta = [customer.location, customer.partnership ? formatPartnershipPeriod() : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          sheet.content,
          'h-full max-h-full w-full max-w-full rounded-none',
          !isMaximized && 'sm:h-auto sm:max-h-[90vh] sm:max-w-[36rem] sm:rounded-lg',
        )}
      >
        {/* Header: kicker, logo on its plate, serif title, place and period */}
        <DialogHeader className={sheet.head}>
          <p className={sheet.kicker}>
            Customer{customer.category ? ` · ${customer.category}` : ''}
          </p>
          <div className="mt-3 flex items-start gap-4">
            {customerLogo && (
              <div className="logo-plate h-14 w-20 flex-shrink-0 p-2">
                <img loading="lazy" decoding="async"
                  src={customerLogo}
                  alt={`${companyTitle || customer.companyCode} logo`}
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
                {companyTitle || customer.companyCode || customer.code}
              </DialogTitle>
              {meta && <DialogDescription className={cn(sheet.meta, 'tnum mt-1')}>{meta}</DialogDescription>}
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
              {(customer.projectCodes && customer.projectCodes.length > 0) && (
                <span className={sheet.tabCount}>{customer.projectCodes.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="technologies">
              Skills
              {customer.skillCodes && <span className={sheet.tabCount}>{customer.skillCodes.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="services">
              Services
              {customer.serviceCodes && <span className={sheet.tabCount}>{customer.serviceCodes.length}</span>}
            </TabsTrigger>
          </TabsList>

          <div className={cn(sheet.body, 'sm:max-h-[60vh]')}>
            <TabsContent value="overview" className="mt-0 space-y-8 pt-5">
              {/* Customer Description */}
              {customer.description && (
                <div
                  className="text-[15px] leading-6 text-foreground [text-wrap:pretty]"
                  dangerouslySetInnerHTML={{ __html: customer.description }}
                />
              )}

              {/* Industry & relationship */}
              {(customer.industry || customer.relationship) && (
                <dl className="grid grid-cols-2 gap-x-6 border-t border-border pt-4">
                  {customer.industry && (
                    <div>
                      <dt className="text-xs leading-4 text-faint">Industry</dt>
                      <dd className="mt-1 text-sm leading-5 text-foreground">{customer.industry}</dd>
                    </div>
                  )}
                  {customer.relationship && (
                    <div>
                      <dt className="text-xs leading-4 text-faint">Relationship</dt>
                      <dd className="mt-1 text-sm leading-5 text-foreground">{customer.relationship}</dd>
                    </div>
                  )}
                </dl>
              )}

              {/* Testimonials Section */}
              {customerReferences.length > 0 && (
                <section>
                  <h4 className={cn(sheet.sectionTitle, 'border-t border-border pt-4')}>Testimonials</h4>
                  <div className="mt-4 space-y-6">
                    {customerReferences.map((reference, index) => (
                      <figure key={index} className={cn(index > 0 && 'border-t border-border pt-6')}>
                        <blockquote
                          className="font-serif text-[17px] leading-7 text-foreground [text-wrap:pretty]"
                          dangerouslySetInnerHTML={{ __html: `“${reference.testimonial}”` }}
                        />
                        <figcaption className="mt-3 flex items-center gap-3">
                          {reference.photoUrl && (
                            <img loading="lazy" decoding="async"
                              src={reference.photoUrl}
                              alt={reference.title}
                              className="print-photo h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium leading-5 text-foreground">{reference.title}</span>
                            <span className="block text-xs leading-4 text-faint">{reference.position} at {reference.company}</span>
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              )}

              {/* Related Projects */}
              {customer.projectCodes && customer.projectCodes.length > 0 && (
                <section>
                  <h4 className={cn(sheet.sectionTitle, 'flex items-baseline justify-between border-t border-border pt-4')}>
                    Related projects
                    <span className={sheet.tabCount}>{customer.projectCodes.length}</span>
                  </h4>
                  <ul className="mt-3 divide-y divide-border border-y border-border">
                    {projects.map((project) => {
                      const logoPath = project.photoUrl || "";

                      return (
                        <li key={project.code}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors duration-150 ease-dossier hover:bg-secondary/60"
                            onClick={() => {
                              setSelectedProject(project);
                              setIsProjectDialogOpen(true);
                            }}
                          >
                            {/* Project Logo */}
                            {logoPath && (
                              <img loading="lazy" decoding="async"
                                src={logoPath}
                                alt=""
                                className="h-7 w-7 flex-shrink-0 rounded-sm object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                              {project.title}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </TabsContent>

            <TabsContent value="services" className="mt-0 pt-5">
              {customer.serviceCodes && customer.serviceCodes.length > 0 ? (
                <section>
                  <h3 className={sheet.sectionTitle}>Services provided</h3>
                  <ul className="mt-3 divide-y divide-border border-y border-border">
                    {customer.serviceCodes.map((serviceCode, index) => (
                      <li key={index} className="px-2 py-3 text-sm leading-5 text-foreground">
                        {serviceLabel(serviceCode)}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className={sheet.empty}>No service information available</p>
              )}
            </TabsContent>

            <TabsContent value="technologies" className="mt-0 pt-5">
              {skills.length > 0 ? (
                <ul className="grid grid-cols-1 gap-x-6 border-t border-border sm:grid-cols-2">
                  {skills.map((skill) => {
                    const logoPath = skill.photoUrl || "";
                    return (
                      <li key={skill.code} className="border-b border-border">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors duration-150 ease-dossier hover:bg-secondary/60"
                          onClick={() => {
                            setSelectedSkill(skill);
                            setIsSkillDialogOpen(true);
                          }}
                        >
                          {/* Technology Logo */}
                          {logoPath && (
                            <img loading="lazy" decoding="async"
                              src={logoPath}
                              alt=""
                              className="h-5 w-5 flex-shrink-0 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="truncate text-sm font-medium text-foreground">{skill.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={sheet.empty}>No technology information available</p>
              )}
            </TabsContent>
          </div>
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
        onOpenProject={(project) => {
          setSelectedProject(project);
          setIsProjectDialogOpen(true);
        }}
      />

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

export default CustomerDetailDialog;