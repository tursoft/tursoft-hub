export interface Customer {
  name: string;
  uid: string;
  title?: string;
  description?: string;
  website?: string;
  logoPath?: string;
  location?: string; // freeform location string from JSON
  city?: string;
  country?: string;
  industry?: string;
  relationship?: string;
  // codes arrays used in JSON
  skillCodes?: string[];
  experienceCodes?: string[];
  serviceCodes?: string[];
  projectCodes?: string[];
  companyCodes?: string[];
  projectNames?: string[];
  technologies?: string[];
  resolvedCompanyNames?: string[];
  resolvedProjectTitles?: string[];
  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'ongoing' | string;
  };
  // optional geolocation metadata if present
  coordinates?: { lat: number; lng: number };
}

export interface CustomerData {
  items: Customer[];
  categories?: string[];
}