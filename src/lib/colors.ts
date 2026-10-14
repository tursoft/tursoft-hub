// Shared colours for entity types. Values mirror the --exp/--proj/--edu/--cust/--part tokens in src/index.css.

export type EntityType = "experience" | "project" | "education" | "customer" | "partner";

export const ENTITY_HEX_COLORS: Record<EntityType, string> = {
  experience: "#7cc4ff",
  project: "#5ec8f2",
  education: "#f5c66b",
  customer: "#f87b9b",
  partner: "#5fd6bd",
};

/** Tag tone (see the Tag component and the .tag-* classes) for each entity type. */
export const ENTITY_TAG_TONE: Record<EntityType, "exp" | "proj" | "edu" | "cust" | "part"> = {
  experience: "exp",
  project: "proj",
  education: "edu",
  customer: "cust",
  partner: "part",
};

export const getEntityHexColor = (type: EntityType): string =>
  ENTITY_HEX_COLORS[type] ?? ENTITY_HEX_COLORS.project;

// Tailwind class bundles per entity, for components that style with utility classes.
export const ENTITY_COLORS = {
  project: {
    text: "text-proj",
    bg: "bg-proj",
    bgLight: "bg-proj/10",
    border: "border-proj",
    borderLight: "border-proj/20",
    hover: "hover:bg-proj/20",
  },
  experience: {
    text: "text-exp",
    bg: "bg-exp",
    bgLight: "bg-exp/10",
    border: "border-exp",
    borderLight: "border-exp/20",
    hover: "hover:bg-exp/20",
  },
  education: {
    text: "text-edu",
    bg: "bg-edu",
    bgLight: "bg-edu/10",
    border: "border-edu",
    borderLight: "border-edu/20",
    hover: "hover:bg-edu/20",
  },
  customer: {
    text: "text-cust",
    bg: "bg-cust",
    bgLight: "bg-cust/10",
    border: "border-cust",
    borderLight: "border-cust/20",
    hover: "hover:bg-cust/20",
  },
  partner: {
    text: "text-part",
    bg: "bg-part",
    bgLight: "bg-part/10",
    border: "border-part",
    borderLight: "border-part/20",
    hover: "hover:bg-part/20",
  },
} as const;

export const getEntityColors = (type: EntityType) => ENTITY_COLORS[type] ?? ENTITY_COLORS.project;
