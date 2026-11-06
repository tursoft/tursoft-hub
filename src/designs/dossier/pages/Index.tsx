import { useState, useEffect, lazy, Suspense } from "react";
import Navigation from "@design/components/Navigation";
import HeroSection from "@design/components/HeroSection";
import AboutSection from "@design/components/AboutSection";
import ExperienceSection from "@design/components/experiences/ExperienceSection";
import DomainsSection from "@design/components/domains/DomainsSection";
import EducationSection from "@design/components/educations/EducationSection";
import FaqSection from "@design/components/faq/FaqSection";
import CaseStudiesSection from "@design/components/case-studies/CaseStudiesSection";
import SiteFooter from "@design/components/SiteFooter";
import Seo from "@/shared/Seo";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, homeJsonLd } from "@/lib/site";
import { scheduleSectionSettle } from "@/lib/section-settle";

import SkillsSection from "@design/components/skills/SkillsSection";
import PortfolioSection from "@design/components/projects/PortfolioSection";
import CustomersSection from "@design/components/customers/CustomersSection";
import ReferencesSection from "@design/components/references/ReferencesSection";
import ContactSection from "@design/components/contact/ContactSection";
import Reveal from "@design/components/ui/reveal";
import { ArrowUp } from "lucide-react";

// Heavy sections (Leaflet map, timeline) load in their own chunks after the first paint.
const MapSection = lazy(() => import("@design/components/map/MapSection"));
const TimelineSection = lazy(() => import("@design/components/timeline/TimelineSection"));

// Same order as SECTIONS in src/lib/sections.ts, which numbers them.
const sections = [
  AboutSection,
  ExperienceSection,
  DomainsSection,
  SkillsSection,
  PortfolioSection,
  CaseStudiesSection,
  CustomersSection,
  ReferencesSection,
  EducationSection,
  MapSection,
  TimelineSection,
  FaqSection,
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

  // Sections render lazily (content-visibility); give them their real sizes once the page
  // is idle, or at once when the URL points at a section.
  useEffect(() => {
    scheduleSectionSettle();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo title={DEFAULT_TITLE} description={DEFAULT_DESCRIPTION} path="/" jsonLd={homeJsonLd()} />

      {/* Back to top: a quiet square on the paper, after the hero */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-[100] flex h-10 w-10 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-[opacity,transform,color,background-color] duration-150 ease-dossier hover:bg-secondary hover:text-foreground ${
          isScrolled ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <Navigation />
      <main>
        <HeroSection />
        {sections.map((Section, index) => (
          <div key={index}>
            {/* section-boundary: the prerender step adds React's Suspense markers here */}
            <Reveal threshold={0.05} className="section-boundary">
              <Suspense fallback={<div className="min-h-[40vh]" aria-hidden="true" />}>
                <Section />
              </Suspense>
            </Reveal>
          </div>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
