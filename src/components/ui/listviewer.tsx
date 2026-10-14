import { useState, type ComponentType, type MouseEvent, type ReactNode } from "react";
import { GalleryHorizontal, Grid3x3, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Carousel from "@/components/system/Carousel";
import Chip, { ChipRow } from "@/components/system/Chip";
import LogoTile, { type LogoTileVariant } from "@/components/system/LogoTile";
import Reveal from "@/components/system/Reveal";
import SearchField from "@/components/system/SearchField";
import SegmentedControl, { type SegmentedOption } from "@/components/system/SegmentedControl";
import Surface from "@/components/system/Surface";
import Tag from "@/components/system/Tag";
import {
  ALL_CATEGORY,
  buildCategories,
  countForCategory,
  filterItems,
  getFieldValue,
  type FieldAccessor,
} from "@/lib/listview";
import { cn } from "@/lib/utils";

export type ViewMode = "small-card" | "card" | "list" | "carousel";

export interface ListAction<T> {
  label: string | ((item: T) => string);
  icon?: ComponentType<{ className?: string }>;
  onClick: (item: T, event: MouseEvent) => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  /** Return false to leave this action out for an item (e.g. a contact the item does not have). */
  show?: (item: T) => boolean;
}

export interface FieldMapping<T> {
  code: FieldAccessor<T>;
  title: FieldAccessor<T>;
  subtitle?: FieldAccessor<T>;
  /** Plain text or trusted HTML from the site's own data files. */
  description: FieldAccessor<T>;
  image?: FieldAccessor<T>;
  badge?: FieldAccessor<T>;
  date?: FieldAccessor<T>;
  /** Short labels shown as quiet tags at the bottom of cards (first two plus "+n"). */
  tags?: (item: T) => string[];
  actions?: ListAction<T>[];
}

export interface ListViewerProps<T> {
  data: T[];
  fieldMapping: FieldMapping<T>;
  defaultViewMode?: ViewMode;
  enabledModes?: ViewMode[];
  enableCategoryFilter?: boolean;
  categoryField?: FieldAccessor<T>;
  categoryLabels?: Record<string, string>;
  categoryOrder?: string[];
  enableSearch?: boolean;
  searchFields?: FieldAccessor<T>[] | ((item: T) => string[]);
  searchPlaceholder?: string;
  renderCardContent?: (item: T) => ReactNode;
  renderListContent?: (item: T) => ReactNode;
  renderCarouselContent?: (item: T) => ReactNode;
  renderSmallCardContent?: (item: T) => ReactNode;
  /** Card-mode columns per breakpoint; `sm` is the base (phone) column count. */
  gridCols?: { sm?: number; md?: number; lg?: number; xl?: number };
  /** Small-tile columns per breakpoint. */
  smallCardCols?: { base?: number; md?: number; lg?: number };
  /** How item images are shown: dark logo tile, light well for dark logos, or a cover-fit photo. */
  imageVariant?: LogoTileVariant;
  /** Items to emphasise in small-tile mode (brighter label and an accent dot). */
  highlightItem?: (item: T) => boolean;
  enableShowMore?: boolean;
  visibleMajorItemCount?: number;
  onItemClick?: (item: T) => void;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  enableAnimation?: boolean;
  ariaLabel?: string;
  /** CSS width of one carousel slide. */
  carouselSlideWidth?: string;
}

const MODE_OPTIONS: Record<ViewMode, SegmentedOption<ViewMode>> = {
  "small-card": { value: "small-card", label: "Tiles", icon: <Grid3x3 /> },
  card: { value: "card", label: "Cards", icon: <LayoutGrid /> },
  list: { value: "list", label: "List", icon: <List /> },
  carousel: { value: "carousel", label: "Carousel", icon: <GalleryHorizontal /> },
};

// Static class names so Tailwind can see them.
const BASE_COLS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
const MD_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
};
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
  8: "lg:grid-cols-8",
};
const XL_COLS: Record<number, string> = {
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  8: "xl:grid-cols-8",
};

const gridClass = (cols: { base?: number; md?: number; lg?: number; xl?: number }) =>
  cn(
    "grid",
    cols.base && BASE_COLS[cols.base],
    cols.md && MD_COLS[cols.md],
    cols.lg && LG_COLS[cols.lg],
    cols.xl && XL_COLS[cols.xl],
  );

