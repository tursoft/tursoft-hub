import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
  /** Small square colour swatch before the label (entity filters). */
  dotColor?: string;
  icon?: ReactNode;
}

/** Toggleable filter button with an optional count. */
export default function Chip({ selected = false, count, dotColor, icon, className, children, ...props }: ChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={cn("chip", className)} {...props}>
      {dotColor && <span className="chip-dot" style={{ background: dotColor }} aria-hidden="true" />}
      {icon}
      <span>{children}</span>
      {count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  );
}

/** Wrapping row of chips; scrolls horizontally on phones. */
export function ChipRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("chip-row", className)} {...props} />;
}
