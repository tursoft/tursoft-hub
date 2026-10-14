import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

interface StatTileProps {
  value: number;
  label: string;
  suffix?: string;
}

/** Large counting number with a mono label; grows an accent line on hover. */
export default function StatTile({ value, label, suffix }: StatTileProps) {
  return (
    <div className="stat-tile">
      <CountUp end={value} suffix={suffix} className="stat-value" />
      <span className="stat-label">{label}</span>
    </div>
  );
}

/** Grid of stat tiles that reveal one after another. */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  return (
    <div className={cn("stat-grid", columns === 3 && "stat-grid-3")}>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={index} index={index}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
