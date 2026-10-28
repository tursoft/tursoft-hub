import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import SiteFooter from "@/components/SiteFooter";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath } from "@/lib/case-studies";
import { breadcrumbJsonLd, PERSON, SITE_URL } from "@/lib/site";

const CaseStudies = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Seo
      title={`Case studies | ${PERSON.name}`}
      description="Case studies by Muhammet Turşak: an AI document pipeline for construction estimating, an AI-native SaaS built with agent teams, and an open-source VS Code extension."
      path={CASE_STUDIES_PATH}
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Case studies",
          url: `${SITE_URL}${CASE_STUDIES_PATH}`,
          hasPart: CASE_STUDIES.map((c) => ({ "@type": "Article", headline: c.title, url: `${SITE_URL}${caseStudyPath(c.slug)}` })),
        },
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Case studies", path: CASE_STUDIES_PATH },
        ]),
      ]}
    />
    <PageHeader />

    <main className="container mx-auto px-6 py-14">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary-readable mb-3">Case studies</p>
        <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-5">How I architect and build software</h1>
        <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-3xl">
          Three recent projects in depth: the problem, the architecture, the role AI agents played and what came out of it.
        </p>

        <ul className="grid gap-6">
          {CASE_STUDIES.map((c) => (
            <li key={c.slug}>
              <Link to={caseStudyPath(c.slug)} className="group block glass rounded-xl p-6 hover:border-primary/50 transition-colors">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{c.company} · {c.period}</p>
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">{c.title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{c.dek}</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary-readable">
                  Read the case study <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>

    <SiteFooter />
  </div>
);

export default CaseStudies;
