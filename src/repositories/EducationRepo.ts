import type { Education, EducationData } from '../models/Education';
import BaseRepo from './base/BaseRepo';
import { companiesRepo } from './CompaniesRepo';

class EducationRepo extends BaseRepo<Education, EducationData> {
  constructor() {
    super('/src/data/education.json');
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

const educationRepo = new EducationRepo();
export default educationRepo;
export { educationRepo, EducationRepo };
