import { useState, useRef, ReactNode, useMemo, useCallback, type ReactElement } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Grid, List, RotateCcw, Grid3x3, Filter, Search, Orbit } from "lucide-react";
import { ItemCloud } from "@/components/ui/item-cloud";

/** Data-driven descriptions may contain target=_blank links; make sure they carry rel=noopener. */
const withSafeLinks = (html: string) =>
  html.replace(/<a\s(?![^>]*\brel=)([^>]*target=['"]_blank['"][^>]*)>/gi, '<a rel="noopener noreferrer" $1>');

export type ViewMode = 'small-card' | 'card' | 'list' | 'carousel' | 'cloud';

const VIEW_MODE_ICONS: Record<ViewMode, ReactNode> = {
  'small-card': <Grid3x3 className="w-4 h-4" />,
  card: <Grid className="w-4 h-4" />,
  list: <List className="w-4 h-4" />,
  carousel: <RotateCcw className="w-4 h-4" />,
  cloud: <Orbit className="w-4 h-4" />,
};

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  'small-card': 'Compact grid',
  card: 'Cards',
  list: 'List',
  carousel: 'Carousel',
  cloud: '3D cloud',
};

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
  
  // Carousel settings
  carouselHeight?: string;
  carouselCardWidth?: string;
  carouselCardHeight?: string;
  
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
  searchPlaceholder = 'Search...',
  renderCardContent,
  renderListContent,
  renderCarouselContent,
  renderSmallCardContent,
  carouselHeight = '500px',
  carouselCardWidth = '36rem',
  carouselCardHeight = '28rem',
  gridCols = { sm: 1, md: 2, lg: 3, xl: 4 },
  imageRounded = false,
  smallCardImageClassName = 'w-full h-full',
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

  // Carousel navigation
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === data.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Carousel transform calculation
  const getCardTransform = (index: number) => {
    const offset = index - currentIndex;
    const isActive = offset === 0;
    const distance = Math.abs(offset);
    
    if (distance > 2) return { transform: 'scale(0)', opacity: '0', display: 'none' };
    
    const translateX = offset * 590;
    const rotateY = isActive ? 0 : offset > 0 ? -25 : 25;
    const scale = isActive ? 1 : 0.8 - (distance * 0.1);
    const zIndex = isActive ? 10 : 10 - distance;
    const opacity = isActive ? 1 : 0.6 - (distance * 0.2);
    
    return {
      transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity: opacity.toString(),
      zIndex: zIndex.toString(),
    };
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
          className="border-border bg-card hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer"
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
        className="border-border bg-card hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
        style={enableAnimation ? { animationDelay: `${index * 100}ms` } : undefined}
        onClick={() => onItemClick?.(item)}
      >
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center text-center">
            {image && (
              <div className="flex-shrink-0 mb-3">
                <div className={`h-20 w-20 flex items-center justify-center overflow-hidden border-background shadow-lg ${
                  imageRounded ? 'rounded-full border-4' : 'rounded-lg'
                }`}>
                  <img loading="lazy" decoding="async" 
                    src={image} 
                    alt={title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
            <div className="w-full">
              {badgeText && (
                <Badge variant="outline" className="mb-2 text-xs">{badgeText}</Badge>
              )}
              <h3 className="text-lg font-bold mb-1">{title}</h3>
              {subtitle && (
                <p className="text-primary font-semibold text-sm mb-1">{subtitle}</p>
              )}
              {date && (
                <p className="text-muted-foreground text-xs">{date}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col flex-1">
          <div className="flex-1">
            <p 
              className="text-sm leading-relaxed text-muted-foreground text-center line-clamp-4"
              dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
            />
          </div>
          {fieldMapping.actions && fieldMapping.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {fieldMapping.actions.map((action, idx) => {
                const ActionIcon = action.icon;
                const label = typeof action.label === 'function' ? action.label(item) : action.label;
                return (
                  <Button
                    key={`${code}-action-${idx}`}
                    variant={action.variant || "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(item, e);
                    }}
                  >
                    {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                    {label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
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
        <Card 
          key={code}
          className="border-2 border-border/50 hover:border-primary/50 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
          style={enableAnimation ? { animationDelay: `${index * 50}ms` } : undefined}
          onClick={() => onItemClick?.(item)}
        >
          {renderListContent(item)}
        </Card>
      );
    }

    return (
      <Card 
        key={code}
        className="border-2 border-border/50 hover:border-primary/50 bg-card hover:shadow-lg transition-all duration-300 cursor-pointer"
        style={enableAnimation ? { animationDelay: `${index * 50}ms` } : undefined}
        onClick={() => onItemClick?.(item)}
      >
        <CardContent className="p-6">
          <div className="flex gap-6 items-start">
            {image && (
              <div className="flex-shrink-0">
                <div className={`h-20 w-20 flex items-center justify-center overflow-hidden ${
                  imageRounded ? 'rounded-full' : 'rounded-lg'
                }`}>
                  <img loading="lazy" decoding="async" 
                    src={image} 
                    alt={title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  {badgeText && (
                    <Badge variant="outline" className="mb-2 text-xs">{badgeText}</Badge>
                  )}
                  <h3 className="text-xl font-bold mb-1">{title}</h3>
                  {subtitle && (
                    <p className="text-primary font-semibold text-sm">{subtitle}</p>
                  )}
                </div>
                {date && (
                  <div className="text-xs text-muted-foreground/70 font-light whitespace-pre-line text-right">
                    {date}
                  </div>
                )}
              </div>
              <div 
                className="text-sm leading-relaxed text-muted-foreground mb-4 pl-4 border-l-4 border-primary/30"
                dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
              />
              {fieldMapping.actions && fieldMapping.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fieldMapping.actions.map((action, idx) => {
                    const ActionIcon = action.icon;
                    const label = typeof action.label === 'function' ? action.label(item) : action.label;
                    return (
                      <Button
                        key={`${code}-action-${idx}`}
                        variant={action.variant || "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item, e);
                        }}
                      >
                        {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                        {label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
        <div className="bg-card border border-border rounded-lg p-3 hover:shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center">
          <div className="w-full aspect-square flex items-center justify-center mb-2">
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
              <div className="text-center text-xs font-medium text-muted-foreground line-clamp-2 px-1">
                {title}
              </div>
            )}
          </div>
          <div className="text-xs text-center font-medium text-foreground line-clamp-2 w-full">
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

    if (renderCarouselContent) {
      return (
        <Card 
          key={code}
          className="absolute border-border bg-card cursor-pointer transition-all duration-500 ease-in-out flex flex-col"
          style={{ ...cardStyle, width: carouselCardWidth, height: carouselCardHeight }}
          onClick={() => {
            if (index === currentIndex) {
              onItemClick?.(item);
            } else {
              goToSlide(index);
            }
          }}
        >
          {renderCarouselContent(item)}
        </Card>
      );
    }

    return (
      <Card 
        key={code}
        className="absolute border-border bg-card cursor-pointer transition-all duration-500 ease-in-out flex flex-col"
        style={{ ...cardStyle, width: carouselCardWidth, height: carouselCardHeight }}
        onClick={() => {
          if (index === currentIndex) {
            onItemClick?.(item);
          } else {
            goToSlide(index);
          }
        }}
      >
        <CardHeader className="pb-4 relative">
          <div className="flex flex-col items-center text-center">
            {image && (
              <div className="flex-shrink-0 mb-2 -mt-8">
                <div className={`h-20 w-20 flex items-center justify-center overflow-hidden border-background shadow-lg ${
                  imageRounded ? 'rounded-full border-4' : 'rounded-lg'
                }`}>
                  <img loading="lazy" decoding="async" 
                    src={image} 
                    alt={title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}
            <div className="w-full">
              {badgeText && (
                <Badge variant="outline" className="mb-2 text-xs">{badgeText}</Badge>
              )}
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              {subtitle && (
                <p className="text-primary font-semibold text-sm">{subtitle}</p>
              )}
              {date && (
                <p className="text-muted-foreground text-xs mb-3">{date}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center">
            <div 
              className="text-sm leading-relaxed text-muted-foreground text-center line-clamp-5"
              dangerouslySetInnerHTML={{ __html: withSafeLinks(description) }}
            />
          </div>
          {fieldMapping.actions && fieldMapping.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {fieldMapping.actions.slice(0, 3).map((action, idx) => {
                const ActionIcon = action.icon;
                const label = typeof action.label === 'function' ? action.label(item) : action.label;
                return (
                  <Button
                    key={`${code}-action-${idx}`}
                    variant={action.variant || "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(item, e);
                    }}
                  >
                    {ActionIcon && <ActionIcon className="w-3 h-3 mr-1" />}
                    {label}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  const sideLayout = categoryFilterLayout === 'side';
  const hasCategories = enableCategoryFilter && !!categoryField && categories.length > 0;
  const categoryFilter = hasCategories ? (
    <div className={sideLayout ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2'}>
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(category)}
          className={sideLayout ? 'gap-2 w-full justify-between' : 'gap-2 flex-1'}
        >
          <span className={sideLayout ? 'truncate' : undefined}>{categoryLabels?.[category] || category}</span>
          <Badge variant={selectedCategory === category ? 'secondary' : 'outline'}>
            {getCategoryCount(category)}
          </Badge>
        </Button>
      ))}
    </div>
  ) : null;

  if (data.length === 0) {
    return (
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`bg-background/50 ${(title || subtitle || badge) ? 'py-20' : 'py-8'}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        {(title || subtitle || badge) && (
          <div className="text-center mb-12">
            {badge && (
              <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase tracking-widest">{badge}</Badge>
            )}
            {title && (
              <h2 
                className="text-4xl lg:text-5xl font-bold mb-6"
                dangerouslySetInnerHTML={{ __html: title }}
              />
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Summary Section */}
        {summary && (
          <div className="mb-8">
            {summary}
          </div>
        )}

        {/* Body: optional category sidebar + content column */}
        <div className={sideLayout && hasCategories ? 'flex flex-col md:flex-row gap-8' : undefined}>
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
            <div className="md:hidden flex justify-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Filter Controls */}
            <div className={`space-y-4 ${showFilters ? 'block' : 'hidden'} md:block`}>
              {/* Category Filter (top layout) */}
              {!sideLayout && categoryFilter}

              {/* Search Input with View Mode Toggle */}
              {enableSearch && (
                <div className="flex flex-row justify-center items-center gap-3 w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* View Mode Toggle inline with search */}
                  {enabledModes.length > 1 && (
                    <div className="flex gap-1 bg-muted/30 p-1 rounded-lg flex-shrink-0">
                      {enabledModes.map((mode) => (
                        <Button
                          key={mode}
                          variant={viewMode === mode ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode(mode)}
                          className="h-8 px-3"
                          title={VIEW_MODE_LABELS[mode]}
                          aria-label={VIEW_MODE_LABELS[mode]}
                          aria-pressed={viewMode === mode}
                        >
                          {VIEW_MODE_ICONS[mode]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode Toggle - Standalone (when search is not enabled) */}
        {!enableSearch && enabledModes.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
              {enabledModes.map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="h-8 px-3"
                  title={VIEW_MODE_LABELS[mode]}
                  aria-label={VIEW_MODE_LABELS[mode]}
                  aria-pressed={viewMode === mode}
                >
                  {VIEW_MODE_ICONS[mode]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <>
            <div className={getGridClasses()}>
              {filteredData.map((item, index) => withCollapse(item, index, renderCard))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAll(!showAll)}
                  className="transition-all duration-300 hover:scale-105"
                >
                  {showAll ? 'Show Less' : `Show All (${filteredData.length})`}
                </Button>
              </div>
            )}
          </>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            <div className="space-y-4 max-w-5xl mx-auto">
              {filteredData.map((item, index) => withCollapse(item, index, renderListItem))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAll(!showAll)}
                  className="transition-all duration-300 hover:scale-105"
                >
                  {showAll ? 'Show Less' : `Show All (${filteredData.length})`}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Small Cards View */}
        {viewMode === 'small-card' && (
          <>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-4">
              {filteredData.map((item, index) => withCollapse(item, index, renderSmallCard))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAll(!showAll)}
                  className="transition-all duration-300 hover:scale-105"
                >
                  {showAll ? 'Show Less' : `Show All (${filteredData.length})`}
                </Button>
              </div>
            )}
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
                    <div className="h-full min-h-[8rem] rounded-xl border border-dashed border-border flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                      Hover or click an icon to see its details. Drag to turn the sphere.
                    </div>
                  )}
                </aside>
              )}
            </div>
          );
        })()}

        {/* Carousel View */}
        {viewMode === 'carousel' && (
          <div className="relative max-w-6xl mx-auto">
            {/* Navigation Buttons */}
            {data.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  aria-label="Previous items"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next items"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Carousel Container */}
            <div 
              ref={containerRef}
              className="relative flex items-center justify-center overflow-hidden"
              style={{ perspective: '1000px', height: carouselHeight }}
            >
              {data.map((item, index) => renderCarouselItem(item, index))}
            </div>

            {/* Dot Indicators */}
            {data.length > 1 && (
              <div className="flex justify-center mt-8 gap-3">
                {data.map((item, index) => {
                  const code = getFieldValue(item, fieldMapping.code);
                  return (
                    <button
                      key={`dot-${code}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                      aria-current={index === currentIndex ? "true" : undefined}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? "bg-primary"
                          : "bg-border hover:bg-primary/50"
                      }`}
                    />
                  );
                })}
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
      </div>
    </section>
  );
};

export default ListViewer;
