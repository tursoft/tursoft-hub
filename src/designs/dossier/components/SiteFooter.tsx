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
  { label: "llms.txt", href: "/llms.txt" },
  { label: "Sitemap", href: "/sitemap.xml" },
];

const linkClass = "text-muted-foreground transition-colors duration-150 hover:text-foreground";

/** The colophon: who, where, when, and the links, under an ink rule. */
const SiteFooter = () => {
  const year = new Date(BUILD_DATE).getFullYear();

  return (
    <footer className="mt-16 lg:mt-24">
      <div className="container">
        <div className="flex flex-col gap-10 border-t border-foreground pb-12 pt-10 text-sm md:flex-row md:justify-between">
          <div className="max-w-md space-y-2">
            <p className="font-serif text-2xl leading-8 text-foreground">{PERSON.name}</p>
            <p className="text-faint">Also written Tursak</p>
            <p className="pt-2 text-muted-foreground">
              {PERSON.headline}, {PERSON.location.city}, {PERSON.location.country}.
            </p>
            <p className="tnum text-faint">
              © {year} {PERSON.name}. Last updated <time dateTime={BUILD_DATE}>{BUILD_DATE}</time>
            </p>
          </div>

          <nav aria-label="Site links" className="grid grid-cols-2 gap-x-12 gap-y-2">
            <ul className="space-y-2">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-2">
              {profileLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} rel="me noopener noreferrer" target="_blank" className={linkClass}>
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
