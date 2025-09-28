import BaseRepo from './BaseRepo';
import type { Person, PeopleData } from '../models/People';



class PeopleRepo extends BaseRepo<Person, PeopleData> {
  constructor() {
    super(
      '/src/data/people.json',
      item => item.code,
      item => item.photoUrl,
      (s) => s.toUpperCase()
    );
  }
}

const peopleRepo = new PeopleRepo();
export default peopleRepo;
export { peopleRepo };