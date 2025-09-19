import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Filter } from "lucide-react";

// Import company logos (actual logos from tursoft.net)
import gamyteLogo from "@/assets/logos/companies/gamyte.png";
import avicennaLogo from "@/assets/logos/companies/avicenna.png";
import ercLogo from "@/assets/logos/companies/erc.png";
import dataselLogo from "@/assets/logos/companies/datasel.png";
import fonetLogo from "@/assets/logos/companies/fonet.png";
import haliciLogo from "@/assets/logos/companies/halici.png";
import labrisLogo from "@/assets/logos/companies/labris.png";
import metuLogo from "@/assets/logos/companies/metu.png";
import unhcrLogo from "@/assets/logos/companies/unhcr.png";

// Import technology icons (actual icons from tursoft.net)
import dotnetIcon from "@/assets/logos/technologies/dotnet.png";
import dotnetCoreIcon from "@/assets/logos/technologies/dotnetcore.png";
import angularIcon from "@/assets/logos/technologies/angular.png";
import reactIcon from "@/assets/logos/technologies/react.png";
import dockerIcon from "@/assets/logos/technologies/docker.png";
import javaIcon from "@/assets/logos/technologies/java.png";
import nodejsIcon from "@/assets/logos/technologies/nodejs.png";
import typescriptIcon from "@/assets/logos/technologies/typescript.png";
import ionicIcon from "@/assets/logos/technologies/ionic.png";
import csharpIcon from "@/assets/logos/technologies/csharp.png";
import mysqlIcon from "@/assets/logos/technologies/mysql.png";

// Technology icon name mapping
const techIconNames: { [key: string]: string } = {
  [dotnetIcon]: ".NET Framework",
  [dotnetCoreIcon]: ".NET Core",
  [angularIcon]: "Angular",
  [reactIcon]: "React",
  [dockerIcon]: "Docker",
  [javaIcon]: "Java",
  [nodejsIcon]: "Node.js",
  [typescriptIcon]: "TypeScript",
  [ionicIcon]: "Ionic",
  [csharpIcon]: "C#",
  [mysqlIcon]: "MySQL"
};

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

const projects: Project[] = [
  {
    id: 373,
    title: "Alışveriş Asistanı",
    category: "Misc",
    description: "An intelligent shopping assistant application that helps users make better purchasing decisions.",
    technologies: ["Mobile App", "AI"],
    year: "2024",
    techIcons: [reactIcon, typescriptIcon]
  },
  {
    id: 372,
    title: "Gamyte App",
    category: "Game",
    description: "Gaming platform application with social features and multiplayer capabilities.",
    technologies: ["React Native", "Node.js", "WebSocket"],
    year: "2024",
    companyLogo: gamyteLogo,
    techIcons: [reactIcon, nodejsIcon]
  },
  {
    id: 371,
    title: "Pardus on Docker",
    category: "Research",
    description: "Containerized Turkish national operating system Pardus for cloud deployment.",
    technologies: ["Docker", "Linux", "DevOps"],
    year: "2024",
    techIcons: [dockerIcon]
  },
  {
    id: 301,
    title: "Avicenna Telemedicine Platform",
    category: "Telemedicine",
    description: "Comprehensive telemedicine platform enabling remote healthcare delivery and patient monitoring.",
    technologies: [".NET Core", "Angular", "WebRTC", "SignalR"],
    year: "2023",
    companyLogo: avicennaLogo,
    techIcons: [dotnetCoreIcon, angularIcon]
  },
  {
    id: 307,
    title: "Avicenna Product Development Framework",
    category: "Framework",
    description: "Enterprise-grade development framework for rapid healthcare application development.",
    technologies: [".NET Core", "Entity Framework", "Angular", "Docker"],
    year: "2023",
    companyLogo: avicennaLogo,
    techIcons: [dotnetCoreIcon, angularIcon, dockerIcon]
  },
  {
    id: 311,
    title: "Avicenna Hospital Information System",
    category: "HIS",
    description: "Complete hospital management system with patient records, billing, and inventory management.",
    technologies: [".NET", "SQL Server", "Angular", "Kubernetes"],
    year: "2022",
    companyLogo: avicennaLogo,
    techIcons: [dotnetIcon, angularIcon]
  },
  {
    id: 322,
    title: "Fonet Hospital Information System",
    category: "HIS",
    description: "Modular hospital information system with comprehensive healthcare workflow management.",
    technologies: [".NET Framework", "WCF", "Silverlight", "Oracle"],
    year: "2021",
    companyLogo: fonetLogo,
    techIcons: [dotnetIcon]
  },
  {
    id: 327,
    title: "Halici e-Learning Portal",
    category: "LMS",
    description: "Advanced learning management system with content authoring and assessment tools.",
    technologies: ["ASP.NET MVC", "jQuery", "MySQL", "HTML5"],
    year: "2020",
    companyLogo: haliciLogo,
    techIcons: [dotnetIcon, mysqlIcon]
  },
  {
    id: 330,
    title: "Official Portal of The UN Refugee Agency Turkey",
    category: "Social Responsibility",
    description: "Official website and information portal for UNHCR Turkey operations.",
    technologies: ["PHP", "MySQL", "jQuery", "Bootstrap"],
    year: "2019",
    companyLogo: unhcrLogo,
    techIcons: [mysqlIcon]
  },
  {
    id: 310,
    title: "Avicenna Project Master",
    category: "Project Management",
    description: "Comprehensive project management solution for healthcare and enterprise projects.",
    technologies: [".NET Core", "Angular", "PostgreSQL", "Redis"],
    year: "2022",
    companyLogo: avicennaLogo,
    techIcons: [dotnetCoreIcon, angularIcon]
  },
  {
    id: 337,
    title: "Efsane - 3D Educational Game",
    category: "Game",
    description: "Interactive 3D educational game for learning Turkish history and culture.",
    technologies: ["Unity", "C#", "3D Graphics", "Mobile"],
    year: "2018",
    techIcons: [csharpIcon]
  },
  {
    id: 344,
    title: "EDers - Online Learning Platform",
    category: "LMS",
    description: "Modern online learning platform with video streaming and interactive content.",
    technologies: ["Angular", "Node.js", "MongoDB", "WebRTC"],
    year: "2019",
    techIcons: [angularIcon, nodejsIcon]
  }
];

const categories = ["All", "Research", "Framework", "HIS", "Telemedicine", "LMS", "Social Responsibility", "Project Management", "Game", "Misc"];

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
  const statsRef = useRef<HTMLDivElement>(null);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return projects;
    return projects.filter(project => project.category === selectedCategory);
  }, [selectedCategory]);

  const getCategoryCount = (category: string) => {
    if (category === "All") return projects.length;
    return projects.filter(project => project.category === category).length;
  };

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
                    {project.companyLogo && (
                      <div className="w-16 h-16 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={project.companyLogo} 
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
                      {project.techIcons.map((icon, iconIndex) => (
                        <Tooltip key={iconIndex}>
                          <TooltipTrigger asChild>
                            <div className="w-6 h-6 rounded bg-white/10 p-1 hover:scale-110 hover:bg-primary/20 transition-all duration-300 cursor-pointer">
                              <img 
                                src={icon} 
                                alt={techIconNames[icon] || "Technology"}
                                className="w-full h-full object-contain hover:brightness-110 transition-all duration-300"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{techIconNames[icon] || "Technology"}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
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