export default class BaseRepo<TItem, TData extends { items: TItem[] } = { items: TItem[] }> {
  protected data: TData | null = null;
  protected loadingPromise: Promise<void> | null = null;
  protected codeMap: Map<string, TItem> | null = null;

  constructor(
    private jsonPath: string,
    private codeSelector: (item: TItem) => string | undefined,
    private logoSelector: (item: TItem) => string | undefined,
    private normalizeCode: (k: string) => string = (s) => s.toUpperCase()
  ) { }

  protected async loadIfNeeded(): Promise<void> {
    if (this.data) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const resp = await fetch(this.jsonPath);
        if (!resp.ok) throw new Error(`Failed to load ${this.jsonPath}: ${resp.status}`);
        const json = (await resp.json()) as TData;
        this.data = json || ({ items: [] } as TData);
        this.buildMaps();
      } catch (err) {
        this.data = ({ items: [] } as TData);
        this.codeMap = new Map();
        console.error(`BaseRepo: error loading ${this.jsonPath}`, err);
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  protected buildMaps() {
    if (!this.data) {
      this.codeMap = new Map();
      return;
    }
    this.codeMap = new Map();
    for (const item of this.data.items) {
      const raw = this.codeSelector(item);
      if (raw) {
        const key = this.normalizeCode(raw.toString());
        this.codeMap.set(key, item);
      }
    }
  }

  async getList(): Promise<TItem[]> {
    await this.loadIfNeeded();
    return this.data ? this.data.items.slice() : [];
  }

  async getById(id: number | string): Promise<TItem | null> {
    await this.loadIfNeeded();
    if (!this.data) return null;

    if (typeof id === 'number') {
      // try to find by id property first, then by array index
      const byId = this.data.items.find((it) => {
        const candidate = it as unknown as { id?: number | string };
        return candidate && candidate.id === id;
      });
      if (byId) return byId;
      return this.data.items[id] || null;
    }

    const key = this.normalizeCode(id.toString());
    return this.codeMap?.get(key) || null;
  }

  async getByCode(code: string | null | undefined): Promise<TItem | null> {
    if (!code) return null;
    await this.loadIfNeeded();
    return this.codeMap?.get(this.normalizeCode(code.toString())) || null;
  }

  async getLogoUrlByCode(code: string | null | undefined): Promise<string | null> {
    if (!code) return null;
    const item = await this.getByCode(code);
    if (!item) return null;
    const logo = this.logoSelector(item);
    return logo ?? null;
  }

  /**
   * Basic search implementation. If fields is provided it will only search those properties on the item.
   * Otherwise it will stringify the item and search the full JSON.
   */
  async search(query: string, fields?: (keyof TItem)[]): Promise<TItem[]> {
    await this.loadIfNeeded();
    if (!this.data) return [];
    if (!query || !query.trim()) return this.data.items.slice();
    const q = query.toLowerCase();

    if (fields && fields.length) {
      return this.data.items.filter((it) => {
        for (const f of fields) {
          const obj = it as unknown as Record<string, unknown>;
          const v = obj[String(f)];
          if (v && String(v).toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }

    return this.data.items.filter((it) => JSON.stringify(it).toLowerCase().includes(q));
  }
}
