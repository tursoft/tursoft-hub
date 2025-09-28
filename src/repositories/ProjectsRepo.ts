
import BaseRepo from './BaseRepo';
import type { ProjectEntry, ProjectsData } from '../models/Project';



class ProjectsRepo extends BaseRepo<ProjectEntry, ProjectsData> {
  constructor() {
    super(
      '/src/data/projects.json',
      item => item.name,
      item => item.logo || item.logoUrl || item.icon,
      (s) => s.toUpperCase()
    );
  }
}

const projectsRepo = new ProjectsRepo();
export default projectsRepo;
export { projectsRepo };
