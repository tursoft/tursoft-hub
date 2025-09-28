export interface IBaseRepoAdvanced {
  getTitleByCode(code: string | null | undefined): Promise<string | null>;
  getPhotoUrlByCode(code: string | null | undefined): Promise<string | null>;
}