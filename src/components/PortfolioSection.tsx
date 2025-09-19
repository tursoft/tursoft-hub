import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter } from "lucide-react";

// Import company logos
import gamyteLogo from "@/assets/logos/companies/gamyte.svg";
import avicennaLogo from "@/assets/logos/companies/avicenna.svg";
import fonetLogo from "@/assets/logos/companies/fonet.svg";
import halsoftLogo from "@/assets/logos/companies/halsoft.svg";
import unhcrLogo from "@/assets/logos/companies/unhcr.svg";

// Import technology icons
import dotnetIcon from "@/assets/logos/technologies/dotnet.svg";
import angularIcon from "@/assets/logos/technologies/angular.svg";
import reactIcon from "@/assets/logos/technologies/react.svg";
import dockerIcon from "@/assets/logos/technologies/docker.svg";

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
    techIcons: [reactIcon]
  },
  {
    id: 372,
    title: "Gamyte App",
    category: "Game",
    description: "Gaming platform application with social features and multiplayer capabilities.",
    technologies: ["React Native", "Node.js", "WebSocket"],
    year: "2024",
    companyLogo: gamyteLogo,
    techIcons: [reactIcon]
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
    techIcons: [dotnetIcon, angularIcon]
  },
  {
    id: 307,
    title: "Avicenna Product Development Framework",
    category: "Framework",
    description: "Enterprise-grade development framework for rapid healthcare application development.",
    technologies: [".NET Core", "Entity Framework", "Angular", "Docker"],
    year: "2023",
    companyLogo: avicennaLogo,
    techIcons: [dotnetIcon, angularIcon, dockerIcon]
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
    title: "Halsoft e-Learning Portal",
    category: "LMS",
    description: "Advanced learning management system with content authoring and assessment tools.",
    technologies: ["ASP.NET MVC", "jQuery", "MySQL", "HTML5"],
    year: "2020",
    companyLogo: halsoftLogo,
    techIcons: [dotnetIcon]
  },
  {
    id: 330,
    title: "Official Portal of The UN Refugee Agency Turkey",
    category: "Social Responsibility",
    description: "Official website and information portal for UNHCR Turkey operations.",
    technologies: ["PHP", "MySQL", "jQuery", "Bootstrap"],
    year: "2019",
    companyLogo: unhcrLogo
  },
  {
    id: 310,
    title: "Avicenna Project Master",
    category: "Project Management",
    description: "Comprehensive project management solution for healthcare and enterprise projects.",
    technologies: [".NET Core", "Angular", "PostgreSQL", "Redis"],
    year: "2022",
    companyLogo: avicennaLogo,
    techIcons: [dotnetIcon, angularIcon]
  },
  {
    id: 337,
    title: "Efsane - 3D Educational Game",
    category: "Game",
    description: "Interactive 3D educational game for learning Turkish history and culture.",
    technologies: ["Unity", "C#", "3D Graphics", "Mobile"],
    year: "2018",
    techIcons: [dotnetIcon]
  },
  {
    id: 344,
    title: "EDers - Online Learning Platform",
    category: "LMS",
    description: "Modern online learning platform with video streaming and interactive content.",
    technologies: ["Angular", "Node.js", "MongoDB", "WebRTC"],
    year: "2019",
    techIcons: [angularIcon]
  }
];

const categories = ["All", "Research", "Framework", "HIS", "Telemedicine", "LMS", "Social Responsibility", "Project Management", "Game", "Misc"];

const PortfolioSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return projects;
    return projects.filter(project => project.category === selectedCategory);
  }, [selectedCategory]);

  const getCategoryCount = (category: string) => {
    if (category === "All") return projects.length;
    return projects.filter(project => project.category === category).length;
  };

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-4">
            Portfolio & Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A showcase of {projects.length}+ enterprise projects spanning healthcare, education, gaming, and research domains
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
              className="github-card group copilot-shimmer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {project.companyLogo && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 p-1 flex-shrink-0">
                        <img 
                          src={project.companyLogo} 
                          alt={`${project.title} logo`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {project.category}
                      </Badge>
                      <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                        {project.title}
                      </CardTitle>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {project.year}
                </div>
                {project.techIcons && (
                  <div className="flex items-center gap-2 mb-2">
                    {project.techIcons.map((icon, iconIndex) => (
                      <div 
                        key={iconIndex}
                        className="w-6 h-6 rounded bg-white/10 p-1 floating-box"
                        style={{ animationDelay: `${iconIndex * 200}ms` }}
                      >
                        <img 
                          src={icon} 
                          alt="Technology"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
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
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">{projects.length}+</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">20+</div>
            <div className="text-sm text-muted-foreground">Years Experience</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">{categories.length - 1}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border/50">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Technologies</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;