import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Code, Database, Cloud, Smartphone, Layers, Globe, ChevronLeft, ChevronRight } from "lucide-react";

// Import technology logos
import angularLogo from "@/assets/logos/technologies/angular.png";
import csharpLogo from "@/assets/logos/technologies/csharp.png";
import dockerLogo from "@/assets/logos/technologies/docker.png";
import dotnetLogo from "@/assets/logos/technologies/dotnet.png";
import dotnetcoreLogo from "@/assets/logos/technologies/dotnetcore.png";
import ionicLogo from "@/assets/logos/technologies/ionic.png";
import javaLogo from "@/assets/logos/technologies/java.png";
import mysqlLogo from "@/assets/logos/technologies/mysql.png";
import nodejsLogo from "@/assets/logos/technologies/nodejs.png";
import reactLogo from "@/assets/logos/technologies/react.png";
import typescriptLogo from "@/assets/logos/technologies/typescript.png";

// Define interfaces for the new JSON structure
interface SkillGroup {
  id: number;
  name: string;
  title: string;
  orderIndex: number;
}

interface SkillItem {
  id: number;
  name: string;
  title: string;
  group: string;
  value: number;
  iconCss: string;
  projects: number;
  jobs: number;
  isMajor?: boolean;
  orderIndex?: number;
}

interface NewSkillsData {
  general: {
    title: string;
    summary: string;
    groups: SkillGroup[];
  };
  items: SkillItem[];
}

// Legacy interfaces for component compatibility
interface Skill {
  name: string;
  level: number;
  years: string;
}

interface SkillCategory {
  icon: string;
  title: string;
  skills: Skill[];
}

interface Tool {
  name: string;
  count: number;
  frequency: number;
  image?: string;
}

interface CoreExpertise {
  title: string;
  description: string;
  icon: string;
}

interface TransformedSkillsData {
  skillCategories: SkillCategory[];
  tools: Tool[];
  coreExpertise: CoreExpertise[];
}

// Helper function to convert projects count to frequency
const getFrequencyFromProjects = (projects: number): number => {
  if (projects >= 25) return 5;
  if (projects >= 15) return 4; 
  if (projects >= 8) return 3;
  if (projects >= 3) return 2;
  return 1;
};

// Map skill names to technology images
const getTechnologyImage = (skillName: string): string | undefined => {
  const nameToImage: { [key: string]: string } = {
    'Angular': angularLogo,
    'C#': csharpLogo,
    'Docker': dockerLogo,
    '.NET': dotnetLogo,
    '.NET Core': dotnetcoreLogo,
    'Ionic': ionicLogo,
    'Java': javaLogo,
    'MySQL': mysqlLogo,
    'Node.js': nodejsLogo,
    'React': reactLogo,
    'TypeScript': typescriptLogo
  };
  
  return nameToImage[skillName];
};

