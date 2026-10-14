import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { experienceRepo } from "@/repositories/ExperienceRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import RailItem from "@/components/system/TimelineRail";
import { experienceSpan, sortExperiencesDesc, sortPositionsDesc } from "@/lib/career";
import { capitalize, formatYearRange, numberToWords } from "@/lib/format";
import { CAREER } from "@/lib/site";
import ExperienceCard, { type CompanyEntry } from "./ExperienceCard";
import ExperienceDetailDialog from "./ExperienceDetailDialog";

const ExperienceSection = () => {
  const [entries, setEntries] = useState<CompanyEntry[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [experiences, projects] = await Promise.all([experienceRepo.getList(), projectsRepo.getList()]);
        const resolved = await Promise.all(
          sortExperiencesDesc(experiences).map(async (experience) => ({
            experience,
            company: experience.companyCode ? await companiesRepo.getByCode(experience.companyCode) : null,
            span: experienceSpan(experience),
            positions: sortPositionsDesc(experience.positions ?? []),
          })),
        );
        if (cancelled) return;
        setEntries(resolved);
        setProjectCount(projects.length);
      } catch (error) {
        console.error("Failed to load experiences:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section id="experience">
      <SectionHeader
        index="02"
        label="experience"
        title={
          <>
            {capitalize(numberToWords(CAREER.companies))} companies, {numberToWords(CAREER.years)} years,{" "}
            <em>one thread:</em> systems that have to work.
          </>
        }
        lede="A journey through enterprise software development, team leadership and architecture."
      />

      <StatGrid>
        <StatTile value={CAREER.companies} label="companies" />
        <StatTile value={CAREER.positions} label="positions" />
        <StatTile value={CAREER.years} suffix="+" label="years" />
        <StatTile value={projectCount} label="projects" />
      </StatGrid>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="surface h-[132px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {entries.map((entry, index) => (
            <RailItem
              key={entry.experience.companyCode ?? entry.experience.code ?? index}
              index={index}
              label={entry.span ? formatYearRange(entry.span.start, entry.span.end) : ""}
            >
              <ExperienceCard entry={entry} onOpen={() => setSelectedExperience(entry.experience)} />
            </RailItem>
          ))}
        </div>
      )}

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

export default ExperienceSection;
