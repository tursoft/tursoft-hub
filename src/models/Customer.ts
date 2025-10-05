import { IBaseModel } from "./base/IBaseModel";

export interface Customer extends IBaseModel {
  // Fields from JSON
  companyCode?: string | null;
  description?: string;
  industry?: string | null;
  relationship?: string | null;
  location?: string | null;

  skillCodes?: string[];
  experienceCodes?: string[];
  serviceCodes?: string[];
  projectCodes?: string[];

  partnership?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  } | null;
  
  // Runtime-added fields (not in JSON, added by component)
  category?: string;
}

export interface CustomerData {
  items: Customer[];
  categories?: string[];
}