export interface PersonContact {
  code: string;
  value: string | null;
}

export interface Person {
  id: number;
  code: string;
  name: string;
  photoUrl?: string | null;
  company?: string;
  contacts?: PersonContact[];
}

export interface PeopleData {
  general?: { title?: string; summary?: string };
  items: Person[];
}

export default Person;
