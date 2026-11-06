import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import SectionHeader from '@/components/SectionHeader';
import { domainsRepo } from '@/repositories/DomainsRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { Domain, DomainsData } from '@/models/Domain';
import DomainDetailDialog from './DomainDetailDialog';
import { DomainIcon } from './DomainIcon';
import ExperienceDetailDialog from '../experiences/ExperienceDetailDialog';
import ProjectDetailDialog from '../projects/ProjectDetailDialog';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';

/** What the data says about one domain: counts, the companies involved and the years covered. */
interface DomainFacts {
  projects: number;
  experiences: number;
  companies: string[];
  from: number | null;
  to: number | null;
}

/** "01.05.2026" -> 2026 */
const yearOf = (date?: string | null) => {
  const year = Number(date?.split('.').pop());
  return Number.isFinite(year) && year > 0 ? year : null;
};

const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;

const yearRange = (from: number | null, to: number | null) =>
  from && to ? (from === to ? String(from) : `${from} – ${to}`) : '';

/** Projects and experiences per domain, from the same data the domain dialog lists. */
const collectFacts = (
  domains: Domain[],
  projects: ProjectEntry[],
  experiences: Experience[],
  companyTitle: (code: string) => string,
): Record<string, DomainFacts> => {
  const facts: Record<string, DomainFacts> = {};
  domains.forEach((domain) => {
    const code = domain.code || '';
    const inDomain = projects.filter((p) => p.domainCodes?.includes(code));
    const positions = experiences.flatMap((exp) =>
      (exp.positions ?? []).filter((pos) => pos.domainCodes?.includes(code)).map((pos) => ({ exp, pos })),
    );
    const experienceCount = new Set(positions.map(({ exp }) => exp)).size;

    const companies: string[] = [];
    [...positions.map(({ exp }) => exp.companyCode), ...inDomain.map((p) => p.companyCode)].forEach((companyCode) => {
      if (!companyCode) return;
      const title = companyTitle(companyCode);
      if (!companies.includes(title)) companies.push(title);
    });

    const years = [
      ...inDomain.flatMap((p) => [p.datePeriod?.startDate, p.datePeriod?.endDate]),
      ...positions.flatMap(({ pos }) => [pos.startDate, pos.endDate]),
    ]
      .map(yearOf)
      .filter((y): y is number => y !== null);

    facts[code] = {
      projects: inDomain.length,
      experiences: experienceCount,
      companies,
      from: years.length ? Math.min(...years) : null,
      to: years.length ? Math.max(...years) : null,
    };
  });
  return facts;
};

// Domain | companies | projects | experiences | years | arrow, on md and up
const INDEX_COLUMNS =
  'md:grid-cols-[1rem_minmax(0,4fr)_minmax(0,5fr)_4.5rem_6rem_7rem_1rem] md:gap-x-6 lg:gap-x-8';

/** A count cell: a figure under its column head on md+, "22 projects" in the meta line below. */
const CountCell = ({ value, unit }: { value: number; unit: string }) =>
  value > 0 ? (
    <span className="tnum md:text-right md:text-sm md:leading-7 md:text-foreground">
      {value}
      <span className="md:sr-only"> {plural(value, unit)}</span>
    </span>
  ) : (
    <span className="hidden text-right text-sm leading-7 text-faint md:inline">
      <span aria-hidden="true">–</span>
      <span className="sr-only">No {unit}s</span>
    </span>
  );

