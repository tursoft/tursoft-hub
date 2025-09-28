export interface ServiceItem {
  name: string;
  title?: string;
  value?: number;
  iconCss?: string;
  summary?: string;
}

export interface ServicesData {
  items: ServiceItem[];
}

export default ServiceItem;
