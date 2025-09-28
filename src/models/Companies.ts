import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Company extends IBaseModelAdvanced {
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  country?: string | null;
  city?: string | null;
}

export interface CompaniesData {
  items: Company[];
}

export default Company;
