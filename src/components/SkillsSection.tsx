import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Code, Database, Cloud, Smartphone, Layers, Globe } from "lucide-react";

const SkillsSection = () => {
  const skillCategories = [
    {
      icon: Code,
      title: "Programming Languages",
      skills: [
        { name: "C#", level: 95, years: "15+ years" },
        { name: "Java", level: 90, years: "12+ years" },
        { name: "JavaScript", level: 88, years: "10+ years" },
        { name: "TypeScript", level: 85, years: "6+ years" },
        { name: "Python", level: 75, years: "4+ years" },
        { name: "PHP", level: 80, years: "8+ years" }
      ]
    },
    {
      icon: Layers,
      title: "Frameworks & Libraries",
      skills: [
        { name: ".NET Core", level: 95, years: "8+ years" },
        { name: "ASP.NET MVC", level: 92, years: "12+ years" },
        { name: "Spring Framework", level: 88, years: "10+ years" },
        { name: "React", level: 85, years: "5+ years" },
        { name: "Angular", level: 82, years: "6+ years" },
        { name: "Vue.js", level: 78, years: "3+ years" }
      ]
    },
    {
      icon: Database,
      title: "Databases & Storage",
      skills: [
        { name: "SQL Server", level: 92, years: "15+ years" },
        { name: "Oracle", level: 88, years: "12+ years" },
        { name: "MySQL", level: 85, years: "10+ years" },
        { name: "PostgreSQL", level: 80, years: "6+ years" },
        { name: "MongoDB", level: 75, years: "4+ years" },
        { name: "Redis", level: 78, years: "5+ years" }
      ]
    },
    {
      icon: Cloud,
      title: "Cloud & DevOps",
      skills: [
        { name: "Azure", level: 85, years: "6+ years" },
        { name: "AWS", level: 78, years: "4+ years" },
        { name: "Docker", level: 82, years: "5+ years" },
        { name: "Kubernetes", level: 75, years: "3+ years" },
        { name: "CI/CD", level: 88, years: "8+ years" },
        { name: "Microservices", level: 90, years: "7+ years" }
      ]
    },
    {
      icon: Smartphone,
      title: "Mobile Development",
      skills: [
        { name: "Xamarin", level: 85, years: "6+ years" },
        { name: "React Native", level: 78, years: "3+ years" },
        { name: "Flutter", level: 70, years: "2+ years" },
        { name: "Ionic", level: 75, years: "4+ years" },
        { name: "PhoneGap", level: 80, years: "5+ years" }
      ]
    },
    {
      icon: Globe,
      title: "Web Technologies",
      skills: [
        { name: "HTML5/CSS3", level: 92, years: "15+ years" },
        { name: "Sass/SCSS", level: 88, years: "8+ years" },
        { name: "Bootstrap", level: 90, years: "10+ years" },
        { name: "Tailwind CSS", level: 85, years: "3+ years" },
        { name: "REST APIs", level: 95, years: "12+ years" },
        { name: "GraphQL", level: 80, years: "3+ years" }
      ]
    }
  ];

  const tools = [
    { name: "Visual Studio", icon: "🔧" },
    { name: "IntelliJ IDEA", icon: "💡" },
    { name: "VS Code", icon: "📝" },
    { name: "Eclipse", icon: "🌙" },
    { name: "Git", icon: "🔄" },
    { name: "SVN", icon: "📋" },
    { name: "Jira", icon: "📊" },
    { name: "Azure DevOps", icon: "☁️" },
    { name: "Jenkins", icon: "🔨" },
    { name: "Postman", icon: "📮" },
    { name: "Swagger", icon: "📚" },
    { name: "Docker Desktop", icon: "🐳" },
    { name: "Kubernetes", icon: "⚙️" },
    { name: "Terraform", icon: "🏗️" },
    { name: "Ansible", icon: "🔧" },
    { name: "Selenium", icon: "🤖" },
    { name: "JUnit", icon: "✅" },
    { name: "NUnit", icon: "🧪" },
    { name: "Entity Framework", icon: "🗃️" },
    { name: "Hibernate", icon: "💾" },
    { name: "Node.js", icon: "🟢" },
    { name: "Express.js", icon: "🚀" },
    { name: "Webpack", icon: "📦" },
    { name: "Babel", icon: "🔄" }
  ];

  // Add frequency to existing tools based on usage patterns
  const toolsWithFrequency = tools.map(tool => {
    // Define frequency based on most commonly used technologies
    const highFrequencyTools = ["Visual Studio", ".NET Core", "ASP.NET MVC", "Entity Framework", "SQL Server", "Git", "Angular", "JavaScript", "Azure", "Oracle", "Java", "Spring Framework", "HTML5", "CSS3"];
    const mediumHighFrequencyTools = ["TypeScript", "Docker", "MySQL", "jQuery", "Bootstrap", "WPF", "WCF", "LINQ", "Node.js", "React", "Hibernate", "Jenkins", "Kubernetes", "VS Code", "Ionic"];
    const mediumFrequencyTools = ["AWS", "MongoDB", "Redis", "Xamarin", "AngularJS", "Silverlight", "Eclipse", "IntelliJ IDEA", "Maven", "NPM", "NuGet", "GitLab", "GitHub", "TFS", "JSON", "XML", "Express.js", "VB.NET", "Hangfire", "Jasper Reports", "Ubuntu", "VMware"];
    
    let frequency = 1; // Default for specialized/legacy tools
    
    if (highFrequencyTools.includes(tool.name)) {
      frequency = 5;
    } else if (mediumHighFrequencyTools.includes(tool.name)) {
      frequency = 4;
    } else if (mediumFrequencyTools.includes(tool.name)) {
      frequency = 3;
    } else {
      // Check if it's occasionally used (level 2)
      const occasionalTools = ["PostgreSQL", "Redis", "Mercurial", "SourceTree", "TortoiseHG"];
      if (occasionalTools.includes(tool.name)) {
        frequency = 2;
      }
    }
    
    return { ...tool, frequency };
  });

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

          {/* Skills Carousel */}
          <div className="mb-16">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-5xl mx-auto"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {skillCategories.map((category, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/2">
                    <Card className="portfolio-card portfolio-light-streak portfolio-glow-pulse gradient-card border-border h-full">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <category.icon className="h-5 w-5 text-primary" />
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
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
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
                  {toolsWithFrequency.map((tool, index) => (
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
              {[
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
              ].map((item, index) => (
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