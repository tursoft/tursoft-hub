import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { Briefcase, Building2, FolderKanban, Mail, Phone, Globe, Linkedin } from "lucide-react";
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag from '@/components/system/Tag';
import { stripHtml } from '@/lib/format';
import type { Person } from '@/models/People';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';

interface PeopleDetailDialogProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
}

const PeopleDetailDialog: React.FC<PeopleDetailDialogProps> = ({
  person,
  isOpen,
  onClose
}) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});
  const [projectLogos, setProjectLogos] = useState<Record<string, string>>({});
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Fetch experiences and projects related to this person
  useEffect(() => {
    const fetchData = async () => {
      if (!person?.code) return;

      try {
        // Fetch all projects
        const allProjects = await projectsRepo.getList();
        
        // Filter projects where this person is a team member
        const personProjects = allProjects.filter(project => 
          project.team?.some(member => member.personCode === person.code)
        );
        setProjects(personProjects);

        // Get distinct company codes from person's projects
        const companyCodes = new Set<string>();
        personProjects.forEach(project => {
          if (project.companyCode) companyCodes.add(project.companyCode);
        });

        // Fetch all experiences and filter by company codes from person's projects
        const allExperiences = await experienceRepo.getList();
        const personExperiences = allExperiences.filter(experience => 
          experience.companyCode && companyCodes.has(experience.companyCode)
        );
        
        // Remove duplicates by company (experience entries carry no code)
        const uniqueExperiences = Array.from(
          new Map(personExperiences.map(exp => [exp.companyCode, exp])).values()
        );
        setExperiences(uniqueExperiences);

        // Load companies for projects and experiences
        const companiesData: { [key: string]: Company } = {};
        for (const code of companyCodes) {
          const company = await companiesRepo.getByCode(code);
          if (company) companiesData[code] = company;
        }
        setCompanies(companiesData);

        // Fetch project logos
        const logos: Record<string, string> = {};
        for (const project of personProjects) {
          if (project.code) {
            const logo = await projectsRepo.getPhotoUrlByCode(project.code);
            if (logo) logos[project.code] = logo;
          }
        }
        setProjectLogos(logos);

      } catch (error) {
        console.error('Failed to load person data:', error);
      }
    };

    if (person && isOpen) {
      fetchData();
    }
  }, [person, isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!person) return null;

  // Get contact information
  const linkedinContact = person.contacts?.find(c => c.code === 'linkedin');
  const emailContact = person.contacts?.find(c => c.code === 'email');
  const phoneContact = person.contacts?.find(c => c.code === 'phone');
  const websiteContact = person.contacts?.find(c => c.code === 'website');

  const contactLinks =
    linkedinContact?.value || emailContact?.value || phoneContact?.value || websiteContact?.value ? (
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
        {linkedinContact?.value && (
          <a
            href={linkedinContact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link-quiet inline-flex items-center gap-1.5"
          >
            <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
            LinkedIn
          </a>
        )}
        {emailContact?.value && (
          <a href={`mailto:${emailContact.value}`} className="link-quiet inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {emailContact.value}
          </a>
        )}
        {phoneContact?.value && (
          <a href={`tel:${phoneContact.value}`} className="link-quiet inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {phoneContact.value}
          </a>
        )}
        {websiteContact?.value && (
          <a
            href={websiteContact.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link-quiet inline-flex items-center gap-1.5"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            Website
          </a>
        )}
      </div>
    ) : null;

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        icon={<LogoTile src={person.photoUrl} alt={person.title} size={52} variant="photo" />}
        title={person.title}
        meta={[
          person.company ? (
            <>
              <Building2 aria-hidden="true" />
              {person.company}
            </>
          ) : null,
        ]}
        tags={<Tag tone="accent">person</Tag>}
        headerExtra={contactLinks}
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
            {projects.length > 0 ? (
              <DetailRows>
                {projects.map((project) => {
                  const company = companies[project.companyCode || ''];
                  const teamMember = project.team?.find((member) => member.personCode === person.code);
                  return (
                    <DetailRow
                      key={project.code}
                      icon={
                        <LogoTile src={projectLogos[project.code] || project.photoUrl} alt={project.title} size={40} />
                      }
                      title={project.title}
                      subtitle={stripHtml(project.summary)}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsProjectDialogOpen(true);
                      }}
                    >
                      {(teamMember?.position || company) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {teamMember?.position && <Tag tone="accent">{teamMember.position}</Tag>}
                          {company && <Tag>{company.title}</Tag>}
                        </div>
                      )}
                    </DetailRow>
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No projects found.</DetailEmpty>
            )}
          </TabsContent>

          <TabsContent value="experiences">
            {experiences.length > 0 ? (
              <DetailRows>
                {experiences.map((experience) => {
                  const company = companies[experience.companyCode || ''];
                  // The person's roles on projects at this company.
                  const positions = [
                    ...new Set(
                      projects
                        .filter((project) => project.companyCode === experience.companyCode)
                        .map((project) => project.team?.find((member) => member.personCode === person.code)?.position)
                        .filter(Boolean),
                    ),
                  ];
                  return (
                    <DetailRow
                      key={experience.companyCode}
                      icon={
                        <LogoTile src={company?.photoUrl} alt={company?.title ?? experience.companyCode ?? ''} size={40} />
                      }
                      title={company?.title || experience.companyCode}
                      subtitle={positions.length > 0 ? positions.join(', ') : 'Team Member'}
                      onClick={() => {
                        setSelectedExperience(experience);
                        setIsExperienceDialogOpen(true);
                      }}
                    />
                  );
                })}
              </DetailRows>
            ) : (
              <DetailEmpty>No experiences found.</DetailEmpty>
            )}
          </TabsContent>
        </Tabs>
      </DetailDialog>

      <ExperienceDetailDialog
        experience={selectedExperience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
      />

      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
        projectIcon={selectedProject?.photoUrl}
      />
    </>
  );
};

export default PeopleDetailDialog;
