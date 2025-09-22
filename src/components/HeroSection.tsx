import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Mail, Phone, Download, ExternalLink } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
const HeroSection = () => {
  const socialLinks = [{
    icon: Github,
    href: "https://github.com/tursoft",
    label: "GitHub"
  }, {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/tursoft/",
    label: "LinkedIn"
  }, {
    icon: Mail,
    href: "mailto:tursoft@gmail.com",
    label: "Email"
  }, {
    icon: Phone,
    href: "tel:+905542007829",
    label: "Phone"
  }];
  return <section id="hero" className="min-h-screen relative flex items-center justify-center overflow-hidden hero-animated-bg" style={{
    backgroundImage: `url(${heroImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <Badge className="mb-6 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white border-0 shadow-lg opacity-60 hover:opacity-100 hover:scale-105 transition-all duration-300 glow-on-hover">
            🟢 Available for New Opportunities
          </Badge>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-7xl mb-6 leading-tight">
            <span className="block text-foreground">MUHAMMET</span>
            <span className="block text-foreground font-bold">TURŞAK</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 font-light">
            Senior Software Architect / <span className="text-primary font-semibold">.NET</span>, <span className="text-primary font-semibold">Java</span>, <span className="text-primary font-semibold">Web</span> and <span className="text-primary font-semibold">Mobile</span>
          </p>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            With <span className="text-primary font-semibold">25+ years</span> in technology, I've driven the creation of innovative <span className="text-primary font-semibold">cloud based</span> and <span className="text-primary font-semibold">SaaS</span> solutions, blending <span className="text-primary font-semibold">startup</span> <span className="text-primary font-semibold">agility</span> with enterprise-grade functionality and <span className="text-primary font-semibold">scalability</span>.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] hover:scale-105 text-primary-foreground px-8 py-3 text-lg glow-on-hover transition-all duration-300 border-2 border-primary/30 hover:border-primary/60" onClick={() => document.getElementById("portfolio")?.scrollIntoView({
            behavior: "smooth"
          })}>
              View My Work
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-gradient-to-r hover:from-[hsl(var(--navy-deep))] hover:via-[hsl(var(--primary))] hover:to-[hsl(var(--primary-light))] hover:text-primary-foreground px-8 py-3 text-lg transition-all duration-300" onClick={() => window.open("https://tursoft.net/assets/files/downloads/CV/CV_MuhammetTursak_v52.20200304.pdf", "_blank")}>
              <Download className="mr-2 h-5 w-5" />
              Download CV
            </Button>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-6">
            {socialLinks.map((social, index) => <a key={index} href={social.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors duration-300 p-2 hover:scale-110 transform" aria-label={social.label}>
                <social.icon className="h-6 w-6" />
              </a>)}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>;
};
export default HeroSection;