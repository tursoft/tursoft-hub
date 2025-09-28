import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface PersonContact {
  code: string;
  value: string | null;
}

export interface Person extends IBaseModelAdvanced {
  id: number;
  company?: string;
  contacts?: PersonContact[];
}

export interface PeopleData {
  general?: { title?: string; summary?: string };
  items: Person[];
}

export default Person;
