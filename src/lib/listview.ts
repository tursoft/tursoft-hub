export const ALL_CATEGORY = "All";

/** A property name, or a function that derives the value from an item. */
export type FieldAccessor<T> = string | ((item: T) => string | null | undefined);

export function getFieldValue<T>(item: T, field?: FieldAccessor<T>): string {
  if (!field) return "";
  const value = typeof field === "function" ? field(item) : (item as unknown as Record<string, unknown>)[field];
  return value === null || value === undefined ? "" : String(value);
}

/** "All" followed by the unique non-empty categories, in the preferred order first, then alphabetically. */
export function buildCategories<T>(data: T[], field: FieldAccessor<T>, order: string[] = []): string[] {
  const unique = Array.from(new Set(data.map((item) => getFieldValue(item, field)).filter(Boolean)));
  const rank = (category: string) => {
    const index = order.indexOf(category);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  unique.sort((a, b) => {
    const diff = rank(a) - rank(b);
    return Number.isNaN(diff) || diff === 0 ? a.localeCompare(b) : diff;
  });
  return [ALL_CATEGORY, ...unique];
}

export function countForCategory<T>(data: T[], field: FieldAccessor<T> | undefined, category: string): number {
  if (!field || category === ALL_CATEGORY) return data.length;
  return data.filter((item) => getFieldValue(item, field) === category).length;
}

export interface FilterOptions<T> {
  categoryField?: FieldAccessor<T>;
  category?: string;
  search?: string;
  /** Fields to search in, or a function returning field names for an item. */
  searchFields?: FieldAccessor<T>[] | ((item: T) => string[]);
}

export function filterItems<T>(
  data: T[],
  { categoryField, category = ALL_CATEGORY, search = "", searchFields = [] }: FilterOptions<T>,
): T[] {
  const query = search.trim().toLowerCase();
  return data.filter((item) => {
    if (categoryField && category !== ALL_CATEGORY && getFieldValue(item, categoryField) !== category) return false;
    if (!query) return true;
    const fields: FieldAccessor<T>[] = typeof searchFields === "function" ? searchFields(item) : searchFields;
    return fields.some((field) => getFieldValue(item, field).toLowerCase().includes(query));
  });
}
