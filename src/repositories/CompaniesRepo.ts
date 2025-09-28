

import BaseRepo from './BaseRepo';
import type { Company, CompaniesData } from '../models/Companies';



class CompaniesRepo extends BaseRepo<Company, CompaniesData> {
	constructor() {
		super(
			'/src/data/companies.json',
			item => item.code,
			item => item.logo,
			(s) => s.toUpperCase()
		);
	}
}

const companiesRepo = new CompaniesRepo();
export default companiesRepo;
export { companiesRepo };
