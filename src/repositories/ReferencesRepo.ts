import type { Reference, ReferencesData } from '../models/Reference';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class ReferencesRepo extends BaseRepoAdvanced<Reference, ReferencesData> {
	constructor() {
		super('/src/data/references.json');
	}
}

const referencesRepo = new ReferencesRepo();
export default referencesRepo;
export { referencesRepo, ReferencesRepo };
