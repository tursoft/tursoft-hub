import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Reference extends IBaseModelAdvanced {
  company: string;
  position: string;
  testimonial: string;
  /** BCP 47 language tag when the testimonial is not in English (e.g. "tr"). */
  lang?: string;
  date: string;
  rating: number;
  isActive: boolean;
  contacts?: Array<{ code: string; value: string }> | null;
}

export interface ReferencesData {
  items: Reference[];
}

export default Reference;
