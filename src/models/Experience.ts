export interface ExperienceTechnology {
  name: string;
  type?: string;
}

export interface Project {
  name?: string;
  title?: string;
}

export interface ExperienceDomain {
  name?: string;
  title?: string;
  value?: number;
  iconCss?: string;
}

export interface Position {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  domains?: ExperienceDomain[];
  domainCodes?: string[];
  projects?: Array<Project | string>;
  projectCodes?: string[];
  technologies?: ExperienceTechnology[];
  skillCodes?: string[];
}

export interface Experience {
  id: number;
  orderIndex: number;
  icon?: string;
  companyCode?: string;
  companyName?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  positions: Position[];
  uid?: string;
  coordinates?: { lat: number; lng: number };
  city: string;
  country: string;
}

export interface ExperiencesData {
  general?: {
    title?: string;
    summary?: string;
    total_years?: number;
    prop_subitems?: string;
  };
  items: Experience[];
}