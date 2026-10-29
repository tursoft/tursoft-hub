import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Mail, Phone, Download, ExternalLink, ChevronDown, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import Typewriter from "@/components/ui/typewriter";
import { PERSON } from "@/lib/site";
import { scrollToSection } from "@/lib/section-settle";

// Decorative background (30% opacity), served unhashed from /assets.
const heroImage = "/assets/hero-bg.webp";
import cvData from "@/data/cv.json";

const HeroSection = () => {
  // The hero's ambient animations (aurora, gradient name, typewriter) are about half of the
  // page's main-thread work; pause them while the hero is scrolled out of view.
  const heroRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  const roles = [
    "AI-Enabled Software Architect",
    "Senior Software Architect",
    "Director of Technology",
    ".NET & Web Expert",
    "Cloud & SaaS Solution Builder",
  ];

  return (
    <section ref={heroRef} id="hero" data-paused={inView ? undefined : ""} className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background photo, kept very subtle under the aurora */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Overlay + aurora blobs + grid */}
      <div className="absolute inset-0 hero-overlay" />
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
      <div className="absolute inset-0 bg-grid" />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto hero-rise">
          {/* Availability badge */}
          <Badge className="mb-8 px-4 py-2 text-xs font-semibold glass text-foreground border-success/30 hover:border-success/60 hover:scale-105 transition-all duration-300">
            <span className="relative flex h-2.5 w-2.5 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--success))]" />
            </span>
            Available for New Opportunities
          </Badge>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-7xl mb-6 leading-tight tracking-tight">
            <span className="block text-foreground font-light">MUHAMMET</span>
            <span className="block font-extrabold text-gradient-animated">TURŞAK</span>
          </h1>

          {/* Static positioning line: crawlers and screen readers get the full statement */}
          <p className="text-base lg:text-lg text-foreground/85 mb-3 font-medium tracking-wide">
            {PERSON.headline} · {PERSON.yearsOfExperience} years
          </p>

          {/* Rotating role */}
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 font-light min-h-[2.25rem]">
            <Typewriter phrases={roles} className="text-foreground/90" paused={!inView} />
          </p>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            With <span className="text-gradient font-semibold">25+ years</span> in technology, I architect <span className="text-primary font-semibold">cloud-based</span> and <span className="text-primary font-semibold">SaaS</span> products and build them with <span className="text-accent font-semibold">AI agents</span> across the whole development lifecycle, pairing <span className="text-accent font-semibold">prompt and context engineering</span> with enterprise-grade architecture and scalability.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              asChild
              size="lg"
              className="btn-shine bg-gradient-to-r from-[hsl(var(--primary-variant))] via-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground border-0 px-8 py-3 text-lg hover:scale-[1.03] hover:shadow-[var(--shadow-glow)] transition-all duration-300"
            >
              <a
                href="#portfolio"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("portfolio");
                }}
              >
                View My Portfolio
                <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass border-primary/40 text-foreground hover:border-primary hover:bg-primary/10 hover:scale-[1.03] px-8 py-3 text-lg transition-all duration-300"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download CV
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass">
                <DropdownMenuItem onClick={() => window.open(cvData.general.compactDownloadUrl, "_blank")} className="cursor-pointer">
                  <FileDown className="mr-2 h-4 w-4" />
                  Compact Version
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(cvData.general.downloadUrl, "_blank")} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Detailed Version
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-3">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-full p-3 text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] transition-all duration-300"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
        onClick={() => scrollToSection("about")}
        aria-label="Scroll to About section"
      >
        <div className="w-6 h-10 border-2 border-primary/60 rounded-full flex justify-center hover:border-primary transition-colors duration-300">
          <div className="w-1 h-3 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--accent))] rounded-full mt-2 animate-pulse" />
        </div>
      </button>
    </section>
  );
};

export default HeroSection;
