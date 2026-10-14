import type { ReactNode } from "react";
import LogoTile from "./LogoTile";

interface QuoteCardProps {
  /** Testimonial text; may contain <span> highlights from references.json (trusted local data). */
  quote: string;
  name: string;
  role: string;
  date?: string;
  photo?: string | null;
  actions?: ReactNode;
}

export default function QuoteCard({ quote, name, role, date, photo, actions }: QuoteCardProps) {
  return (
    <figure className="flex h-full flex-col gap-6 p-6 sm:p-9">
      <blockquote className="quote-text" dangerouslySetInnerHTML={{ __html: `“${quote}”` }} />
      <figcaption className="mt-auto flex flex-wrap items-center gap-3.5">
        <LogoTile src={photo} alt={name} size={44} variant="photo" />
        <div className="min-w-0">
          <b className="block text-sm font-medium">{name}</b>
          <span className="type-meta">{[role, date].filter(Boolean).join(" · ")}</span>
        </div>
        {actions && <div className="ml-auto flex gap-1.5">{actions}</div>}
      </figcaption>
    </figure>
  );
}
