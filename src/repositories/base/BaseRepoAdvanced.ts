import { IBaseModelAdvanced } from "@/models/base/IBaseModelAdvanced";
import BaseRepo from "./BaseRepo";

export default class BaseRepoAdvanced<TItem extends IBaseModelAdvanced, TData extends { items: TItem[] } = { items: TItem[] }> 
    extends BaseRepo<TItem, TData> {

  constructor(jsonPath: string) {
    super(jsonPath);
  }

  async getLogoUrlByCode(code: string | null | undefined): Promise<string | null> {
    if (!code) return null;
    const item = await this.getByCode(code);
    if (!item) return null;
    const logo = item.logoUrl;
    return logo ?? null;
  }

  async getTitleByCode(code: string | null | undefined): Promise<string | null> {
    if (!code) return null;
    const item = await this.getByCode(code);
    if (!item) return null;
    const title = item.title;
    return title ?? null;
  }
}
