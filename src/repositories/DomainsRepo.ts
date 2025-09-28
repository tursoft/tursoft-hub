import type { Domain, DomainsData } from '../models/Domain';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class DomainsRepo extends BaseRepoAdvanced<Domain, DomainsData> {
  constructor() {
    super('/src/data/domains.json');
  }
}

const domainsRepo = new DomainsRepo();
export default domainsRepo;
export { domainsRepo, DomainsRepo };

