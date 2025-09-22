import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import tursoftLogo from "@/assets/tursoft-logo.png";

const navItems = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About Me" },
  { id: "experience", label: "Experience" },
  { id: "domains", label: "Domains" },
  { id: "skills", label: "Skills" },
  { id: "portfolio", label: "Portfolio" },
  { id: "references", label: "References" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" }
];

const Navigation = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);

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

          {/* Download CV Button */}
          <Button 
            className="hidden lg:flex bg-primary hover:bg-primary/90 text-primary-foreground glow-on-hover"
            onClick={() => window.open("#", "_blank")}
          >
            Download CV
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;