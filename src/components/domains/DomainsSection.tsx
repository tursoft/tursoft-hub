import { useEffect, useState } from "react";
import { domainsRepo } from "@/repositories/DomainsRepo";
import { experienceRepo } from "@/repositories/ExperienceRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { Domain } from "@/models/Domain";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import ExperienceDetailDialog from "@/components/experiences/ExperienceDetailDialog";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import LogoTile from "@/components/system/LogoTile";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import Surface from "@/components/system/Surface";
import { countDomainUsage, type DomainUsage } from "@/lib/domains";
import { plural } from "@/lib/format";
import DomainDetailDialog from "./DomainDetailDialog";

type DomainWithUsage = Domain & DomainUsage;

const DomainsSection = () => {
  const [domains, setDomains] = useState<DomainWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [domainList, projects, experiences] = await Promise.all([
          domainsRepo.getList(),
          projectsRepo.getList(),
          experienceRepo.getList(),
        ]);
        setDomains(
          domainList
            .map((domain) => ({ ...domain, ...countDomainUsage(domain.code, projects, experiences) }))
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
      } catch (error) {
        console.error("Failed to load domains:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="domains">
      <SectionHeader
        index="03"
        label="domains"
        title={
          <>
            Industries I have <em>built for.</em>
          </>
        }
        lede="Specialized expertise across diverse industries and technology domains."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="surface h-[88px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain, index) => (
            <Reveal key={domain.code} index={index}>
              <Surface
                interactive
                onActivate={() => setSelectedDomain(domain)}
                className="flex h-full items-center gap-4 p-5"
              >
                <LogoTile src={domain.photoUrl} alt={domain.title} size={46} className="domain-tile" />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-medium">{domain.title}</h3>
                  <p className="type-meta mt-0.5">
                    {plural(domain.projects, "project")} · {plural(domain.companies, "company", "companies")}
                  </p>
                </div>
              </Surface>
            </Reveal>
          ))}
        </div>
      )}

      <DomainDetailDialog
        domain={selectedDomain}
        isOpen={selectedDomain !== null}
        onClose={() => setSelectedDomain(null)}
        onOpenExperience={setSelectedExperience}
        onOpenProject={setSelectedProject}
      />
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
        onOpenProject={setSelectedProject}
      />
      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
    </Section>
  );
};

export default DomainsSection;
