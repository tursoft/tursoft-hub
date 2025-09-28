import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Domain {
  code: string;
  orderIndex?: number;
  title?: string;
  photoUrl?: string;
  value?: number;
}

export interface DomainsData {
  items: Domain[];
}

export default Domain;
