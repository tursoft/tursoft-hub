import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface Domain extends IBaseModelAdvanced {
  value?: number;
}

export interface DomainsData {
  items: Domain[];
}

export default Domain;
