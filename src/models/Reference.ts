import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Reference extends IBaseModelAdvanced {
  company: string;
  position: string;
  testimonial: string;
  date: string;
  rating: number;
  isActive: boolean;
  contacts?: Array<{ code: string; value: string }> | null;
}

export interface ReferencesData {
  items: Reference[];
}

export default Reference;
