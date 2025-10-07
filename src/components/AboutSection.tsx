import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Users, Award, Briefcase } from "lucide-react";

const AboutSection = () => {
  const highlights = [
    {
      icon: Briefcase,
      title: "25+ Years Experience", 
      description: "Leading enterprise software development projects worldwide"
    },
    {
      icon: Users,
      title: "Team Leadership",
      description: "Director of Technology, R&D Director, and Project Manager roles"
    },
    {
      icon: Code,
      title: "Full-Stack Expertise",
      description: ".NET, Java, Web, and Mobile development technologies"
    },
    {
      icon: Award,
      title: "Enterprise Systems",
      description: "World-class systems with exceptional performance and scalability"
    }
  ];

  const roles = [
    "Software Group Director",
    "Research & Development Director",
    "Software Architect",
    "Software Team Leader"
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">About Me</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Transforming Ideas Into 
              <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Digital Reality</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              I lead development of enterprise systems that deliver world-class functionality and performance while prioritizing scalability, maintainability, fault tolerance, and rapid extensibility.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Column - Story */}
            <div className="animate-slide-in">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">My Journey</h3>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Throughout my professional career, I have taken the <span className="text-primary font-semibold">leadership</span> of various <span className="text-primary font-semibold">enterprise projects</span> within software companies that are significant players 
                  in their sectors. As part of <span className="text-primary font-semibold">international companies</span>, we have completed <span className="text-primary font-semibold">multi-million dollar</span> software projects all over the world.
                </p>
                <p>
                  My mission is to lead both <span className="text-primary font-semibold">research and development</span> teams to produce <span className="text-primary font-semibold">world-class innovative systems</span> in terms of both functional and technical quality. 
                  I bring a unique combination of <span className="text-primary font-semibold">technical expertise</span> and <span className="text-primary font-semibold">leadership experience</span> to every project.
                </p>
                <p>
                  Currently serving as <span className="text-primary font-semibold">Director of Technology</span> & <span className="text-primary font-semibold">Senior Software Architect</span> at Gamyte,
                  I continue to push the boundaries of what's possible in <span className="text-primary font-semibold">enterprise software development</span> and <span className="text-primary font-semibold">gaming technology</span>.
                </p>
              </div>

              {/* Contact Info */}
              <div className="mt-8 p-6 gradient-card rounded-lg border border-border">
                <h4 className="text-lg font-semibold mb-4">Get In Touch</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-primary font-medium">Email:</span> tursoft@gmail.com</p>
                  <p><span className="text-primary font-medium">Phone:</span> +90 554 200 78 29</p>
                  <p><span className="text-primary font-medium">Website:</span> tursoft.net</p>
                </div>
              </div>
            </div>

            {/* Right Column - Leadership Roles */}
            <div className="animate-scale-in">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">Positions</h3>
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <div key={index} className="flex items-center p-4 gradient-card rounded-lg border border-border card-hover">
                    <div className="w-2 h-2 bg-primary rounded-full mr-4 flex-shrink-0" />
                    <span className="text-foreground font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, index) => (
              <Card key={index} className="gradient-card border-border card-hover animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <highlight.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-foreground">{highlight.title}</h4>
                  <p className="text-sm text-muted-foreground">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
