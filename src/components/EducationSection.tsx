import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, MapPin } from "lucide-react";
import EducationDetailDialog from './EducationDetailDialog';

// Define interfaces for the data structure
interface Course {
  name: string;
  score: string;
  content: string;
}

interface Technology {
  name: string;
  type: string;
}

interface DatePeriod {
  startDate: string;
  endDate: string;
}

interface Education {
  id: number;
  orderIndex: number;
  icon: string;
  url?: string;
  code: string;
  name: string;
  department: string;
  level: string;
  period: string;
  datePeriod: DatePeriod;
  city: string;
  graduateDate: string;
  graduateScore: string;
  courses?: Course[];
  technologies?: Technology[];
}

interface EducationData {
  general: {
    title: string;
    summary: string;
  };
  items: Education[];
}

const EducationSection = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [educationData, setEducationData] = useState<EducationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [educationIconMap, setEducationIconMap] = useState<{ [key: string]: string }>({});

  // Load education data from JSON file
  useEffect(() => {
    const loadEducationData = async () => {
      try {
        const response = await fetch('/data/education.json');
        const data: EducationData = await response.json();
        setEducationData(data);

        // Create education icon map using direct asset paths
        const educationIcons: { [key: string]: string } = {};
        for (const education of data.items) {
          if (education.icon) {
            // Use direct asset path for reliable loading in production
            educationIcons[education.code] = `/assets/logos/companies/${education.icon}`;
          }
        }
        setEducationIconMap(educationIcons);

      } catch (error) {
        console.error('Failed to load education data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEducationData();
  }, []);

  // Process education data to match the expected format
  const getProcessedEducation = () => {
    if (!educationData) return [];

    return educationData.items.map(item => ({
      degree: `${item.level} ${item.department}`,
      institution: item.name,
      location: item.city,
      period: `${item.datePeriod.startDate} - ${item.datePeriod.endDate}`,
      graduation: item.graduateDate,
      type: item.level,
      description: `Advanced studies in ${item.department.toLowerCase()}${item.graduateScore ? ` with GPA: ${item.graduateScore}` : ''}`,
      focus: item.technologies?.slice(0, 6).map(tech => tech.name) || [],
      logo: `/assets/logos/companies/${item.icon}`,
      score: item.graduateScore,
      url: item.url
    }));
  };

  // Handle education card click
  const handleEducationClick = (education: Education) => {
    setSelectedEducation(education);
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedEducation(null);
  };

  if (isLoading || !educationData) {
    return (
      <section id="education" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-pulse">Loading education...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const education = getProcessedEducation();

  return (
    <section id="education" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">Academic Background</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Educational
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Foundation</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {educationData.general.summary}
            </p>
          </div>

          {/* Education Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-primary/20" />

            <div className="space-y-12">
              {educationData.items.map((edu, index) => {
                const isHovered = hoveredCard === index;
                return (
                  <div 
                    key={edu.id}
                    className={`relative animate-slide-in ${
                      index % 2 === 0 ? 'lg:pr-1/2' : 'lg:pl-1/2 lg:ml-auto'
                    }`}
                    style={{ animationDelay: `${index * 0.3}s` }}
                  >
                  {/* Timeline Dot */}
                  <div className="hidden lg:block absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background z-10" />

                  <Card 
                    className={`portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl ${
                      index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'
                    }`}
                    onMouseEnter={() => setHoveredCard(edu.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleEducationClick(edu)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {edu.level}
                          </Badge>
                          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
                            {edu.department}
                          </h3>
                          <h4 className="text-lg font-semibold text-primary mb-3">
                            {edu.name}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{edu.period}</span>
                            </div>
                            <div className="flex items-center gap-1">  
                              <MapPin className="h-4 w-4" />
                              <span>{edu.city}</span>
                            </div>
                          </div>

                          <div className="text-sm text-primary font-medium mb-4">
                            Graduated: {edu.graduateDate} • GPA: {edu.graduateScore}
                          </div>
                        </div>
                        {educationIconMap[edu.code] && (
                          <div className="flex-shrink-0">
                            <img 
                              src={educationIconMap[edu.code]} 
                              alt={`${edu.name} logo`}
                              className="w-16 h-16 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Description - Hidden in compact view */}
                      <div className={`overflow-hidden transition-all duration-300 ${
                        hoveredCard === edu.id ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
                      }`}>
                        <p className="text-muted-foreground leading-relaxed">
                          Advanced studies in {edu.department.toLowerCase()}. Focused on modern technologies and methodologies in educational technology and software development.
                        </p>
                      </div>

                      {/* Technologies - Hidden in compact view */}
                      <div className={`overflow-hidden transition-all duration-300 ${
                        hoveredCard === edu.id ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="flex flex-wrap gap-2">
                          {edu.technologies?.slice(0, 6).map((tech, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tech.name}
                            </Badge>
                          ))}
                          {edu.technologies && edu.technologies.length > 6 && (
                            <Badge variant="outline" className="text-xs border-dashed">
                              +{edu.technologies.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                );
              })}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center animate-fade-in">
            <Card className="portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border max-w-2xl mx-auto">
              <CardContent className="p-8">
                <GraduationCap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Continuous Learning
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  My educational journey has provided me with a strong theoretical foundation 
                  that complements my practical experience. I continue to stay updated with 
                  the latest technologies and industry best practices through ongoing 
                  professional development and certifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Education Detail Dialog */}
      <EducationDetailDialog 
        education={selectedEducation}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        educationIcon={selectedEducation ? educationIconMap[selectedEducation.code] : undefined}
      />
    </section>
  );
};

export default EducationSection;