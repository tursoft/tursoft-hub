import type { CSSProperties } from "react";
import profilePhoto from "@/assets/profile-photo.jpg";
import { Button } from "@/components/ui/button";
import Typewriter from "@/components/ui/typewriter";
import CvMenu from "@/components/system/CvMenu";
import { capitalize, numberToWords } from "@/lib/format";
import { CAREER, OWNER, ROLES, SOCIAL_LINKS, scrollToSection } from "@/lib/site";

const BYLINE_LINKS = [
  { label: "GitHub", href: SOCIAL_LINKS[0].href },
  { label: "LinkedIn", href: SOCIAL_LINKS[1].href },
  { label: "Email", href: `mailto:${OWNER.email}` },
  { label: "Phone", href: OWNER.phoneHref },
];

/** Start delay for one step of the staggered hero entrance. */
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

const HeroSection = () => (
  <section id="hero" className="hero">
    <div className="container-page">
      <p className="type-eyebrow hero-rise min-h-[1.4em]" style={delay(0.15)}>
        <Typewriter phrases={ROLES} />
      </p>

      <h1 className="type-display hero-display hero-rise mt-[18px] max-w-[820px]" style={delay(0.28)}>
        {capitalize(numberToWords(CAREER.years))} years of building <em>enterprise &amp; SaaS systems</em> that
        last.
      </h1>

      <p className="type-lede hero-rise mt-[22px] max-w-[600px] text-[16.5px]" style={delay(0.42)}>
        I lead R&amp;D teams and architect cloud platforms that blend startup speed with enterprise reliability, from
        hospital information systems used nationally to AI-powered SaaS products.
      </p>

      <div className="hero-rise mt-[30px] flex flex-wrap gap-2.5" style={delay(0.54)}>
        <Button magnetic onClick={() => scrollToSection("portfolio")}>
          View portfolio
        </Button>
        <CvMenu variant="secondary" magnetic />
      </div>

      <div
        className="hero-rise mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 text-[13px] text-muted-foreground"
        style={delay(0.66)}
      >
        <img
          src={profilePhoto}
          alt={OWNER.name}
          className="h-9 w-9 rounded-[8px] object-cover outline outline-1 outline-line-strong"
        />
        <span className="inline-flex items-center gap-2 font-mono text-xs">
          <span
            className="h-[7px] w-[7px] rounded-[2px] bg-success shadow-[0_0_0_3px_hsl(var(--success)/0.15)]"
            aria-hidden="true"
          />
          Available for new opportunities
        </span>
        <span className="hidden h-[18px] w-px bg-line-strong sm:block" aria-hidden="true" />
        <span className="flex flex-wrap gap-x-3.5 gap-y-1">
          {BYLINE_LINKS.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <a
                key={link.label}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            );
          })}
        </span>
      </div>

      <button
        type="button"
        className="scroll-cue hero-rise mt-14"
        style={delay(0.9)}
        onClick={() => scrollToSection("about")}
      >
        <span className="scroll-cue-line" aria-hidden="true" />
        scroll
      </button>
    </div>
  </section>
);

export default HeroSection;
