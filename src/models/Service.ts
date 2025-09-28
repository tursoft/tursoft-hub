export interface ServiceItem {
  code: string;
  orderIndex?: number;
  title?: string;
  photoUrl?: string;
  summary?: string;
  value?: number;
}

export interface ServicesData {
  items: ServiceItem[];
}

export default ServiceItem;
