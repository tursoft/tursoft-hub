export interface ScreenshotItem {
  file_small?: string;
  file_big?: string;
  title?: string;
  orderindex?: number;
  [k: string]: unknown;
}

export interface ProjectFileEntry {
  screenshoots?: ScreenshotItem[];
  [k: string]: unknown;
}

export interface ProjectFilesData {
  general: Record<string, ProjectFileEntry>;
}

export default ProjectFilesData;
