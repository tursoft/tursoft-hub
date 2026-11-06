import { useState, useEffect, type MouseEvent, type ReactNode } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Globe, Linkedin } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import ExperienceDetailDialog from './ExperienceDetailDialog';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import AnimatedCounter from '@/components/ui/animated-counter';
import CareerPlate from './CareerPlate';
import { formatDuration, formatRange, parseDate } from './career-dates';
import type { Experience, ExperiencesData } from '@/models/Experience';

interface ProcessedPosition {
  title: string;
  /** "Dec 2022 – Apr 2026" */
  range: string;
  /** "3 years 4 months" */
  duration: string;
  /** The summary, split into its paragraphs */
  description: string[];
  /** Up to six skills, by title */
  skills: string[];
  current: boolean;
  startDate: string;
}

interface ProcessedExperience {
  companyCode: string;
  company: string;
  logo?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  positions: ProcessedPosition[];
  location: string;
  /** The whole stay at the company */
  range: string;
  duration: string;
  current: boolean;
}

const byStartDesc = (a: { startDate: string }, b: { startDate: string }) =>
  parseDate(b.startDate).getTime() - parseDate(a.startDate).getTime();

// Durations count to today, so they are worked out here (in an effect) and kept in snapshot
// state; the render reads only stored strings and matches the prerendered HTML.
async function processExperiences(data: ExperiencesData): Promise<ProcessedExperience[]> {
  const results = await Promise.all(
    data.items.map(async (item) => {
      const positions = await Promise.all(
        item.positions.map(async (position): Promise<ProcessedPosition> => {
          const skills = await Promise.all(
            (position.skillCodes || []).slice(0, 6).map(async (code) => (await skillsRepo.getByCode(code))?.title || code),
          );
          return {
            title: position.title,
            range: formatRange(position.startDate, position.endDate),
            duration: formatDuration(position.startDate, position.endDate),
            description: position.summary.split('<br/>').map((part) => part.trim()).filter(Boolean),
            skills,
            current: !position.endDate,
            startDate: position.startDate,
          };
        }),
      );
      positions.sort(byStartDesc);

      const company = item.companyCode ? await companiesRepo.getByCode(item.companyCode) : null;
      const current = item.positions.some((position) => !position.endDate);
      const start = item.positions.reduce(
        (earliest, position) => (parseDate(position.startDate) < parseDate(earliest) ? position.startDate : earliest),
        item.positions[0].startDate,
      );
      const end = current
        ? null
        : item.positions.reduce<string>(
            (latest, position) =>
              position.endDate && parseDate(position.endDate) > parseDate(latest) ? position.endDate : latest,
            item.positions[0].endDate as string,
          );

      return {
        companyCode: item.companyCode || '',
        company: company?.title || item.companyCode || 'Unknown',
        logo: company?.photoUrl || undefined,
        websiteUrl: company?.websiteUrl || undefined,
        linkedinUrl: company?.linkedinUrl || undefined,
        positions,
        location: company?.city && company?.country ? `${company.city}, ${company.country}` : 'Turkey',
        range: formatRange(start, end),
        duration: formatDuration(start, end),
        current,
      };
    }),
  );

  // Most recent first, by the latest position's start date
  return results.sort((a, b) => byStartDesc(a.positions[0], b.positions[0]));
}

/** Whole years since the first position started. */
function yearsSinceFirstRole(data: ExperiencesData): number {
  const starts = data.items.flatMap((item) => item.positions.map((position) => parseDate(position.startDate).getTime()));
  if (!starts.length) return 0;
  return Math.floor((Date.now() - Math.min(...starts)) / (1000 * 60 * 60 * 24 * 365));
}

const stopRowClick = (event: MouseEvent) => event.stopPropagation();