const DomainsSection = () => {
  const [domainsData, setDomainsData] = useSnapshotState<DomainsData | null>('domains.domainsData', null);
  const [facts, setFacts] = useSnapshotState<Record<string, DomainFacts>>('domains.facts', {});
  const [isLoading, setIsLoading] = useSnapshotState('domains.isLoading', true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Load domains, and the projects, experiences and companies their index rows count
  useEffect(() => {
    const loadDomainsData = async () => {
      try {
        const [domains, projects, experiences, companies] = await Promise.all([
          domainsRepo.getList(),
          projectsRepo.getList(),
          experienceRepo.getList(),
          companiesRepo.getList(),
        ]);
        const titles = new Map(companies.map((c) => [c.code.toUpperCase(), c.title]));
        setFacts(collectFacts(domains, projects, experiences, (code) => titles.get(code.toUpperCase()) || code));
        setDomainsData({ items: domains });
      } catch (error) {
        console.error('Failed to load domains data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDomainsData();
  }, [setDomainsData, setFacts, setIsLoading]);

  const title = 'Industry expertise in healthcare, construction, e-learning and SaaS';
  const description = 'Specialized expertise across diverse industries and technology domains';

  if (isLoading || !domainsData) {
    return (
      <section id="domains" className="py-16 lg:py-24">
        <div className="container">
          <SectionHeader id="domains" title={title} description={description} />
          <p className="text-sm text-muted-foreground">Loading domains</p>
        </div>
      </section>
    );
  }

  const { items: domains } = domainsData;
  const allYears = Object.values(facts).flatMap((f) => [f.from, f.to]).filter((y): y is number => y !== null);
  const span = allYears.length ? yearRange(Math.min(...allYears), Math.max(...allYears)) : '';

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDomainDialogOpen(true);
  };

  const handleOpenExperience = (experience: Experience) => {
    setSelectedExperience(experience);
    setIsExperienceDialogOpen(true);
  };

  const handleOpenProject = (project: ProjectEntry) => {
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };

  return (
    <section id="domains" className="py-16 lg:py-24">
      <div className="container">
        <SectionHeader
          id="domains"
          title={title}
          description={description}
          aside={
            <p>
              <span className="tnum">{domains.length}</span> domains{span && <>, <span className="tnum">{span}</span></>}
            </p>
          }
        />

        {/* Index of practice areas: one ruled row per domain, figures in their own columns */}
        <div
          aria-hidden="true"
          className={`hidden pb-3 text-xs leading-4 text-faint md:grid ${INDEX_COLUMNS}`}
        >
          <span />
          <span>Domain</span>
          <span>Companies</span>
          <span className="text-right">Projects</span>
          <span className="text-right">Experiences</span>
          <span className="text-right">Years</span>
          <span />
        </div>
        <ul className="border-b border-border">
          {domains.map((domain) => {
            const fact = facts[domain.code || ''];
            const years = fact ? yearRange(fact.from, fact.to) : '';
            return (
              <li
                key={domain.code}
                className={`group relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 border-t border-border py-5 max-md:first:border-t-0 max-md:first:pt-0 md:items-baseline md:py-4 ${INDEX_COLUMNS}`}
              >
                <DomainIcon
                  code={domain.code}
                  title={domain.title}
                  photoUrl={domain.photoUrl}
                  className="mt-1.5 self-start transition-colors duration-150 ease-dossier group-hover:text-foreground"
                />
                <h3 className="text-lg font-medium leading-7 text-foreground">
                  <button
                    type="button"
                    onClick={() => handleDomainClick(domain)}
                    className="text-left underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 ease-dossier after:absolute after:inset-0 group-hover:decoration-foreground/40 focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
                  >
                    {domain.title}
                  </button>
                </h3>
                {fact && (
                  <>
                    <p className="col-start-2 mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground md:col-start-auto md:mt-0">
                      {fact.companies.join(' · ')}
                    </p>
                    <p className="col-start-2 mt-2 flex flex-wrap gap-x-4 text-[13px] leading-5 text-faint md:contents">
                      <CountCell value={fact.projects} unit="project" />
                      <CountCell value={fact.experiences} unit="experience" />
                      <span className="tnum md:text-right md:text-sm md:leading-7 md:text-muted-foreground">{years}</span>
                    </p>
                  </>
                )}
                <ArrowUpRight
                  className="mt-1.5 hidden h-4 w-4 self-start text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground md:block"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Domain Detail Dialog */}
      <DomainDetailDialog
        domain={selectedDomain}
        isOpen={isDomainDialogOpen}
        onClose={() => {
          setIsDomainDialogOpen(false);
          setSelectedDomain(null);
        }}
        onOpenExperience={handleOpenExperience}
        onOpenProject={handleOpenProject}
      />

      {/* Experience Detail Dialog */}
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
        onOpenProject={handleOpenProject}
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
    </section>
  );
};

export default DomainsSection;
