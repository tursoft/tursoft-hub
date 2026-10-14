import cvData from "@/data/cv.json";
import experiencesData from "@/data/experiences.json";
import type { Experience } from "@/models/Experience";
import { computeCareerStats } from "./career";

export const OWNER = {
  name: "Muhammet Turşak",
  email: "tursoft@gmail.com",
  phone: "+90 554 200 78 29",
  phoneHref: "tel:+905542007829",
  website: "tursoft.net",
  websiteHref: "https://tursoft.net",
  location: "Turkey",
} as const;

export const SOCIAL_LINKS = [
  { id: "github", label: "GitHub", href: "https://github.com/tursoft" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/tursoft/" },
  { id: "twitter", label: "Twitter", href: "https://twitter.com/muhammettursak" },
] as const;

export const CV_LINKS = {
  compact: cvData.general.compactDownloadUrl,
  detailed: cvData.general.downloadUrl,
} as const;

export interface NavItem {
  id: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "domains", label: "Domains" },
  { id: "skills", label: "Skills" },
  { id: "portfolio", label: "Projects" },
  { id: "customers", label: "Clients" },
  { id: "references", label: "References" },
  { id: "education", label: "Education" },
  { id: "map", label: "Footprint" },
  { id: "timeline", label: "Timeline" },
  { id: "contact", label: "Contact" },
];

export const ROLES = [
  "Senior Software Architect",
  "Director of Technology",
  ".NET & Web Expert",
  "Cloud & SaaS Solution Builder",
];

/** Companies, positions and years from experiences.json (project counts are loaded where they are shown). */
export const CAREER = computeCareerStats((experiencesData as unknown as { items: Experience[] }).items, 0);

export function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
