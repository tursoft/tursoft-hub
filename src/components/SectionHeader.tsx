import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sectionLabel, sectionNumber, type SectionId } from "@/lib/sections";

interface SectionHeaderProps {
  /** Section id; sets the printed number and label in the kicker ("09 References"). */
  id: SectionId;
  /** The serif headline. Plain words, sentence case, no gradient or split styling. */
  title: ReactNode;
  /** One or two plain sentences under the headline. */
  description?: ReactNode;
  /** Right column: quiet meta (counts, ranges) and controls such as a view-mode switch. */
  aside?: ReactNode;
  className?: string;
}

/**
 * The header every homepage section starts with, set like a section opener in a printed
 * dossier: an ink rule across the column, a kicker with the red section number, the
 * headline in Newsreader, a short description, and a hairline under the whole block.
 */
const SectionHeader = ({ id, title, description, aside, className }: SectionHeaderProps) => (
  <header className={cn("section-head", className)}>
    <div className="min-w-0">
      <p className="kicker">
        <span className="kicker-num">{sectionNumber(id)}</span>
        {sectionLabel(id)}
      </p>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-desc">{description}</p>}
    </div>
    {aside && <div className="section-aside">{aside}</div>}
  </header>
);

export default SectionHeader;
