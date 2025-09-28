export interface Company {
  code: string;
  name: string;
  logo?: string | null;
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