/** Filterable, searchable collection with small-tile, card, list and carousel views. */
function ListViewer<T>({
  data,
  fieldMapping,
  defaultViewMode = "card",
  enabledModes = ["card", "list", "carousel"],
  enableCategoryFilter = false,
  categoryField,
  categoryLabels,
  categoryOrder,
  enableSearch = false,
  searchFields,
  searchPlaceholder = "Search…",
  renderCardContent,
  renderListContent,
  renderCarouselContent,
  renderSmallCardContent,
  gridCols = { sm: 1, md: 2, lg: 3 },
  smallCardCols = { base: 3, md: 6, lg: 8 },
  imageVariant = "logo",
  highlightItem,
  enableShowMore = false,
  visibleMajorItemCount,
  onItemClick,
  isLoading = false,
  loadingMessage = "Loading…",
  emptyMessage = "Nothing to show yet.",
  enableAnimation = true,
  ariaLabel = "Items",
  carouselSlideWidth,
}: ListViewerProps<T>) {
  const [viewMode, setViewMode] = useState<ViewMode>(
    enabledModes.includes(defaultViewMode) ? defaultViewMode : enabledModes[0],
  );
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const categories = enableCategoryFilter && categoryField ? buildCategories(data, categoryField, categoryOrder) : [];
  const fallbackSearchFields = [fieldMapping.title, fieldMapping.subtitle].filter(
    (field): field is FieldAccessor<T> => Boolean(field),
  );
  const filtered = filterItems(data, {
    categoryField: categories.length > 0 ? categoryField : undefined,
    category,
    search: enableSearch ? search : "",
    searchFields: searchFields ?? fallbackSearchFields,
  });

  const isCarousel = viewMode === "carousel";
  const limit = enableShowMore && visibleMajorItemCount && !showAll ? visibleMajorItemCount : undefined;
  const visible = isCarousel || limit === undefined ? filtered : filtered.slice(0, limit);
  const canToggleMore =
    !isCarousel && enableShowMore && Boolean(visibleMajorItemCount) && filtered.length > (visibleMajorItemCount ?? 0);

  const text = (item: T, field?: FieldAccessor<T>) => getFieldValue(item, field);
  const keyOf = (item: T, index: number) => text(item, fieldMapping.code) || String(index);
  const activate = (item: T) => (onItemClick ? () => onItemClick(item) : undefined);

  const wrapItem = (key: string, index: number, node: ReactNode) =>
    enableAnimation ? (
      <Reveal key={key} index={index} className="h-full">
        {node}
      </Reveal>
    ) : (
      <div key={key} className="h-full">
        {node}
      </div>
    );

  const renderImage = (item: T, size: number) =>
    fieldMapping.image ? (
      <LogoTile src={text(item, fieldMapping.image)} alt={text(item, fieldMapping.title)} size={size} variant={imageVariant} />
    ) : null;

  const renderTags = (item: T) => {
    const tags = fieldMapping.tags?.(item) ?? [];
    if (tags.length === 0) return null;
    return (
      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        {tags.slice(0, 2).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
        {tags.length > 2 && <Tag>+{tags.length - 2}</Tag>}
      </div>
    );
  };

  const renderActions = (item: T) => {
    const actions = fieldMapping.actions?.filter((action) => action.show?.(item) ?? true) ?? [];
    if (actions.length === 0) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const label = typeof action.label === "function" ? action.label(item) : action.label;
          return (
            <Button
              key={index}
              variant={action.variant ?? "secondary"}
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(item, event);
              }}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </Button>
          );
        })}
      </div>
    );
  };

  const renderCard = (item: T) => {
    if (renderCardContent) {
      return (
        <Surface interactive onActivate={activate(item)} className="h-full">
          {renderCardContent(item)}
        </Surface>
      );
    }
    const title = text(item, fieldMapping.title);
    const meta = [text(item, fieldMapping.subtitle), text(item, fieldMapping.date)].filter(Boolean).join(" · ");
    const badge = text(item, fieldMapping.badge);
    const description = text(item, fieldMapping.description);
    return (
      <Surface interactive onActivate={activate(item)} className="flex h-full flex-col gap-3.5 p-5">
        <div className="flex items-start justify-between gap-3">
          {renderImage(item, 52) ?? <span />}
          {badge && <Tag tone="accent">{badge}</Tag>}
        </div>
        <div>
          <h3 className="text-base font-medium tracking-[-0.02em] text-foreground">{title}</h3>
          {meta && <p className="type-meta mt-1">{meta}</p>}
        </div>
        {description && (
          <div
            className="lv-description line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {renderTags(item)}
        {renderActions(item)}
      </Surface>
    );
  };

  const renderSmallCard = (item: T) => {
    if (renderSmallCardContent) {
      return (
        <Surface interactive onActivate={activate(item)} className="h-full">
          {renderSmallCardContent(item)}
        </Surface>
      );
    }
    const title = text(item, fieldMapping.title);
    const highlighted = highlightItem?.(item) ?? false;
    return (
      <Surface interactive onActivate={activate(item)} className={cn("lv-tile", highlighted && "is-highlighted")}>
        {highlighted && <span className="lv-tile-dot" aria-hidden="true" />}
        <LogoTile
          src={text(item, fieldMapping.image)}
          alt={title}
          variant={imageVariant}
          className={imageVariant === "logo-light" ? "lv-tile-well" : "lv-tile-logo"}
        />
        <span className="lv-tile-label">{title}</span>
      </Surface>
    );
  };

  const renderListItem = (item: T) => {
    if (renderListContent) {
      return (
        <Surface interactive tilt={false} onActivate={activate(item)} className="p-4">
          {renderListContent(item)}
        </Surface>
      );
    }
    const title = text(item, fieldMapping.title);
    const subtitle = text(item, fieldMapping.subtitle);
    const badge = text(item, fieldMapping.badge);
    const date = text(item, fieldMapping.date);
    const description = text(item, fieldMapping.description);
    const image = renderImage(item, 52);
    return (
      <Surface interactive tilt={false} onActivate={activate(item)} className={cn("lv-row", !image && "lv-row-noimage")}>
        {image}
        <div className="min-w-0">
          <h3 className="text-[15.5px] font-medium tracking-[-0.02em]">{title}</h3>
          {(subtitle || badge) && (
            <p className="type-meta mt-1 flex flex-wrap items-center gap-2">
              {subtitle && <span>{subtitle}</span>}
              {badge && <Tag>{badge}</Tag>}
            </p>
          )}
          {description && (
            <div
              className="lv-description mt-2 line-clamp-3 max-w-[700px] text-[13.5px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {renderActions(item)}
        </div>
        {date && <span className="lv-row-date">{date}</span>}
      </Surface>
    );
  };

  if (isLoading) {
    return (
      <div
        className={cn(gridClass({ base: 1, md: 2, lg: 3 }), "gap-4")}
        role="status"
        aria-busy="true"
        aria-label={loadingMessage}
      >
        <span className="sr-only">{loadingMessage}</span>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="surface h-[148px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return emptyMessage ? <p className="type-meta py-12 text-center">{emptyMessage}</p> : null;
  }

  const modeOptions = enabledModes.map((mode) => MODE_OPTIONS[mode]);
  const showModes = modeOptions.length > 1;
  const showControls = categories.length > 0 || enableSearch || showModes;

  let body: ReactNode;
  if (filtered.length === 0) {
    body = <p className="type-meta py-12 text-center">{emptyMessage || "No matches."}</p>;
  } else if (viewMode === "carousel") {
    body = (
      <Carousel
        key={`${category}|${search}`}
        items={filtered}
        getKey={keyOf}
        ariaLabel={ariaLabel}
        slideWidth={carouselSlideWidth}
        renderItem={(item) =>
          renderCarouselContent ? (
            <Surface interactive tilt={false} onActivate={activate(item)} className="h-full">
              {renderCarouselContent(item)}
            </Surface>
          ) : (
            renderCard(item)
          )
        }
      />
    );
  } else if (viewMode === "list") {
    body = (
      <div className="flex flex-col gap-3">
        {visible.map((item, index) => wrapItem(keyOf(item, index), index, renderListItem(item)))}
      </div>
    );
  } else if (viewMode === "small-card") {
    body = (
      <div
        className={cn(
          gridClass({ base: smallCardCols.base ?? 3, md: smallCardCols.md ?? 6, lg: smallCardCols.lg ?? 8 }),
          "gap-2.5",
        )}
      >
        {visible.map((item, index) => wrapItem(keyOf(item, index), index, renderSmallCard(item)))}
      </div>
    );
  } else {
    body = (
      <div className={cn(gridClass({ base: gridCols.sm ?? 1, md: gridCols.md, lg: gridCols.lg, xl: gridCols.xl }), "gap-4")}>
        {visible.map((item, index) => wrapItem(keyOf(item, index), index, renderCard(item)))}
      </div>
    );
  }

  return (
    <div>
      {showControls && (
        <div className="lv-controls">
          {categories.length > 0 && (
            <ChipRow aria-label="Filter by category">
              {categories.map((value) => (
                <Chip
                  key={value}
                  selected={category === value}
                  count={countForCategory(data, categoryField, value)}
                  onClick={() => setCategory(value)}
                >
                  {categoryLabels?.[value] ?? value}
                </Chip>
              ))}
            </ChipRow>
          )}
          {(enableSearch || showModes) && (
            <div className={cn("lv-controls-row", !enableSearch && "justify-end")}>
              {enableSearch && <SearchField value={search} onChange={setSearch} placeholder={searchPlaceholder} />}
              {showModes && (
                <SegmentedControl ariaLabel="View mode" options={modeOptions} value={viewMode} onChange={setViewMode} />
              )}
            </div>
          )}
        </div>
      )}

      {body}

      {canToggleMore && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Show less" : `Show all (${filtered.length})`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ListViewer;
