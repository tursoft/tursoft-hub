/**
 * The homepage sections in page order. The dossier design numbers them like the
 * sections of a printed profile ("01 Profile", "02 About me", ...), and the masthead
 * lists the ones marked `nav`. Keep this in the same order as `sections` in pages/Index.tsx.
 */
export const SECTIONS = [
  { id: "hero", label: "Profile", nav: "Home" },
  { id: "about", label: "About me", nav: "About me" },
  { id: "experience", label: "Experience", nav: "Experience" },
  { id: "domains", label: "Domains", nav: "Domains" },
  { id: "skills", label: "Skills", nav: "Skills" },
  { id: "portfolio", label: "Portfolio", nav: "Portfolio" },
  { id: "case-studies", label: "Case studies" },
  { id: "customers", label: "Customers", nav: "Customers" },
  { id: "references", label: "References", nav: "References" },
  { id: "education", label: "Education", nav: "Education" },
  { id: "map", label: "Map", nav: "Map" },
  { id: "timeline", label: "Timeline", nav: "Timeline" },
  { id: "faq", label: "Questions" },
  { id: "contact", label: "Contact", nav: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** Two-digit section number, "01" for the hero. */
export function sectionNumber(id: SectionId): string {
  const index = SECTIONS.findIndex((section) => section.id === id);
  return String(index + 1).padStart(2, "0");
}

export function sectionLabel(id: SectionId): string {
  return SECTIONS.find((section) => section.id === id)?.label ?? "";
}

/** Sections linked from the masthead, in page order. */
export const NAV_ITEMS = SECTIONS.flatMap((section) =>
  "nav" in section ? [{ id: section.id as SectionId, label: section.nav }] : [],
);
