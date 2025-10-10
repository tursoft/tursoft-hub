import type { SkillItem, SkillsData } from '../models/Skills';
import type { ProjectEntry } from '../models/Project';
import type { Experience } from '../models/Experience';
import type { Education } from '../models/Education';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';
import { projectsRepo } from './ProjectsRepo';
import { experienceRepo } from './ExperienceRepo';
import { educationRepo } from './EducationRepo';

class SkillsRepo extends BaseRepoAdvanced<SkillItem, SkillsData> {
  constructor() {
    super('/data/skills.json');
  }

  /**
   * Get all projects that use this skill
   * @param skillCode The skill code to search for
   * @returns Array of projects that include this skill in their skillCodes
   */
  async getProjectsBySkillCode(skillCode: string | null | undefined): Promise<ProjectEntry[]> {
    if (!skillCode) return [];
    
    try {
      const allProjects = await projectsRepo.getList();
      const normalizedSkillCode = skillCode.toUpperCase();
      return allProjects.filter(project => 
        project.skillCodes?.some(code => code.toUpperCase() === normalizedSkillCode)
      );
    } catch (error) {
      console.error(`Error getting projects for skill ${skillCode}:`, error);
      return [];
    }
  }

  /**
   * Get all experiences that use this skill
   * @param skillCode The skill code to search for
   * @returns Array of experiences where any position includes this skill
   */
  async getExperiencesBySkillCode(skillCode: string | null | undefined): Promise<Experience[]> {
    if (!skillCode) return [];
    
    try {
      const allExperiences = await experienceRepo.getList();
      const normalizedSkillCode = skillCode.toUpperCase();
      return allExperiences.filter(exp => 
        exp.positions?.some(pos => 
          pos.skillCodes?.some(code => code.toUpperCase() === normalizedSkillCode)
        )
      );
    } catch (error) {
      console.error(`Error getting experiences for skill ${skillCode}:`, error);
      return [];
    }
  }

  /**
   * Get all educations that use this skill
   * @param skillCode The skill code to search for
   * @returns Array of educations that include this skill in their skillCodes
   */
  async getEducationsBySkillCode(skillCode: string | null | undefined): Promise<Education[]> {
    if (!skillCode) return [];
    
    try {
      const allEducations = await educationRepo.getList();
      const normalizedSkillCode = skillCode.toUpperCase();
      return allEducations.filter(edu => 
        edu.skillCodes?.some(code => code.toUpperCase() === normalizedSkillCode)
      );
    } catch (error) {
      console.error(`Error getting educations for skill ${skillCode}:`, error);
      return [];
    }
  }
}

const skillsRepo = new SkillsRepo();
export default skillsRepo;
export { skillsRepo, SkillsRepo };