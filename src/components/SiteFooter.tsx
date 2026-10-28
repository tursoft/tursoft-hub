import { BUILD_DATE, PERSON } from "@/lib/site";

const profileLinks = [
  { label: "LinkedIn", href: PERSON.profiles.linkedin },
  { label: "GitHub", href: PERSON.profiles.github },
  { label: "Stack Overflow", href: PERSON.profiles.stackoverflow },
  { label: "X", href: PERSON.profiles.x },
];

const siteLinks = [
  { label: "About", href: "/#about" },
  { label: "Experience", href: "/#experience" },
  { label: "Projects", href: "/#portfolio" },
  { label: "Case studies", href: "/case-studies/" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
  { label: "AmelBook privacy policy", href: "/privacy/amelbook/" },
  { label: "llms.txt", href: "/llms.txt" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

const SiteFooter = () => {
  const year = new Date(BUILD_DATE).getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="container mx-auto px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 md:flex-row md:items-start md:justify-between text-sm text-muted-foreground">
          <div className="space-y-2 max-w-md">
            <p className="text-foreground font-semibold">
              {PERSON.name} <span className="font-normal text-muted-foreground">(also written Tursak)</span>
            </p>
            <p>
              {PERSON.headline}, {PERSON.location.city}, {PERSON.location.country}. Founder of Tursoft.
            </p>
            <p>
              © {year} {PERSON.name}. Last updated <time dateTime={BUILD_DATE}>{BUILD_DATE}</time>.
            </p>
          </div>

          <nav aria-label="Site links" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-2">
            <ul className="space-y-2">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-primary transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              {profileLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} rel="me noopener noreferrer" target="_blank" className="hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
