import type { Partner, PartnersData } from '../models/Partner';
import BaseRepo from './base/BaseRepo';

class PartnersRepo extends BaseRepo<Partner, PartnersData> {
	constructor() {
		super('/data/partners.json');
	}

	async getTitleByCode(code: string | null | undefined): Promise<string | null> {
		const item = await this.getByCode(code);
		return item?.partnerCode || null;
	}

	async getPhotoUrlByCode(_code: string | null | undefined): Promise<string | null> {
		return null;
	}
}

const partnersRepo = new PartnersRepo();
export default partnersRepo;
export { partnersRepo, PartnersRepo };