// Function to transform new data structure to legacy format
const transformSkillsData = (newData: NewSkillsData): TransformedSkillsData => {
  // Group items by their group property
  const groupedItems: { [key: string]: SkillItem[] } = {};
  newData.items.forEach(item => {
    if (!groupedItems[item.group]) {
      groupedItems[item.group] = [];
    }
    groupedItems[item.group].push(item);
  });

  // Map group names to icons
  const groupIconMap: { [key: string]: string } = {
    "Programming Language": "Code",
    "Framework": "Layers", 
    "Frontend": "Globe",
    "Backend": "Database",
    "Database": "Database",
    "Cloud Hosting": "Cloud",
    "Virtualization": "Cloud",
    "DevOps": "Cloud",
    "Web": "Globe",
    "Mobile": "Smartphone"
  };

  // Create skill categories for all groups, sorted by orderIndex and filtered to only include groups with skills
  const skillCategories: SkillCategory[] = newData.general.groups
    .filter(group => groupedItems[group.name] && groupedItems[group.name].length > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(group => {
      const groupName = group.name;
      const items = groupedItems[groupName];
      const skills: Skill[] = items
        .filter(item => item.isMajor || item.projects >= 5)
        .sort((a, b) => b.projects - a.projects)
        .slice(0, 6)
        .map(item => ({
          name: item.title,
          level: Math.min(95, Math.max(70, item.projects * 3 + 70)),
          years: item.projects > 20 ? "15+ years" : 
                 item.projects > 15 ? "12+ years" : 
                 item.projects > 10 ? "10+ years" : 
                 item.projects > 5 ? "5+ years" : "3+ years"
        }));

      return {
        icon: groupIconMap[groupName] || "Code",
        title: groupName,
        skills
      };
    })
    .filter(category => category.skills.length > 0);

  // Create tools array from all items, with frequency based on projects
  const tools: Tool[] = newData.items
    .filter(item => item.projects > 0)
    .map(item => ({
      name: item.title,
      count: item.projects,
      frequency: getFrequencyFromProjects(item.projects),
      image: getTechnologyImage(item.title)
    }));

  // Create core expertise (static for now)
  const coreExpertise: CoreExpertise[] = [
    {
      title: "Enterprise Architecture",
      description: "Designing scalable, secure, and maintainable enterprise systems with performance optimization",
      icon: "🏗️"
    },
    {
      title: "Team Leadership", 
      description: "Leading cross-functional development teams and establishing best practices across organizations",
      icon: "👥"
    },
    {
      title: "Full-Stack Development",
      description: "End-to-end development expertise from database design to responsive user interfaces",
      icon: "⚡"
    }
  ];

  return {
    skillCategories,
    tools,
    coreExpertise
  };
};

const SkillsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skillsData, setSkillsData] = useState<TransformedSkillsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create icon mapping for skill categories
  const iconMap = {
    Code,
    Database,
    Cloud,
    Smartphone,
    Layers,
    Globe
  };



  // Load skills data from JSON file
  useEffect(() => {
    const loadSkillsData = async () => {
      try {
        const response = await fetch('/src/data/data_new/skills.json');
        const newData: NewSkillsData = await response.json();
        const transformedData = transformSkillsData(newData);
        setSkillsData(transformedData);
      } catch (error) {
        console.error('Failed to load skills data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSkillsData();
  }, []);

  if (isLoading || !skillsData) {
    return (
      <section id="skills" className="py-20 gradient-bg">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      </section>
    );
  }

  const { skillCategories, tools, coreExpertise } = skillsData;

  // Function to get font size based on frequency
  const getImageSize = (frequency: number) => {
    switch (frequency) {
      case 5: return "w-12 h-12 lg:w-12 lg:h-12"; // Largest
      case 4: return "w-9 h-9 lg:w-9 lg:h-9";   // Large
      case 3: return "w-8 h-8 lg:w-8 lg:h-8";   // Medium
      case 2: return "w-6 h-6 lg:w-7 lg:h-7";   // Small
      case 1: return "w-4 h-4 lg:w-6 lg:h-6";   // Smallest
      default: return "w-2 h-2";
    }
  };

  const getTextSize = (frequency: number) => {
    switch (frequency) {
      case 5: return "text-3xl lg:text-3xl"; // Largest
      case 4: return "text-xl lg:text-2xl";  // Large
      case 3: return "text-lg lg:text-xl";   // Medium
      case 2: return "text-base lg:text-lg"; // Small
      case 1: return "text-sm lg:text-base"; // Smallest
      default: return "text-base";
    }
  };

  // Function to get color intensity based on frequency
  const getColorIntensity = (frequency: number) => {
    switch (frequency) {
      case 5: return "text-primary font-bold";
      case 4: return "text-primary font-semibold";
      case 3: return "text-primary font-medium";
      case 2: return "text-muted-foreground font-medium";
      case 1: return "text-muted-foreground/70 font-normal";
      default: return "text-muted-foreground";
    }
  };

  // Function to get hover scale based on frequency
  const getHoverScale = (frequency: number) => {
    switch (frequency) {
      case 5: return "hover:scale-125";
      case 4: return "hover:scale-120";
      case 3: return "hover:scale-115";
      case 2: return "hover:scale-110";
      case 1: return "hover:scale-105";
      default: return "hover:scale-110";
    }
  };

  // Coverflow navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? skillCategories.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === skillCategories.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Calculate transform and scale for each card based on position
  const getCardTransform = (index: number) => {
    const diff = index - currentIndex;
    const absIndex = Math.abs(diff);
    
    if (absIndex === 0) {
      // Center card
      return {
        transform: 'translateX(0) translateZ(0) rotateY(0deg) scale(1)',
        zIndex: 10,
        opacity: 1,
      };
    } else if (absIndex === 1) {
      // Adjacent cards
      const direction = diff > 0 ? 1 : -1;
      return {
        transform: `translateX(${direction * 280}px) translateZ(-100px) rotateY(${-direction * 35}deg) scale(0.85)`,
        zIndex: 5,
        opacity: 0.8,
      };
    } else if (absIndex === 2) {
      // Second level cards
      const direction = diff > 0 ? 1 : -1;
      return {
        transform: `translateX(${direction * 480}px) translateZ(-200px) rotateY(${-direction * 55}deg) scale(0.7)`,
        zIndex: 3,
        opacity: 0.5,
      };
    } else {
      // Hidden cards
      const direction = diff > 0 ? 1 : -1;
      return {
        transform: `translateX(${direction * 600}px) translateZ(-300px) rotateY(${-direction * 75}deg) scale(0.5)`,
        zIndex: 1,
        opacity: 0.2,
      };
    }
  };

  return (
    <section id="skills" className="py-20 gradient-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">Technical Expertise</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Skills &
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Technologies</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive expertise across the full technology stack with 20+ years of hands-on experience
            </p>
          </div>

          {/* Skills Coverflow */}
          <div className="mb-16">
            <div className="relative w-full max-w-6xl mx-auto">
              {/* Coverflow Container */}
              <div 
                ref={containerRef}
                className="relative h-[500px] flex items-center justify-center overflow-hidden"
                style={{
                  perspective: '1200px',
                  perspectiveOrigin: 'center center'
                }}
              >
                {skillCategories.map((category, index) => {
                  const cardStyle = getCardTransform(index);
                  return (
                    <div
                      key={index}
                      className="absolute cursor-pointer transition-all duration-700 ease-out"
                      style={{
                        ...cardStyle,
                        transformStyle: 'preserve-3d',
                        width: '320px',
                        height: '400px'
                      }}
                      onClick={() => goToSlide(index)}
                    >
                      <Card className="portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border h-full hover:shadow-2xl transition-shadow duration-300">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              {React.createElement(iconMap[category.icon as keyof typeof iconMap], { className: "h-6 w-6 text-primary" })}
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{category.title}</h3>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {category.skills.map((skill, skillIndex) => (
                              <div key={skillIndex} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-foreground">{skill.name}</span>
                                  <div className="text-right">
                                    <span className="text-xs text-primary font-medium">{skill.level}%</span>
                                    <div className="text-xs text-muted-foreground">{skill.years}</div>
                                  </div>
                                </div>
                                <Progress value={skill.level} className="h-2" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
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
                {skillCategories.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    onClick={() => goToSlide(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tools & Technologies */}
          <div className="animate-fade-in">
            <Card className="portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border">
              <CardHeader>
                <h3 className="text-2xl font-bold text-center text-foreground mb-4">
                  Technology Cloud
                </h3>
                <p className="text-center text-muted-foreground">
                  Technologies sized by frequency of use
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  {tools.map((tool, index) => (
                    <div 
                      key={index} 
                      className={`
                        cursor-pointer transition-all duration-300 tag-cloud-item
                        ${getColorIntensity(tool.frequency)}
                        ${getHoverScale(tool.frequency)}
                        hover:brightness-110 flex items-center gap-2 px-2 py-1 rounded-md
                        hover:bg-primary/10 hover:shadow-md
                      `}
                      style={{ '--delay': `${(index * 0.1) % 3}s` } as React.CSSProperties}
                      title={`${tool.name} - ${tool.count} Projects`}
                    >
                      {tool.image ? (
                        <img 
                          src={tool.image} 
                          alt={tool.name}
                          className={`${getImageSize(tool.frequency)} opacity-80`}
                        />
                      ) : (
                        <span className={`${getTextSize(tool.frequency)} opacity-80 font-medium text-primary`}>●</span>
                      )}
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Core Expertise */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-foreground">Core Expertise</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {coreExpertise.map((item, index) => (
                <Card 
                  key={index} 
                  className="portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border text-center animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h4 className="text-lg font-semibold mb-3 text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;