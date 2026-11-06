import { useState, useEffect, type ReactNode } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "@design/components/SectionHeader";
import EducationDetailDialog from './EducationDetailDialog';
import CareerPlate from '../experiences/CareerPlate';
import { educationRepo } from '@/repositories/EducationRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { Education, EducationData } from '@/models/Education';

// Helper type for processed education with company details
type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
  /** Skill titles in the data's order, resolved from `skillCodes` */
  skillTitles?: string[];
};

const SKILLS_SHOWN = 8;

/** "1999–2004" or "2012-2013" → "1999 – 2004": one dash, one format. */
const formatPeriod = (period: string) => period.replace(/\s*[-–]\s*/, ' – ');

/** "February, 2013" → "February 2013" */
const formatGraduation = (date: string) => date.replace(/,\s*/, ' ');

/** A numeric score is a GPA ("3.80 / 4.00"); letters are a grade ("AA"). */
const scoreLabel = (score: string) => (/\d/.test(score) ? 'GPA' : 'Grade');

/** "4.80/5.00" → "4.80 / 5.00" */
const formatScore = (score: string) => score.replace(/\s*\/\s*/, ' / ');

/** "5 programs, 1995 – 2013", from the periods in the data. */
function summarizeYears(educations: Education[]): string {
  const years = educations.flatMap((edu) => (edu.period.match(/\d{4}/g) || []).map(Number));
  if (!years.length) return `${educations.length} programs`;
  return `${educations.length} programs, ${Math.min(...years)} – ${Math.max(...years)}`;
}

const EducationSection = () => {
  const [educationData, setEducationData] = useSnapshotState<EducationData | null>('education.educationData', null);
  const [processedEducations, setProcessedEducations] = useSnapshotState<ProcessedEducation[]>('education.processedEducations', []);
  const [isLoading, setIsLoading] = useSnapshotState('education.isLoading', true);
  const [selectedEducation, setSelectedEducation] = useState<ProcessedEducation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load education data and process with company details
  useEffect(() => {
    const loadEducationData = async () => {
      try {
        // Load education data from repository
        const educations = await educationRepo.getList();

        // Get general info
        const response = await fetch('/data/education.json');
        const fullData = await response.json();
        const data: EducationData = {
          general: fullData.general,
          items: educations
        };
        setEducationData(data);

        // Process educations with company details and skill titles
        const processed = await Promise.all(
          educations.map(async (edu) => {
            const company = await companiesRepo.getByCode(edu.companyCode);
            const skillTitles = await Promise.all(
              (edu.skillCodes || []).map(async (code) => (await skillsRepo.getByCode(code))?.title || code),
            );
            return {
              ...edu,
              companyName: company?.title,
              companyPhotoUrl: company?.photoUrl,
              companyCity: company?.city,
              skillTitles,
            } as ProcessedEducation;
          })
        );
        setProcessedEducations(processed);

      } catch (error) {
        console.error('Failed to load education data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEducationData();
  }, [setEducationData, setIsLoading, setProcessedEducations]);

  // Handle education row click
  const handleEducationClick = (education: ProcessedEducation) => {
    setSelectedEducation(education);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEducation(null);
  };

  const header = (description?: ReactNode, aside?: ReactNode) => (
    <SectionHeader
      id="education"
      title="Education"
      description={description}
      aside={aside}
    />
  );

  if (isLoading || !educationData) {
    return (
      <section id="education" className="py-16 lg:py-24">
        <div className="container">
          {header()}
          <p className="text-sm text-faint">Loading education…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="education" className="py-16 lg:py-24">
      <div className="container">
        {header(educationData.general.summary, <p>{summarizeYears(processedEducations)}</p>)}

        {/* The record: one row per program, most recent first, as in the data */}
        <ol>
          {processedEducations.map((edu) => {
            const skills = edu.skillTitles ?? edu.skillCodes ?? [];
            const more = skills.length - SKILLS_SHOWN;

            return (
              <li key={edu.code} className="border-b border-border">
                <div
                  className="career-row group -mx-4 cursor-pointer px-4 py-6 transition-colors duration-150 ease-dossier hover:bg-card md:-mx-6 md:px-6 md:py-8"
                  onClick={() => handleEducationClick(edu)}
                >
                  <div className="career-when flex flex-wrap items-baseline gap-x-2 md:block">
                    <p className="tnum text-sm leading-5 text-foreground">{formatPeriod(edu.period)}</p>
                    <p className="text-[13px] leading-5 text-faint md:mt-1">
                      <span aria-hidden="true" className="pr-2 md:hidden">·</span>
                      {edu.level}
                    </p>
                  </div>

                  <div className="career-head mt-3 md:mt-0">
                    <h3 className="career-name text-lg font-medium leading-7 text-foreground [text-wrap:balance]">
                      {edu.department}
                    </h3>
                    <h4 className="mt-0.5 text-[15px] leading-6 text-muted-foreground">{edu.companyName}</h4>
                    <p className="tnum mt-1 text-[13px] leading-5 text-faint">
                      <span className="whitespace-nowrap">{edu.companyCity}</span>
                      <span aria-hidden="true" className="px-1.5">·</span>
                      <span className="whitespace-nowrap">Graduated {formatGraduation(edu.graduateDate)}</span>
                      <span aria-hidden="true" className="px-1.5">·</span>
                      <span className="whitespace-nowrap">
                        {scoreLabel(edu.graduateScore)} {formatScore(edu.graduateScore)}
                      </span>
                    </p>
                  </div>

                  <div className="career-body mt-4 max-w-[46rem]">
                    {edu.summary && (
                      <p className="text-sm leading-[22px] text-muted-foreground [text-wrap:pretty]">{edu.summary}</p>
                    )}
                    {skills.length > 0 && (
                      <p className="mt-2 text-[13px] leading-5 text-faint">
                        {skills.slice(0, SKILLS_SHOWN).join(', ')}
                        {more > 0 && ` and ${more} more`}
                      </p>
                    )}
                    <button
                      type="button"
                      aria-label={`Full record, ${edu.department}`}
                      className="mt-4 inline-flex items-center gap-1 rounded-sm text-[13px] leading-5 text-muted-foreground transition-colors duration-150 ease-dossier group-hover:text-foreground"
                    >
                      Full record
                      <ArrowUpRight className="h-4 w-4 text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="career-logo">
                    {edu.companyPhotoUrl && (
                      <CareerPlate
                        src={edu.companyPhotoUrl}
                        alt={`${edu.companyName} logo`}
                        className="aspect-square w-full p-1.5 md:p-2"
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* A closing note, set in the record's columns */}
        <div className="mt-12 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-x-12">
          <h3 className="text-[13px] font-medium leading-6 text-muted-foreground">Continuous learning</h3>
          <p className="mt-2 max-w-[46rem] text-[15px] leading-6 text-foreground [text-wrap:pretty] md:mt-0">
            My educational journey has provided me with a strong theoretical foundation that complements my practical
            experience. I continue to stay updated with the latest technologies and industry best practices through
            ongoing professional development and certifications.
          </p>
        </div>
      </div>

      {/* Education Detail Dialog */}
      <EducationDetailDialog
        education={selectedEducation}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        educationIcon={selectedEducation?.companyPhotoUrl || undefined}
      />
    </section>
  );
};

export default EducationSection;
