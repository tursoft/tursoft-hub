import { useRef, type ReactNode } from "react";
import { useDrift } from "@/lib/motion/hooks";
import Reveal from "./Reveal";

interface SectionHeaderProps {
  /** Two-digit section number, e.g. "02". */
  index: string;
  /** Lowercase label after the number, e.g. "experience". */
  label: string;
  /** Title; wrap the quieter half in <em> for the two-tone look. */
  title: ReactNode;
  lede?: ReactNode;
}

export default function SectionHeader({ index, label, title, lede }: SectionHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  useDrift(titleRef, 56);
  useDrift(ledeRef, -36);

  return (
    <Reveal className="section-head">
      <div>
        <p className="type-eyebrow">
          <span className="type-eyebrow-index">{index}</span>
          {label}
        </p>
        <h2 ref={titleRef} className="type-title">
          {title}
        </h2>
      </div>
      {lede && (
        <p ref={ledeRef} className="type-lede">
          {lede}
        </p>
      )}
    </Reveal>
  );
}
