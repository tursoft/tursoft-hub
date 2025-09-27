export interface ProjectEntry {
  id: number;
  name: string;
  title?: string;
  group?: string;
  company?: string;
  value?: number;
  icon?: string;
  logo?: string; // optional alternate field name used for explicit logos
  summary?: string;
  fulltext?: string | string[];
  datePeriod?: { startDate?: string; endDate?: string | null };
  props?: Array<{ name: string; title: string }>;
  domains?: Array<{ name: string; title: string; value?: number; iconCss?: string }>;
  modules?: string[];
  customerNames?: string[];
  partners?: string[];
  team?: Array<{ position?: string; name?: string; contactNo?: string }>;
  technologies?: Array<{ name: string; type?: string }>;
  isactive?: boolean;
}

export interface ProjectsData {
  general?: {
    title?: string;
    summary?: string;
    groups?: Array<{ name: string; title: string; value?: number; iconCss?: string }>;
  };
  items: ProjectEntry[];
}

/**
 * Utility to normalize project names for matching.
 */
export const normalizeProjectKey = (s?: string) =>
  (s || '').toString().replace(/[^a-z0-9]/gi, '').toUpperCase();



/**
 * Create a ProjectEntry from a raw object (from JSON). This performs minimal
 * validation and returns the typed shape.
 */
export function fromJSON(raw: unknown): ProjectEntry {
  const r = (raw as { [k: string]: unknown }) || {};

  const id = typeof r['id'] === 'number' ? r['id'] as number : Number(r['id'] || 0);
  const name = typeof r['name'] === 'string' ? r['name'] as string : (typeof r['title'] === 'string' ? r['title'] as string : '');
  const title = typeof r['title'] === 'string' ? r['title'] as string : (typeof r['name'] === 'string' ? r['name'] as string : '');
  const group = typeof r['group'] === 'string' ? r['group'] as string : undefined;
  const company = typeof r['company'] === 'string' ? r['company'] as string : undefined;
  const value = typeof r['value'] === 'number' ? r['value'] as number : (typeof r['value'] === 'string' ? Number(r['value']) : undefined);
  const icon = typeof r['icon'] === 'string' ? r['icon'] as string : undefined;
  const logo = typeof r['logo'] === 'string' ? r['logo'] as string : undefined;
  const summary = typeof r['summary'] === 'string' ? r['summary'] as string : undefined;
  const fulltext = typeof r['fulltext'] === 'string' || Array.isArray(r['fulltext']) ? r['fulltext'] as string | string[] : undefined;
  const datePeriod = typeof r['datePeriod'] === 'object' ? r['datePeriod'] as { startDate?: string; endDate?: string | null } : undefined;
  const props = Array.isArray(r['props']) ? r['props'] as Array<{ name: string; title: string }> : [];
  const domains = Array.isArray(r['domains']) ? r['domains'] as Array<{ name: string; title: string; value?: number; iconCss?: string }> : [];
  const modules = Array.isArray(r['modules']) ? r['modules'] as string[] : [];
  const customerNames = Array.isArray(r['customerNames']) ? r['customerNames'] as string[] : [];
  const partners = Array.isArray(r['partners']) ? r['partners'] as string[] : [];
  const team = Array.isArray(r['team']) ? r['team'] as Array<{ position?: string; name?: string; contactNo?: string }> : [];
  const technologies = Array.isArray(r['technologies']) ? r['technologies'] as Array<{ name: string; type?: string }> : [];
  const isactive = typeof r['isactive'] === 'boolean' ? r['isactive'] as boolean : undefined;

  return {
    id: Number(id),
    name,
    title,
    group,
    company,
    value,
    icon,
    logo,
    summary,
    fulltext,
    datePeriod,
    props,
    domains,
    modules,
    customerNames,
    partners,
    team,
    technologies,
    isactive,
  };
}

export default ProjectEntry;
