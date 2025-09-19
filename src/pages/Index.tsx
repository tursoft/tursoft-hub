import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import SkillsSection from "@/components/SkillsSection";
import PortfolioSection from "@/components/PortfolioSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Name in Top Left */}
      <div className="fixed top-4 left-4 z-[100]">
        <span className="text-lg font-semibold text-foreground uppercase">MUHAMMET TURŞAK</span>
      </div>
      
      <Navigation />
      <main>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <EducationSection />
        <PortfolioSection />
        <SkillsSection />
        <ContactSection />
      </main>
    </div>
  );
};

export default Index;
