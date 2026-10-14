# Task 8: ListViewer, Carousel, QuoteCard + Skills, Projects, Clients, References, People sections

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Rewrite: `src/components/ui/listviewer.tsx`
- Create: `src/components/system/Carousel.tsx`, `src/components/system/QuoteCard.tsx`
- Rewrite: `src/components/skills/SkillsSection.tsx`, `src/components/projects/PortfolioSection.tsx`, `src/components/customers/CustomersSection.tsx`, `src/components/references/ReferencesSection.tsx`, `src/components/people/PeopleSection.tsx`
- Modify: `src/components/domains/DomainDetailDialog.tsx` (remove the `imageRounded` prop, which no longer exists)

**Interfaces:**
- Consumes: Task 2 `listview` helpers, `formatYearRange`, `wrap`; Task 3 `Reveal`; Task 4 `Surface`, `LogoTile`, `Tag`, `Chip`/`ChipRow`, `SearchField`, `SegmentedControl`, `StatTile`/`StatGrid`, `Section`, `SectionHeader`, `Button`; Task 5 `CAREER`, `OWNER`; repositories; existing detail dialogs (unchanged APIs).
- Produces:
  - `ListViewer<T>` (default export of `src/components/ui/listviewer.tsx`) with `ListViewerProps<T>`:
    `data, fieldMapping, defaultViewMode = "card", enabledModes = ["card","list","carousel"], enableCategoryFilter, categoryField, categoryLabels, categoryOrder, enableSearch, searchFields, searchPlaceholder, renderCardContent, renderListContent, renderCarouselContent, renderSmallCardContent, gridCols = { sm: 1, md: 2, lg: 3 } (sm = base), smallCardCols = { base: 3, md: 6, lg: 8 }, imageVariant: "logo" | "logo-light" | "photo" = "logo", highlightItem, enableShowMore, visibleMajorItemCount, onItemClick, isLoading, loadingMessage, emptyMessage, enableAnimation = true, ariaLabel = "Items", carouselSlideWidth`.
    `FieldMapping<T>`: `code, title, subtitle?, description, image?, badge?, date?, tags?: (item) => string[], actions?`.
    Removed props (now rendered by the sections themselves): `title, subtitle, badge, summary, footer, carouselHeight, carouselCardWidth, carouselCardHeight, imageRounded`.
  - `Carousel<T>` (default): `{ items, getKey(item, index), renderItem(item, { active }), ariaLabel, slideWidth? }`.
  - `QuoteCard` (default): `{ quote, name, role, date?, photo?, actions? }`.

Copy (exact):
- Skills: `04 / skills` — title `The toolbox, from <em>.NET to Kubernetes.</em>`; lede `A comprehensive overview of programming languages, frameworks, databases, and tools I've mastered throughout my career.`
- Projects: `05 / projects` — title `Selected work across <em>healthcare, construction and AI.</em>`; lede `A showcase of innovative solutions and successful implementations across various domains and technologies.`
- Clients: `06 / clients` — title `Organisations that <em>trusted the work.</em>`; lede `Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors.`
- References: `07 / references` — title `In <em>colleagues' words.</em>`; lede `Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career.`

---

- [ ] **Step 1: Let testimonial highlights render as accent text in list cards too**

In `src/index.css`, change the selector `.quote-text span {` to `.quote-text span,\n  .lv-description span {` (the rule body stays the same). The rule now reads:

```css
  .quote-text span,
  .lv-description span {
    padding: 0 !important;
    border-radius: 0 !important;
    background: none !important;
    font-weight: inherit !important;
    color: hsl(var(--accent)) !important;
  }
```

- [ ] **Step 2: Create `src/components/system/Carousel.tsx`**

