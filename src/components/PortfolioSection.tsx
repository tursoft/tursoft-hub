import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Filter } from "lucide-react";

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

  useEffect(() => {
    if (!isVisible) return;

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

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Reset and start animation
    setCount(0);
    countRef.current = 0;
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, isVisible]);

  return <span>{count}{suffix}</span>;
};

const PortfolioSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [projectData, setProjectData] = useState<NewProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectIconMap, setProjectIconMap] = useState<{ [key: string]: string }>({});
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);

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
        const response = await fetch('/src/data/data_new/projects.json');
        const data: NewProjectData = await response.json();
        setProjectData(data);

        // Load project icons dynamically from _logos folder
        const projectIcons: { [key: string]: string } = {};
        for (const project of data.items) {
          if (project.icon) {
            try {
              // Try to load the project icon from assets/files/projects/_logos/
              const iconPath = `/src/assets/files/projects/_logos/${project.icon}`;
              const iconModule = await import(/* @vite-ignore */ iconPath);
              projectIcons[project.name] = iconModule.default;
            } catch (error) {
              // If specific icon fails, try fallback or continue without icon
              console.warn(`Failed to load project icon: ${project.icon} for ${project.name}`, error);
            }
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
    if (selectedCategory === "All") return projectData.items;
    return projectData.items.filter(project => project.group === selectedCategory);
  }, [selectedCategory, projectData]);

  const getCategoryCount = (category: string) => {
    if (!projectData) return 0;
    if (category === "All") return projectData.items.length;
    return projectData.items.filter(project => project.group === category).length;
  };

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

  useEffect(() => {
    if (!isVisible) return;

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

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Reset and start animation
    setCount(0);
    countRef.current = 0;
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, duration, isVisible]);

  return <span>{count}{suffix}</span>;
};

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-4">
            Portfolio & Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A showcase of projects that I architected and contributed spanning healthcare, education, gaming, and research domains
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters ({getCategoryCount(selectedCategory)})
          </Button>
          
          <div className={`flex flex-wrap gap-2 ${showFilters ? 'block' : 'hidden lg:flex'}`}>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="transition-all duration-200 hover:scale-105"
              >
                {category}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {getCategoryCount(category)}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => {
            const isHovered = hoveredCard === project.id;
            return (
              <Card 
                key={project.id} 
                className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
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
                  
                  {/* External Link Icon */}
                  <div className="absolute top-4 right-4">
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
          })}
        </div>

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
    </section>
  );
};

export default PortfolioSection;