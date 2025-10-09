import type { ProjectEntry, ProjectsData } from '../models/Project';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class ProjectsRepo extends BaseRepoAdvanced<ProjectEntry, ProjectsData> {
  constructor() {
    super('/data/projects.json');
  }
}

const projectsRepo = new ProjectsRepo();
export default projectsRepo;
export { projectsRepo, ProjectsRepo };
