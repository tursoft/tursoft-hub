

import BaseRepo from './BaseRepo';
import type { Domain, DomainsData } from '../models/Domain';



class DomainsRepo extends BaseRepo<Domain, DomainsData> {
  constructor() {
    super(
      '/src/data/domains.json',
      item => item.name,
      item => item.iconCss,
      (s) => s.toUpperCase()
    );
  }
}

const domainsRepo = new DomainsRepo();
export default domainsRepo;
export { domainsRepo };

