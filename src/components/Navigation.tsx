import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, ChevronDown, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import tursoftLogo from "@/assets/tursoft-logo.png";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Improved section detection using Intersection Observer
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is 20% from top and 60% from bottom
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

    // Observe all sections
    navItems.forEach(item => {
      const section = document.getElementById(item.id);
      if (section) {
        observer.observe(section);
      }
    });

    window.addEventListener("scroll", handleScroll);
    
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
    setIsMobileMenuOpen(false); // Close mobile menu when navigating
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => scrollToSection(item.id)}
                className={`
                  px-4 py-2 text-sm font-medium uppercase transition-all duration-300 hover:text-primary
                  ${activeSection === item.id 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Desktop Download CV Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="hidden lg:flex bg-primary hover:bg-primary/90 text-primary-foreground glow-on-hover">
                <Download className="mr-2 h-4 w-4" />
                Download CV
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
      <div className={`lg:hidden transition-all duration-300 ${
        isMobileMenuOpen 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      } ${isScrolled 
          ? "bg-background/95 backdrop-blur-md border-b border-border" 
          : "bg-background/90 backdrop-blur-md"
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => scrollToSection(item.id)}
                className={`
                  justify-start px-4 py-3 text-sm font-medium uppercase transition-all duration-300
                  ${activeSection === item.id 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                {item.label}
              </Button>
            ))}
            
            {/* Mobile Download CV Buttons */}
            <div className="mt-4 flex flex-col space-y-2">
              <Button
                className="justify-start bg-primary hover:bg-primary/90 text-primary-foreground"
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
                className="justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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