import type { ProjectFilesData, ProjectFileEntry } from '../models/ProjectFiles';

class ProjectFilesRepo {
  private dataUrl: string;
  private cache: ProjectFilesData | null = null;

  constructor() {
    this.dataUrl = '/src/data/project_files.json';
  }

  private async loadData(): Promise<ProjectFilesData> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const response = await fetch(this.dataUrl);
      if (!response.ok) {
        throw new Error(`Failed to load project files: ${response.statusText}`);
      }
      const data: ProjectFilesData = await response.json();
      this.cache = data;
      return data;
    } catch (error) {
      console.error('Error loading project files:', error);
      throw error;
    }
  }

  async getByProjectCode(projectCode: string): Promise<ProjectFileEntry | null> {
    try {
      const data = await this.loadData();
      const upperCode = projectCode.toUpperCase();
      return data.general[upperCode] || null;
    } catch (error) {
      console.error(`Error getting project files for ${projectCode}:`, error);
      return null;
    }
  }

  async getAllProjects(): Promise<Record<string, ProjectFileEntry>> {
    try {
      const data = await this.loadData();
      return data.general;
    } catch (error) {
      console.error('Error getting all project files:', error);
      return {};
    }
  }

  clearCache(): void {
    this.cache = null;
  }
}

const projectFilesRepo = new ProjectFilesRepo();
export default projectFilesRepo;
export { projectFilesRepo, ProjectFilesRepo };
