import type { SkillItem, SkillsData } from '../models/Skills';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class SkillsRepo extends BaseRepoAdvanced<SkillItem, SkillsData> {
  constructor() {
    super('/data/skills.json');
  }
}

const skillsRepo = new SkillsRepo();
export default skillsRepo;
export { skillsRepo, SkillsRepo };