import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface ProjectEntry extends IBaseModelAdvanced {
  id: number;
  group?: string;
  companyCode?: string; // new field used in JSON
  value?: number;
  summary?: string;
  fulltext?: string | string[];
  datePeriod?: { startDate?: string; endDate?: string | null };
  props?: Array<{ name?: string; title?: string } | { [k: string]: unknown }>;
  domainCodes?: string[];
  modules?: string[];
  customerCodes?: string[];
  partnerCodes?: string[];
  team?: Array<{ personCode?: string; position?: string; contactNo?: string }>;
  skillCodes?: string[];
  isactive?: boolean;
}

export interface ProjectsData {
  general?: {
    title?: string;
    summary?: string;
    groups?: Array<{ code: string; title: string; value?: number; iconCss?: string; orderIndex?: number }>;
  };
  items: ProjectEntry[];
}

/**
 * Utility to normalize project codes for matching.
 */
export const normalizeProjectKey = (s?: string) =>
  (s || '').toString().replace(/[^a-z0-9]/gi, '').toUpperCase();

export default ProjectEntry;
