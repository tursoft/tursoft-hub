export interface ExperienceTechnology {
  name: string;
  type: string;
}

export interface Project {
  name: string;
  title: string;
}

export interface Domain {
  name: string;
  title: string;
  value: number;
  iconCss: string;
}

export interface Position {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  domains?: Domain[];
  projects?: Project[];
  technologies: ExperienceTechnology[];
}

export interface Experience {
  id: number;
  orderIndex: number;
  icon: string;
  companyCode: string;
  companyName: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  positions: Position[];
  uid: string;
  coordinates: { lat: number; lng: number };
  city: string;
  country: string;
}

export interface ExperiencesData {
  general: {
    title: string;
    summary: string;
    total_years: number;
    prop_subitems: string;
  };
  items: Experience[];
}