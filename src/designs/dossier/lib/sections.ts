/**
 * The homepage sections in page order. The dossier design numbers them like the
 * sections of a printed profile ("01 Profile", "02 About me", ...), and the masthead
 * lists the ones marked `nav`. Keep this in the same order as `sections` in pages/Index.tsx.
 *
 * `tone` sets the printing of a section's band (styles/tones.css): paper (the default),
 * tint (the same paper printed in orange) or orange (the reverse, an orange band). The rhythm runs
 * tint, paper, orange, paper, so no two neighbours share a printing.
 */
export const SECTIONS = [
  { id: "hero", label: "Profile", nav: "Home" },
  { id: "about", label: "About me", nav: "About me", tone: "tint" },
  { id: "experience", label: "Experience", nav: "Experience" },
  { id: "domains", label: "Domains", nav: "Domains", tone: "orange" },
  { id: "skills", label: "Skills", nav: "Skills" },
  { id: "portfolio", label: "Portfolio", nav: "Portfolio", tone: "tint" },
  { id: "case-studies", label: "Case studies", tone: "orange" },
  { id: "customers", label: "Customers", nav: "Customers" },
  { id: "references", label: "References", nav: "References", tone: "tint" },
  { id: "education", label: "Education", nav: "Education", tone: "orange" },
  { id: "map", label: "Map", nav: "Map" },
  { id: "timeline", label: "Timeline", nav: "Timeline", tone: "tint" },
  { id: "faq", label: "Questions" },
  { id: "contact", label: "Contact", nav: "Contact", tone: "orange" },
] as const;

export type SectionTone = "paper" | "tint" | "orange";

export type SectionId = (typeof SECTIONS)[number]["id"];

/** Two-digit section number, "01" for the hero. */
export function sectionNumber(id: SectionId): string {
  const index = SECTIONS.findIndex((section) => section.id === id);
  return String(index + 1).padStart(2, "0");
}

/** The printing of a section's band; paper unless the section sets a tone. */
export function sectionTone(id: SectionId): SectionTone {
  const section = SECTIONS.find((entry) => entry.id === id);
  return section && "tone" in section ? section.tone : "paper";
}

export function sectionLabel(id: SectionId): string {
  return SECTIONS.find((section) => section.id === id)?.label ?? "";
}

/** Sections linked from the masthead, in page order. */
export const NAV_ITEMS = SECTIONS.flatMap((section) =>
  "nav" in section ? [{ id: section.id as SectionId, label: section.nav }] : [],
);
