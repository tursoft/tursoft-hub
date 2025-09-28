

import BaseRepo from './BaseRepo';
import type { SkillItem, SkillsData } from '../models/Skills';


class SkillsRepo extends BaseRepo<SkillItem, SkillsData> {
  constructor() {
    super(
      '/src/data/skills.json',
      item => item.name,
      item => item.iconCss,
      (s) => s.toUpperCase()
    );
  }
}

const skillsRepo = new SkillsRepo();
export default skillsRepo;
export { skillsRepo };