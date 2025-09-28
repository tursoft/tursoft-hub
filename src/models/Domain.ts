export interface Domain {
  id?: number;
  name: string;
  title?: string;
  value?: number;
  iconCss?: string;
}

export interface DomainsData {
  items: Domain[];
}

export default Domain;
