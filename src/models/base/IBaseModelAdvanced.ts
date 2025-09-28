import { IBaseModel } from "./IBaseModel";

export interface IBaseModelAdvanced extends IBaseModel {
    title: string;
    logoUrl?: string | null;
}