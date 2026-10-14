import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCount } from "@/components/ui/tabs";
import { MapPin, Building2, BookOpen, Clock, Info, Wrench } from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import SkillDetailDialog from '../skills/SkillDetailDialog';
import DetailDialog, { DetailEmpty, DetailRow, DetailRows } from '@/components/system/DetailDialog';
import LogoTile from '@/components/system/LogoTile';
import Tag, { type TagTone } from '@/components/system/Tag';
import { formatMonthRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Education } from '@/models/Education';
import type SkillItem from '@/models/Skills';
import type { Company } from '@/models/Companies';
import type { ProcessedEducation } from './EducationCard';

/** Tag tone for a course grade: AA in green, BB in the education colour, anything else quiet. */
const scoreTone = (score: string): TagTone => (score === 'AA' ? 'success' : score === 'BB' ? 'edu' : 'quiet');

interface EducationDetailDialogProps {
  education: ProcessedEducation | null;
  isOpen: boolean;
  onClose: () => void;
  educationIcon?: string;
}

const EducationDetailDialog: React.FC<EducationDetailDialogProps> = ({
  education,
  isOpen,
  onClose,
  educationIcon
}) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  // Fetch technology logos and skills when education changes
  useEffect(() => {
    const fetchData = async () => {
      if (!education?.skillCodes) return;
      
      const skillItems: SkillItem[] = [];
      
      for (const skillCode of education.skillCodes) {
        if (skillCode) {
          const skill = await skillsRepo.getByCode(skillCode);
          if (skill) {
            skillItems.push(skill);
          }
        }
      }
      
      setSkills(skillItems);
    };

    if (education?.skillCodes && education.skillCodes.length > 0) {
      fetchData();
    } else {
      setSkills([]);
    }
  }, [education?.skillCodes]);

  // Education items opened from the skill dialog arrive without company details; look them up.
  useEffect(() => {
    let cancelled = false;
    setCompany(null);
    if (education?.companyCode && !education.companyName) {
      companiesRepo.getByCode(education.companyCode).then((result) => {
        if (!cancelled) setCompany(result);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [education?.companyCode, education?.companyName]);


  if (!education) return null;

  const institution = education.companyName || company?.title || education.companyCode;
  const logo = educationIcon || education.companyPhotoUrl || company?.photoUrl;
  const city = education.companyCity || company?.city;
  const period =
    formatMonthRange(education.datePeriod?.startDate, education.datePeriod?.endDate) || education.period;
  const score = education.graduateScore || '';
  const highGrade = score.includes('AA') || score.includes('4.00') || parseFloat(score) >= 3.5;
  const facts: Array<{ label: string; value?: string | null; highlight?: boolean }> = [
    { label: 'degree level', value: education.level },
    { label: 'department', value: education.department },
    { label: 'institution', value: institution },
    { label: 'graduation date', value: education.graduateDate },
    { label: 'gpa / grade', value: score, highlight: highGrade },
    { label: 'location', value: city },
  ].filter((fact) => Boolean(fact.value));

  return (
    <>
      <DetailDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        icon={<LogoTile src={logo} alt={institution || education.department} size={52} />}
        title={education.department}
        meta={[
          institution ? (
            <>
              <Building2 aria-hidden="true" />
              {institution}
            </>
          ) : null,
          period ? (
            <>
              <Clock aria-hidden="true" />
              {period}
            </>
          ) : null,
          city ? (
            <>
              <MapPin aria-hidden="true" />
              {city}
            </>
          ) : null,
        ]}
        tags={
          <>
            <Tag tone="edu">education</Tag>
            {education.level && <Tag>{education.level}</Tag>}
          </>
        }
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">
              <Info aria-hidden="true" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen aria-hidden="true" />
              Courses
              <TabCount>{education.courses?.length || 0}</TabCount>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <Wrench aria-hidden="true" />
              Skills
              <TabCount>{education.skillCodes?.length || 0}</TabCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-b border-line py-3.5">
                  <dt className="type-meta">{fact.label}</dt>
                  <dd className={cn('mt-1 text-[15px] font-medium', fact.highlight ? 'text-success' : 'text-foreground')}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </TabsContent>

          <TabsContent value="courses">
            {education.courses && education.courses.length > 0 ? (
              <DetailRows>
                {education.courses.map((course, index) => (
                  <DetailRow
                    key={`course-${index}`}
                    icon={<BookOpen className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />}
                    title={course.title}
                    subtitle={course.content ? `Topics: ${course.content}` : undefined}
                    clampSubtitle={false}
                    trailing={course.score ? <Tag tone={scoreTone(course.score)}>{course.score}</Tag> : undefined}
                  />
                ))}
              </DetailRows>
            ) : (
              <DetailEmpty>No detailed course information available.</DetailEmpty>
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
        </Tabs>
      </DetailDialog>

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />
    </>
  );
};

export default EducationDetailDialog;