import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Building, ExternalLink, Linkedin } from "lucide-react";

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
  websiteUrl?: string;
  linkedinUrl?: string;
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

  // Process experiences to group positions by company
  const getProcessedExperiences = () => {
    if (!experiencesData) return [];

    interface ProcessedPosition {
      title: string;
      duration: string;
      years: string;
      description: string[];
      technologies: string[];
      current: boolean;
      startDate: string;
    }

    interface ProcessedExperience {
      company: string;
      logo: string;
      websiteUrl?: string;
      linkedinUrl?: string;
      positions: ProcessedPosition[];
      location: string;
    }

    const processedExperiences: ProcessedExperience[] = [];
    
    experiencesData.items.forEach(company => {
      const positions: ProcessedPosition[] = [];
      
      company.positions.forEach(position => {
        const dateInfo = formatDateRange(position.startDate, position.endDate);
        
        // Process description - handle both HTML and plain text
        let description: string[] = [];
        if (position.summary.includes('<br/>')) {
          description = position.summary.split('<br/>').map(item => item.trim()).filter(item => item);
        } else {
          description = [position.summary];
        }
        
        positions.push({
          title: position.title,
          duration: dateInfo.range,
          years: dateInfo.duration,
          description: description,
          technologies: position.technologies.slice(0, 6).map(tech => tech.name),
          current: dateInfo.current,
          startDate: position.startDate
        });
      });

      // Sort positions by start date (most recent first)
      positions.sort((a, b) => new Date(b.startDate.split('.').reverse().join('-')).getTime() - new Date(a.startDate.split('.').reverse().join('-')).getTime());
      
      processedExperiences.push({
        company: company.companyName,
        logo: `/src/assets/logos/companies/${company.icon}`,
        websiteUrl: company.websiteUrl,
        linkedinUrl: company.linkedinUrl,
        positions: positions,
        location: "Turkey" // Default location from original data
      });
    });

    // Sort companies by the most recent position's start date
    return processedExperiences.sort((a, b) => {
      const aLatest = new Date(a.positions[0].startDate.split('.').reverse().join('-'));
      const bLatest = new Date(b.positions[0].startDate.split('.').reverse().join('-'));
      return bLatest.getTime() - aLatest.getTime();
    });
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
          <div className="space-y-8 pl-6">
            {experiences.map((exp, index) => {
              const hasCurrent = exp.positions.some(pos => pos.current);
              return (
                <Card 
                  key={index} 
                  className={`portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card hover:border-l-4 hover:border-l-primary transition-all duration-200 relative ${
                    hasCurrent ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  {/* Company Logo and Links - Top Right Corner */}
                  <div className="absolute top-4 right-4 flex flex-col items-center">
                    <div className="w-16 h-16 flex items-center justify-center p-1 mb-2">
                      <img 
                        src={exp.logo} 
                        alt={`${exp.company} logo`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    
                    {/* Company Links */}
                    {(exp.websiteUrl || exp.linkedinUrl) && (
                      <div className="flex items-center gap-1">
                        {exp.websiteUrl && (
                          <a 
                            href={exp.websiteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Visit Website"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {exp.linkedinUrl && (
                          <a 
                            href={exp.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Visit LinkedIn"
                          >
                            <Linkedin className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-4 pr-24">
                    <div className="flex items-center gap-3 mb-4">
                      <Building className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold text-foreground uppercase">{exp.company}</h3>
                      {hasCurrent && (
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{exp.location}</span>
                      </div>
                    </div>

                    {/* Multiple Positions */}
                    <div className="space-y-6">
                      {exp.positions.map((position, posIndex) => (
                        <div key={posIndex} className={`${posIndex > 0 ? 'pt-6 border-t border-border/50' : ''}`}>
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-semibold text-primary flex-1">{position.title}</h4>
                            <div className="flex flex-col items-end gap-1 ml-4">
                              <Badge variant="secondary" className="text-xs">
                                {position.years}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                <span>{position.duration}</span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="mb-4">
                            <div className="space-y-2">
                              {position.description.map((item, i) => (
                                <p key={i} className="text-muted-foreground text-sm">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* Technologies */}
                          <div>
                            <div className="flex flex-wrap gap-2">
                              {position.technologies.map((tech, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;