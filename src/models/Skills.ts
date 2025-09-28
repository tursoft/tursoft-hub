export interface SkillGroup {
  id?: number;
  name?: string;
  title?: string;
  orderIndex?: number;
}

export interface SkillItem {
  id?: number;
  name: string;
  title?: string;
  group?: string | number;
  value?: number;
  iconCss?: string;
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