export interface Customer {
  name: string;
  title: string;
  logoPath: string;
  category?: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  relationship?: string;
  projects?: string[];
  technologies?: string[];
  companyCodes?: string[];
  projectNames?: string[];
  resolvedCompanyNames?: string[];
  resolvedProjectTitles?: string[];
  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'ongoing';
  };
  uid: string;
  coordinates: { lat: number; lng: number };
  city: string;
  country: string;
}

export interface CustomerData {
  items: Customer[];
  categories?: string[];
}