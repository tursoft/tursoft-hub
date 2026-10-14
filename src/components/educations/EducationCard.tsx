import type { Education } from "@/models/Education";
import Collapsible from "@/components/system/Collapsible";
import ExpandHint from "@/components/system/ExpandHint";
import LogoTile from "@/components/system/LogoTile";
import Surface from "@/components/system/Surface";
import Tag from "@/components/system/Tag";
import { useExpandableCard } from "@/lib/motion/hooks";

export type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
};

interface EducationCardProps {
  education: ProcessedEducation;
  onOpen: () => void;
}

export default function EducationCard({ education, onOpen }: EducationCardProps) {
  const { expanded, fine, surfaceProps } = useExpandableCard(onOpen);
  const skills = education.skillCodes ?? [];
  const graduation = [
    education.graduateDate && `graduated ${education.graduateDate}`,
    education.graduateScore && `gpa ${education.graduateScore}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Surface interactive aria-expanded={expanded} className="mb-4 p-5 sm:p-6" {...surfaceProps}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4">
        <LogoTile src={education.companyPhotoUrl} alt={education.companyName ?? education.department} size={48} />
        <div className="min-w-0">
          <Tag tone="edu">{education.level}</Tag>
          <h3 className="mt-2 text-base font-medium leading-snug tracking-[-0.02em]">{education.department}</h3>
          <p className="mt-0.5 text-sm text-accent">{education.companyName ?? education.companyCode}</p>
          {education.companyCity && <p className="type-meta mt-2">{education.companyCity}</p>}

          <Collapsible open={expanded}>
            {graduation && <p className="type-meta pt-3 text-muted-foreground">{graduation}</p>}
            {education.summary && (
              <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{education.summary}</p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {skills.slice(0, 8).map((code) => (
                  <Tag key={code}>{code}</Tag>
                ))}
                {skills.length > 8 && <Tag>+{skills.length - 8}</Tag>}
              </div>
            )}
          </Collapsible>

          {!fine && <ExpandHint expanded={expanded} onOpen={onOpen} />}
        </div>
      </div>
    </Surface>
  );
}
