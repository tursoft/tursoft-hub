import type { CSSProperties, ReactNode } from "react";
import Reveal from "./Reveal";

interface RailItemProps {
  /** Mono date label shown in the left column (above the card on phones). */
  label: ReactNode;
  children: ReactNode;
  /** Position in the list; staggers the dot's pulse. */
  index?: number;
}

/** One row of the vertical timeline used by Experience and Education. */
export default function RailItem({ label, children, index = 0 }: RailItemProps) {
  return (
    <Reveal className="rail">
      <div className="rail-label" style={{ "--ping-delay": `${(index % 6) * 0.4}s` } as CSSProperties}>
        {label}
      </div>
      <div className="rail-body">{children}</div>
    </Reveal>
  );
}