```tsx
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { wrap } from "@/lib/motion/math";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 40;
const DRAG_START = 6;
/** Up to this many slides get one progress bar each; more get a counter and a progress line. */
const BAR_LIMIT = 12;

interface CarouselProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, state: { active: boolean }) => ReactNode;
  ariaLabel: string;
  /** CSS width of one slide; defaults to min(440px, 82vw). */
  slideWidth?: string;
}

/**
 * Flat carousel: the active slide is centred and its neighbours dimmed. Moves with swipe/drag,
 * arrow keys, the previous/next buttons or the progress bars. Clicking a dimmed slide brings it to the centre.
 */
export default function Carousel<T>({ items, getKey, renderItem, ariaLabel, slideWidth }: CarouselProps<T>) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const drag = useRef<{ startX: number; pointerId: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const count = items.length;

  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  const go = (delta: number) => setIndex((current) => wrap(current + delta, count));

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { startX: event.clientX, pointerId: event.pointerId, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    if (!current.moved && Math.abs(dx) > DRAG_START) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.moved) setDragX(dx);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (current.moved) {
      suppressClick.current = true;
      const dx = event.clientX - current.startX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    }
    setDragX(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  };

  const rootStyle = slideWidth ? ({ "--slide-w": slideWidth } as CSSProperties) : undefined;
  const trackStyle = { "--index": index, "--drag": `${dragX}px` } as CSSProperties;

  return (
    <div
      className="carousel"
      style={rootStyle}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="carousel-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <div className={cn("carousel-track", dragX !== 0 && "is-dragging")} style={trackStyle}>
          {items.map((item, itemIndex) => {
            const active = itemIndex === index;
            return (
              <div
                key={getKey(item, itemIndex)}
                className={cn("carousel-slide", active && "is-active")}
                onClickCapture={(event) => {
                  if (active) return;
                  event.stopPropagation();
                  event.preventDefault();
                  setIndex(itemIndex);
                }}
              >
                {renderItem(item, { active })}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="carousel-controls">
          <Button variant="secondary" size="icon" magnetic aria-label="Previous" className="max-sm:hidden" onClick={() => go(-1)}>
            <ChevronLeft />
          </Button>
          <CarouselProgress index={index} count={count} onSelect={setIndex} />
          <Button variant="secondary" size="icon" magnetic aria-label="Next" className="max-sm:hidden" onClick={() => go(1)}>
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function CarouselProgress({ index, count, onSelect }: { index: number; count: number; onSelect: (index: number) => void }) {
  if (count <= BAR_LIMIT) {
    return (
      <div className="carousel-bars">
        {Array.from({ length: count }, (_, barIndex) => (
          <button
            key={barIndex}
            type="button"
            className="carousel-bar-hit"
            aria-label={`Go to slide ${barIndex + 1}`}
            aria-current={barIndex === index}
            onClick={() => onSelect(barIndex)}
          >
            <span className="carousel-bar" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="carousel-count">
        {String(index + 1).padStart(2, "0")} / {count}
      </span>
      <span className="carousel-line" aria-hidden="true">
        <span className="carousel-line-fill" style={{ width: `${((index + 1) / count) * 100}%` }} />
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/system/QuoteCard.tsx`**

