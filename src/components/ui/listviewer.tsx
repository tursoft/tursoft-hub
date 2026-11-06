import { useState, useRef, useEffect, useId, ReactNode, useMemo, useCallback, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GalleryHorizontal, Grid3x3, LayoutGrid, List, ListFilter, Orbit, PanelLeft, Search } from "lucide-react";
import { ItemCloud } from "@/components/ui/item-cloud";
import { cn } from "@/lib/utils";
import { isPrerender } from "@/lib/prerender";

/** Data-driven descriptions may contain target=_blank links; make sure they carry rel=noopener. */
const withSafeLinks = (html: string) =>
  html.replace(/<a\s(?![^>]*\brel=)([^>]*target=['"]_blank['"][^>]*)>/gi, '<a rel="noopener noreferrer" $1>');

export type ViewMode = 'small-card' | 'card' | 'list' | 'carousel' | 'cloud' | 'split';

const iconProps = { className: 'h-4 w-4', strokeWidth: 1.5, 'aria-hidden': true } as const;

const VIEW_MODE_ICONS: Record<ViewMode, ReactNode> = {
  'small-card': <Grid3x3 {...iconProps} />,
  card: <LayoutGrid {...iconProps} />,
  list: <List {...iconProps} />,
  carousel: <GalleryHorizontal {...iconProps} />,
  cloud: <Orbit {...iconProps} />,
  split: <PanelLeft {...iconProps} />,
};

// Full names, shown as the hover title of each segment
const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  'small-card': 'Compact grid',
  card: 'Cards',
  list: 'List',
  carousel: 'Carousel',
  cloud: '3D cloud',
  split: 'List and detail',
};

// Visible segment labels; they are also each button's accessible name
const VIEW_MODE_SHORT: Record<ViewMode, string> = {
  'small-card': 'Compact',
  card: 'Cards',
  list: 'List',
  carousel: 'Carousel',
  cloud: 'Cloud',
  split: 'Split',
};

const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// md and up: the split view is two columns, its list part of the page rather than a scrolling row
const isSplitColumns = () => typeof matchMedia === 'function' && matchMedia('(min-width: 768px)').matches;

export interface FieldMapping<T = Record<string, unknown>> {
  // Core fields
  code: string | ((item: T) => string);
  title: string | ((item: T) => string);
  subtitle?: string | ((item: T) => string);
  description: string | ((item: T) => string);
  image?: string | ((item: T) => string);
  badge?: string | ((item: T) => string);
  date?: string | ((item: T) => string);
  
  // Optional metadata
  metadata?: Array<{
    label: string;
    value: string | ((item: T) => string);
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  
  // Actions/buttons
  actions?: Array<{
    label: string | ((item: T) => string);
    icon?: React.ComponentType<{ className?: string }>;
    onClick: (item: T, event: React.MouseEvent) => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
}

export interface ListViewerProps<T = Record<string, unknown>> {
  // Data
  data: T[];
  
  // Field mappings
  fieldMapping: FieldMapping<T>;
  
  // View configuration
  defaultViewMode?: ViewMode;
  enabledModes?: ViewMode[];
  
  // Section header
  title?: string;
  subtitle?: string;
  badge?: string;
  summary?: ReactNode;
  
  // Filtering
  enableCategoryFilter?: boolean;
  categoryField?: string | ((item: T) => string); // Field name or function to extract category
  categoryLabels?: Record<string, string>; // Optional custom labels for categories
  categoryOrder?: string[];
  categoryFilterLayout?: 'top' | 'side'; // 'side' renders the category buttons in a vertical column on the left // Optional custom order for categories
  enableSearch?: boolean;
  searchFields?: string[] | ((item: T) => string[]); // Fields to search in
  searchPlaceholder?: string;
  
  // Rendering customization
  renderCardContent?: (item: T) => ReactNode;
  renderListContent?: (item: T) => ReactNode;
  renderCarouselContent?: (item: T) => ReactNode;
  renderSmallCardContent?: (item: T) => ReactNode;
  renderSplitItem?: (item: T) => ReactNode; // Entry in the split view's left-hand list
  renderSplitDetail?: (item: T) => ReactNode; // Selected item in the split view's right pane (falls back to renderCardContent)

  // Split (list + detail) view
  splitHeight?: string; // Minimum height of the sticky detail pane on md+ (capped to fit the viewport)

  // Carousel settings
  carouselHeight?: string;
  carouselCardWidth?: string;
  carouselCardHeight?: string;
  carouselCardClassName?: string; // Replaces the default card surface classes in carousel view
  carouselAutoplayMs?: number; // Advances the carousel while on screen and not hovered; 0 disables
  carouselLabel?: string; // Accessible name of the carousel region and of the split view's list
  
  // Grid settings
  gridCols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  
  // Image styling
  imageRounded?: boolean; // If true, images will use rounded-full (circular)
  smallCardImageClassName?: string; // Size classes for the image in small-card view (default fills the cell)
  smallCardGridClassName?: string; // Grid classes for the small-card view

  // Cloud (3D sphere) view
  cloudWeight?: (item: T) => number; // Relative weight used to size items in cloud view
  cloudHeight?: number; // Pixel height of the cloud container
  cloudHoverContent?: (item: T) => ReactNode; // Rendered beside the cloud for the hovered (or selected) item
  
  // Show More functionality
  enableShowMore?: boolean; // If true, enables show more/less functionality
  visibleMajorItemCount?: number; // Number of items to show initially when enableShowMore is true
  
  // Callbacks
  onItemClick?: (item: T) => void;
  
  // Additional content
  footer?: ReactNode;
  
  // Loading state
  isLoading?: boolean;
  loadingMessage?: string;
  
  // Empty state
  emptyMessage?: string;
  
  // Animation
  enableAnimation?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ListViewer = <T = any>({
  data,
  fieldMapping,
  defaultViewMode = 'carousel',
  enabledModes = ['card', 'list', 'carousel'],
  title,
  subtitle,
  badge,
  summary,
  enableCategoryFilter = false,
  categoryField,
  categoryLabels,
  categoryOrder,
  categoryFilterLayout = 'top',
  enableSearch = false,
  searchFields,
  searchPlaceholder = 'Search',
  renderCardContent,
  renderListContent,
  renderCarouselContent,
  renderSmallCardContent,
  renderSplitItem,
  renderSplitDetail,
  splitHeight = '34rem',
  carouselHeight = '500px',
  carouselCardWidth = '36rem',
  carouselCardHeight = '28rem',
  carouselCardClassName,
  carouselAutoplayMs = 0,
  carouselLabel = 'Items',
  gridCols = { sm: 1, md: 2, lg: 3, xl: 4 },
  imageRounded = false,
  smallCardImageClassName = 'w-full h-full',
  smallCardGridClassName = 'grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-4',
  cloudWeight,
  cloudHeight = 560,
  cloudHoverContent,
  enableShowMore = false,
  visibleMajorItemCount,
  onItemClick,
  footer,
  isLoading = false,
  loadingMessage = 'Loading...',
  emptyMessage = 'No items to display',
  enableAnimation = true,
}: ListViewerProps<T>) => {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cloudHovered, setCloudHovered] = useState<string | null>(null);
  const [cloudSelected, setCloudSelected] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselInView, setCarouselInView] = useState(false);
  const swipeRef = useRef<{ x: number; y: number; swiped: boolean } | null>(null);
  const splitListRef = useRef<HTMLDivElement>(null);
  const splitRevealRef = useRef(false);
  const splitId = useId();

  // Helper to get field value
  const getFieldValue = useCallback((item: T, field: string | ((item: T) => string) | undefined): string => {
    if (!field) return '';
    return typeof field === 'function' ? field(item) : String(item[field as keyof T] || '');
  }, []);

  // Extract categories from data
  const categories = useMemo(() => {
    if (!enableCategoryFilter || !categoryField) return [];
    const categorySet = new Set<string>();
    data.forEach(item => {
      const category = getFieldValue(item, categoryField);
      if (category) categorySet.add(category);
    });
    
    const uniqueCategories = Array.from(categorySet);
    
    // Sort categories based on custom order if provided
    if (categoryOrder && categoryOrder.length > 0) {
      uniqueCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        
        // If both are in the order list, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only a is in the order list, it comes first
        if (indexA !== -1) return -1;
        // If only b is in the order list, it comes first
        if (indexB !== -1) return 1;
        // If neither is in the order list, sort alphabetically
        return a.localeCompare(b);
      });
    } else {
      // Default alphabetical sorting
      uniqueCategories.sort();
    }
    
    return ['All', ...uniqueCategories];
  }, [data, enableCategoryFilter, categoryField, categoryOrder, getFieldValue]);

  // Get category count
  const getCategoryCount = useCallback((category: string) => {
    if (category === 'All') return data.length;
    return data.filter(item => {
      const itemCategory = getFieldValue(item, categoryField);
      return itemCategory === category;
    }).length;
  }, [data, categoryField, getFieldValue]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply category filter
    if (enableCategoryFilter && categoryField && selectedCategory !== 'All') {
      result = result.filter(item => {
        const itemCategory = getFieldValue(item, categoryField);
        return itemCategory === selectedCategory;
      });
    }

    // Apply search filter
    if (enableSearch && searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(item => {
        // Get search fields
        const fieldsToSearch = typeof searchFields === 'function' 
          ? searchFields(item)
          : searchFields || [fieldMapping.title, fieldMapping.subtitle].filter(Boolean) as string[];
        
        // Check if any field matches search text
        return fieldsToSearch.some(field => {
          const value = getFieldValue(item, field);
          return value.toLowerCase().includes(searchLower);
        });
      });
    }

    return result;
  }, [data, enableCategoryFilter, categoryField, selectedCategory, enableSearch, searchText, searchFields, fieldMapping, getFieldValue]);

  // Every item stays in the page so crawlers and search engines can read it. Items past
  // the limit are collapsed with a CSS class until "Show All" is pressed; slicing the
  // list instead would drop them from the HTML and from what Google indexes.
  const collapseLimit = enableShowMore && !showAll && visibleMajorItemCount ? visibleMajorItemCount : Infinity;
  // A collapsed item carries only the text that matters to crawlers (title, subtitle and
  // description) instead of the full card, which keeps the page's DOM small; the full card
  // renders once the visitor expands the list.
  const renderCollapsed = (item: T) => {
    const code = getFieldValue(item, fieldMapping.code);
    const title = getFieldValue(item, fieldMapping.title);
    const subtitle = getFieldValue(item, fieldMapping.subtitle);
    const description = getFieldValue(item, fieldMapping.description);
    return (
      <div key={code} className="lv-collapsed">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
        {description && <p dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }} />}
      </div>
    );
  };
  const withCollapse = (item: T, index: number, render: (item: T, index: number) => ReactElement) =>
    index >= collapseLimit ? renderCollapsed(item) : render(item, index);
  const hasMore = enableShowMore && visibleMajorItemCount && filteredData.length > visibleMajorItemCount;

  // Carousel navigation (over the filtered list, so category filters apply here too)
  const slideCount = filteredData.length;
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (slideCount === 0 ? 0 : (prev + 1) % slideCount));
  }, [slideCount]);
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (slideCount === 0 ? 0 : (prev - 1 + slideCount) % slideCount));
  }, [slideCount]);
  const goToSlide = (index: number) => setCurrentIndex(index);

  // Keep the active slide valid when a filter shrinks the list
  useEffect(() => {
    if (slideCount > 0 && currentIndex >= slideCount) setCurrentIndex(0);
  }, [currentIndex, slideCount]);

  // Measure the stage so the card width and slide spacing fit the viewport. The width starts
  // at 0 (default geometry) so the prerendered HTML and the hydrating client render the same.
  const isCarousel = viewMode === 'carousel';
  useEffect(() => {
    const stage = containerRef.current;
    if (!isCarousel || !stage || typeof ResizeObserver === 'undefined') return;
    const measure = () => setStageWidth(stage.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isCarousel]);

  // Autoplay runs only while the stage is on screen, not hovered or focused, the tab is
  // visible and the visitor has not asked for reduced motion. Never during prerender.
  useEffect(() => {
    const stage = containerRef.current;
    if (!isCarousel || !carouselAutoplayMs || isPrerender || slideCount < 2 || !stage) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setCarouselInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isCarousel, carouselAutoplayMs, slideCount]);

  useEffect(() => {
    if (!isCarousel || !carouselAutoplayMs || isPrerender || slideCount < 2) return;
    if (!carouselInView || carouselPaused) return;
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') nextSlide();
    }, carouselAutoplayMs);
    return () => window.clearInterval(id);
    // currentIndex is a dependency on purpose: a manual change restarts the countdown
  }, [isCarousel, carouselAutoplayMs, slideCount, carouselInView, carouselPaused, nextSlide, currentIndex]);

  // Split view: the selection is currentIndex, shared with the carousel, so switching views keeps it.
  const isSplit = viewMode === 'split';

  // Bring the selected entry into view. Next/back and the arrow keys ask for that explicitly
  // (splitRevealRef); on md+ the list is part of the page, so the page scrolls while the sticky
  // detail stays put. Otherwise (first render, view switch) only the phone's row scrolls.
  useEffect(() => {
    const list = splitListRef.current;
    const entry = list?.children[currentIndex] as HTMLElement | undefined;
    if (!isSplit || !list || !entry) return;
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (splitRevealRef.current) {
      splitRevealRef.current = false;
      entry.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior });
      return;
    }
    const listBox = list.getBoundingClientRect();
    const entryBox = entry.getBoundingClientRect();
    const top = entryBox.top < listBox.top ? entryBox.top - listBox.top : Math.max(0, entryBox.bottom - listBox.bottom);
    const left = entryBox.left < listBox.left ? entryBox.left - listBox.left : Math.max(0, entryBox.right - listBox.right);
    if (top || left) list.scrollBy({ top, left, behavior });
  }, [isSplit, currentIndex]);

  // Next/back under the detail pane; on phones the buttons sit below the list, so the page stays put
  const stepSplit = (delta: 1 | -1) => {
    splitRevealRef.current = isSplitColumns();
    if (delta > 0) nextSlide();
    else prevSlide();
  };

  const toPx = (value: string) => {
    const match = /^([\d.]+)\s*(px|rem|em)?$/.exec(value.trim());
    if (!match) return 576;
    const n = parseFloat(match[1]);
    return match[2] === 'rem' || match[2] === 'em' ? n * 16 : n;
  };
  const baseCardWidth = toPx(carouselCardWidth);
  const cardWidth = stageWidth > 0 ? Math.min(baseCardWidth, stageWidth - 32) : baseCardWidth;
  const slideSpacing = cardWidth + 16;

  // Carousel transform: the active card centred, its neighbours fanned back in 3D
  const getCardTransform = (index: number): React.CSSProperties => {
    let offset = index - currentIndex;
    // Wrap around so the first slide shows the last one on its left, and vice versa
    if (offset > slideCount / 2) offset -= slideCount;
    else if (offset < -slideCount / 2) offset += slideCount;
    const distance = Math.abs(offset);
    if (distance > 2) return { transform: 'scale(0)', opacity: 0, display: 'none' };
    const direction = offset > 0 ? -1 : 1;
    const scale = distance === 0 ? 1 : distance === 1 ? 0.86 : 0.72;
    const rotateY = distance === 0 ? 0 : direction * (distance === 1 ? 14 : 22);
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : 0.25;
    return {
      transform: `translateX(${offset * slideSpacing}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex: 10 - distance,
    };
  };

  // Swipe on the stage (touch or mouse); a completed swipe swallows the click that follows it
  const onStagePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    swipeRef.current = { x: e.clientX, y: e.clientY, swiped: false };
  };
  const onStagePointerUp = (e: React.PointerEvent) => {
    const start = swipeRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      start.swiped = true;
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  };
  const onStageClickCapture = (e: React.MouseEvent) => {
    if (swipeRef.current?.swiped) {
      e.stopPropagation();
      e.preventDefault();
    }
    swipeRef.current = null;
  };
  const onStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    }
  };

  // Split view list is a tablist with roving focus; both arrow axes work since it is a row on phones
  const onSplitKeyDown = (e: React.KeyboardEvent) => {
    let target: number | null = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') target = (currentIndex + 1) % slideCount;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') target = (currentIndex - 1 + slideCount) % slideCount;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = slideCount - 1;
    if (target === null || slideCount === 0) return;
    e.preventDefault();
    splitRevealRef.current = true;
    setCurrentIndex(target);
    (splitListRef.current?.children[target] as HTMLElement | undefined)?.focus({ preventScroll: true });
  };

  // Grid column classes
  const getGridClasses = () => {
    const classes = ['grid', 'gap-6'];
    if (gridCols.sm) classes.push(`grid-cols-${gridCols.sm}`);
    if (gridCols.md) classes.push(`md:grid-cols-${gridCols.md}`);
    if (gridCols.lg) classes.push(`lg:grid-cols-${gridCols.lg}`);
    if (gridCols.xl) classes.push(`xl:grid-cols-${gridCols.xl}`);
    return classes.join(' ');
  };

  // A whole card is one click target: a hairline sheet whose hover is a soft shadow, never a lift
  const cardSurface = 'cursor-pointer transition-[box-shadow,background-color] duration-150 ease-dossier hover:shadow-[var(--shadow-card-hover)]';
  // List rows: hairlines between them (from the list), a raised-paper step on hover
  const rowSurface = 'cursor-pointer transition-colors duration-150 ease-dossier hover:bg-secondary/60';

  // Item images: people photos print on the paper (round), logos and icons sit as they are
  const imageClass = (size: string) =>
    cn(size, 'flex-shrink-0', imageRounded ? 'rounded-full object-cover print-photo' : 'rounded-md object-contain');

  const renderActions = (item: T, code: string, max?: number) => {
    if (!fieldMapping.actions || fieldMapping.actions.length === 0) return null;
    const actions = max ? fieldMapping.actions.slice(0, max) : fieldMapping.actions;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action, idx) => {
          const ActionIcon = action.icon;
          const label = typeof action.label === 'function' ? action.label(item) : action.label;
          return (
            <Button
              key={`${code}-action-${idx}`}
              variant={action.variant || "outline"}
              size="sm"
              className="h-8 px-3 text-[13px]"
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(item, e);
              }}
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {label}
            </Button>
          );
        })}
      </div>
    );
  };

  // Render card view
  const renderCard = (item: T, index: number) => {
    const code = getFieldValue(item, fieldMapping.code);
    const title = getFieldValue(item, fieldMapping.title);
    const subtitle = getFieldValue(item, fieldMapping.subtitle);
    const description = getFieldValue(item, fieldMapping.description);
    const image = getFieldValue(item, fieldMapping.image);
    const badgeText = getFieldValue(item, fieldMapping.badge);
    const date = getFieldValue(item, fieldMapping.date);

    if (renderCardContent) {
      return (
        <Card
          key={code}
          className={cardSurface}
          style={enableAnimation ? { animationDelay: `${index * 100}ms` } : undefined}
          onClick={() => onItemClick?.(item)}
        >
          {renderCardContent(item)}
        </Card>
      );
    }

    return (
      <Card
        key={code}
        className={cn(cardSurface, 'flex flex-col p-5')}
        style={enableAnimation ? { animationDelay: `${index * 100}ms` } : undefined}
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex items-start gap-4">
          {image && (
            <img loading="lazy" decoding="async"
              src={image}
              alt={title}
              className={imageClass('h-12 w-12')}
            />
          )}
          <div className="min-w-0 flex-1">
            {badgeText && (
              <Badge variant="secondary" className="mb-2">{badgeText}</Badge>
            )}
            <h3 className="text-base font-medium leading-snug text-foreground">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
            {date && (
              <p className="mt-0.5 whitespace-pre-line text-[13px] tabular-nums text-faint">{date}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-1 flex-col">
          {description && (
            <p
              className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4"
              dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
            />
          )}
          {renderActions(item, code)}
        </div>
      </Card>
    );
  };

  // Render list view
  const renderListItem = (item: T, index: number) => {
    const code = getFieldValue(item, fieldMapping.code);
    const title = getFieldValue(item, fieldMapping.title);
    const subtitle = getFieldValue(item, fieldMapping.subtitle);
    const description = getFieldValue(item, fieldMapping.description);
    const image = getFieldValue(item, fieldMapping.image);
    const badgeText = getFieldValue(item, fieldMapping.badge);
    const date = getFieldValue(item, fieldMapping.date);

    if (renderListContent) {
      return (
        <div
          key={code}
          className={rowSurface}
          style={enableAnimation ? { animationDelay: `${index * 50}ms` } : undefined}
          onClick={() => onItemClick?.(item)}
        >
          {renderListContent(item)}
        </div>
      );
    }

    return (
      <div
        key={code}
        className={cn(rowSurface, 'flex items-start gap-4 px-4 py-4 sm:gap-5')}
        style={enableAnimation ? { animationDelay: `${index * 50}ms` } : undefined}
        onClick={() => onItemClick?.(item)}
      >
        {image && (
          <img loading="lazy" decoding="async"
            src={image}
            alt={title}
            className={imageClass('h-12 w-12')}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="min-w-0">
              {badgeText && (
                <Badge variant="secondary" className="mb-1.5">{badgeText}</Badge>
              )}
              <h3 className="text-base font-medium leading-snug text-foreground">{title}</h3>
              {subtitle && (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {date && (
              <p className="whitespace-pre-line text-[13px] leading-5 tabular-nums text-faint md:flex-shrink-0 md:text-right">
                {date}
              </p>
            )}
          </div>
          {description && (
            <div
              className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
            />
          )}
          {renderActions(item, code)}
        </div>
      </div>
    );
  };

  // Render small card item
  const renderSmallCard = (item: T, index: number) => {
    const code = getFieldValue(item, fieldMapping.code);
    const title = getFieldValue(item, fieldMapping.title);
    const image = getFieldValue(item, fieldMapping.image);

    if (renderSmallCardContent) {
      return (
        <div
          key={code}
          className="cursor-pointer"
          style={enableAnimation ? { animationDelay: `${index * 30}ms` } : undefined}
          onClick={() => onItemClick?.(item)}
        >
          {renderSmallCardContent(item)}
        </div>
      );
    }

    return (
      <div
        key={code}
        className="group cursor-pointer"
        style={enableAnimation ? { animationDelay: `${index * 30}ms` } : undefined}
        onClick={() => onItemClick?.(item)}
      >
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-3 transition-shadow duration-150 ease-dossier group-hover:shadow-[var(--shadow-card-hover)]">
          <div className="mb-2 flex aspect-square w-full items-center justify-center">
            {image ? (
              <img loading="lazy" decoding="async"
                src={image}
                alt={title}
                className={`${smallCardImageClassName} object-contain`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="line-clamp-2 px-1 text-center text-xs font-medium text-muted-foreground">
                {title}
              </div>
            )}
          </div>
          <div className="line-clamp-2 w-full text-center text-xs font-medium leading-4 text-foreground">
            {title}
          </div>
        </div>
      </div>
    );
  };

  // Render carousel item
  const renderCarouselItem = (item: T, index: number) => {
    const code = getFieldValue(item, fieldMapping.code);
    const title = getFieldValue(item, fieldMapping.title);
    const subtitle = getFieldValue(item, fieldMapping.subtitle);
    const description = getFieldValue(item, fieldMapping.description);
    const image = getFieldValue(item, fieldMapping.image);
    const badgeText = getFieldValue(item, fieldMapping.badge);
    const date = getFieldValue(item, fieldMapping.date);
    const cardStyle = getCardTransform(index);
    const cardClass = cn(
      'absolute flex cursor-pointer flex-col transition-[transform,opacity,box-shadow] duration-500 ease-dossier',
      carouselCardClassName ?? 'border-border bg-card',
      index === currentIndex && 'is-active',
    );
    const onCardClick = () => {
      if (index === currentIndex) {
        onItemClick?.(item);
      } else {
        goToSlide(index);
      }
    };

    if (renderCarouselContent) {
      return (
        <Card
          key={code}
          className={cardClass}
          style={{ ...cardStyle, width: `min(${baseCardWidth}px, calc(100% - 2rem))`, height: carouselCardHeight }}
          aria-hidden={index !== currentIndex || undefined}
          onClick={onCardClick}
        >
          {renderCarouselContent(item)}
        </Card>
      );
    }

    return (
      <Card
        key={code}
        className={cn(cardClass, 'p-6 sm:p-8')}
        style={{ ...cardStyle, width: `min(${baseCardWidth}px, calc(100% - 2rem))`, height: carouselCardHeight }}
        aria-hidden={index !== currentIndex || undefined}
        onClick={onCardClick}
      >
        <div className="flex items-start gap-4">
          {image && (
            <img loading="lazy" decoding="async"
              src={image}
              alt={title}
              className={imageClass('h-14 w-14')}
            />
          )}
          <div className="min-w-0 flex-1">
            {badgeText && (
              <Badge variant="secondary" className="mb-2">{badgeText}</Badge>
            )}
            <h3 className="text-lg font-medium leading-snug text-foreground">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
            {date && (
              <p className="mt-0.5 whitespace-pre-line text-[13px] tabular-nums text-faint">{date}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-border pt-5">
          {description && (
            <div
              className="text-[15px] leading-relaxed text-muted-foreground line-clamp-6"
              dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
            />
          )}
          <div className="mt-auto">{renderActions(item, code, 3)}</div>
        </div>
      </Card>
    );
  };

  // Standalone use (with its own title) renders a full section; inside a section or a
  // dialog that already has its own header and column, the viewer is plain content.
  const hasHeader = !!(title || subtitle || badge);
  const frame = (content: ReactNode) =>
    hasHeader ? (
      <section className="py-16 lg:py-24">
        <div className="container">{content}</div>
      </section>
    ) : (
      <div className="lv-root">{content}</div>
    );

  if (isLoading) {
    return frame(
      <p className="py-16 text-center text-sm text-muted-foreground">{loadingMessage}</p>
    );
  }

  const sideLayout = categoryFilterLayout === 'side';
  const hasCategories = enableCategoryFilter && !!categoryField && categories.length > 0;
  const categoryFilter = hasCategories ? (
    <div
      role="group"
      aria-label="Categories"
      className={sideLayout ? 'flex flex-col border-l border-border' : 'flex flex-wrap gap-2'}
    >
      {categories.map((category) => {
        const active = selectedCategory === category;
        const label = categoryLabels?.[category] || category;
        const count = getCategoryCount(category);
        if (sideLayout) {
          return (
            <button
              key={category}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'relative flex h-9 w-full items-center justify-between gap-3 rounded-r-md pl-4 pr-3 text-left text-sm transition-colors duration-150 ease-dossier',
                'before:absolute before:inset-y-0 before:-left-px before:w-0.5 before:bg-foreground before:transition-opacity before:duration-150',
                active
                  ? 'bg-secondary font-medium text-foreground before:opacity-100'
                  : 'text-muted-foreground before:opacity-0 hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <span className="truncate">{label}</span>
              <span className="text-xs tabular-nums text-faint">{count}</span>
            </button>
          );
        }
        return (
          <button
            key={category}
            type="button"
            aria-pressed={active}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors duration-150 ease-dossier',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <span>{label}</span>
            <span className={cn('tabular-nums', active ? 'text-background/70' : 'text-faint')}>{count}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  if (data.length === 0) {
    return frame(
      emptyMessage ? <p className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</p> : null
    );
  }

  // View-mode switch: a segmented control on a raised track. Segments share one width,
  // so the active surface slides by its index alone and renders the same on the server.
  const activeModeIndex = enabledModes.indexOf(viewMode);
  const viewSwitch = enabledModes.length > 1 ? (
    <div
      role="group"
      aria-label="View mode"
      className="lv-seg"
      style={{ '--seg-count': enabledModes.length, '--seg-index': Math.max(0, activeModeIndex) } as React.CSSProperties}
    >
      <span aria-hidden="true" className="lv-seg-thumb" hidden={activeModeIndex < 0} />
      {enabledModes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setViewMode(mode)}
          title={VIEW_MODE_LABELS[mode]}
          aria-pressed={viewMode === mode}
          className="lv-seg-btn"
        >
          {VIEW_MODE_ICONS[mode]}
          <span>{VIEW_MODE_SHORT[mode]}</span>
        </button>
      ))}
    </div>
  ) : null;

  // "Show all": a quiet control on a hairline that runs across the column
  const showMore = hasMore ? (
    <div className="mt-8 flex items-center gap-4">
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAll(!showAll)}
        aria-expanded={showAll}
      >
        {showAll ? 'Show less' : <>Show all <span className="tabular-nums text-faint">{filteredData.length}</span></>}
        {showAll ? <ChevronUp className="text-faint" strokeWidth={1.5} /> : <ChevronDown className="text-faint" strokeWidth={1.5} />}
      </Button>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
  ) : null;

  return frame(
    <>
        {/* Section Header (standalone use): set like the dossier's SectionHeader */}
        {hasHeader && (
          <header className="section-head lv-head">
            <div className="min-w-0">
              {badge && <p className="kicker">{badge}</p>}
              {title && (
                <h2
                  className="section-title"
                  dangerouslySetInnerHTML={{ __html: title }}
                />
              )}
              {subtitle && (
                <p className="section-desc">
                  {subtitle}
                </p>
              )}
            </div>
          </header>
        )}

        {/* Summary Section */}
        {summary && (
          <div className="mb-8">
            {summary}
          </div>
        )}

        {/* Body: optional category sidebar + content column */}
        <div className={sideLayout && hasCategories ? 'flex flex-col md:flex-row gap-8 lg:gap-12' : undefined}>
        {sideLayout && hasCategories && (
          <aside className={`md:w-52 lg:w-60 flex-shrink-0 md:sticky md:top-24 self-start ${showFilters ? 'block' : 'hidden'} md:block`}>
            {categoryFilter}
          </aside>
        )}
        <div className={sideLayout && hasCategories ? 'flex-1 min-w-0' : undefined}>

        {/* Filters */}
        {(enableCategoryFilter || enableSearch) && (
          <div className="mb-8">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
              >
                <ListFilter className="text-faint" strokeWidth={1.5} />
                {showFilters ? 'Hide filters' : 'Show filters'}
              </Button>
            </div>

            {/* Filter Controls */}
            <div className={`space-y-4 ${showFilters ? 'block' : 'hidden'} md:block`}>
              {/* Category Filter (top layout) */}
              {!sideLayout && categoryFilter}

              {/* Search Input with View Mode Toggle */}
              {enableSearch && (
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" strokeWidth={1.5} aria-hidden="true" />
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      aria-label="Search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* View Mode Toggle inline with search */}
                  {viewSwitch}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode Toggle - Standalone (when search is not enabled) */}
        {!enableSearch && viewSwitch && (
          <div className="mb-8 flex sm:justify-end">
            {viewSwitch}
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <>
            <div className={getGridClasses()}>
              {filteredData.map((item, index) => withCollapse(item, index, renderCard))}
            </div>
            {showMore}
          </>
        )}

        {/* List View: rows divided by hairlines */}
        {viewMode === 'list' && (
          <>
            <div className="divide-y divide-border border-y border-border">
              {filteredData.map((item, index) => withCollapse(item, index, renderListItem))}
            </div>
            {showMore}
          </>
        )}

        {/* Small Cards View */}
        {viewMode === 'small-card' && (
          <>
            <div className={smallCardGridClassName}>
              {filteredData.map((item, index) => withCollapse(item, index, renderSmallCard))}
            </div>
            {showMore}
          </>
        )}

        {/* Cloud View */}
        {viewMode === 'cloud' && (() => {
          const findByCode = (code: string | null) =>
            code ? filteredData.find((d) => getFieldValue(d, fieldMapping.code) === code) : undefined;
          const focusItem = findByCode(cloudHovered) ?? findByCode(cloudSelected);
          return (
            <div className="flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="flex-1 min-w-0">
                <ItemCloud
                  items={filteredData.map((item) => ({
                    code: getFieldValue(item, fieldMapping.code),
                    title: getFieldValue(item, fieldMapping.title),
                    image: getFieldValue(item, fieldMapping.image) || undefined,
                    weight: cloudWeight ? cloudWeight(item) : 1,
                  }))}
                  height={cloudHeight}
                  selectedCode={cloudSelected}
                  onHoverChange={setCloudHovered}
                  onItemClick={(code) => {
                    setCloudSelected(code);
                    const item = findByCode(code);
                    if (item) onItemClick?.(item);
                  }}
                />
              </div>
              {cloudHoverContent && (
                <aside className="lg:w-72 flex-shrink-0">
                  {focusItem ? (
                    cloudHoverContent(focusItem)
                  ) : (
                    <div className="flex h-full min-h-[8rem] items-center justify-center rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                      Hover or click an icon to see its details. Drag to turn the sphere.
                    </div>
                  )}
                </aside>
              )}
            </div>
          );
        })()}

        {/* Split View: list on the left, selected item on the right */}
        {viewMode === 'split' && slideCount > 0 && (() => {
          const selected = filteredData[Math.min(currentIndex, slideCount - 1)];
          const selectedCode = getFieldValue(selected, fieldMapping.code);
          const tabId = (code: string) => `${splitId}-tab-${code}`;
          const panelId = `${splitId}-panel`;
          const renderDefaultDetail = (item: T) => {
            const title = getFieldValue(item, fieldMapping.title);
            const subtitle = getFieldValue(item, fieldMapping.subtitle);
            const image = getFieldValue(item, fieldMapping.image);
            const date = getFieldValue(item, fieldMapping.date);
            return (
              <div className="flex h-full flex-col justify-center gap-6">
                <div className="flex items-center gap-5">
                  {image && (
                    <img loading="lazy" decoding="async" src={image} alt="" className={imageClass('h-20 w-20')} />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-medium leading-snug text-foreground">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
                    {date && <p className="mt-0.5 text-[13px] tabular-nums text-faint">{date}</p>}
                  </div>
                </div>
                <div
                  className="max-w-3xl text-base leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: withSafeLinks(getFieldValue(item, fieldMapping.description)) }}
                />
              </div>
            );
          };
          return (
            <div
              className="flex flex-col md:flex-row md:items-stretch"
              style={{ '--split-height': splitHeight } as React.CSSProperties}
            >
              <div
                ref={splitListRef}
                role="tablist"
                aria-orientation="vertical"
                aria-label={carouselLabel}
                onKeyDown={onSplitKeyDown}
                className="split-list flex gap-1 overflow-x-auto pb-2 md:w-72 md:flex-shrink-0 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0 lg:w-80"
              >
                {filteredData.map((item, index) => {
                  const code = getFieldValue(item, fieldMapping.code);
                  const title = getFieldValue(item, fieldMapping.title);
                  const subtitle = getFieldValue(item, fieldMapping.subtitle);
                  const image = getFieldValue(item, fieldMapping.image);
                  const active = code === selectedCode;
                  return (
                    <button
                      key={code}
                      type="button"
                      role="tab"
                      id={tabId(code)}
                      aria-selected={active}
                      aria-controls={panelId}
                      tabIndex={active ? 0 : -1}
                      onClick={() => setCurrentIndex(index)}
                      className={cn('split-item w-60 md:w-full', active && 'is-active')}
                    >
                      {renderSplitItem ? renderSplitItem(item) : (
                        <>
                          {image && (
                            <img loading="lazy" decoding="async" src={image} alt="" className={imageClass('h-10 w-10')} />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{title}</span>
                            {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                aria-hidden="true"
                className="split-divider my-6 h-px md:my-0 md:ml-4 md:mr-8 md:h-auto md:w-px lg:ml-6 lg:mr-12"
              />

              <div role="tabpanel" id={panelId} aria-labelledby={tabId(selectedCode)} className="split-detail flex min-w-0 flex-1 flex-col">
                <div key={selectedCode} className="split-detail-enter flex flex-1 flex-col cursor-pointer" onClick={() => onItemClick?.(selected)}>
                  {renderSplitDetail
                    ? renderSplitDetail(selected)
                    : renderCardContent
                      ? renderCardContent(selected)
                      : renderDefaultDetail(selected)}
                </div>
                {slideCount > 1 && (
                  <div className="split-pager mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
                    <span className="mr-2 text-[13px] tabular-nums text-faint">
                      {currentIndex + 1} / {slideCount}
                    </span>
                    <button type="button" onClick={() => stepSplit(-1)} aria-label="Previous" aria-controls={panelId} className="split-nav">
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button type="button" onClick={() => stepSplit(1)} aria-label="Next" aria-controls={panelId} className="split-nav">
                      <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Carousel View */}
        {viewMode === 'carousel' && (
          <div className="relative max-w-6xl mx-auto">
            {/* Stage */}
            <div
              ref={containerRef}
              role="region"
              aria-roledescription="carousel"
              aria-label={carouselLabel}
              tabIndex={0}
              className="carousel-stage relative flex items-center justify-center overflow-hidden rounded-lg"
              style={{ perspective: '1200px', height: carouselHeight }}
              onPointerDown={onStagePointerDown}
              onPointerUp={onStagePointerUp}
              onPointerCancel={() => {
                swipeRef.current = null;
              }}
              onClickCapture={onStageClickCapture}
              onKeyDown={onStageKeyDown}
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
              onFocus={() => setCarouselPaused(true)}
              onBlur={() => setCarouselPaused(false)}
            >
              {filteredData.map((item, index) => renderCarouselItem(item, index))}
            </div>

            {/* Pager under the stage, so nothing covers the slides: back, the slide bars
                (small ink bars, the active one longer), the count and next. On phones the
                bars take their own line above the buttons. */}
            {slideCount > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:flex-nowrap">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous"
                  className="carousel-nav order-2 sm:order-1"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <div
                  className={cn(
                    'order-1 flex w-full min-w-0 flex-wrap justify-center sm:order-2 sm:w-auto',
                    // Long sets get narrower bars, set like the ticks on a rule
                    slideCount > 24 ? 'carousel-dots-dense gap-0.5' : 'gap-1',
                  )}
                  role="tablist"
                  aria-label="Slides"
                >
                  {filteredData.map((item, index) => {
                    const code = getFieldValue(item, fieldMapping.code);
                    const active = index === currentIndex;
                    return (
                      <button
                        key={`dot-${code}`}
                        type="button"
                        role="tab"
                        onClick={() => goToSlide(index)}
                        aria-label={`Slide ${index + 1}: ${getFieldValue(item, fieldMapping.title)}`}
                        aria-selected={active}
                        className={cn('carousel-dot', active && 'is-active')}
                      />
                    );
                  })}
                </div>
                <span className="order-3 flex-shrink-0 text-[13px] tabular-nums text-faint">
                  {currentIndex + 1} / {slideCount}
                </span>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next"
                  className="carousel-nav order-4"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        )}
        </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-16">
            {footer}
          </div>
        )}
    </>
  );
};

export default ListViewer;
