import data from "@/data/case-studies.json";

export interface CaseStudySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
}

export interface CaseStudy {
  slug: string;
  projectCode: string;
  title: string;
  shortTitle: string;
  dek: string;
  description: string;
  role: string;
  company: string;
  period: string;
  datePublished: string;
  outcome: string;
  stack: string[];
  sections: CaseStudySection[];
  links: { label: string; href: string }[];
}

export const CASE_STUDIES: CaseStudy[] = (data as { items: CaseStudy[] }).items;

export const CASE_STUDIES_PATH = "/case-studies/";

export const caseStudyPath = (slug: string) => `${CASE_STUDIES_PATH}${slug}/`;

export const getCaseStudy = (slug: string | undefined) => CASE_STUDIES.find((c) => c.slug === slug);
