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

export interface Education {
  id: number;
  orderIndex: number;
  icon: string;
  url?: string;
  code: string;
  name: string;
  department: string;
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