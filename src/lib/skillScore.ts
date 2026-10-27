import type { SkillItem } from '@/models/Skills';

export type SkillScoreInput = Pick<SkillItem, 'projects' | 'yearsOfExperience' | 'competency'>;

/**
 * Skill score = ((number of projects * 5) + yearsOfExperience) * competency
 * where competency is stored as a percentage (0-100) and applied as a fraction.
 * Result is rounded to one decimal place.
 */
export const calculateSkillScore = (skill: SkillScoreInput): number => {
  const projects = skill.projects ?? 0;
  const years = skill.yearsOfExperience ?? 0;
  const competency = (skill.competency ?? 0) / 100;
  return Math.round((projects * 5 + years) * competency * 10) / 10;
};
