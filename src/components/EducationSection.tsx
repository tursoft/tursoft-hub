import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Calendar, MapPin } from "lucide-react";

const EducationSection = () => {
  const education = [
    {
      degree: "Graduate School Department of Software Management",
      institution: "Middle East Technical University",
      location: "Ankara",
      period: "01.09.2012 - 01.02.2013",
      graduation: "February 2013",
      type: "Master's Program",
      description: "Advanced software management methodologies, project leadership, and enterprise architecture principles",
      focus: ["Software Project Management", "Enterprise Architecture", "Team Leadership", "Quality Assurance"],
      logo: "/src/assets/logos/companies/metu.png"
    },
    {
      degree: "Graduate School Computer Education and Instructional Technologies Department",
      institution: "Middle East Technical University", 
      location: "Ankara",
      period: "15.09.2004 - 15.09.2007",
      graduation: "September 2007",
      type: "Master's Degree",
      description: "Computer education methodologies, instructional technology design, and educational software development",
      focus: ["Educational Technology", "Software Development", "Human-Computer Interaction", "E-Learning Systems"],
      logo: "/src/assets/logos/companies/metu.png"
    },
    {
      degree: "Undergraduate School Computer Education and Instructional Technologies Department",
      institution: "Middle East Technical University",
      location: "Ankara", 
      period: "15.09.1999 - 15.06.2004",
      graduation: "June 2004",
      type: "Bachelor's Degree",
      description: "Foundation in computer science, programming, and educational technology applications",
      focus: ["Computer Programming", "Database Systems", "Web Development", "Software Engineering"],
      logo: "/src/assets/logos/companies/metu.png"
    },
    {
      degree: "High School Computer Programming Branch",
      institution: "Kocaeli Technical High School",
      location: "Kocaeli",
      period: "15.09.1996 - 15.06.1999", 
      graduation: "June 1999",
      type: "Technical High School",
      description: "Technical foundation in computer programming and software development fundamentals",
      focus: ["Programming Fundamentals", "Computer Systems", "Technical Mathematics", "Logic Design"],
      logo: "/src/assets/logos/companies/meb.png"
    }
  ];

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
              Strong academic foundation from one of Turkey's most prestigious technical universities
            </p>
          </div>

          {/* Education Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-primary/20" />

            <div className="space-y-12">
              {education.map((edu, index) => (
                <div 
                  key={index}
                  className={`relative animate-slide-in ${
                    index % 2 === 0 ? 'lg:pr-1/2' : 'lg:pl-1/2 lg:ml-auto'
                  }`}
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  {/* Timeline Dot */}
                  <div className="hidden lg:block absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background z-10" />

                  <Card className={`portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border ${
                    index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'
                  }`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2 text-xs">
                            {edu.type}
                          </Badge>
                          <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
                            {edu.degree}
                          </h3>
                          <h4 className="text-lg font-semibold text-primary mb-3">
                            {edu.institution}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{edu.period}</span>
                            </div>
                            <div className="flex items-center gap-1">  
                              <MapPin className="h-4 w-4" />
                              <span>{edu.location}</span>
                            </div>
                          </div>

                          <div className="text-sm text-primary font-medium mb-4">
                            Graduated: {edu.graduation}
                          </div>
                        </div>
                        {edu.logo && (
                          <div className="flex-shrink-0">
                            <img 
                              src={edu.logo} 
                              alt={`${edu.institution} logo`}
                              className="w-16 h-16 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {edu.description}
                      </p>

                      <div>
                        <div className="flex flex-wrap gap-2">
                          {edu.focus.map((area, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
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
    </section>
  );
};

export default EducationSection;