import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import DomainsSection from "@/components/DomainsSection";
import EducationSection from "@/components/EducationSection";
import MapSection from "@/components/MapSection";
import SkillsSection from "@/components/SkillsSection";
import PortfolioSection from "@/components/PortfolioSection";
import CustomersSection from "@/components/CustomersSection";
import ReferencesSection from "@/components/ReferencesSection";
import ContactSection from "@/components/ContactSection";
import profilePhoto from "@/assets/profile-photo.jpg";

const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        setIsScrolled(window.scrollY > heroBottom - 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Profile & Name in Top Left - Only visible after hero */}
      <div className={`fixed top-4 left-4 z-[100] transition-all duration-500 transform ${
        isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className="flex items-center gap-2 bg-background/10 backdrop-blur-md rounded-full pr-3 py-1 border border-primary/20 shadow-lg hover:border-primary/40 transition-all duration-300 glow-on-hover scale-80">
          {/* Profile Photo */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow-md hover:border-primary/60 transition-all duration-300">
            <img 
              src={profilePhoto} 
              alt="Muhammet Turşak" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Name */}
          <span className="text-base font-semibold text-foreground uppercase tracking-wide">MUHAMMET TURŞAK</span>
        </div>
      </div>
      
      <Navigation />
      <main>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <DomainsSection />
        <SkillsSection />
        <PortfolioSection />
        <CustomersSection />
        <ReferencesSection />
        <EducationSection />
        <MapSection />
        <ContactSection />
      </main>
    </div>
  );
};

export default Index;
