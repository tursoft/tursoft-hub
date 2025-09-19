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
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyLogoMap, setCompanyLogoMap] = useState<{ [key: string]: string }>({});
  const [techIconMap, setTechIconMap] = useState<{ [key: string]: string }>({});
  const statsRef = useRef<HTMLDivElement>(null);

  // Load project data from JSON file
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const response = await fetch('/src/data/projects.json');
        const data: ProjectData = await response.json();
        setProjectData(data);

        // Load company logos dynamically
        const companyLogos: { [key: string]: string } = {};
        for (const [key, path] of Object.entries(data.companyLogos)) {
          try {
            const logoModule = await import(/* @vite-ignore */ path);
            companyLogos[key] = logoModule.default;
          } catch (error) {
            console.warn(`Failed to load company logo: ${path}`, error);
          }
        }
        setCompanyLogoMap(companyLogos);

        // Load tech icons dynamically
        const techIcons: { [key: string]: string } = {};
        for (const [key, path] of Object.entries(data.techIcons)) {
          try {
            const iconModule = await import(/* @vite-ignore */ path);
            techIcons[key] = iconModule.default;
          } catch (error) {
            console.warn(`Failed to load tech icon: ${path}`, error);
          }
        }
        setTechIconMap(techIcons);

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
    if (selectedCategory === "All") return projectData.projects;
    return projectData.projects.filter(project => project.category === selectedCategory);
  }, [selectedCategory, projectData]);

  const getCategoryCount = (category: string) => {
    if (!projectData) return 0;
    if (category === "All") return projectData.projects.length;
    return projectData.projects.filter(project => project.category === category).length;
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

  const { projects, categories, techIconNames } = projectData;

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
          {filteredProjects.map((project, index) => (
            <Card 
              key={project.id} 
              className="portfolio-card portfolio-light-streak portfolio-glow-pulse group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {project.category}
                    </Badge>
                    <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.companyLogo && companyLogoMap[project.companyLogo] && (
                      <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={companyLogoMap[project.companyLogo]} 
                          alt={`${project.title} logo`}
                          className="max-w-full max-h-full object-contain hover:brightness-110 transition-all duration-300"
                        />
                      </div>
                    )}
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {project.year}
                </div>
                {project.techIcons && (
                  <div className="flex items-center gap-2 mb-2">
                    <TooltipProvider>
                      {project.techIcons.map((iconKey, iconIndex) => 
                        techIconMap[iconKey] ? (
                          <Tooltip key={iconIndex}>
                            <TooltipTrigger asChild>
                              <div className="w-6 h-6 rounded bg-white/10 p-1 hover:scale-110 hover:bg-primary/20 transition-all duration-300 cursor-pointer">
                                <img 
                                  src={techIconMap[iconKey]} 
                                  alt={techIconNames[iconKey] || "Technology"}
                                  className="w-full h-full object-contain hover:brightness-110 transition-all duration-300"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{techIconNames[iconKey] || "Technology"}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null
                      )}
                    </TooltipProvider>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="mb-4 text-sm leading-relaxed">
                  {project.description}
                </CardDescription>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.map((tech) => (
                    <Badge 
                      key={tech} 
                      variant="secondary" 
                      className="text-xs hover:bg-primary/10 transition-colors"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
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