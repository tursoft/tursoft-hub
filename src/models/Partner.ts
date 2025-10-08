import { IBaseModel } from "./base/IBaseModel";

export interface Partner extends IBaseModel {
  partnerCode: string;
  companyCode: string;
}

export interface PartnersData {
  items: Partner[];
}

export default Partner;
