import type { Person, PeopleData } from '../models/People';
import BaseRepoAdvanced from './base/BaseRepoAdvanced';

class PeopleRepo extends BaseRepoAdvanced<Person, PeopleData> {
  constructor() {
    super('/src/data/people.json');
  }
}

const peopleRepo = new PeopleRepo();
export default peopleRepo;
export { peopleRepo, PeopleRepo };