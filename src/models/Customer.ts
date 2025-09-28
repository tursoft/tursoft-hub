import { IBaseModel } from "./base/IBaseModel";

export interface Customer extends IBaseModel {
  // many fields are optional in JSON
  companyCode?: string | null;
  description?: string;
  industry?: string | null;
  relationship?: string | null;

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