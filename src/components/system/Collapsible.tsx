import type { ReactNode } from "react";

/** Animates its content's height open and closed (CSS grid-rows transition). */
export default function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="collapsible" data-open={open} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  );
}
