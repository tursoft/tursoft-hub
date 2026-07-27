import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/experiences/ExperienceSection";
import DomainsSection from "@/components/domains/DomainsSection";
import EducationSection from "@/components/educations/EducationSection";
import MapSection from "@/components/map/MapSection";
import TimelineSection from "@/components/timeline/TimelineSection";
import SkillsSection from "@/components/skills/SkillsSection";
import PortfolioSection from "@/components/projects/PortfolioSection";
import CustomersSection from "@/components/customers/CustomersSection";
import ReferencesSection from "@/components/references/ReferencesSection";
import ContactSection from "@/components/contact/ContactSection";
import Reveal from "@/components/ui/reveal";
import { ArrowUp } from "lucide-react";
import profilePhoto from "@/assets/profile-photo.jpg";

const sections = [
  AboutSection,
  ExperienceSection,
  DomainsSection,
  SkillsSection,
  PortfolioSection,
  CustomersSection,
  ReferencesSection,
  EducationSection,
  MapSection,
  TimelineSection,
  ContactSection,
];

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Profile & Name in Top Left - Only visible after hero */}
      <div className={`fixed top-4 left-4 z-[100] transition-all duration-500 transform ${
        isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 glass rounded-full pr-4 py-1 pl-1 hover:border-primary/50 hover:shadow-[var(--shadow-glow)] transition-all duration-300"
          aria-label="Back to top"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/40 transition-all duration-300">
            <img
              src={profilePhoto}
              alt="Muhammet Turşak"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Muhammet Turşak</span>
        </button>
      </div>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-[100] glass rounded-full p-3 text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 transition-all duration-300 ${
          isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      <Navigation />
      <main>
        <HeroSection />
        {sections.map((Section, index) => (
          <div key={index}>
            <hr className="section-divider" />
            <Reveal threshold={0.05}>
              <Section />
            </Reveal>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Index;
