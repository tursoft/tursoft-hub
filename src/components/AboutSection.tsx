import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Award, Briefcase, Mail, Phone, Globe } from "lucide-react";
import Reveal from "@/components/ui/reveal";

const AboutSection = () => {
  const highlights = [
    {
      icon: Briefcase,
      title: "25+ Years Experience",
      description: "Leading enterprise software projects worldwide, from national healthcare systems to AI-native SaaS"
    },
    {
      icon: Sparkles,
      title: "AI-Driven Lifecycle",
      description: "AI coding agents across the whole SDLC: specs, plans, implementation, review, tests and docs"
    },
    {
      icon: Bot,
      title: "Agent Teams",
      description: "Designing and managing multi-agent workflows with prompt and context engineering"
    },
    {
      icon: Award,
      title: "Enterprise Architecture",
      description: ".NET, Node.js, cloud and SaaS systems built for scale, security and extensibility"
    }
  ];

  const roles = [
    "AI-Enabled Software Architect",
    "Director of Technology",
    "Software Group Director",
    "Research & Development Director",
    "Software Team Leader"
  ];

  const contacts = [
    { icon: Mail, label: "Email", value: "tursoft@gmail.com", href: "mailto:tursoft@gmail.com" },
    { icon: Phone, label: "Phone", value: "+90 554 200 78 29", href: "tel:+905542007829" },
    { icon: Globe, label: "Website", value: "tursoft.net", href: "https://tursoft.net" },
  ];

  return (
    <section id="about" className="py-20 bg-background relative">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <Reveal className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase tracking-widest">About Me</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Transforming Ideas Into
              <span className="text-gradient block lg:inline lg:ml-4">Digital Reality</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              I lead the development of enterprise systems that deliver world-class functionality and performance, and I build them the AI-native way: coding agents across the whole lifecycle, engineered prompts and context, and agent teams that I design and manage.
            </p>
          </Reveal>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Left Column - Story */}
            <Reveal direction="left">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">My Journey</h3>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Throughout my professional career, I have taken the <span className="text-primary font-semibold">leadership</span> of various <span className="text-primary font-semibold">enterprise projects</span> within software companies that are significant players
                  in their sectors. As part of <span className="text-primary font-semibold">international companies</span>, we have completed <span className="text-primary font-semibold">multi-million dollar</span> software projects all over the world.
                </p>
                <p>
                  Since 2023 I have rebuilt the way I deliver software around AI. I run the whole <span className="text-primary font-semibold">development lifecycle with AI coding agents</span>, from specs and plans to implementation, review, tests and documentation, apply <span className="text-primary font-semibold">prompt and context engineering</span> to keep them accurate on large codebases, and <span className="text-primary font-semibold">design and manage agent teams</span> that work alongside human engineers.
                </p>
                <p>
                  After leading technology at <span className="text-primary font-semibold">Jengai</span> and <span className="text-primary font-semibold">Gamyte</span>, I now build <span className="text-primary font-semibold">AI-native products</span> under Tursoft, such as BestJobFinder and Account Manager for Claude, and help engineering teams make the same transition: the specs, context, tooling and guardrails that let humans and AI agents deliver together.
                </p>
              </div>

              {/* Contact Info */}
              <div className="mt-8 p-6 glass rounded-xl">
                <h4 className="text-lg font-semibold mb-4">Get In Touch</h4>
                <div className="space-y-3 text-sm">
                  {contacts.map((contact) => (
                    <a
                      key={contact.label}
                      href={contact.href}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-300 group"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                        <contact.icon className="h-4 w-4 text-primary" />
                      </span>
                      <span>{contact.value}</span>
                    </a>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Right Column - Leadership Roles */}
            <Reveal direction="right" delay={120}>
              <h3 className="text-2xl font-semibold mb-6 text-foreground">Positions</h3>
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 gradient-card rounded-xl border border-border card-hover hover:border-primary/40 group"
                  >
                    <div className="w-2 h-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-full mr-4 flex-shrink-0 group-hover:scale-150 transition-transform duration-300" />
                    <span className="text-foreground font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Highlights Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((highlight, index) => (
              <Reveal key={index} direction="scale" delay={index * 100}>
                <Card className="gradient-card border-border card-hover hover:border-primary/40 h-full group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.18)] to-[hsl(var(--accent)/0.18)] ring-1 ring-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:ring-primary/50 transition-all duration-300">
                      <highlight.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2 text-foreground">{highlight.title}</h4>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
