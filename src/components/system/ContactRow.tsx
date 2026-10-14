import type { LucideIcon } from "lucide-react";

interface ContactRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

/** Icon square + mono label + value, separated by hairlines. Rendered as a link when `href` is set. */
export default function ContactRow({ icon: Icon, label, value, href }: ContactRowProps) {
  const content = (
    <>
      <span className="contact-row-icon">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="type-meta block lowercase">{label}</span>
        <span className="block truncate font-medium text-foreground">{value}</span>
      </span>
    </>
  );

  if (!href) return <div className="contact-row">{content}</div>;

  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="contact-row"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}
