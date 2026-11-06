import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@design/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@design/components/ui/tabs";
import { Button } from "@design/components/ui/button";
import LogoPlate from "@design/components/ui/logo-plate";
import {
  Maximize2,
  Minimize2,
  Mail,
  Phone,
  Globe,
  Linkedin
} from "lucide-react";
import { cn } from '@/lib/utils';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import type { Person } from '@/models/People';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';

/** A testimonial the person gave, shown in full when the dialog opens from References. */
export interface PersonTestimonial {
  /** Quote markup, already without highlight spans. */
  html: string;
  role?: string;
  date?: string;
  lang?: string;
}

interface PeopleDetailDialogProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  testimonial?: PersonTestimonial | null;
}

/** One clickable row of a list inside the dialog: logo plate, title, meta. */
const DialogRow = ({
  onClick,
  logo,
  logoAlt,
  title,
  children,
}: {
  onClick: () => void;
  logo?: string;
  logoAlt: string;
  title: string;
  children?: React.ReactNode;
}) => (
  <li className="border-b border-border">
    <button
      type="button"
      onClick={onClick}
      className="group -mx-3 flex w-[calc(100%+1.5rem)] items-start gap-4 rounded-md px-3 py-4 text-left transition-colors duration-150 ease-dossier hover:bg-secondary"
    >
      <LogoPlate src={logo || undefined} alt={logoAlt} className="h-12 w-12 flex-shrink-0 p-1.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-6 text-foreground">{title}</span>
        {children}
      </span>
    </button>
  </li>
);

