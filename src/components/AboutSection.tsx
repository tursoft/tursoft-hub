import { Mail, Phone, Globe } from "lucide-react";
import Reveal from "@/components/ui/reveal";
import SectionHeader from "@/components/SectionHeader";
import { PERSON } from "@/lib/site";

const highlights = [
  {
    title: "25+ years of experience",
    description: "Leading enterprise software projects worldwide, from national healthcare systems to AI-native SaaS",
  },
  {
    title: "AI-driven lifecycle",
    description: "AI coding agents across the whole SDLC: specs, plans, implementation, review, tests and docs",
  },
  {
    title: "Agent teams",
    description: "Designing and managing multi-agent workflows with prompt and context engineering",
  },
  {
    title: "Enterprise architecture",
    description: ".NET, Node.js, cloud, SaaS",
  },
];

const roles = [
  "AI-Enabled Software Architect",
  "Director of Technology",
  "Software Group Director",
  "Research & Development Director",
  "Software Team Leader",
];

const contacts = [
  { icon: Mail, label: "Email", value: "tursoft@gmail.com", href: "mailto:tursoft@gmail.com" },
  { icon: Phone, label: "Phone", value: "+90 554 200 78 29", href: "tel:+905542007829" },
  { icon: Globe, label: "Website", value: "tursoft.net", href: "https://tursoft.net" },
];

// The facts search engines and AI assistants quote; kept in sync with llms.txt and the JSON-LD.
const glance = [
  { label: "Name", value: `${PERSON.name} (also written Tursak)` },
  { label: "Title", value: PERSON.headline },
  { label: "Based in", value: `${PERSON.location.city}, ${PERSON.location.country}` },
  { label: "Experience", value: `${PERSON.yearsOfExperience} years in enterprise software` },
  { label: "Current", value: PERSON.currentRole },
  { label: "Previously", value: PERSON.previousRoles },
  { label: "Specialties", value: "AI agentic development, .NET, Node.js, Azure, React, SaaS" },
  { label: "Available for", value: PERSON.availability },
];

/** Column head inside a section, set like a label in a printed profile. */
const ColumnHead = ({ children }: { children: string }) => (
  <h3 className="text-[13px] font-medium leading-4 text-muted-foreground">{children}</h3>
);

const AboutSection = () => (
  <section id="about" className="py-16 lg:py-24">
    <div className="container">
      <SectionHeader
        id="about"
        title="Senior software architect building the AI-native way"
        description="I lead the development of enterprise systems and build them the AI-native way: coding agents across the whole lifecycle, engineered prompts and context, and agent teams that I design and manage."
      />

      <div className="about-grid">
        {/* At a glance: the facts, as a ruled two-column list */}
        <Reveal className="about-glance">
          <ColumnHead>At a glance</ColumnHead>
          <dl className="mt-3 divide-y divide-border">
            {glance.map((fact) => (
              <div key={fact.label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 py-3 first:pt-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-[13px] leading-5 text-faint">{fact.label}</dt>
                <dd className="text-sm leading-5 text-foreground [text-wrap:pretty]">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* The biography and what it adds up to */}
        <Reveal className="about-story" delay={60}>
          <ColumnHead>My journey</ColumnHead>
          <div className="mt-4 max-w-[36em] space-y-5 text-base leading-[26px] text-foreground [text-wrap:pretty] md:text-[17px] md:leading-7">
            <p>
              Throughout my professional career, I have taken the leadership of various enterprise projects within
              software companies that are significant players in their sectors. As part of international companies,
              we have completed multi-million dollar software projects all over the world.
            </p>
            <p>
              Since 2023 I have rebuilt the way I deliver software around AI. I run the whole development lifecycle
              with AI coding agents, from specs and plans to implementation, review, tests and documentation, apply
              prompt and context engineering to keep them accurate on large codebases, and design and manage agent
              teams that work alongside human engineers.
            </p>
            <p>
              After leading technology at Jengai and Gamyte, I now build AI-native products under Tursoft, such as
              BestJobFinder and Account Manager for Claude, and help engineering teams make the same transition: the
              specs, context, tooling and guardrails that let humans and AI agents deliver together.
            </p>
          </div>

          <ul className="mt-12 grid gap-x-12 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <li key={highlight.title} className="border-t border-border pb-6 pt-4">
                <h4 className="text-[15px] font-medium leading-6 text-foreground">{highlight.title}</h4>
                <p className="mt-1 text-sm leading-[22px] text-muted-foreground [text-wrap:pretty]">
                  {highlight.description}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Positions held and how to reach me */}
        <Reveal className="about-more" delay={120}>
          <ColumnHead>Positions</ColumnHead>
          <ol className="mt-3 divide-y divide-border">
            {roles.map((role) => (
              <li key={role} className="py-2.5 text-[15px] leading-6 text-foreground first:pt-0">
                {role}
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <h4 className="text-[13px] font-medium leading-4 text-muted-foreground">Get in touch</h4>
            <ul aria-label="Contact" className="mt-3 grid gap-1">
              {contacts.map((contact) => (
                <li key={contact.label}>
                  <a
                    href={contact.href}
                    className="group flex h-7 items-center gap-2.5 text-sm leading-5 text-muted-foreground transition-colors duration-150 ease-dossier hover:text-foreground"
                  >
                    <contact.icon
                      className="h-4 w-4 text-faint transition-colors duration-150 ease-dossier group-hover:text-foreground"
                      strokeWidth={1.5}
                    />
                    <span className="w-16 text-[13px] text-faint">{contact.label}</span>
                    <span className="tnum truncate">{contact.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

export default AboutSection;
