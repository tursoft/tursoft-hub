import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, MapPin } from "lucide-react";
import EducationDetailDialog from './EducationDetailDialog';
import { educationRepo } from '@/repositories/EducationRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { 
  Education, 
  EducationData, 
  Course, 
  DatePeriod 
} from '@/models/Education';
import type { Company } from '@/models/Companies';

// Helper type for processed education with company details
type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
};

const EducationSection = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [educationData, setEducationData] = useState<EducationData | null>(null);
  const [processedEducations, setProcessedEducations] = useState<ProcessedEducation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEducation, setSelectedEducation] = useState<ProcessedEducation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load education data and process with company details
  useEffect(() => {
    const loadEducationData = async () => {
      try {
        // Load education data from repository
        const educations = await educationRepo.getList();
        
        // Get general info
        const response = await fetch('/src/data/education.json');
        const fullData = await response.json();
        const data: EducationData = {
          general: fullData.general,
          items: educations
        };
        setEducationData(data);

        // Process educations with company details
        const processed = await Promise.all(
          educations.map(async (edu) => {
            const company = await companiesRepo.getByCode(edu.companyCode);
            return {
              ...edu,
              companyName: company?.title,
              companyPhotoUrl: company?.photoUrl,
              companyCity: company?.city
            } as ProcessedEducation;
          })
        );
        setProcessedEducations(processed);

      } catch (error) {
        console.error('Failed to load education data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEducationData();
  }, []);

  // Handle education card click
  const handleEducationClick = (education: ProcessedEducation) => {
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

  return (
    <section id="education" className="py-20 bg-background education-bg">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto relative z-10">
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
          <div className="relative min-h-screen">
            {/* Main Timeline Line - Subtle and Dashed */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full border-l-2 border-dashed border-muted-foreground/20 z-10" />

            {/* Timeline Container with Overlapping Items */}
            <div className="relative">
              {[...processedEducations].slice().reverse().map((edu, index) => {
                const isHovered = hoveredCard === edu.code;
                const isLeft = index % 2 === 0;
                
                return (
                  <div 
                    key={edu.code}
                    className={`relative animate-slide-in mb-8 lg:mb-6`}
                    style={{ 
                      animationDelay: `${index * 0.2}s`,
                      marginTop: index > 0 ? (isLeft !== ((index - 1) % 2 === 0) ? '-2rem' : '0') : '0'
                    }}
                  >
                    {/* Timeline Dot - Enhanced Size and Visibility */}
                    <div className="hidden lg:block absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
                      <div className={`transition-all duration-300 rounded-full border-2 border-background flex items-center justify-center ${
                        isHovered 
                          ? 'w-12 h-12 bg-primary shadow-xl scale-110' 
                          : 'w-10 h-10 bg-background/70 border-muted-foreground/20 shadow-md'
                      }`}>
                        <GraduationCap className={`transition-all duration-300 ${
                          isHovered 
                            ? 'w-6 h-6 text-white scale-110' 
                            : 'w-5 h-5 text-muted-foreground/60'
                        }`} />
                      </div>
                    </div>

                    {/* Connector line (sibling) - placed under the card by being a sibling with lower z-index than card's z-10 */}
                    <div className="hidden lg:block absolute z-0" style={{
                      top: '52px',
                      transform: 'translateY(-50%)',
                      left: isLeft ? `calc(50% - 180px)` : 'calc(50% + 20px)',
                      width: '160px'
                    }}>
                      <div className={`h-0.5 w-full transition-colors duration-200 ${isHovered ? 'bg-primary/70' : 'bg-muted-foreground/30'}`} />
                    </div>

                    {/* Card Container */}
                    <div className={`lg:w-1/2 ${isLeft ? 'lg:pr-10' : 'lg:pl-10 lg:ml-auto'} relative`}>

                      {/* Mobile Timeline Elements */}
                      <div className="lg:hidden absolute left-4 top-8 w-0.5 h-full border-l-2 border-dashed border-muted-foreground/20" />
                      <div className={`lg:hidden absolute left-2 top-6 w-5 h-5 rounded-full border border-background shadow-sm flex items-center justify-center transition-all duration-300 ${
                        isHovered 
                          ? 'bg-primary shadow-lg border-primary/20' 
                          : 'bg-background/40 border-transparent'
                      }`}>
                        <GraduationCap className={`w-2 h-2 transition-all duration-300 ${
                          isHovered ? 'text-white scale-110' : 'text-muted-foreground/15'
                        }`} />
                      </div>

                      <Card 
                        className={`portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border transition-all duration-500 cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/10 lg:ml-0 relative z-10 ${
                          isHovered ? 'shadow-xl shadow-primary/20 scale-[1.005]' : ''
                        } ${isLeft ? 'lg:text-right' : 'lg:text-left'}`}
                        onMouseEnter={() => setHoveredCard(edu.code)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => handleEducationClick(edu)}
                      >
                        <CardHeader className="pb-4">
                          <div className={`flex items-start gap-4 ${isLeft ? 'lg:flex-row-reverse lg:text-right' : ''}`}>
                            {edu.companyPhotoUrl && (
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16">
                                  <img 
                                    src={edu.companyPhotoUrl} 
                                    alt={`${edu.companyName} logo`}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`mb-3 ${isLeft ? 'lg:text-right' : ''}`}>
                                <Badge variant="secondary" className="mb-2 text-xs bg-primary/10 text-primary border-primary/20">
                                  {edu.level}
                                </Badge>
                                <h3 className="text-xl font-bold text-foreground mb-1 leading-tight">
                                  {edu.department}
                                </h3>
                                <h4 className="text-lg font-semibold text-primary mb-2">
                                  {edu.companyName}
                                </h4>
                              </div>
                              
                              <div className={`flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3 ${
                                isLeft ? 'lg:justify-end' : ''
                              }`}>
                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1">
                                  <Calendar className="h-3 w-3" />
                                  <span className="font-medium">{edu.period}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="font-medium">{edu.companyCity}</span>
                                </div>
                              </div>

                              {/* Graduation info - Hidden in compact view */}
                              <div className={`text-sm text-primary font-medium transition-all duration-300 ${
                                hoveredCard === edu.code ? 'max-h-8 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0 overflow-hidden'
                              } ${isLeft ? 'lg:text-right' : ''}`}>
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                  Graduated: {edu.graduateDate} • GPA: {edu.graduateScore}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {/* Description - Hidden in compact view */}
                          <div className={`overflow-hidden transition-all duration-500 ${
                            hoveredCard === edu.code ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'
                          }`}>
                            <div className={`p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border-l-4 border-primary/30 ${
                              isLeft ? 'lg:text-right lg:border-r-4 lg:border-l-0 lg:bg-gradient-to-l' : ''
                            }`}>
                              <p className="text-muted-foreground leading-relaxed text-sm">
                                {edu.summary}
                              </p>
                            </div>
                          </div>

                          {/* Technologies - Hidden in compact view */}
                          <div className={`overflow-hidden transition-all duration-500 ${
                            hoveredCard === edu.code ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className={`${isLeft ? 'lg:text-right' : ''}`}>
                              <div className={`flex flex-wrap gap-1.5 ${isLeft ? 'lg:justify-end' : ''}`}>
                                {edu.skillCodes?.slice(0, 8).map((skillCode, i) => (
                                  <Badge 
                                    key={`${edu.code}-skill-${skillCode}-${i}`} 
                                    variant="outline" 
                                    className="text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    {skillCode}
                                  </Badge>
                                ))}
                                {edu.skillCodes && edu.skillCodes.length > 8 && (
                                  <Badge variant="outline" className="text-xs border-dashed bg-muted/20">
                                    +{edu.skillCodes.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
        educationIcon={selectedEducation?.companyPhotoUrl || undefined}
      />
    </section>
  );
};

export default EducationSection;