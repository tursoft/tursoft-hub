import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, ChevronDown, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import cvData from "@/data/cv.json";

const navItems = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About Me" },
  { id: "experience", label: "Experience" },
  { id: "domains", label: "Domains" },
  { id: "skills", label: "Skills" },
  { id: "portfolio", label: "Portfolio" },
  { id: "customers", label: "Customers" },
  { id: "references", label: "References" },
  { id: "education", label: "Education" },
  { id: "map", label: "Map" },
  { id: "timeline", label: "Timeline" },
  { id: "contact", label: "Contact" }
];

const Navigation = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(1, window.scrollY / docHeight) : 0);
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          if (navItems.find(item => item.id === sectionId)) {
            setActiveSection(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    navItems.forEach(item => {
      const section = document.getElementById(item.id);
      if (section) {
        observer.observe(section);
      }
    });

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass border-b border-border/60 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)]"
          : "bg-transparent"
      }`}
    >
      {/* Scroll progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary-glow))] to-[hsl(var(--accent))] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo placeholder keeps layout balanced */}
          <div className="flex items-center" />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 rounded-full px-1.5 py-1 transition-colors duration-300">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`
                  relative px-3 py-2 text-[13px] font-medium uppercase tracking-wide rounded-full
                  transition-all duration-300
                  ${activeSection === item.id
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }
                `}
              >
                {activeSection === item.id && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[hsl(var(--primary-variant))] to-[hsl(var(--primary))] shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all duration-300" />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Download CV Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden lg:flex btn-shine bg-gradient-to-r from-[hsl(var(--primary-variant))] via-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground border-0 hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
                <Download className="mr-2 h-4 w-4" />
                Download CV
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
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

          {/* Mobile Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden glass border-b border-border/60 transition-all duration-400 ${
        isMobileMenuOpen
          ? 'max-h-[80vh] opacity-100 overflow-y-auto'
          : 'max-h-0 opacity-0 overflow-hidden border-b-0'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col space-y-1">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                style={{ transitionDelay: isMobileMenuOpen ? `${index * 30}ms` : '0ms' }}
                className={`
                  text-left px-4 py-3 text-sm font-medium uppercase tracking-wide rounded-lg
                  transition-all duration-300
                  ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                  ${activeSection === item.id
                    ? "text-primary bg-primary/10 border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }
                `}
              >
                {item.label}
              </button>
            ))}

            {/* Mobile Download CV Buttons */}
            <div className="mt-4 flex flex-col space-y-2">
              <Button
                className="justify-start btn-shine bg-gradient-to-r from-[hsl(var(--primary-variant))] via-[hsl(var(--primary))] to-[hsl(var(--accent))] text-primary-foreground border-0"
                onClick={() => {
                  window.open(cvData.general.compactDownloadUrl, "_blank");
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                CV - Compact
              </Button>
              <Button
                variant="outline"
                className="justify-start border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  window.open(cvData.general.downloadUrl, "_blank");
                  setIsMobileMenuOpen(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                CV - Detailed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
