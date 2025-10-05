import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Grid, List, RotateCcw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import CustomerDetailDialog from './CustomerDetailDialog';
import type { Customer, CustomerData } from '@/models/Customer';
import { companiesRepo } from '@/repositories/CompaniesRepo';

interface Experience {
  companyCode: string;
  companyName: string;
}

interface Project {
  name: string;
  title: string;
}

interface ExperiencesData {
  items: Experience[];
}

interface ProjectsData {
  items: Project[];
}

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string; isVisible?: boolean }> = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  isVisible = false 
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible || hasAnimated) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress >= 1) {
        setHasAnimated(true);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation from 0
    setCount(0);
    countRef.current = 0;
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, isVisible, hasAnimated]);

  // Show final value if not visible or already animated
  const displayValue = (!isVisible && !hasAnimated) ? end : count;

  return <span>{displayValue}{suffix}</span>;
};

const CustomersSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [experiencesData, setExperiencesData] = useState<ExperiencesData | null>(null);
  const [projectsData, setProjectsData] = useState<ProjectsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerLogoMap, setCustomerLogoMap] = useState<{ [key: string]: string }>({});
  const [companyTitlesMap, setCompanyTitlesMap] = useState<{ [key: string]: string }>({});
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'carousel'>('card');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const statsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Load customer, experiences, and projects data from JSON files
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all three data files concurrently
        const [customersResponse, experiencesResponse, projectsResponse] = await Promise.all([
          fetch('/data/customers.json'),
          fetch('/data/experiences.json'),
          fetch('/data/projects.json')
        ]);

        const [customersData, experiencesData, projectsData] = await Promise.all([
          customersResponse.json() as Promise<CustomerData>,
          experiencesResponse.json() as Promise<ExperiencesData>,
          projectsResponse.json() as Promise<ProjectsData>
        ]);

        // Set experiences and projects data
        setExperiencesData(experiencesData);
        setProjectsData(projectsData);

        // Customers already have categories in JSON, no need to compute them
        const customers = customersData.items;
        
        // Create customer logo map by fetching company photoUrl from companiesRepo
        const customerLogos: { [key: string]: string } = {};
        const companyTitles: { [key: string]: string } = {};
        for (const customer of customers) {
          if (customer.companyCode) {
            const photoUrl = await companiesRepo.getPhotoUrlByCode(customer.companyCode);
            if (photoUrl) {
              customerLogos[customer.code] = photoUrl;
            }
            const title = await companiesRepo.getTitleByCode(customer.companyCode);
            if (title) {
              companyTitles[customer.code] = title;
            }
          }
        }
        setCustomerLogoMap(customerLogos);
        setCompanyTitlesMap(companyTitles);
        
        setCustomerData(customersData);

      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Intersection observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const currentRef = statsRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [statsVisible]);

  // Memoized computed values
  const filteredCustomers = useMemo(() => {
    if (!customerData) return [];
    
    let filtered = selectedCategory === "All" 
      ? customerData.items 
      : customerData.items.filter(customer => customer.category === selectedCategory);
    
    // Apply search text filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.companyCode.toLowerCase().includes(searchLower) ||
        customer.description.toLowerCase().includes(searchLower) ||
        customer.category?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [selectedCategory, customerData, searchText]);

  const categories = useMemo(() => {
    if (!customerData) return ['All'];
    const uniqueCategories = [...new Set(customerData.items.map(customer => customer.category))];
    return ['All', ...uniqueCategories.sort()];
  }, [customerData]);

  const getCategoryCount = (category: string) => {
    if (!customerData) return 0;
    if (category === "All") return customerData.items.length;
    return customerData.items.filter(customer => customer.category === category).length;
  };

  // Handle customer card click
  const handleCustomerClick = (customer: Customer) => {
    // Create customer object with resolved company names and project titles
    const customerWithResolvedData: Customer = {
      ...customer
    };
    
    setSelectedCustomer(customerWithResolvedData);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Carousel navigation functions
  const goToPrevious = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === 0 ? filteredCustomers.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === filteredCustomers.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCarouselIndex(index);
  };

  // Reset carousel index when category or search changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedCategory, searchText]);

  if (isLoading || !customerData) {
    return (
      <section id="customers" className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </section>
    );
  }

  const { items: customers } = customerData;

  // Customer Card Component
  const CustomerCard: React.FC<{ 
    customer: Customer; 
    index: number; 
    variant?: 'default' | 'list' | 'carousel'; 
    style?: React.CSSProperties 
  }> = ({ customer, index, variant = 'default', style }) => {
    const isHovered = hoveredCard === customer.code;
    const companyTitle = companyTitlesMap[customer.code] || customer.companyCode || customer.code;
    
    if (variant === 'list') {
      return (
        <div
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-card/80 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms`, ...style }}
          onMouseEnter={() => setHoveredCard(customer.code)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => handleCustomerClick(customer)}
        >
          {/* Customer Logo */}
          {customerLogoMap[customer.code] && (
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
              <img 
                src={customerLogoMap[customer.code]} 
                alt={`${companyTitle} logo`}
                className="w-14 h-14 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300 rounded-lg"
                onError={(e) => {
                  // Try with /src/assets/ prefix for development fallback
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                    e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                  } else {
                    // Hide image if it fails to load even with fallback
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            </div>
          )}
          
          {/* Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {companyTitle}
              </h3>
              {customer.category && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {customer.category}
                </Badge>
              )}
            </div>            
            
            {/* Associated Companies - Display companyCode */}
            {customer.companyCode && (
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {customer.companyCode}
                </Badge>
              </div>
            )}
            
            {customer.description && (
              <div 
                className={`text-sm text-muted-foreground overflow-hidden transition-all duration-300 ${
                  isHovered ? 'line-clamp-none' : 'line-clamp-2'
                }`}
              >
                {customer.description}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Carousel variant - always shows full content
    if (variant === 'carousel') {
      return (
        <Card 
          className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in transition-all duration-300 cursor-pointer"
          style={{ animationDelay: `${index * 100}ms`, ...style }}
          onMouseEnter={() => setHoveredCard(customer.code)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => handleCustomerClick(customer)}
        >
          <CardHeader className="pb-2">
            <div className="flex flex-col items-center text-center mb-2">
              {/* Category Badge */}
              {customer.category && (
                <Badge variant="outline" className="mb-2 text-xs">
                  {customer.category}
                </Badge>
              )}
              
              {/* Customer Logo - Smaller for carousel */}
              {customerLogoMap[customer.code] && (
                <div className="w-20 h-20 flex items-center justify-center mb-2">
                  <img 
                    src={customerLogoMap[customer.code]} 
                    alt={`${companyTitle} logo`}
                    className="w-16 h-16 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300 rounded-lg"
                    onError={(e) => {
                      // Try with /src/assets/ prefix for development fallback
                      const currentSrc = e.currentTarget.src;
                      if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                        e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                      } else {
                        // Hide image if it fails to load even with fallback
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Customer Info */}
              <div className="w-full">
                <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors mb-1">
                  {companyTitle}
                </CardTitle>
                
                {/* Associated Companies - Display companyCode */}
                {customer.companyCode && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {customer.companyCode}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Description - Always shown in carousel */}
            {customer.description && (
              <div className="mb-3">
                <CardDescription className="text-xs leading-relaxed text-center line-clamp-4">
                  {customer.description}
                </CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }
    
    // Default card view
    return (
      <Card 
        className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl"
        style={{ animationDelay: `${index * 100}ms`, ...style }}
        onMouseEnter={() => setHoveredCard(customer.code)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleCustomerClick(customer)}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center text-center mb-3">
            {/* Category Badge */}
            {customer.category && (
              <Badge variant="outline" className="mb-3 text-xs">
                {customer.category}
              </Badge>
            )}
            
            {/* Customer Logo */}
            {customerLogoMap[customer.code] && (
              <div className="w-36 h-36 flex items-center justify-center mb-3">
                <img 
                  src={customerLogoMap[customer.code]} 
                  alt={`${companyTitle} logo`}
                  className="w-32 h-32 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300 rounded-lg"
                  onError={(e) => {
                    // Try with /src/assets/ prefix for development fallback
                    const currentSrc = e.currentTarget.src;
                    if (currentSrc.includes('/assets/') && !currentSrc.includes('/src/assets/')) {
                      e.currentTarget.src = currentSrc.replace('/assets/', '/src/assets/');
                    } else {
                      // Hide image if it fails to load even with fallback
                      e.currentTarget.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
            
            {/* Customer Info */}
            <div className="w-full">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors mb-1">
                {companyTitle}
              </CardTitle>
              
              {/* Associated Companies - Display companyCode */}
              {customer.companyCode && (
                <div className="flex flex-wrap gap-1 mt-3 justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {customer.companyCode}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Description - Hidden in compact view */}
          {customer.description && (
            <div className={`overflow-hidden transition-all duration-300 ${
              isHovered ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
            }`}>
              <CardDescription className="text-sm leading-relaxed text-center">
                {customer.description}
              </CardDescription>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="customers" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Clients & <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Customers</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organizations and institutions that have trusted us with their technology needs across healthcare, government, and enterprise sectors
          </p>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters ({getCategoryCount(selectedCategory)})
            </Button>
          </div>
          
          {/* Filter Categories */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="flex flex-wrap gap-2 w-full">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex-1 min-w-fit transition-all duration-200 hover:scale-105"
                >
                  {category}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getCategoryCount(category)}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Search and View Mode Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers, industries, or categories..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="h-8 px-3"
              >
                <Grid className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Cards</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">List</span>
              </Button>
              <Button
                variant={viewMode === 'carousel' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('carousel')}
                className="h-8 px-3"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Carousel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Customers Display */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCustomers.map((customer, index) => (
              <CustomerCard 
                key={customer.code} 
                customer={customer} 
                index={index} 
                variant="default"
              />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredCustomers.map((customer, index) => (
              <CustomerCard 
                key={customer.code} 
                customer={customer} 
                index={index} 
                variant="list"
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        )}

        {viewMode === 'carousel' && filteredCustomers.length > 0 && (
          <div className="relative max-w-5xl mx-auto">
            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="relative h-[600px] flex items-center justify-center overflow-hidden"
              style={{
                perspective: '1200px',
                perspectiveOrigin: 'center center'
              }}
            >
              {filteredCustomers.map((customer, index) => {
                const diff = index - carouselIndex;
                const absIndex = Math.abs(diff);
                
                let transform = '';
                let zIndex = 1;
                let opacity = 0.3;
                let scale = 0.6;
                
                if (absIndex === 0) {
                  // Center card
                  transform = 'translateX(0) translateZ(0) rotateY(0deg) scale(1)';
                  zIndex = 10;
                  opacity = 1;
                  scale = 1;
                } else if (absIndex === 1) {
                  // Adjacent cards
                  const direction = diff > 0 ? 1 : -1;
                  transform = `translateX(${direction * 350}px) translateZ(-100px) rotateY(${-direction * 25}deg) scale(0.8)`;
                  zIndex = 5;
                  opacity = 0.7;
                  scale = 0.8;
                } else if (absIndex === 2) {
                  // Second level cards
                  const direction = diff > 0 ? 1 : -1;
                  transform = `translateX(${direction * 600}px) translateZ(-200px) rotateY(${-direction * 45}deg) scale(0.6)`;
                  zIndex = 3;
                  opacity = 0.4;
                  scale = 0.6;
                } else {
                  // Hidden cards
                  const direction = diff > 0 ? 1 : -1;
                  transform = `translateX(${direction * 800}px) translateZ(-300px) rotateY(${-direction * 60}deg) scale(0.4)`;
                  zIndex = 1;
                  opacity = 0.1;
                  scale = 0.4;
                }
                
                return (
                  <div
                    key={customer.code}
                    className="absolute cursor-pointer transition-all duration-700 ease-out"
                    style={{
                      transform,
                      zIndex,
                      opacity,
                      transformStyle: 'preserve-3d',
                      width: '400px',
                      height: '500px'
                    }}
                    onClick={() => {
                      if (index === carouselIndex) {
                        handleCustomerClick(customer);
                      } else {
                        goToSlide(index);
                      }
                    }}
                  >
                    <CustomerCard 
                      customer={customer} 
                      index={index} 
                      variant="carousel"
                      style={{ 
                        height: '100%',
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-border hover:bg-primary hover:text-primary-foreground"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-border hover:bg-primary hover:text-primary-foreground"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-8">
              {filteredCustomers.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === carouselIndex 
                      ? 'bg-primary scale-125' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>

            {/* Customer Counter */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {carouselIndex + 1} of {filteredCustomers.length} customers
            </div>
          </div>
        )}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No customers found in this category.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center" ref={statsRef}>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={customers.length} isVisible={statsVisible} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={categories.length - 1} isVisible={statsVisible} />
            </div>
            <div className="text-sm text-muted-foreground">Industries</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={8} isVisible={statsVisible} />
            </div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={15} isVisible={statsVisible} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
        </div>
      </div>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog 
        customer={selectedCustomer}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        customerLogo={selectedCustomer ? customerLogoMap[selectedCustomer.code] : undefined}
        companyTitle={selectedCustomer ? companyTitlesMap[selectedCustomer.code] : undefined}
      />
    </section>
  );
};

export default CustomersSection;