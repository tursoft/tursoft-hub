import type { MouseEvent } from "react";
import { MapPin } from "lucide-react";
import type { Company } from "@/models/Companies";
import type { Experience, Position } from "@/models/Experience";
import Collapsible from "@/components/system/Collapsible";
import ExpandHint from "@/components/system/ExpandHint";
import LogoTile from "@/components/system/LogoTile";
import Surface from "@/components/system/Surface";
import Tag from "@/components/system/Tag";
import type { Span } from "@/lib/career";
import { calculateDuration } from "@/lib/datetimeutils";
import { formatMonthRange, splitSummary } from "@/lib/format";
import { useExpandableCard } from "@/lib/motion/hooks";

export interface CompanyEntry {
  experience: Experience;
  company: Company | null;
  span: Span | null;
  positions: Position[];
}

/** Links inside the card must not also activate the card. */
const stopPropagation = (event: MouseEvent) => event.stopPropagation();

interface ExperienceCardProps {
  entry: CompanyEntry;
  onOpen: () => void;
}

export default function ExperienceCard({ entry, onOpen }: ExperienceCardProps) {
  const { expanded, fine, surfaceProps } = useExpandableCard(onOpen);
  const { experience, company, span, positions } = entry;
  const name = company?.title ?? experience.companyCode ?? "Company";
  const location = [company?.city, company?.country].filter(Boolean).join(", ");
  const current = span !== null && span.end === null;
  const duration = span ? calculateDuration([{ startDate: span.start, endDate: span.end }]) : "";

  return (
    <Surface interactive aria-expanded={expanded} className="mb-4 p-5 sm:p-6" {...surfaceProps}>
      <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[48px_minmax(0,1fr)_auto]">
        <LogoTile src={company?.photoUrl} alt={name} size={48} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-medium tracking-[-0.02em]">{name}</h3>
            {current && <Tag tone="accent">current</Tag>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {location}
              </span>
            )}
            {company?.websiteUrl && (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet"
                onClick={stopPropagation}
              >
                Website
              </a>
            )}
            {company?.linkedinUrl && (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-quiet"
                onClick={stopPropagation}
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
        <div className="col-span-2 font-mono text-xs text-faint sm:col-span-1 sm:text-right">
          {duration && <b className="mr-2 font-medium text-foreground sm:mr-0 sm:block">{duration}</b>}
          {span && formatMonthRange(span.start, span.end)}
        </div>
      </div>

      {positions.map((position) => (
        <div key={`${position.title}-${position.startDate}`} className="mt-4 border-t border-line pt-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h4 className="text-[14.5px] font-medium">{position.title}</h4>
            <span className="font-mono text-xs text-faint">{formatMonthRange(position.startDate, position.endDate)}</span>
          </div>
          <Collapsible open={expanded}>
            <div className="space-y-2 pt-2 text-sm leading-relaxed text-muted-foreground">
              {splitSummary(position.summary).map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            {position.skillCodes && position.skillCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-3">
                {position.skillCodes.slice(0, 6).map((code) => (
                  <Tag key={code}>{code}</Tag>
                ))}
              </div>
            )}
          </Collapsible>
        </div>
      ))}

      {!fine && <ExpandHint expanded={expanded} onOpen={onOpen} />}
    </Surface>
  );
}