```tsx
import type { ReactNode } from "react";
import LogoTile from "./LogoTile";

interface QuoteCardProps {
  /** Testimonial text; may contain <span> highlights from references.json (trusted local data). */
  quote: string;
  name: string;
  role: string;
  date?: string;
  photo?: string | null;
  actions?: ReactNode;
}

export default function QuoteCard({ quote, name, role, date, photo, actions }: QuoteCardProps) {
  return (
    <figure className="flex h-full flex-col gap-6 p-6 sm:p-9">
      <blockquote className="quote-text" dangerouslySetInnerHTML={{ __html: `“${quote}”` }} />
      <figcaption className="mt-auto flex flex-wrap items-center gap-3.5">
        <LogoTile src={photo} alt={name} size={44} variant="photo" />
        <div className="min-w-0">
          <b className="block text-sm font-medium">{name}</b>
          <span className="type-meta">{[role, date].filter(Boolean).join(" · ")}</span>
        </div>
        {actions && <div className="ml-auto flex gap-1.5">{actions}</div>}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Rewrite `src/components/ui/listviewer.tsx`**

```tsx
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
    if (!fieldMapping.actions?.length) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {fieldMapping.actions.map((action, index) => {
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
      <div className={cn(gridClass({ base: 1, md: 2, lg: 3 }), "gap-4")} aria-busy="true" aria-label={loadingMessage}>
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
```

- [ ] **Step 5: Rewrite `src/components/skills/SkillsSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { skillsRepo } from "@/repositories/SkillsRepo";
import type { SkillItem } from "@/models/Skills";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import type { Education } from "@/models/Education";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import ExperienceDetailDialog from "@/components/experiences/ExperienceDetailDialog";
import EducationDetailDialog from "@/components/educations/EducationDetailDialog";
import SkillDetailDialog from "./SkillDetailDialog";

interface SkillWithIcon extends SkillItem {
  icon: string;
}

const SkillsSection = () => {
  const [skills, setSkills] = useState<SkillWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, fullData] = await Promise.all([skillsRepo.getList(), skillsRepo.getFullData()]);
        const groups = [...(fullData?.general?.groups ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategoryOrder(groups.map((group) => group.title || group.name || ""));
        setSkills(
          list
            .map((skill) => ({ ...skill, icon: skill.photoUrl ?? "" }))
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
      } catch (error) {
        console.error("Failed to load skills:", error);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="skills">
      <SectionHeader
        index="04"
        label="skills"
        title={
          <>
            The toolbox, from <em>.NET to Kubernetes.</em>
          </>
        }
        lede="A comprehensive overview of programming languages, frameworks, databases, and tools I've mastered throughout my career."
      />

      <ListViewer<SkillWithIcon>
        data={skills}
        isLoading={isLoading}
        loadingMessage="Loading skills…"
        emptyMessage="No skills found."
        defaultViewMode="small-card"
        enabledModes={["small-card", "card", "list"]}
        enableShowMore
        visibleMajorItemCount={32}
        enableCategoryFilter
        categoryField="group"
        categoryOrder={categoryOrder}
        enableSearch
        searchFields={["title", "code", "group"]}
        searchPlaceholder="Search skills, technologies, or categories…"
        highlightItem={(skill) => Boolean(skill.isMajor)}
        onItemClick={setSelectedSkill}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (skill) => String(skill.group ?? ""),
          description: (skill) => `${skill.projects ?? 0} projects · ${skill.jobs ?? 0} jobs`,
          image: "icon",
          badge: (skill) => (skill.isMajor ? "major" : ""),
        }}
        gridCols={{ sm: 2, md: 3, lg: 4 }}
        ariaLabel="Skills"
      />

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
        onOpenProject={setSelectedProject}
        onOpenExperience={setSelectedExperience}
        onOpenEducation={setSelectedEducation}
      />
      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
      />
      <EducationDetailDialog
        education={selectedEducation}
        isOpen={selectedEducation !== null}
        onClose={() => setSelectedEducation(null)}
      />
    </Section>
  );
};

export default SkillsSection;
```

- [ ] **Step 6: Rewrite `src/components/projects/PortfolioSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { ProjectEntry } from "@/models/Project";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import { formatYearRange } from "@/lib/format";
import ProjectDetailDialog from "./ProjectDetailDialog";

interface ProjectWithMeta extends ProjectEntry {
  icon: string;
  formattedYears: string;
  companyTitle: string;
}

const PortfolioSection = () => {
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fullData, list, companies] = await Promise.all([
          projectsRepo.getFullData(),
          projectsRepo.getList(),
          companiesRepo.getList(),
        ]);
        const companyTitles = new Map(companies.map((company) => [company.code.toUpperCase(), company.title]));
        const groups = [...(fullData?.general?.groups ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategoryOrder(groups.map((group) => group.code));
        setProjects(
          list.map((project) => ({
            ...project,
            icon: project.photoUrl ?? "",
            formattedYears: formatYearRange(project.datePeriod?.startDate, project.datePeriod?.endDate, ""),
            companyTitle:
              (project.companyCode && companyTitles.get(project.companyCode.toUpperCase())) || project.companyCode || "",
          })),
        );
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categoryCount = new Set(projects.map((project) => project.group).filter(Boolean)).size;
  const technologyCount = new Set(projects.flatMap((project) => project.skillCodes ?? [])).size;

  return (
    <Section id="portfolio">
      <SectionHeader
        index="05"
        label="projects"
        title={
          <>
            Selected work across <em>healthcare, construction and AI.</em>
          </>
        }
        lede="A showcase of innovative solutions and successful implementations across various domains and technologies."
      />

      <StatGrid columns={3}>
        <StatTile value={projects.length} label="projects" />
        <StatTile value={categoryCount} label="categories" />
        <StatTile value={technologyCount} label="technologies" />
      </StatGrid>

      <ListViewer<ProjectWithMeta>
        data={projects}
        isLoading={isLoading}
        loadingMessage="Loading projects…"
        emptyMessage="No projects found."
        defaultViewMode="card"
        enabledModes={["card", "list", "carousel"]}
        enableShowMore
        visibleMajorItemCount={21}
        enableCategoryFilter
        categoryField="group"
        categoryOrder={categoryOrder}
        enableSearch
        searchFields={["title", "summary", "group", "companyTitle"]}
        searchPlaceholder="Search projects, technologies, or categories…"
        onItemClick={setSelectedProject}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: "companyTitle",
          description: (project) => project.summary ?? "",
          image: "icon",
          badge: "group",
          date: "formattedYears",
          tags: (project) => project.skillCodes ?? [],
        }}
        gridCols={{ sm: 1, md: 2, lg: 3 }}
        ariaLabel="Projects"
      />

      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
    </Section>
  );
};

export default PortfolioSection;
```

- [ ] **Step 7: Rewrite `src/components/customers/CustomersSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import type { Customer, CustomerData } from "@/models/Customer";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import { CAREER } from "@/lib/site";
import CustomerDetailDialog from "./CustomerDetailDialog";

interface CustomerWithCompany extends Customer {
  logo: string;
  companyTitle: string;
  country: string;
}

const CustomersSection = () => {
  const [customers, setCustomers] = useState<CustomerWithCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithCompany | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/data/customers.json");
        const data = (await response.json()) as CustomerData;
        const withCompanies = await Promise.all(
          data.items.map(async (customer) => {
            const company = customer.companyCode ? await companiesRepo.getByCode(customer.companyCode) : null;
            return {
              ...customer,
              logo: company?.photoUrl ?? "",
              companyTitle: company?.title ?? customer.companyCode ?? customer.code,
              country: company?.country ?? "",
            };
          }),
        );
        setCustomers(withCompanies);
      } catch (error) {
        console.error("Failed to load customers:", error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const industryCount = new Set(customers.map((customer) => customer.category).filter(Boolean)).size;
  const countryCount = new Set(customers.map((customer) => customer.country).filter(Boolean)).size;

  return (
    <Section id="customers">
      <SectionHeader
        index="06"
        label="clients"
        title={
          <>
            Organisations that <em>trusted the work.</em>
          </>
        }
        lede="Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors."
      />

      <StatGrid>
        <StatTile value={customers.length} label="customers" />
        <StatTile value={industryCount} label="industries" />
        <StatTile value={countryCount} label="countries" />
        <StatTile value={CAREER.years} suffix="+" label="years" />
      </StatGrid>

      <ListViewer<CustomerWithCompany>
        data={customers}
        isLoading={isLoading}
        loadingMessage="Loading customers…"
        emptyMessage="No customers found in this category."
        defaultViewMode="small-card"
        enabledModes={["small-card", "card", "list", "carousel"]}
        enableShowMore
        visibleMajorItemCount={24}
        enableCategoryFilter
        categoryField="category"
        enableSearch
        searchFields={["companyTitle", "description", "category", "country"]}
        searchPlaceholder="Search customers, industries, or categories…"
        imageVariant="logo-light"
        smallCardCols={{ base: 2, md: 4, lg: 6 }}
        gridCols={{ sm: 1, md: 2, lg: 3 }}
        onItemClick={setSelectedCustomer}
        fieldMapping={{
          code: "code",
          title: "companyTitle",
          subtitle: "country",
          description: (customer) => customer.description ?? "",
          image: "logo",
          badge: "category",
        }}
        ariaLabel="Clients"
      />

      <CustomerDetailDialog
        customer={selectedCustomer}
        isOpen={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customerLogo={selectedCustomer?.logo}
        companyTitle={selectedCustomer?.companyTitle}
      />
    </Section>
  );
};

export default CustomersSection;
```

- [ ] **Step 8: Rewrite `src/components/references/ReferencesSection.tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  ExternalLink,
  Facebook,
  Globe,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { peopleRepo } from "@/repositories/PeopleRepo";
import { referencesRepo } from "@/repositories/ReferencesRepo";
import type { Person } from "@/models/People";
import type { Reference } from "@/models/Reference";
import { Button } from "@/components/ui/button";
import ListViewer from "@/components/ui/listviewer";
import PeopleDetailDialog from "@/components/people/PeopleDetailDialog";
import QuoteCard from "@/components/system/QuoteCard";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import { OWNER } from "@/lib/site";

interface ReferenceWithPhoto extends Reference {
  photo: string;
}

const CONTACT_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  website: Globe,
  skype: MessageSquare,
};

const CONTACT_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Call",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  facebook: "Facebook",
  website: "Website",
  skype: "Skype",
};

/** Contacts shown on a quote, in this order of preference. */
const PREFERRED_CONTACTS = ["email", "linkedin", "website", "phone", "twitter", "facebook", "skype"];

const contactHref = (code: string, value: string) => {
  if (code === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (code === "email") return `mailto:${value}`;
  return value.startsWith("http") ? value : `https://${value}`;
};

function ContactButtons({ reference }: { reference: Reference }) {
  const rank = (code: string) => {
    const index = PREFERRED_CONTACTS.indexOf(code);
    return index === -1 ? PREFERRED_CONTACTS.length : index;
  };
  const contacts = (reference.contacts ?? [])
    .filter((contact) => contact.value)
    .sort((a, b) => rank(a.code) - rank(b.code))
    .slice(0, 3);

  return (
    <>
      {contacts.map((contact) => {
        const Icon = CONTACT_ICONS[contact.code] ?? ExternalLink;
        const href = contactHref(contact.code, contact.value);
        const external = href.startsWith("http");
        return (
          <Button
            key={contact.code}
            asChild
            variant="secondary"
            size="icon-sm"
            aria-label={`${CONTACT_LABELS[contact.code] ?? contact.code}: ${reference.title}`}
          >
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              <Icon />
            </a>
          </Button>
        );
      })}
    </>
  );
}

const ReferencesSection = () => {
  const [references, setReferences] = useState<ReferenceWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await referencesRepo.getList();
        const active = all.filter((reference) => reference.isActive);
        setReferences(
          await Promise.all(
            active.map(async (reference) => ({
              ...reference,
              photo: (await referencesRepo.getPhotoUrlByCode(reference.code)) ?? "",
            })),
          ),
        );
      } catch (error) {
        console.error("Error loading references:", error);
        setReferences([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const openPerson = async (reference: ReferenceWithPhoto) => {
    try {
      const person = await peopleRepo.getByCode(reference.code);
      if (person) setSelectedPerson(person);
    } catch (error) {
      console.error("Failed to load person:", error);
    }
  };

  return (
    <Section id="references">
      <SectionHeader
        index="07"
        label="references"
        title={
          <>
            In <em>colleagues' words.</em>
          </>
        }
        lede="Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career."
      />

      <ListViewer<ReferenceWithPhoto>
        data={references}
        isLoading={isLoading}
        loadingMessage="Loading references…"
        emptyMessage="No references available."
        defaultViewMode="carousel"
        enabledModes={["carousel", "card", "list"]}
        imageVariant="photo"
        carouselSlideWidth="min(720px, 86vw)"
        onItemClick={openPerson}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (reference) => `${reference.position} at ${reference.company}`,
          description: (reference) => `“${reference.testimonial}”`,
          image: "photo",
          date: "date",
        }}
        renderCarouselContent={(reference) => (
          <QuoteCard
            quote={reference.testimonial}
            name={reference.title}
            role={`${reference.position} at ${reference.company}`}
            date={reference.date}
            photo={reference.photo}
            actions={<ContactButtons reference={reference} />}
          />
        )}
        ariaLabel="References"
      />

      <Reveal className="mt-14 flex flex-col items-center gap-4 text-center">
        <p className="type-lede">Want to add your reference or testimonial?</p>
        <Button variant="secondary" magnetic asChild>
          <a href={`mailto:${OWNER.email}?subject=Reference%20Request`}>
            <Mail aria-hidden="true" />
            Contact for a reference
          </a>
        </Button>
      </Reveal>

      <PeopleDetailDialog person={selectedPerson} isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} />
    </Section>
  );
};

export default ReferencesSection;
```

- [ ] **Step 9: Rewrite `src/components/people/PeopleSection.tsx`** (not on the page today; migrated so it keeps compiling)

```tsx
import { useEffect, useState } from "react";
import { peopleRepo } from "@/repositories/PeopleRepo";
import type { Person } from "@/models/People";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import PeopleDetailDialog from "./PeopleDetailDialog";

interface PersonWithIcon extends Person {
  icon: string;
}

const PeopleSection = () => {
  const [people, setPeople] = useState<PersonWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await peopleRepo.getList();
        setPeople(list.map((person) => ({ ...person, icon: person.photoUrl ?? "" })));
      } catch (error) {
        console.error("Failed to load people:", error);
        setPeople([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="people">
      <SectionHeader
        index="—"
        label="people"
        title={
          <>
            Team <em>members.</em>
          </>
        }
        lede="Talented professionals I've had the privilege to work with throughout my career."
      />
      <ListViewer<PersonWithIcon>
        data={people}
        isLoading={isLoading}
        loadingMessage="Loading people…"
        emptyMessage="No people found."
        defaultViewMode="card"
        enabledModes={["card", "list"]}
        enableShowMore
        visibleMajorItemCount={12}
        enableSearch
        searchFields={["title", "code", "company"]}
        searchPlaceholder="Search people, companies…"
        imageVariant="photo"
        gridCols={{ sm: 2, md: 3, lg: 4 }}
        onItemClick={setSelectedPerson}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (person) => String(person.company ?? ""),
          description: (person) => person.contacts?.find((contact) => contact.code === "email")?.value || "Team member",
          image: "icon",
        }}
        ariaLabel="People"
      />
      <PeopleDetailDialog person={selectedPerson} isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} />
    </Section>
  );
};