const ExperienceSection = () => {
  const [experiencesData, setExperiencesData] = useSnapshotState<ExperiencesData | null>('experience.experiencesData', null);
  const [isLoading, setIsLoading] = useSnapshotState('experience.isLoading', true);
  const [totalProjects, setTotalProjects] = useSnapshotState('experience.totalProjects', 0);
  const [careerYears, setCareerYears] = useSnapshotState('experience.careerYears', 0);
  const [processedExperiences, setProcessedExperiences] = useSnapshotState<ProcessedExperience[]>('experience.processedExperiences', []);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExperienceClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedExperience(null);
  };

  // Load experiences data from JSON file
  useEffect(() => {
    const loadExperiencesData = async () => {
      try {
        const response = await fetch('/data/experiences.json');
        const data: ExperiencesData = await response.json();
        setExperiencesData(data);
      } catch (error) {
        console.error('Failed to load experiences data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiencesData();
  }, [setExperiencesData, setIsLoading]);

  // Load total projects count
  useEffect(() => {
    const loadProjectsCount = async () => {
      try {
        const projects = await projectsRepo.getList();
        setTotalProjects(projects.length);
      } catch (error) {
        console.error('Failed to load projects count:', error);
      }
    };

    loadProjectsCount();
  }, [setTotalProjects]);

  // Process experiences when data is loaded
  useEffect(() => {
    if (!experiencesData) return;
    let cancelled = false;
    processExperiences(experiencesData).then((experiences) => {
      if (cancelled) return;
      setProcessedExperiences(experiences);
      setCareerYears(yearsSinceFirstRole(experiencesData));
    });
    return () => {
      cancelled = true;
    };
  }, [experiencesData, setProcessedExperiences, setCareerYears]);

  const header = (aside?: ReactNode) => (
    <SectionHeader
      id="experience"
      title="25+ years of enterprise software leadership"
      description="Enterprise software development, team leadership and architecture, now delivered with AI agent teams."
      aside={aside}
    />
  );

  if (isLoading || !experiencesData) {
    return (
      <section id="experience" className="py-16 lg:py-24">
        <div className="container">
          {header()}
          <p className="text-sm text-faint">Loading experience…</p>
        </div>
      </section>
    );
  }

  const figures = [
    { label: 'Companies', value: processedExperiences.length },
    { label: 'Positions', value: processedExperiences.reduce((total, exp) => total + exp.positions.length, 0) },
    { label: 'Years', value: careerYears, suffix: '+' },
    { label: 'Projects', value: totalProjects },
  ];

  const openExperience = (exp: ProcessedExperience, index: number) => {
    // Find the original experience item by companyCode
    const matchingExperience = experiencesData.items.find((item) => item.companyCode === exp.companyCode);
    handleExperienceClick(matchingExperience || experiencesData.items[index]);
  };

  return (
    <section id="experience" className="py-16 lg:py-24">
      <div className="container">
        {header(
          <dl className="grid grid-cols-4 gap-x-6 sm:gap-x-10">
            {figures.map((figure) => (
              <div key={figure.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-[13px] leading-5 text-faint">{figure.label}</dt>
                <dd className="tnum font-serif text-[32px] leading-9 text-foreground">
                  <AnimatedCounter end={figure.value} suffix={figure.suffix} />
                </dd>
              </div>
            ))}
          </dl>,
        )}

        {/* The record: one row per employer, most recent first */}
        <ol>
          {processedExperiences.map((exp, index) => (
            <li key={exp.companyCode || index} className="border-b border-border">
              <div
                className="career-row group -mx-4 cursor-pointer px-4 py-6 transition-colors duration-150 ease-dossier hover:bg-card md:-mx-6 md:px-6 md:py-8"
                onClick={() => openExperience(exp, index)}
              >
                <div className="career-when flex flex-wrap items-baseline gap-x-2 md:block">
                  <p className="tnum text-sm leading-5 text-foreground">{exp.range}</p>
                  <p className="tnum text-[13px] leading-5 text-faint md:mt-1">
                    <span aria-hidden="true" className="pr-2 md:hidden">·</span>
                    {exp.duration}
                  </p>
                </div>

                <div className="career-head mt-3 md:mt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="career-name text-lg font-medium leading-7 text-foreground">{exp.company}</h3>
                    {exp.current && <Badge>Current</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] leading-5 text-muted-foreground">
                    <span>{exp.location}</span>
                    {(exp.websiteUrl || exp.linkedinUrl) && (
                      <span className="flex items-center gap-1">
                        {exp.websiteUrl && (
                          <a
                            href={exp.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={stopRowClick}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-faint transition-colors duration-150 ease-dossier hover:text-foreground"
                            title="Visit website"
                            aria-label={`${exp.company} website`}
                          >
                            <Globe className="h-4 w-4" strokeWidth={1.5} />
                          </a>
                        )}
                        {exp.linkedinUrl && (
                          <a
                            href={exp.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={stopRowClick}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-faint transition-colors duration-150 ease-dossier hover:text-foreground"
                            title="Visit LinkedIn"
                            aria-label={`${exp.company} on LinkedIn`}
                          >
                            <Linkedin className="h-4 w-4" strokeWidth={1.5} />
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="career-body mt-4 max-w-[46rem]">
                  <div className="space-y-5">
                    {exp.positions.map((position, posIndex) => (
                      <div key={`${position.title}-${posIndex}`}>
                        <h4 className="text-[15px] leading-6 text-foreground">{position.title}</h4>
                        {exp.positions.length > 1 && (
                          <p className="tnum text-[13px] leading-5 text-faint">
                            {position.range}
                            <span aria-hidden="true" className="px-1.5">·</span>
                            {position.duration}
                          </p>
                        )}
                        <p className="mt-1.5 line-clamp-3 text-sm leading-[22px] text-muted-foreground [text-wrap:pretty]">
                          {position.description.join(' ')}
                        </p>
                        {position.skills.length > 0 && (
                          <p className="mt-2 text-[13px] leading-5 text-faint">{position.skills.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label={`Full record, ${exp.company}`}
                    className="mt-4 inline-flex items-center gap-1 rounded-sm text-[13px] leading-5 text-muted-foreground transition-colors duration-150 ease-dossier group-hover:text-foreground"
                  >
                    Full record
                    <ArrowUpRight className="h-4 w-4 text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground" strokeWidth={1.5} />
                  </button>
                </div>

                <div className="career-logo">
                  {exp.logo && (
                    <CareerPlate src={exp.logo} alt={`${exp.company} logo`} className="aspect-square w-full p-1.5 md:p-2" />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Experience Detail Dialog */}
        <ExperienceDetailDialog
          experience={selectedExperience}
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
        />
      </div>
    </section>
  );
};

export default ExperienceSection;
