import { Button } from "@design/components/ui/button";
import { Github, Linkedin, Mail, Phone, Download, ArrowRight, ChevronDown, FileText, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@design/components/ui/dropdown-menu";
import type { CSSProperties, ReactNode } from "react";
import { PERSON } from "@/lib/site";
import { sectionLabel, sectionNumber } from "@design/lib/sections";
import { scrollToSection } from "@/lib/section-settle";
import cvData from "@/data/cv.json";
import portrait from "@/assets/people/muhammet.tursak.jpg";

const contacts = [
  { icon: Github, label: "GitHub", value: "github.com/tursoft", href: PERSON.profiles.github },
  { icon: Linkedin, label: "LinkedIn", value: "in/tursoft", href: PERSON.profiles.linkedin },
  { icon: Mail, label: "Email", value: PERSON.email, href: `mailto:${PERSON.email}` },
  { icon: Phone, label: "Call", value: "+90 554 200 78 29", href: "tel:+905542007829" },
];

const facts = [
  { term: "Available for", detail: PERSON.availability },
  { term: "Specialties", detail: "AI agentic development, .NET, Node.js, Azure, React, SaaS" },
  { term: "Domains", detail: "Healthcare, Construction, E-Learning, E-Commerce" },
];

// Footnotes back the claims in the hero, as in a printed profile: 1 the years, 2 the two
// New York companies, 3 BestJobFinder. One short phrase each, no closing period. The word joiner
// (U+2060) after each dash keeps a year range on one line.
const notes = [
  { id: "fn1", text: "Professional career since 2000, starting with web technologies" },
  { id: "fn2", text: "Gamyte (2019–\u20602022) and Jengai (2022–\u20602026), as Director of Technology and Senior Software Architect" },
  {
    id: "fn3",
    text: "Built under Tursoft since May 2026, with web, desktop and Chrome extension clients",
  },
];

const Note = ({ n }: { n: number }) => (
  <sup className="fn-ref">
    <a href={`#fn${n}`} aria-label={`Note ${n}`}>
      {n}
    </a>
  </sup>
);

/** One entrance on load: each block rises 8px, 50ms after the one before it. */
const rise = (step: number): CSSProperties => ({ "--rise-delay": `${step * 50}ms` }) as CSSProperties;

const CvMenu = ({ children }: { children: ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem onClick={() => window.open(cvData.general.compactDownloadUrl, "_blank")} className="cursor-pointer">
        <FileDown className="mr-2 h-4 w-4" />
        Compact version
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(cvData.general.downloadUrl, "_blank")} className="cursor-pointer">
        <FileText className="mr-2 h-4 w-4" />
        Detailed version
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const HeroSection = () => (
  <section id="hero" className="flex min-h-[100svh] flex-col pt-14 md:pt-[72px]">
    <div className="container flex flex-1 items-center py-10 md:py-12">
      <div className="hero-grid">
        <p className="kicker hero-kicker hero-rise" style={rise(0)}>
          <span className="kicker-num">{sectionNumber("hero")}</span>
          {sectionLabel("hero")}
        </p>

        <h1 className="hero-name hero-rise" style={rise(1)}>
          {PERSON.name}
        </h1>

        <p className="hero-title hero-rise" style={rise(2)}>
          {PERSON.headline}
          <span className="px-1.5 text-faint md:px-2.5" aria-hidden="true">
            ·
          </span>
          <span className="sr-only">, </span>
          <span className="tnum">{PERSON.yearsOfExperience}</span>&nbsp;years
          <Note n={1} />
        </p>

        <div className="hero-dek hero-rise" style={rise(3)}>
          <p className="max-w-[36em] text-base leading-[26px] text-muted-foreground [text-wrap:pretty] md:text-[19px] md:leading-[30px]">
            I architect cloud and SaaS platforms and ship them with AI coding agents, owning the full lifecycle
            from specification to release. I have led enterprise programs across Europe, the Middle East, and
            the&nbsp;U.S., and served as Director of Technology at two
            New York companies
            <Note n={2} />. I currently lead the development of BestJobFinder, an AI-powered job search platform
            <Note n={3} />.
          </p>
          <div className="mt-6 flex gap-3 md:mt-9">
            <Button asChild size="lg" className="min-w-0 flex-1 basis-0 gap-2 px-3 sm:flex-none sm:basis-auto sm:gap-2.5 sm:px-5">
              <a
                href="#portfolio"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("portfolio");
                }}
              >
                View portfolio
                <ArrowRight />
              </a>
            </Button>
            <CvMenu>
              <Button size="lg" variant="outline" className="min-w-0 flex-1 basis-0 gap-2 px-3 sm:flex-none sm:basis-auto sm:gap-2.5 sm:px-5">
                <Download />
                Download CV
                <ChevronDown className="-ml-0.5 text-faint" />
              </Button>
            </CvMenu>
          </div>
        </div>

        <dl className="hero-facts hero-rise" style={rise(4)}>
          {facts.map((fact, index) => (
            <div key={fact.term} className={index === 0 ? "pb-3" : "border-t border-border py-3"}>
              <dt className="text-xs tracking-[0.01em] text-faint">{fact.term}</dt>
              <dd className="mt-1 text-sm text-foreground [text-wrap:pretty]">{fact.detail}</dd>
            </div>
          ))}
        </dl>

        <figure className="hero-portrait hero-rise" style={rise(3)}>
          <img
            src={portrait}
            width={320}
            height={320}
            alt="Muhammet Turşak, head and shoulders, in a dark suit against a light grey studio background"
            // React 18 knows only the lowercase attribute; fetchPriority (React 19) warns.
            {...{ fetchpriority: "high" }}
            className="print-photo aspect-square w-full max-w-[320px] object-cover"
          />
          <figcaption className="mt-3 max-w-[320px] text-[13px] leading-5 text-muted-foreground [text-wrap:pretty]">
            <span className="font-medium text-foreground">{PERSON.name}</span>, an alumnus of {PERSON.alumniOf.name}.
          </figcaption>
          <ul aria-label="Contact" className="mt-6 grid max-w-[320px] gap-1 border-t border-border pt-4">
            {contacts.map((contact) => (
              <li key={contact.label}>
                <a
                  href={contact.href}
                  target={contact.href.startsWith("http") ? "_blank" : undefined}
                  rel={contact.href.startsWith("http") ? "me noopener noreferrer" : undefined}
                  className="group flex h-7 items-center gap-2.5 text-[13px] leading-5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <contact.icon className="h-4 w-4 text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} />
                  <span className="w-16 text-faint">{contact.label}</span>
                  <span className="tnum truncate">{contact.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </div>

    <footer aria-label="Notes" className="container footnote-rule pb-7">
      <ol className="grid gap-y-2 md:grid-cols-3 md:gap-x-12">
        {notes.map((note, index) => (
          <li key={note.id} id={note.id} className="footnote">
            <span className="footnote-num">{index + 1}</span>
            <span>{note.text}</span>
          </li>
        ))}
      </ol>
    </footer>
  </section>
);

export default HeroSection;
