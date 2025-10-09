import { IBaseModel } from "./base/IBaseModel";

export interface Partner extends IBaseModel {
  partnerCode: string;
  companyCode: string;
  description?: string;
}

export interface PartnersData {
  items: Partner[];
}

export default Partner;
