import { OWNER, SOCIAL_LINKS } from "@/lib/site";

const FOOTER_LINKS = [
  ...SOCIAL_LINKS.filter((link) => link.id !== "twitter").map((link) => ({ label: link.label, href: link.href })),
  { label: "Email", href: `mailto:${OWNER.email}` },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col items-center gap-3 py-9 text-center font-mono text-xs text-faint sm:flex-row sm:justify-between sm:text-left">
        <span className="text-[13px] text-muted-foreground">{OWNER.name}</span>
        <span>
          © {new Date().getFullYear()} · Senior Software Architect · <span className="text-success">●</span> available
        </span>
        <span className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="lowercase transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </span>
      </div>
    </footer>
  );
}
