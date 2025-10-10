import type { ProjectEntry, ProjectsData } from '../models/Project';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class ProjectsRepo extends BaseRepoAdvanced<ProjectEntry, ProjectsData> {
  constructor() {
    super('/data/projects.json');
  }

  /**
   * Get the full projects data including general information
   * @returns The complete ProjectsData object
   */
  async getFullData(): Promise<ProjectsData | null> {
    await this.loadIfNeeded();
    return this.data;
  }
}

const projectsRepo = new ProjectsRepo();
export default projectsRepo;
export { projectsRepo, ProjectsRepo };
