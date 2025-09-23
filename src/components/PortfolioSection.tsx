import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Grid, List, RotateCcw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import ProjectDetailDialog from './ProjectDetailDialog';

// Define interfaces for type safety
interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  technologies: string[];
  year: string;
  logo?: string;
  companyLogo?: string;
  techIcons?: string[];
}

// Updated interface for the new projects.json structure
interface ProjectItem {
  id: number;
  name: string;
  title: string;
  group: string;
  company: string;
  value: number;
  icon: string;
  summary: string;
  fulltext?: string | string[];
  datePeriod: { startDate: string; endDate: string | null };
  props: { name: string; title: string }[];
  domains?: { name: string; title: string; value: number; iconCss: string }[];
  team: { position: string; name: string; contactNo: string }[];
  modules?: string[];
  customers?: string[];
  partners?: string[];
  technologies: { name: string; type: string }[];
}

interface NewProjectData {
  general: {
    title: string;
    summary: string;
    groups: { name: string; title: string; value: number; iconCss: string }[];
  };
  items: ProjectItem[];
}

interface ProjectData {
  projects: Project[];
  categories: string[];
  companyLogos: { [key: string]: string };
  techIcons: { [key: string]: string };
  techIconNames: { [key: string]: string };
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

const PortfolioSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectIconMap, setProjectIconMap] = useState<{ [key: string]: string }>({});
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'carousel'>('card');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [searchText, setSearchText] = useState("");
  const statsRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Helper function to format date period to years only
  const formatDateToYears = (datePeriod: { startDate: string; endDate: string | null }) => {
    if (!datePeriod?.startDate) return '';
    
    // Extract year from date string (format: "dd.mm.yyyy")
    const startYear = datePeriod.startDate.split('.')[2];
    
    if (!datePeriod.endDate) {
      return startYear; // Only start year if no end date
    }
    
    const endYear = datePeriod.endDate.split('.')[2];
    
    // If start and end years are the same, show single year
    if (startYear === endYear) {
      return startYear;
    }
    
    // Otherwise show year range
    return `${startYear} - ${endYear}`;
  };

  // Load project data from JSON file
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const response = await fetch('/data/projects.json');
        const data: NewProjectData = await response.json();
        setProjectData(data);

        // Create project icon map using direct asset paths
        const projectIcons: { [key: string]: string } = {};
        for (const project of data.items) {
          if (project.icon) {
            // Use direct asset path for reliable loading in production
            projectIcons[project.name] = `/assets/files/projects/_logos/${project.icon}`;
          }
        }
        setProjectIconMap(projectIcons);

      } catch (error) {
        console.error('Failed to load project data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectData();
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
  const filteredProjects = useMemo(() => {
    if (!projectData) return [];
    
    let filtered = selectedCategory === "All" 
      ? projectData.items 
      : projectData.items.filter(project => project.group === selectedCategory);
    
    // Apply search text filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchLower) ||
        project.summary.toLowerCase().includes(searchLower) ||
        project.company?.toLowerCase().includes(searchLower) ||
        project.technologies.some(tech => tech.name.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [selectedCategory, projectData, searchText]);

  const getCategoryCount = (category: string) => {
    if (!projectData) return 0;
    if (category === "All") return projectData.items.length;
    return projectData.items.filter(project => project.group === category).length;
  };

  // Handle project card click
  const handleProjectClick = (project: ProjectItem) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProject(null);
  };

  // Carousel navigation functions
  const goToPrevious = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === 0 ? filteredProjects.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === filteredProjects.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCarouselIndex(index);
  };

  // Reset carousel index when category or search changes
  useEffect(() => {
    setCarouselIndex(0);
  }, [selectedCategory, searchText]);

  if (isLoading || !projectData) {
    return (
      <section id="portfolio" className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </section>
    );
  }

  const { items: projects, general } = projectData;
  const categories = ["All", ...general.groups.map(group => group.name)];

  // Project Card Component
  const ProjectCard: React.FC<{ 
    project: ProjectItem; 
    index: number; 
    variant?: 'default' | 'list' | 'carousel'; 
    style?: React.CSSProperties 
  }> = ({ project, index, variant = 'default', style }) => {
    const isHovered = hoveredCard === project.id;
    
    if (variant === 'list') {
      return (
        <div
          className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-card/80 animate-fade-in"
          style={{ animationDelay: `${index * 50}ms`, ...style }}
          onMouseEnter={() => setHoveredCard(project.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => handleProjectClick(project)}
        >
          {/* Project Icon */}
          {project.icon && projectIconMap[project.name] && (
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
              <img 
                src={projectIconMap[project.name]} 
                alt={`${project.title} icon`}
                className="w-14 h-14 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300"
              />
            </div>
          )}
          
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {project.group}
              </Badge>
            </div>
            
            {project.company && (
              <div className="text-sm text-muted-foreground mb-2">
                {project.company} • {project.datePeriod?.startDate && formatDateToYears(project.datePeriod)}
              </div>
            )}
            
            <div 
              className={`text-sm text-muted-foreground overflow-hidden transition-all duration-300 ${
                isHovered ? 'line-clamp-none' : 'line-clamp-2'
              }`}
              dangerouslySetInnerHTML={{ __html: project.summary }}
            />
            
            <div className={`flex flex-wrap gap-1 mt-2 overflow-hidden transition-all duration-300 ${
              isHovered ? 'max-h-20 opacity-100' : 'max-h-8 opacity-80'
            }`}>
              {(isHovered ? project.technologies : project.technologies.slice(0, 4)).map((tech) => (
                <Badge 
                  key={tech.name} 
                  variant="secondary" 
                  className="text-xs hover:bg-primary/10 transition-colors"
                >
                  {tech.name}
                </Badge>
              ))}
              {!isHovered && project.technologies.length > 4 && (
                <Badge variant="outline" className="text-xs border-dashed">
                  +{project.technologies.length - 4} more
                </Badge>
              )}
            </div>
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
          onMouseEnter={() => setHoveredCard(project.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => handleProjectClick(project)}
        >
          <CardHeader className="pb-2">
            <div className="flex flex-col items-center text-center mb-2">
              {/* Category Badge */}
              <Badge variant="outline" className="mb-2 text-xs">
                {project.group}
              </Badge>
              
              {/* Project Icon - Smaller for carousel */}
              {project.icon && projectIconMap[project.name] && (
                <div className="w-20 h-20 flex items-center justify-center mb-2">
                  <img 
                    src={projectIconMap[project.name]} 
                    alt={`${project.title} icon`}
                    className="w-16 h-16 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300"
                  />
                </div>
              )}
              
              {/* Project Info */}
              <div className="w-full">
                <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors mb-1">
                  {project.title}
                </CardTitle>
                {project.company && (
                  <div className="text-xs text-muted-foreground/80 font-medium">
                    {project.company}
                  </div>
                )}
              </div>
            </div>
            {/* Date - Always shown in carousel */}
            {project.datePeriod?.startDate && (
              <div className="text-xs text-muted-foreground text-center mb-2">
                {formatDateToYears(project.datePeriod)}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {/* Description - Always shown in carousel */}
            <div className="mb-3">
              <CardDescription 
                className="text-xs leading-relaxed text-center line-clamp-4"
                dangerouslySetInnerHTML={{ __html: project.summary }}
              />
            </div>
            
            {/* Technologies - Always shown in carousel */}
            <div className="flex flex-wrap gap-1 justify-center">
              {project.technologies.slice(0, 4).map((tech) => (
                <Badge 
                  key={tech.name} 
                  variant="secondary" 
                  className="text-xs hover:bg-primary/10 transition-colors"
                >
                  {tech.name}
                </Badge>
              ))}
              {project.technologies.length > 4 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-muted-foreground border-dashed"
                >
                  +{project.technologies.length - 4} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // Default card view (same as existing)
    return (
      <Card 
        className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl"
        style={{ animationDelay: `${index * 100}ms`, ...style }}
        onMouseEnter={() => setHoveredCard(project.id)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => handleProjectClick(project)}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center text-center mb-3">
            {/* Category Badge */}
            <Badge variant="outline" className="mb-3 text-xs">
              {project.group}
            </Badge>
            
            {/* Project Icon */}
            {project.icon && projectIconMap[project.name] && (
              <div className="w-36 h-36 flex items-center justify-center mb-3">
                <img 
                  src={projectIconMap[project.name]} 
                  alt={`${project.title} icon`}
                  className="w-32 h-32 object-contain hover:brightness-110 hover:scale-105 transition-all duration-300"
                />
              </div>
            )}
            
            {/* Project Info */}
            <div className="w-full">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors mb-1">
                {project.title}
              </CardTitle>
              {project.company && (
                <div className="text-sm text-muted-foreground/80 font-medium">
                  {project.company}
                </div>
              )}
            </div>
          </div>
          <div className={`text-sm text-muted-foreground text-center overflow-hidden transition-all duration-300 ${
            isHovered ? 'max-h-32 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0'
          }`}>
            {project.datePeriod?.startDate && formatDateToYears(project.datePeriod)}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Description - Hidden in compact view */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isHovered ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
          }`}>
            <CardDescription 
              className="text-sm leading-relaxed text-center"
              dangerouslySetInnerHTML={{ __html: project.summary }}
            />
          </div>
          
          {/* Technologies - Hidden in compact view */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isHovered ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="flex flex-wrap gap-1 justify-center">
              {project.technologies.slice(0, 5).map((tech) => (
                <Badge 
                  key={tech.name} 
                  variant="secondary" 
                  className="text-xs hover:bg-primary/10 transition-colors"
                >
                  {tech.name}
                </Badge>
              ))}
              {project.technologies.length > 5 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-muted-foreground border-dashed"
                >
                  +{project.technologies.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Portfolio & <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Projects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A showcase of projects that I architected and contributed spanning healthcare, education, gaming, and research domains
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
                placeholder="Search projects, technologies, or companies..."
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

        {/* Projects Display */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                index={index} 
                variant="default"
              />
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                index={index} 
                variant="list"
                style={{ animationDelay: `${index * 50}ms` }}
              />
            ))}
          </div>
        )}

        {viewMode === 'carousel' && filteredProjects.length > 0 && (
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
              {filteredProjects.map((project, index) => {
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
                    key={project.id}
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
                        handleProjectClick(project);
                      } else {
                        goToSlide(index);
                      }
                    }}
                  >
                    <ProjectCard 
                      project={project} 
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
              {filteredProjects.map((_, index) => (
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

            {/* Project Counter */}
            <div className="text-center mt-4 text-sm text-muted-foreground">
              {carouselIndex + 1} of {filteredProjects.length} projects
            </div>
          </div>
        )}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found in this category.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center" ref={statsRef}>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={projects.length} isVisible={statsVisible} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={20} isVisible={statsVisible} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={categories.length - 1} isVisible={statsVisible} />
            </div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">
              <AnimatedCounter end={50} isVisible={statsVisible} suffix="+" />
            </div>
            <div className="text-sm text-muted-foreground">Technologies</div>
          </div>
        </div>
      </div>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog 
        project={selectedProject}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        projectIcon={selectedProject ? projectIconMap[selectedProject.name] : undefined}
      />
    </section>
  );
};

export default PortfolioSection;