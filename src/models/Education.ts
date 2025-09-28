import { IBaseModel } from "./base/IBaseModel";

export interface Course {
  name: string;
  score: string;
  content: string;
}

export interface DatePeriod {
  startDate: string;
  endDate: string;
}

export interface Education extends IBaseModel {
  companyCode: string;
  department: string;
  summary?: string;
  level: string;
  period: string;
  datePeriod: DatePeriod;
  graduateDate: string;
  graduateScore: string;
  courses?: Course[];
  skillCodes?: string[];
}

export interface EducationData {
  general: {
    title: string;
    summary: string;
  };
  items: Education[];
}