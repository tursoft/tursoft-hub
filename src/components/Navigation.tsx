import { useState, useEffect, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, ChevronDown, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import cvData from "@/data/cv.json";
import { scrollToSection as jumpToSection } from "@/lib/section-settle";
import { NAV_ITEMS, sectionNumber } from "@/lib/sections";
import { PERSON } from "@/lib/site";

/**
 * The masthead: the name as the wordmark, every section as a quiet text link, and the
 * CV menu. A hairline runs under it and fills with ink as the page is read.
 */
const Navigation = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(1, window.scrollY / docHeight) : 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && NAV_ITEMS.some((item) => item.id === entry.target.id)) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    NAV_ITEMS.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    jumpToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  // Real anchor links for crawlers and keyboard users; smooth scroll plus a clean hash for everyone else.
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    scrollToSection(sectionId);
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  const openCv = (url: string) => {
    window.open(url, "_blank");
    setIsMobileMenuOpen(false);
  };

  return (
    <nav aria-label="Sections" className="fixed inset-x-0 top-0 z-50 bg-background">
      <div className="container">
        <div className="relative flex h-14 items-center gap-8 border-b border-border md:h-[72px]">
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "hero")}
            className="whitespace-nowrap text-base font-medium text-foreground md:text-[17px]"
          >
            {PERSON.name}
          </a>

          <div className="ml-auto hidden items-center gap-3.5 xl:flex 2xl:gap-5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "location" : undefined}
                onClick={(e) => handleNavClick(e, item.id)}
                className="mast-link"
              >
                {item.label}
              </a>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden xl:inline-flex">
                <Download />
                Download CV
                <ChevronDown className="text-faint" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openCv(cvData.general.compactDownloadUrl)} className="cursor-pointer">
                <FileDown className="mr-2 h-4 w-4" />
                Compact version
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCv(cvData.general.downloadUrl)} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                Detailed version
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="ml-auto xl:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
            {isMobileMenuOpen ? "Close" : "Menu"}
          </Button>

          {/* Reading progress: ink drawn along the hairline */}
          <div
            aria-hidden="true"
            className="absolute -bottom-px left-0 h-px origin-left bg-foreground"
            style={{ width: "100%", transform: `scaleX(${scrollProgress})` }}
          />
        </div>
      </div>

      {/* Mobile menu: the contents page, numbered like the sections */}
      <div
        id="mobile-menu"
        hidden={!isMobileMenuOpen}
        className="max-h-[calc(100svh-56px)] overflow-y-auto border-b border-border bg-background xl:hidden"
      >
        <div className="container py-4">
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className="border-b border-border">
                <a
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className="flex h-11 items-baseline gap-3 pt-3 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground aria-[current]:text-foreground"
                >
                  <span className="kicker-num w-5 text-[13px]">{sectionNumber(item.id)}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => openCv(cvData.general.compactDownloadUrl)}>
              <FileDown />
              CV, compact
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => openCv(cvData.general.downloadUrl)}>
              <FileText />
              CV, detailed
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
