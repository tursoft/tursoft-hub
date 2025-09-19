import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Building } from "lucide-react";

// Define interfaces for the data structure
interface Technology {
  name: string;
  type: string;
}

interface Project {
  name: string;
  title: string;
}

interface Domain {
  name: string;
  title: string;
  value: number;
  iconCss: string;
}

interface Position {
  id: number;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string;
  domains?: Domain[];
  projects?: Project[];
  technologies: Technology[];
}

interface Experience {
  id: number;
  orderIndex: number;
  icon: string;
  companyCode: string;
  companyName: string;
  positions: Position[];
}

interface ExperiencesData {
  general: {
    title: string;
    summary: string;
    total_years: number;
    prop_subitems: string;
  };
  items: Experience[];
}

const ExperienceSection = () => {
  const [experiencesData, setExperiencesData] = useState<ExperiencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load experiences data from JSON file
  useEffect(() => {
    const loadExperiencesData = async () => {
      try {
        const response = await fetch('/src/data/data_new/experiences.json');
        const data: ExperiencesData = await response.json();
        setExperiencesData(data);
      } catch (error) {
        console.error('Failed to load experiences data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiencesData();
  }, []);

  // Helper function to format date ranges and calculate duration
  const formatDateRange = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate.split('.').reverse().join('-'));
    const end = endDate ? new Date(endDate.split('.').reverse().join('-')) : new Date();
    
    const startMonth = start.toLocaleString('en', { month: 'short' });
    const startYear = start.getFullYear();
    
    if (!endDate) {
      return {
        range: `${startMonth} ${startYear} - Present`,
        duration: `${Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))}+ years`,
        current: true
      };
    }
    
    const endMonth = end.toLocaleString('en', { month: 'short' });
    const endYear = end.getFullYear();
    
    const years = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(((end.getTime() - start.getTime()) % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    let duration = '';
    if (years > 0) duration += `${years} year${years > 1 ? 's' : ''}`;
    if (months > 0) duration += `${duration ? ' ' : ''}${months} month${months > 1 ? 's' : ''}`;
    
    return {
      range: `${startMonth} ${startYear} - ${endMonth} ${endYear}`,
      duration: duration || '< 1 month',
      current: false
    };
  };

  // Process experiences to flatten positions into individual experience entries
  const getProcessedExperiences = () => {
    if (!experiencesData) return [];

    interface ProcessedExperience {
      company: string;
      position: string;
      duration: string;
      years: string;
      location: string;
      type: string;
      logo: string;
      description: string[];
      technologies: string[];
      current: boolean;
    }

    const processedExperiences: ProcessedExperience[] = [];
    
    experiencesData.items.forEach(company => {
      company.positions.forEach(position => {
        const dateInfo = formatDateRange(position.startDate, position.endDate);
        
        // Process description - handle both HTML and plain text
        let description: string[] = [];
        if (position.summary.includes('<br/>')) {
          description = position.summary.split('<br/>').map(item => item.trim()).filter(item => item);
        } else {
          description = [position.summary];
        }
        
        processedExperiences.push({
          company: company.companyName,
          position: position.title,
          duration: dateInfo.range,
          years: dateInfo.duration,
          location: "Turkey", // Default location from original data
          type: dateInfo.current ? "Current" : "Full-time",
          logo: `/src/assets/logos/companies/${company.icon}`,
          description: description,
          technologies: position.technologies.slice(0, 6).map(tech => tech.name), // Limit to first 6 technologies
          current: dateInfo.current
        });
      });
    });

    return processedExperiences.sort((a, b) => new Date(b.duration.split(' - ')[0]).getTime() - new Date(a.duration.split(' - ')[0]).getTime());
  };

  if (isLoading || !experiencesData) {
    return (
      <section id="experience" className="py-20 gradient-bg">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-pulse">Loading experiences...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const experiences = getProcessedExperiences();

  return (
    <section id="experience" className="py-20 gradient-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">Professional Experience</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Building Tomorrow's
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Technology Today</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A journey through enterprise software development, team leadership, and architectural excellence
            </p>
          </div>

          {/* Experience Timeline */}
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <Card 
                key={index} 
                className={`portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-l-4 border-l-primary ${
                  exp.current ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold text-foreground uppercase">{exp.company}</h3>
                        {exp.current && (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            Current
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-primary mb-2">{exp.position}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>{exp.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{exp.location}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {exp.years}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 lg:w-28 lg:h-28 flex items-center justify-center p-2">
                        <img 
                          src={exp.logo} 
                          alt={`${exp.company} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Description */}
                  <div className="mb-6">
                    <ul className="space-y-2">
                      {exp.description.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technologies */}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;