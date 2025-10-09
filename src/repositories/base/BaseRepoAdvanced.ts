import { IBaseModelAdvanced } from "@/models/base/IBaseModelAdvanced";
import { IBaseRepoAdvanced } from "./IBaseRepoAdvanced";
import BaseRepo from "./BaseRepo";

export default class BaseRepoAdvanced<TItem extends IBaseModelAdvanced, TData extends { items: TItem[] } = { items: TItem[] }> 
    extends BaseRepo<TItem, TData>
    implements IBaseRepoAdvanced
{
  constructor(jsonPath: string) {
    super(jsonPath);
  }

  async getTitleByCode(code: string | null | undefined): Promise<string | null> {
    if (!code) return null;
    const item = await this.getByCode(code);
    if (!item) return null;
    const title = item.title;
    return title ?? null;
  }

  async getPhotoUrlByCode(code: string | null | undefined): Promise<string | null> {
    if (!code) return null;
    const item = await this.getByCode(code);
    if (!item) return null;
    const photo = item.photoUrl;
    return photo ?? null;
  }
}
