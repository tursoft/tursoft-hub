import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Building2, 
  Code, 
  BookOpen, 
  Award,
  ExternalLink,
  Clock,
  Trophy,
  Globe,
  ChevronDown,
  ChevronRight
} from "lucide-react";

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

interface EducationDetailDialogProps {
  education: Education | null;
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
  // State for expandable technology groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Initialize expanded state when education changes
  useEffect(() => {
    if (education?.technologies) {
      const groupedTechs = education.technologies.reduce((acc, tech) => {
        if (!acc[tech.type]) {
          acc[tech.type] = [];
        }
        acc[tech.type].push(tech);
        return acc;
      }, {} as Record<string, Technology[]>);
      
      const initialExpandedState = Object.keys(groupedTechs).reduce((acc, type) => {
        acc[type] = true; // Default to expanded
        return acc;
      }, {} as Record<string, boolean>);
      setExpandedGroups(initialExpandedState);
    }
  }, [education]);

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

  // Group technologies by type
  const groupedTechnologies = education.technologies?.reduce((acc, tech) => {
    if (!acc[tech.type]) {
      acc[tech.type] = [];
    }
    acc[tech.type].push(tech);
    return acc;
  }, {} as Record<string, Technology[]>) || {};

  // Toggle function for expanding/collapsing technology groups
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
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
      <DialogContent className="max-w-4xl max-h-[90vh] min-h-[400px] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-start gap-4">
            {educationIcon && (
              <div className="w-16 h-16 flex-shrink-0">
                <img 
                  src={educationIcon} 
                  alt={`${education.name} logo`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {education.department}
                </DialogTitle>
                <Badge variant="outline" className="text-xs">
                  {education.level}
                </Badge>
              </div>
              <DialogDescription className="text-base text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{education.name}</span>
                  {education.url && (
                    <a 
                      href={education.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDatePeriod(education.datePeriod)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{education.city}</span>
                  </div>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">
              <span className="flex items-center gap-2">
                Courses
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {education.courses?.length || 0}
                </Badge>
              </span>
            </TabsTrigger>
            <TabsTrigger value="technologies">
              <span className="flex items-center gap-2">
                Technologies
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {education.technologies?.length || 0}
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
                    <GraduationCap className="w-5 h-5" />
                    Academic Achievement
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
                        <div className="text-lg font-semibold">{education.name}</div>
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
                          {education.city}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Focus */}
              {education.technologies && education.technologies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Academic Focus Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {education.technologies.slice(0, 8).map((tech, index) => (
                        <Badge key={index} variant="secondary">
                          {tech.name}
                        </Badge>
                      ))}
                      {education.technologies.length > 8 && (
                        <Badge variant="outline" className="border-dashed">
                          +{education.technologies.length - 8} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            <TabsContent value="courses" className="space-y-6">
              {education.courses && education.courses.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Course Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {education.courses.map((course, index) => (
                        <div key={index} className="p-4 bg-muted/20 rounded-lg border border-border/50">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground">{course.name}</h4>
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
                  </CardContent>
                </Card>
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
              {Object.keys(groupedTechnologies).length > 0 ? (
                Object.entries(groupedTechnologies).map(([type, techs]) => {
                  const isExpanded = expandedGroups[type] ?? true; // Default to expanded
                  return (
                    <div key={type} className="px-4 py-1">
                      <button
                        onClick={() => toggleGroup(type)}
                        className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1 transition-colors border-t border-b border-border/30"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                          {type}
                        </h3>
                        <span className="text-xs text-muted-foreground ml-auto">
                          ({techs.length})
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-6">
                          {techs.map((tech, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="text-xs px-2 py-1 hover:bg-primary/10 transition-colors"
                            >
                              {tech.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
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