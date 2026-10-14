import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";

export interface DomainUsage {
  projects: number;
  companies: number;
}

/** How many projects, and how many companies (through any of their positions), list a domain. */
export function countDomainUsage(domainCode: string, projects: ProjectEntry[], experiences: Experience[]): DomainUsage {
  const projectCount = projects.filter((project) => project.domainCodes?.includes(domainCode)).length;
  const companies = new Set(
    experiences
      .filter((experience) => experience.positions?.some((position) => position.domainCodes?.includes(domainCode)))
      .map((experience) => experience.companyCode ?? experience.code),
  );
  return { projects: projectCount, companies: companies.size };
}
