import { IBaseModel } from "./base/IBaseModel";

export interface Customer extends IBaseModel {
  // Fields from JSON
  companyCode?: string | null;
  description?: string;
  industry?: string | null;
  relationship?: string | null;
  location?: string | null;
  category?: string | null; // Now stored in JSON, not just runtime

  skillCodes?: string[];
  experienceCodes?: string[];
  serviceCodes?: string[];
  projectCodes?: string[];

  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  } | null;
}

export interface CustomerData {
  items: Customer[];
  categories?: string[];
}