export default PeopleSection;
```

- [ ] **Step 10: Remove the dropped prop from `src/components/domains/DomainDetailDialog.tsx`**

Delete both lines that read exactly `                      imageRounded={false}` (one in the experiences `ListViewer`, one in the projects `ListViewer`). Confirm with `git grep -n "imageRounded" -- src` (no output).

- [ ] **Step 11: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. If typecheck reports a removed ListViewer prop anywhere else, delete that prop at the call site (the removed props are listed under **Interfaces**).

- [ ] **Step 12: Visual check**

With the dev server running, run the screenshot tool. Expected:
- Skills: header `04 / skills`; chip row with counts (selected chip filled `surface-2`), search field + 3-icon segmented control on one line; 8 columns of tiles with plain logos and labels, major skills with a brighter label and a small cyan square dot; "Show all (217)" button.
- Projects: three stat tiles that count up; chips; card grid 3 columns with logo tile, cyan mono category tag, title, mono "Company · years" meta, 3-line summary and quiet skill tags.
- Clients: four stat tiles (customers, industries, countries, years); 6-column tiles of logos on light wells.
- References: a wide quote carousel with large text, cyan highlights, square portrait and contact buttons; side quotes dimmed; bars under it. In a real browser: swiping or dragging the carousel moves it; clicking a dimmed slide centres it; clicking the centred slide opens the person dialog.
- `desktop_dialog_project.png` still opens the project dialog (old styling until Task 15).

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(lists): rebuild ListViewer with flat swipe carousel and migrate list sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
