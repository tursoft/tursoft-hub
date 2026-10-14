import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Clock, Info, Wrench, Cog } from "lucide-react";
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { referencesRepo } from '@/repositories/ReferencesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailHeading, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
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
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [customerReferences, setCustomerReferences] = useState<Reference[]>([]);
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
    } else {
      setProjects([]);
    }
  }, [customer?.projectCodes]);

  // Fetch technology objects and logos when customer changes
  useEffect(() => {
    const fetchSkills = async () => {
      if (!customer?.skillCodes) return;
      
      const skillItems: SkillItem[] = [];
      
      for (const skillCode of customer.skillCodes) {
        if (skillCode) {
          const skill = await skillsRepo.getByCode(skillCode);
          if (skill) {
            skillItems.push(skill);
          }
        }
      }
      
      setSkills(skillItems);
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

  const title = companyTitle || companyData?.title || customer.companyCode || customer.code;

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={customerLogo || companyData?.photoUrl} alt={title} size={52} variant="logo-light" />}
        title={title}
        meta={[
          customer.location ? (
            <>
              <MapPin aria-hidden="true" />
              {customer.location}
            </>
          ) : null,
          customer.partnership?.startDate ? (
            <>
              <Clock aria-hidden="true" />
              {formatMonthRange(customer.partnership.startDate, customer.partnership.endDate)}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="cust">customer</Tag>
            {customer.category && <Tag>{customer.category}</Tag>}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
              {customer.projectCodes && customer.projectCodes.length > 0 && (
                <TabCount>{customer.projectCodes.length}</TabCount>
              )}
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              {customer.skillCodes && <TabCount>{customer.skillCodes.length}</TabCount>}
            </TabsTrigger>
            <TabsTrigger value="services">
              <Cog aria-hidden="true" />
              Services
              {customer.serviceCodes && <TabCount>{customer.serviceCodes.length}</TabCount>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-7">
            {customer.description && (
              <div
                className="text-sm leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: customer.description }}
              />
            )}

            {(customer.industry || customer.relationship) && (
              <div className="flex flex-wrap gap-1.5">
                {customer.industry && <Tag>{customer.industry}</Tag>}
                {customer.relationship && <Tag>{customer.relationship}</Tag>}
              </div>
            )}

            {customerReferences.length > 0 && (
              <div>
                <DetailHeading>testimonials · {customerReferences.length}</DetailHeading>
                <div className="detail-list">
                  {customerReferences.map((reference, index) => (
                    <figure key={index} className="py-4 first:pt-0">
                      <blockquote
                        className="quote-text text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: `“${reference.testimonial}”` }}
                      />
                      <figcaption className="mt-3 flex items-center gap-3">
                        <LogoTile src={reference.photoUrl} alt={reference.title} size={32} variant="photo" />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-foreground">{reference.title}</div>
                          <div className="type-meta">
                            {reference.position} at {reference.company}
                          </div>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {customer.projectCodes && customer.projectCodes.length > 0 && projects.length > 0 && (
              <div>
                <DetailHeading>related projects · {projects.length}</DetailHeading>
                <DetailRows>
                  {projects.map((project) => (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsProjectDialogOpen(true);
                      }}
                    />
                  ))}
                </DetailRows>
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
              <DetailEmpty>No technology information available.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="services">
            {customer.serviceCodes && customer.serviceCodes.length > 0 ? (
              <DetailRows columns={2}>
                {customer.serviceCodes.map((serviceCode, index) => (
                  <DetailRow
                    key={`${serviceCode}-${index}`}
                    icon={<span className="h-[5px] w-[5px] shrink-0 rounded-[1px] bg-accent" aria-hidden="true" />}
                    title={serviceCode}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No service information available.</DetailEmpty>
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
        onOpenProject={(project) => {
          setSelectedProject(project);
          setIsProjectDialogOpen(true);
        }}
      />

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

export default CustomerDetailDialog;