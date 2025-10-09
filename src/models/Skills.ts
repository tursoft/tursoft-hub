import { IBaseModelAdvanced } from "./base/IBaseModelAdvanced";

export interface SkillGroup {
  id?: number;
  name?: string;
  title?: string;
  orderIndex?: number;
}

export interface SkillItem extends IBaseModelAdvanced {
  id?: number;
  group?: string | number;
  value?: number;
  projects?: number;
  jobs?: number;
  orderIndex?: number;
  isMajor?: boolean;
}

export interface SkillsData {
  general?: { title?: string; summary?: string; groups?: SkillGroup[] };
  items: SkillItem[];
}

export default SkillItem;