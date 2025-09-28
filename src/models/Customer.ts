import { IBaseModel } from "./base/IBaseModel";

export interface Customer extends IBaseModel {
  uid: string;
  description?: string;
  website?: string;
  location?: string;
  city?: string;
  country?: string;
  industry?: string;
  relationship?: string;

  skillCodes?: string[];
  experienceCodes?: string[];
  serviceCodes?: string[];
  projectCodes?: string[];
  companyCodes?: string[];
  projectNames?: string[];
  technologies?: string[];
  // resolvedCompanyNames?: string[];
  // resolvedProjectTitles?: string[];
  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'ongoing' | string;
  };
  coordinates?: { lat: number; lng: number };
}

export interface CustomerData {
  items: Customer[];
  categories?: string[];
}