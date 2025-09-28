import { IBaseModel } from "./IBaseModel";

export interface IBaseModelAdvanced extends IBaseModel {
    title: string;
    photoUrl?: string | null;
}