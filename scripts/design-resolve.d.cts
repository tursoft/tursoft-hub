export interface SiteDesignMeta {
  label: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
}

export interface SiteDesign {
  /** Folder name under src/designs. */
  name: string;
  /** Absolute path of the design folder. */
  dir: string;
  /** Where the name came from. */
  source: "SITE_DESIGN" | "design.config.json";
  meta: SiteDesignMeta;
  available: string[];
}

export function resolveDesign(): SiteDesign;
export function listDesigns(): string[];
export function readConfig(): { design: string; [key: string]: unknown };
export const CONFIG_FILE: string;
export const DESIGNS_DIR: string;
export const ROOT: string;
