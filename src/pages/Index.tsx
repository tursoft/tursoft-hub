import { useRef } from "react";
import SiteNav from "@/components/system/SiteNav";
import Footer from "@/components/system/Footer";
import BackToTop from "@/components/system/BackToTop";
import HeroSection from "@/components/HeroSection";
import TickerBand from "@/components/TickerBand";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/experiences/ExperienceSection";
import DomainsSection from "@/components/domains/DomainsSection";
import SkillsSection from "@/components/skills/SkillsSection";
import PortfolioSection from "@/components/projects/PortfolioSection";
import CustomersSection from "@/components/customers/CustomersSection";
import ReferencesSection from "@/components/references/ReferencesSection";
import EducationSection from "@/components/educations/EducationSection";
import MapSection from "@/components/map/MapSection";
import TimelineSection from "@/components/timeline/TimelineSection";
import ContactSection from "@/components/contact/ContactSection";
import { useScrollSkew } from "@/lib/motion/hooks";

const Index = () => {
  // Content leans slightly with scroll velocity; the transform is cleared at rest (never set will-change here).
  const mainRef = useRef<HTMLElement>(null);
  useScrollSkew(mainRef);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main ref={mainRef}>
        <HeroSection />
        <TickerBand />
        <AboutSection />
        <ExperienceSection />
        <DomainsSection />
        <SkillsSection />
        <PortfolioSection />
        <CustomersSection />
        <ReferencesSection />
        <EducationSection />
        <MapSection />
        <TimelineSection />
        <ContactSection />
        <Footer />
      </main>
      <BackToTop />
    </div>
  );
};

export default Index;