const PeopleDetailDialog: React.FC<PeopleDetailDialogProps> = ({
  person,
  isOpen,
  onClose,
  testimonial
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
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

        // Remove duplicates based on experience code
        const uniqueExperiences = Array.from(
          new Map(personExperiences.map(exp => [exp.code, exp])).values()
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
    setIsMaximized(false);
    onClose();
  };

  if (!person) return null;

  // Get contact information
  const linkedinContact = person.contacts?.find(c => c.code === 'linkedin');
  const emailContact = person.contacts?.find(c => c.code === 'email');
  const phoneContact = person.contacts?.find(c => c.code === 'phone');
  const websiteContact = person.contacts?.find(c => c.code === 'website');

  const contactLinks = [
    linkedinContact?.value && { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', href: linkedinContact.value, external: true },
    emailContact?.value && { key: 'email', icon: Mail, label: emailContact.value, href: `mailto:${emailContact.value}`, external: false },
    phoneContact?.value && { key: 'phone', icon: Phone, label: phoneContact.value, href: `tel:${phoneContact.value}`, external: false },
    websiteContact?.value && { key: 'website', icon: Globe, label: 'Website', href: websiteContact.value, external: true },
  ].filter(Boolean) as Array<{ key: string; icon: typeof Mail; label: string; href: string; external: boolean }>;

  const testimonialMeta = [testimonial?.role, testimonial?.date].filter(Boolean).join(', ');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 overflow-hidden bg-card p-0',
            isMaximized
              ? 'h-full max-h-full w-full max-w-full rounded-none sm:rounded-none'
              : 'h-full max-h-full w-full max-w-full rounded-none sm:h-auto sm:max-h-[90vh] sm:w-[calc(100vw-4rem)] sm:max-w-2xl sm:rounded-lg'
          )}
        >
          {/* Header: kicker, printed photo, serif name, company and ways to reach them */}
          <header className="flex-shrink-0 border-b border-border px-6 pb-5 pt-6 sm:px-8">
            <p className="pr-24 text-[13px] leading-4 text-faint">Person</p>
            <div className="mt-4 flex items-start gap-4">
              {person.photoUrl && (
                <img
                  loading="lazy"
                  decoding="async"
                  src={person.photoUrl}
                  alt={`${person.title} photo`}
                  width={64}
                  height={64}
                  className="print-photo h-16 w-16 flex-shrink-0 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <DialogHeader className="min-w-0 space-y-0 text-left sm:text-left">
                <DialogTitle className="font-serif text-2xl font-normal leading-8 tracking-[-0.01em] text-foreground sm:text-[28px]">
                  {person.title}
                </DialogTitle>
                {person.company ? (
                  <DialogDescription className="mt-1 text-sm text-muted-foreground">{person.company}</DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">Projects and experiences shared with {person.title}</DialogDescription>
                )}
              </DialogHeader>
            </div>

            {contactLinks.length > 0 && (
              <ul className="-ml-2 mt-4 flex flex-wrap gap-x-1">
                {contactLinks.map((contact) => (
                  <li key={contact.key}>
                    <a
                      href={contact.href}
                      target={contact.external ? '_blank' : undefined}
                      rel={contact.external ? 'noopener noreferrer' : undefined}
                      className="group inline-flex h-8 items-center gap-2 rounded-md px-2 text-[13px] leading-5 text-muted-foreground transition-colors duration-150 ease-dossier hover:bg-secondary hover:text-foreground"
                    >
                      <contact.icon
                        className="h-4 w-4 text-faint transition-colors duration-150 group-hover:text-foreground"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span className="tnum">{contact.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </header>

          {/* Maximize sits left of the dialog's own close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="absolute right-14 top-4 z-10 h-8 w-8 p-0"
            aria-label={isMaximized ? 'Restore size' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
          </Button>

          {/* Body: one scroll for the testimonial and the lists */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-6 sm:px-8">
            {testimonial?.html && (
              <figure className="mb-8">
                <blockquote lang={testimonial.lang || undefined}>
                  <p className="font-serif text-[19px] leading-[30px] text-foreground [text-wrap:pretty] sm:text-xl sm:leading-8">
                    <span className="-ml-[0.4em]">“</span>
                    <span dangerouslySetInnerHTML={{ __html: testimonial.html }} />”
                  </p>
                </blockquote>
                {testimonialMeta && (
                  <figcaption className="tnum mt-3 text-[13px] leading-5 text-faint">{testimonialMeta}</figcaption>
                )}
              </figure>
            )}

            <Tabs defaultValue="projects">
              <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
                <TabsTrigger value="projects">
                  Projects<span className="tnum ml-1.5 text-faint">{projects.length}</span>
                </TabsTrigger>
                <TabsTrigger value="experiences">
                  Experiences<span className="tnum ml-1.5 text-faint">{experiences.length}</span>
                </TabsTrigger>
              </TabsList>

              {/* Projects Tab */}
              <TabsContent value="projects" className="mt-4 border-t border-border">
                {projects.length > 0 ? (
                  <ul>
                    {projects.map((project) => {
                      const company = companies[project.companyCode || ''];
                      const logoPath = projectLogos[project.code] || project.photoUrl || "";
                      const teamMember = project.team?.find(m => m.personCode === person.code);

                      return (
                        <DialogRow
                          key={project.code}
                          logo={logoPath}
                          logoAlt={`${project.title} logo`}
                          title={project.title}
                          onClick={() => {
                            setSelectedProject(project);
                            setIsProjectDialogOpen(true);
                          }}
                        >
                          {(teamMember?.position || company) && (
                            <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">
                              {[teamMember?.position, company?.title].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {project.summary && (
                            <span className="mt-1 line-clamp-2 text-sm leading-[22px] text-muted-foreground">
                              {/* summaries may carry <br/> markup; a line preview reads them as spaces */}
                              {project.summary.replace(/<[^>]+>/g, ' ')}
                            </span>
                          )}
                        </DialogRow>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">No projects found</p>
                )}
              </TabsContent>

              {/* Experiences Tab */}
              <TabsContent value="experiences" className="mt-4 border-t border-border">
                {experiences.length > 0 ? (
                  <ul>
                    {experiences.map((experience) => {
                      const company = companies[experience.companyCode || ''];
                      const logoPath = company?.photoUrl || "";

                      // Find the person's position(s) from projects at this company
                      const personPositions = projects
                        .filter(project => project.companyCode === experience.companyCode)
                        .map(project => {
                          const teamMember = project.team?.find(member => member.personCode === person.code);
                          return teamMember?.position;
                        })
                        .filter(Boolean); // Remove undefined values

                      // Get unique positions
                      const uniquePositions = [...new Set(personPositions)];
                      const positionText = uniquePositions.length > 0
                        ? uniquePositions.join(', ')
                        : 'Team Member';

                      return (
                        <DialogRow
                          key={experience.code}
                          logo={logoPath}
                          logoAlt={`${company?.title} logo`}
                          title={company?.title || experience.companyCode || ''}
                          onClick={() => {
                            setSelectedExperience(experience);
                            setIsExperienceDialogOpen(true);
                          }}
                        >
                          <span className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
                            {positionText}
                          </span>
                        </DialogRow>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">No experiences found</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Experience Detail Dialog */}
      <ExperienceDetailDialog
        experience={selectedExperience as never}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
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
        projectIcon={selectedProject?.photoUrl}
      />
    </>
  );
};

export default PeopleDetailDialog;
