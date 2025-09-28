import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Course {
  name: string;
  score: string;
  content: string;
}

export interface EducationTechnology {
  name: string;
  type: string;
}

export interface DatePeriod {
  startDate: string;
  endDate: string;
}

export interface Education extends IBaseModelAdvanced {
  id: number;
  orderIndex: number;
  url?: string;
  department: string;
  summary?: string;
  level: string;
  period: string;
  datePeriod: DatePeriod;
  city: string;
  graduateDate: string;
  graduateScore: string;
  courses?: Course[];
  technologies?: EducationTechnology[];
  uid: string;
  coordinates: { lat: number; lng: number };
  country: string;
}

export interface EducationData {
  general: {
    title: string;
    summary: string;
  };
  items: Education[];
}