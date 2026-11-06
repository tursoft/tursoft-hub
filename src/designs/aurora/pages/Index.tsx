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
import profilePhoto from "@/assets/profile-photo-80.webp";

// Heavy sections (Leaflet map, timeline) load in their own chunks after the first paint.
const MapSection = lazy(() => import("@design/components/map/MapSection"));
const TimelineSection = lazy(() => import("@design/components/timeline/TimelineSection"));

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
            <img loading="lazy" decoding="async"
              src={profilePhoto}
              alt=""
              width={40}
              height={40}
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
