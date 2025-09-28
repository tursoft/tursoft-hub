import type { Experience, ExperiencesData } from '../models/Experience';
import BaseRepo from './base/BaseRepo';
import companiesRepo from './CompaniesRepo';

class ExperienceRepo extends BaseRepo<Experience, ExperiencesData> {
  constructor() {
    super('/src/data/experiences.json');
  }

  async getTitleByCode(code: string | null | undefined): Promise<string | null> {
    const item = await this.getByCode(code);
    return companiesRepo.getTitleByCode(item?.companyCode);
  }

  async getPhotoUrlByCode(code: string | null | undefined): Promise<string | null> {
    const item = await this.getByCode(code);
    return companiesRepo.getPhotoUrlByCode(item?.companyCode);
  }
}

const experienceRepo = new ExperienceRepo();
export default experienceRepo;
export { experienceRepo, ExperienceRepo };
