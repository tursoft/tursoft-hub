import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Building2, 
  Code, 
  BookOpen,
  ExternalLink,
  Clock,
  Maximize2,
  Minimize2,
  Info,
  Wrench
} from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { Education, Course, DatePeriod } from '@/models/Education';

// ProcessedEducation type with company details
type ProcessedEducation = Education & {
  companyName?: string;
  companyPhotoUrl?: string | null;
  companyCity?: string | null;
};

interface EducationDetailDialogProps {
  education: ProcessedEducation | null;
  isOpen: boolean;
  onClose: () => void;
  educationIcon?: string;
}

const EducationDetailDialog: React.FC<EducationDetailDialogProps> = ({
  education,
  isOpen,
  onClose,
  educationIcon
}) => {
  const [technologyLogos, setTechnologyLogos] = useState<Record<string, string>>({});
  const [isMaximized, setIsMaximized] = useState(false);

  // Fetch technology logos when education changes
  useEffect(() => {
    const fetchLogos = async () => {
      if (!education?.skillCodes) return;
      
      const logos: Record<string, string> = {};
      for (const skillCode of education.skillCodes) {
        if (skillCode) {
          const logo = await skillsRepo.getPhotoUrlByCode(skillCode);
          if (logo) {
            logos[skillCode] = logo;
          }
        }
      }
      setTechnologyLogos(logos);
    };

    if (education?.skillCodes && education.skillCodes.length > 0) {
      fetchLogos();
    }
  }, [education?.skillCodes]);


  if (!education) return null;

  // Helper function to format date period
  const formatDatePeriod = (datePeriod: DatePeriod) => {
    if (!datePeriod?.startDate) return education.period;
    
    const formatDate = (dateStr: string) => {
      const [day, month, year] = dateStr.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    };
    
    const startFormatted = formatDate(datePeriod.startDate);
    const endFormatted = formatDate(datePeriod.endDate);
    
    return `${startFormatted} - ${endFormatted}`;
  };



  // Helper function to get GPA color
  const getGPAColor = (score: string) => {
    if (score.includes('AA') || score.includes('4.00') || parseFloat(score) >= 3.5) {
      return 'text-green-600';
    } else if (score.includes('BB') || parseFloat(score) >= 3.0) {
      return 'text-yellow-600';
    }
    return 'text-muted-foreground';
  };

  // Helper function to get score badge color
  const getScoreBadgeColor = (score: string) => {
    if (score === 'AA') return 'bg-green-100 text-green-800 border-green-200';
    if (score === 'BB') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score === 'CC') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-full max-h-full w-full h-full rounded-none' : 'max-w-full max-h-full w-full h-full rounded-none sm:max-w-[35vw] sm:max-h-[90vh] sm:w-[35vw] sm:h-auto sm:rounded-lg'} overflow-hidden`}>
        <DialogHeader className="pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMaximized(!isMaximized)}
            className="absolute top-4 right-12 z-10 h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {/* Logo positioned on the far left */}
          {educationIcon && (
            <div className="absolute top-4 left-8 z-10 w-16 h-16">
              <img 
                src={educationIcon} 
                alt={`${education.companyName} logo`}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
          <div className="flex items-start gap-4 pl-24">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {education.department}
                </DialogTitle>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">
                  Education
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {education.level}
                </Badge>
              </div>
              <div className="text-base text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{education.companyName}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDatePeriod(education.datePeriod)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{education.companyCity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Overview
              </span>
            </TabsTrigger>
            <TabsTrigger value="courses">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Courses
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {education.courses?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Skills
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {education.skillCodes?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-6">
              {/* Educational Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Degree Level</div>
                        <div className="text-lg font-semibold">{education.level}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Department</div>
                        <div className="text-lg font-semibold">{education.department}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Institution</div>
                        <div className="text-lg font-semibold">{education.companyName}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Graduation Date</div>
                        <div className="text-lg font-semibold">{education.graduateDate}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">GPA / Grade</div>
                        <div className={`text-lg font-semibold ${getGPAColor(education.graduateScore)}`}>
                          {education.graduateScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Location</div>
                        <div className="text-lg font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {education.companyCity}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              {education.courses && education.courses.length > 0 ? (
                <div className="space-y-4">
                      {education.courses.map((course, index) => (
                        <div key={`course-${index}`} className="p-4 bg-muted/20 rounded-lg border border-border/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                              {course.title}
                            </h4>
                            <Badge className={getScoreBadgeColor(course.score)}>
                              {course.score}
                            </Badge>
                          </div>
                          {course.content && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              <strong>Topics:</strong> {course.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No detailed course information available.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="technologies" className="space-y-2 min-h-[400px]">
              {education.skillCodes && education.skillCodes.length > 0 ? (
                <div className="px-4 py-2">
                  <div className={`grid grid-cols-1 gap-x-4 ${isMaximized ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-2'}`}>
                    {education.skillCodes.map((skillCode, index) => {
                      const logoPath = technologyLogos[skillCode] || "";
                      
                      return (
                        <div key={`skill-${skillCode}-${index}`}>
                          <div className="flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 hover:bg-muted/30 hover:shadow-sm cursor-default">
                            {logoPath && (
                              <img 
                                src={logoPath} 
                                alt={`${skillCode} logo`} 
                                className="w-5 h-5 object-contain flex-shrink-0" 
                                onError={(e) => {
                                  // Hide image if it fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-sm font-medium text-foreground">
                              {skillCode}
                            </span>
                          </div>
                          {index < education.skillCodes.length - 1 && (
                            <div className="border-b border-dashed border-border/50 mx-4"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No technology information available.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EducationDetailDialog;