import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@design/components/ui/reveal";
import SectionHeader from "@design/components/SectionHeader";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath } from "@/lib/case-studies";

/** Homepage teaser linking to the case study pages, set like a magazine's contents: three ruled columns. */
const CaseStudiesSection = () => (
  <section id="case-studies" className="py-16 lg:py-24">
    <div className="container">
      <SectionHeader
        id="case-studies"
        title="AI products and architecture"
        description="Three recent projects in depth: the problem, the architecture and the role AI agents played."
        aside={
          <Link to={CASE_STUDIES_PATH} className="ink-link text-sm text-foreground">
            All case studies
          </Link>
        }
      />

      {/* Equal columns: each carries the same side padding, the list reaches into the margins by as much */}
      <ol className="grid md:-mx-6 md:grid-cols-3 lg:-mx-8">
        {CASE_STUDIES.map((c, i) => (
          <li
            key={c.slug}
            className="border-t border-border py-8 first:border-t-0 first:pt-0 md:border-l md:border-t-0 md:px-6 md:py-0 md:first:border-l-0 lg:px-8"
          >
            <Reveal delay={i * 80} className="h-full">
              <Link to={caseStudyPath(c.slug)} className="group flex h-full flex-col outline-offset-4">
                <p className="work-caption">{c.period}</p>
                <h3 className="mt-3 font-serif text-[26px] font-normal leading-8 tracking-[-0.01em] text-foreground underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors duration-150 ease-dossier [text-wrap:balance] group-hover:decoration-foreground/40 group-focus-visible:decoration-foreground">
                  {c.shortTitle}
                </h3>
                <p className="mt-3 flex-1 text-[15px] leading-6 text-muted-foreground [text-wrap:pretty]">{c.dek}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-foreground">
                  Read the case study
                  <ArrowRight className="h-4 w-4 text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default CaseStudiesSection;
