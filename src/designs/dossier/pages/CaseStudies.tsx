import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Seo from "@/shared/Seo";
import PageHeader from "@design/components/PageHeader";
import SiteFooter from "@design/components/SiteFooter";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath } from "@/lib/case-studies";
import { breadcrumbJsonLd, PERSON, SITE_URL } from "@/lib/site";

/** The contents page of the case studies: a ruled list, one feature per row. */
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

    <main className="container pt-10 md:pt-16">
      <div className="mx-auto max-w-[1040px]">
        <header className="max-w-[48rem]">
          <p className="kicker">Case studies</p>
          <h1 className="feature-title mt-4">How I architect and build software</h1>
          <p className="feature-dek mt-5">
            Three recent projects in depth: the problem, the architecture, the role AI agents played and what came out of it.
          </p>
        </header>

        <ol className="mt-12 border-t border-foreground md:mt-16">
          {CASE_STUDIES.map((c, i) => (
            <li key={c.slug} className="border-b border-border">
              <Link
                to={caseStudyPath(c.slug)}
                className="group grid gap-x-12 gap-y-3 py-8 outline-offset-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:py-10"
              >
                <div className="work-caption flex flex-wrap gap-x-3 md:flex-col md:gap-1">
                  <span className="text-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.company}</span>
                  <span>{c.period}</span>
                </div>
                <div className="max-w-[44rem]">
                  <h2 className="font-serif text-[26px] font-normal leading-8 tracking-[-0.01em] text-foreground underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors duration-150 ease-dossier [text-wrap:balance] group-hover:decoration-foreground/40 md:text-[32px] md:leading-10">
                    {c.title}
                  </h2>
                  <p className="mt-3 text-[17px] leading-7 text-muted-foreground [text-wrap:pretty]">{c.dek}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-foreground">
                    Read the case study
                    <ArrowRight className="h-4 w-4 text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>

    <SiteFooter />
  </div>
);

export default CaseStudies;
