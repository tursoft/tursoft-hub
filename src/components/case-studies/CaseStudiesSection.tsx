import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Reveal from "@/components/ui/reveal";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath } from "@/lib/case-studies";

/** Homepage teaser linking to the case study pages. */
const CaseStudiesSection = () => (
  <section id="case-studies" className="py-20 bg-background">
    <div className="container mx-auto px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <Badge variant="outline" className="mb-4 border-primary/40 text-primary uppercase tracking-widest">Case Studies</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Case Studies:
            <span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">AI Products and Architecture</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Three recent projects in depth: the problem, the architecture and the role AI agents played.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {CASE_STUDIES.map((c, i) => (
            <Reveal key={c.slug} direction="up" delay={i * 100}>
              <Link
                to={caseStudyPath(c.slug)}
                className="group flex h-full flex-col gradient-card rounded-xl border border-border p-6 card-hover hover:border-primary/40"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{c.period}</p>
                <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors">{c.shortTitle}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">{c.dek}</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary-readable">
                  Read the case study <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <p className="text-center mt-10">
          <Link to={CASE_STUDIES_PATH} className="text-primary-readable underline underline-offset-4">All case studies</Link>
        </p>
      </div>
    </div>
  </section>
);

export default CaseStudiesSection;
