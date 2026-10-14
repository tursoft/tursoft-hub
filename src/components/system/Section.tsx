import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/** Offsets each section's rule sweep so they never move in unison. */
const sweepDelay = (id: string): string =>
  `${-(Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 11)}s`;

/** A page section: hairline top rule with a travelling light, section padding and the page container. */
export default function Section({ id, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("page-section", className)}
      style={{ "--sweep-delay": sweepDelay(id) } as CSSProperties}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}
