import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Code, Database, Cloud, Smartphone, Layers, Globe, ChevronLeft, ChevronRight } from "lucide-react";

// Define interfaces for type safety
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
  icon: string;
  frequency: number;
}

interface CoreExpertise {
  title: string;
  description: string;
  icon: string;
}

interface SkillsData {
  skillCategories: SkillCategory[];
  tools: Tool[];
  coreExpertise: CoreExpertise[];
}

const SkillsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
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
        const response = await fetch('/src/data/skills.json');
        const data: SkillsData = await response.json();
        setSkillsData(data);
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
  const getFontSize = (frequency: number) => {
    switch (frequency) {
      case 5: return "text-2xl lg:text-3xl"; // Largest
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
                  Technologies sized by frequency of use - larger means more commonly used in projects
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  {tools.map((tool, index) => (
                    <div 
                      key={index} 
                      className={`
                        cursor-pointer transition-all duration-300 tag-cloud-item
                        ${getFontSize(tool.frequency)} 
                        ${getColorIntensity(tool.frequency)}
                        ${getHoverScale(tool.frequency)}
                        hover:brightness-110 flex items-center gap-2 px-2 py-1 rounded-md
                        hover:bg-primary/10 hover:shadow-md
                      `}
                      style={{ '--delay': `${(index * 0.1) % 3}s` } as React.CSSProperties}
                      title={`${tool.name} - Experience Level: ${tool.frequency}/5`}
                    >
                      <span className={`${getFontSize(tool.frequency)} opacity-80`}>{tool.icon}</span>
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
                
                {/* Legend */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span>Most Used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-primary/70 rounded-full"></div>
                    <span>Frequently Used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/50 rounded-full"></div>
                    <span>Regularly Used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                    <span>Occasionally Used</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-muted-foreground/70 rounded-full"></div>
                    <span>Specialized</span>
                  </div>
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