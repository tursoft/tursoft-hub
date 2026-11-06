import React, { useState, useEffect } from 'react';
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
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import { formatRange } from '../experiences/career-dates';
import CareerPlate from '../experiences/CareerPlate';
import type { Education, DatePeriod } from '@/models/Education';
import type { Company } from '@/models/Companies';
import type SkillItem from '@/models/Skills';

// ProcessedEducation type with company details
type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
};

interface EducationDetailDialogProps {
  education: ProcessedEducation | null;
  isOpen: boolean;
  onClose: () => void;
  educationIcon?: string;
}

const tabCount = "tnum ml-1.5 text-faint";

const EducationDetailDialog: React.FC<EducationDetailDialogProps> = ({
  education,
  isOpen,
  onClose,
  educationIcon
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);

  // Resolve skills when education changes
  useEffect(() => {
    let cancelled = false;
    const codes = education?.skillCodes?.filter(Boolean) ?? [];
    if (!codes.length) {
      setSkills([]);
      return;
    }

    const fetchData = async () => {
      const skillItems: SkillItem[] = [];
      for (const skillCode of codes) {
        const skill = await skillsRepo.getByCode(skillCode);
        if (skill) skillItems.push(skill);
      }
      if (!cancelled) setSkills(skillItems);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [education?.skillCodes]);

  // Callers outside the Education section (skills, timeline, map) pass the raw entry;
  // look the institution up so the sheet still shows its name, logo and city.
  useEffect(() => {
    let cancelled = false;
    if (!education?.companyCode || education.companyName) {
      setCompany(null);
      return;
    }
    companiesRepo.getByCode(education.companyCode).then((found) => {
      if (!cancelled) setCompany(found);
    });
    return () => {
      cancelled = true;
    };
  }, [education?.companyCode, education?.companyName]);

  if (!education) return null;

  const institution = education.companyName ?? company?.title ?? '';
  const city = education.companyCity ?? company?.city ?? '';
  const logo = educationIcon || education.companyPhotoUrl || company?.photoUrl || undefined;

  // "Sep 2012 – Feb 2013", or the stated period when the data has no dates
  const formatDatePeriod = (datePeriod: DatePeriod) =>
    datePeriod?.startDate ? formatRange(datePeriod.startDate, datePeriod.endDate) : education.period;

  const facts = [
    { label: 'Degree level', value: education.level },
    { label: 'Department', value: education.department },
    { label: 'Institution', value: institution },
    { label: 'Period', value: formatDatePeriod(education.datePeriod) },
    { label: 'Graduation date', value: (education.graduateDate || '').replace(/,\s*/, ' ') },
    { label: 'GPA / grade', value: (education.graduateScore || '').replace(/\s*\/\s*/, ' / ') },
    { label: 'Location', value: city },
  ].filter((fact) => fact.value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 overflow-hidden bg-card p-0',
          isMaximized
            ? 'h-full max-h-full w-full max-w-full rounded-none sm:rounded-none'
            : 'h-full max-h-full w-full max-w-full rounded-none sm:h-[min(46rem,90vh)] sm:w-[calc(100vw-4rem)] sm:max-w-2xl sm:rounded-lg',
        )}
      >
        {/* Maximize / restore, beside the close button; phones already get the full screen */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="absolute right-14 top-4 z-10 hidden h-8 w-8 p-0 sm:inline-flex"
          aria-label={isMaximized ? 'Restore size' : 'Maximize'}
        >
          {isMaximized ? <Minimize2 strokeWidth={1.5} /> : <Maximize2 strokeWidth={1.5} />}
        </Button>

        {/* The sheet's head, set like a byline: logo plate beside the label and the serif title */}
        <DialogHeader className="flex-shrink-0 space-y-0 border-b border-border px-6 pb-5 pt-6 text-left sm:text-left">
          <div className="flex items-start gap-4">
            {logo && (
              <CareerPlate src={logo} alt={`${institution} logo`} className="h-12 w-12 p-1.5 sm:h-14 sm:w-14 sm:p-2" />
            )}
            <div className="min-w-0 flex-1">
              <p className="pr-12 text-[13px] leading-4 text-faint sm:pr-20">
                Education
                <span aria-hidden="true" className="px-1.5">·</span>
                {education.level}
              </p>
              <DialogTitle className="mt-2 font-serif text-2xl font-normal leading-8 tracking-[-0.01em] text-foreground [text-wrap:balance] sm:text-[28px]">
                {education.department}
              </DialogTitle>
              <DialogDescription className="tnum mt-1 text-sm leading-5 text-muted-foreground">
                {institution}
                {institution && <span aria-hidden="true" className="px-1.5 text-faint">·</span>}
                {formatDatePeriod(education.datePeriod)}
                {city && <span aria-hidden="true" className="px-1.5 text-faint">·</span>}
                {city}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">
                Courses<span className={tabCount}>{education.courses?.length || 0}</span>
              </TabsTrigger>
              <TabsTrigger value="technologies">
                Skills<span className={tabCount}>{education.skillCodes?.length || 0}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
            {education.summary && (
              <p className="max-w-[36em] text-[15px] leading-6 text-foreground [text-wrap:pretty]">{education.summary}</p>
            )}
            <dl className={cn('divide-y divide-border', education.summary && 'mt-6 border-t border-border')}>
              {facts.map((fact) => (
                <div key={fact.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 py-3">
                  <dt className="text-[13px] leading-5 text-faint">{fact.label}</dt>
                  <dd className="tnum text-sm leading-5 text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>

          <TabsContent value="courses" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">
            {education.courses && education.courses.length > 0 ? (
              <ol className="divide-y divide-border">
                {education.courses.map((course, index) => (
                  <li key={`course-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-3">
                    <h4 className="text-sm font-medium leading-5 text-foreground">{course.title}</h4>
                    <span className="tnum text-sm leading-5 text-muted-foreground" aria-label={`Score ${course.score}`}>
                      {course.score}
                    </span>
                    {course.content && (
                      <p className="col-span-2 mt-1 text-[13px] leading-5 text-muted-foreground">
                        <span className="text-faint">Topics</span>
                        <span aria-hidden="true" className="px-1.5 text-faint">·</span>
                        {course.content}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-2 text-sm text-faint">No detailed course information available</p>
            )}
          </TabsContent>

          <TabsContent value="technologies" className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">
            {skills.length > 0 ? (
              <ul className={cn('grid grid-cols-1 gap-x-6', isMaximized ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'sm:grid-cols-2')}>
                {skills.map((skill) => (
                  <li key={skill.code} className="border-b border-border">
                    <button
                      type="button"
                      className="-mx-2 flex h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 text-left text-sm text-foreground transition-colors duration-150 ease-dossier hover:bg-secondary"
                      onClick={() => {
                        setSelectedSkill(skill);
                        setIsSkillDialogOpen(true);
                      }}
                    >
                      {skill.photoUrl && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={skill.photoUrl}
                          alt=""
                          className="h-5 w-5 flex-shrink-0 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="truncate">{skill.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-sm text-faint">No technology information available</p>
            )}
          </TabsContent>
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
      />
    </Dialog>
  );
};

export default EducationDetailDialog;
