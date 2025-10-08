import { IBaseModel } from "./base/IBaseModel";

export interface Position {
  orderIndex?: number;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  domainCodes?: string[];
  projectCodes?: string[];
  skillCodes?: string[];
}

export interface Experience extends IBaseModel {
  orderIndex: number;
  companyCode?: string;
  positions: Position[];
}

export interface ExperiencesData {
  general?: {
    title?: string;
    summary?: string;
    total_years?: number;
    prop_subitems?: string;
  };
  items: Experience[];
}