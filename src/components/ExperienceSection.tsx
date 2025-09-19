import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Building } from "lucide-react";

// Company logos
import jengaiLogo from "@/assets/logos/companies/jengai.png";
import gamyteLogo from "@/assets/logos/companies/gamyte.png";
import ercLogo from "@/assets/logos/companies/erc.png";
import dataselLogo from "@/assets/logos/companies/datasel.png";
import fonetLogo from "@/assets/logos/companies/fonet.png";
import haliciLogo from "@/assets/logos/companies/halici.png";

const ExperienceSection = () => {
  const experiences = [
    {
      company: "Gamyte",
      position: "Director of Technology & Senior Software Architect",
      duration: "Sep 2019 - Present",
      years: "6+ years",
      location: "Turkey",
      type: "Full-time",
      logo: gamyteLogo,
      description: [
        "Leading technology strategy and architecture decisions for enterprise gaming solutions",
        "Managing cross-functional development teams and R&D initiatives",
        "Architecting scalable, high-performance gaming platforms",
        "Driving digital transformation and innovation across the organization"
      ],
      technologies: ["C#", ".NET Core", "Microservices", "Azure", "React", "TypeScript"],
      current: true
    },
    {
      company: "ERC Group Engineering, Consultancy, R&D",
      position: "Senior Software Architect and Group Leader",
      duration: "May 2013 - Sep 2019",
      years: "6.3 years",
      location: "Turkey",
      type: "Full-time",
      logo: ercLogo,
      description: [
        "Led the architecture and development of enterprise-grade engineering solutions",
        "Managed multiple development teams across different product lines",
        "Designed and implemented scalable R&D management systems",
        "Collaborated with international clients on multi-million dollar projects"
      ],
      technologies: ["Java", "Spring", ".NET", "Oracle", "Angular", "JavaScript"],
      current: false
    },
    {
      company: "DataSel Information Systems Co.",
      position: "Senior Software Architect and Group Leader",
      duration: "Jan 2012 - May 2013",
      years: "1.8 years",
      location: "Turkey",
      type: "Full-time",
      logo: dataselLogo,
      description: [
        "Architected enterprise information management systems",
        "Led development teams in building data-driven applications",
        "Implemented performance optimization strategies for large-scale systems",
        "Mentored junior developers and established coding standards"
      ],
      technologies: ["C#", ".NET", "SQL Server", "WPF", "Silverlight", "WCF"],
      current: false
    },
    {
      company: "Fonet Software Co.",
      position: "Research & Development Director",
      duration: "Jan 2010 - Aug 2011",
      years: "1.9 years",
      location: "Turkey",
      type: "Full-time",
      logo: fonetLogo,
      description: [
        "Directed R&D initiatives for next-generation software products",
        "Established development methodologies and best practices",
        "Led innovation projects and proof-of-concept developments",
        "Managed technical roadmap and technology stack decisions"
      ],
      technologies: ["Java", "C#", ".NET", "Web Services", "MySQL", "JavaScript"],
      current: false
    },
    {
      company: "Gendarmerie Training Command",
      position: "Lieutenant",
      duration: "Sep 2008 - Sep 2009",
      years: "1 year",
      location: "Turkey",
      type: "Military Service",
      logo: jengaiLogo, // Will need to add proper logo
      description: [
        "Served as a Lieutenant in the Turkish Gendarmerie Training Command",
        "Led training programs and educational initiatives",
        "Managed personnel and administrative responsibilities",
        "Completed mandatory military service with leadership role"
      ],
      technologies: ["Leadership", "Training", "Administration", "Project Management"],
      current: false
    },
    {
      company: "Halıcı Informatics & Software Co.",
      position: "Software Production and Planning Director",
      duration: "Jan 2007 - Sep 2008",
      years: "4.7 years total",
      location: "Turkey",
      type: "Full-time",
      logo: haliciLogo,
      description: [
        "Oversaw software production lifecycle and project planning (2007-2008)",
        "Served as Project Manager and System Analyst (2005-2007)",
        "Worked as .NET Application Developer (2004-2005)",
        "Progressed through multiple roles showing career advancement"
      ],
      technologies: ["C#", ".NET", "ASP.NET", "SQL Server", "VB.NET", "Web Services"],
      current: false
    }
  ];

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
                    <h5 className="text-sm font-semibold text-foreground mb-2">Key Technologies:</h5>
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