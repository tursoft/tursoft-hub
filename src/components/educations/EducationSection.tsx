import { useEffect, useState } from "react";
import educationData from "@/data/education.json";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { educationRepo } from "@/repositories/EducationRepo";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import RailItem from "@/components/system/TimelineRail";
import { parseDate } from "@/lib/datetimeutils";
import { formatYearRange } from "@/lib/format";
import EducationCard, { type ProcessedEducation } from "./EducationCard";
import EducationDetailDialog from "./EducationDetailDialog";

const startTime = (education: ProcessedEducation) => parseDate(education.datePeriod?.startDate)?.getTime() ?? 0;

const EducationSection = () => {
  const [educations, setEducations] = useState<ProcessedEducation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ProcessedEducation | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await educationRepo.getList();
        const processed = await Promise.all(
          list.map(async (education) => {
            const company = await companiesRepo.getByCode(education.companyCode);
            return {
              ...education,
              companyName: company?.title,
              companyPhotoUrl: company?.photoUrl,
              companyCity: company?.city,
            };
          }),
        );
        if (cancelled) return;
        setEducations(processed.sort((a, b) => startTime(b) - startTime(a)));
      } catch (error) {
        console.error("Failed to load education data:", error);
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
    <Section id="education">
      <SectionHeader
        index="08"
        label="education"
        title={
          <>
            Where the <em>foundations</em> were laid.
          </>
        }
        lede={educationData.general.summary}
      />

      {isLoading ? (
        <div className="space-y-4" aria-busy="true">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="surface h-[132px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {educations.map((education, index) => (
            <RailItem
              key={education.code}
              index={index}
              label={formatYearRange(education.datePeriod?.startDate, education.datePeriod?.endDate)}
            >
              <EducationCard education={education} onOpen={() => setSelected(education)} />
            </RailItem>
          ))}
        </div>
      )}

      <Reveal>
        <p className="type-meta mt-6">
          // continuous learning — courses, certifications and daily practice keep the toolbox current.
        </p>
      </Reveal>

      <EducationDetailDialog
        education={selected}
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        educationIcon={selected?.companyPhotoUrl ?? undefined}
      />
    </Section>
  );
};

export default EducationSection;
