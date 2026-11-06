import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface PersonContact {
  code: string;
  value: string | null;
}

export interface Person extends IBaseModelAdvanced {
  id: number;
  company?: string;
  contacts?: PersonContact[];
  /** Companies whose experience shows on this person even without a shared project. */
  experienceCompanyCodes?: string[];
}

export interface PeopleData {
  general?: { title?: string; summary?: string };
  items: Person[];
}

export default Person;
