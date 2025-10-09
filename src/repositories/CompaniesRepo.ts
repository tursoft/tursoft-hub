import type { Company, CompaniesData } from '../models/Companies';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class CompaniesRepo extends BaseRepoAdvanced<Company, CompaniesData> {
	constructor() {
		super('/data/companies.json');
	}
}

const companiesRepo = new CompaniesRepo();
export default companiesRepo;
export { companiesRepo, CompaniesRepo };
