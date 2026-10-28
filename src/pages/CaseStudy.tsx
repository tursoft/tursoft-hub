import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import SiteFooter from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath, getCaseStudy } from "@/lib/case-studies";
import { articleJsonLd, breadcrumbJsonLd, PERSON } from "@/lib/site";
import NotFound from "./NotFound";

const CaseStudy = () => {
  const { slug } = useParams();
  const study = getCaseStudy(slug);
  if (!study) return <NotFound />;

  const path = caseStudyPath(study.slug);
  const index = CASE_STUDIES.indexOf(study);
  const prev = CASE_STUDIES[(index - 1 + CASE_STUDIES.length) % CASE_STUDIES.length];
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={`${study.title} | ${PERSON.name}`}
        description={study.description}
        path={path}
        type="article"
        jsonLd={[
          articleJsonLd({
            title: study.title,
            description: study.description,
            path,
            datePublished: study.datePublished,
            about: study.shortTitle,
            keywords: study.stack,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Case studies", path: CASE_STUDIES_PATH },
            { name: study.shortTitle, path },
          ]),
        ]}
      />
      <PageHeader />

      <main className="container mx-auto px-6 py-14">
        <article className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-primary">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to={CASE_STUDIES_PATH} className="hover:text-primary">Case studies</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">{study.shortTitle}</li>
            </ol>
          </nav>

          <p className="text-xs uppercase tracking-widest text-primary-readable mb-3">Case study</p>
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-5 text-balance">{study.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">{study.dek}</p>

          <dl className="glass rounded-xl p-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 text-sm mb-12">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Role</dt>
              <dd>{study.role}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Company</dt>
              <dd>{study.company}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Period</dt>
              <dd>{study.period}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Result</dt>
              <dd>{study.outcome}</dd>
            </div>
          </dl>

          <div className="space-y-10">
            {study.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                  {section.bullets && (
                    <ul className="list-disc pl-6 space-y-2 marker:text-primary">
                      {section.bullets.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                  )}
                  {section.steps && (
                    <ol className="list-decimal pl-6 space-y-2 marker:text-primary marker:font-semibold">
                      {section.steps.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                  )}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-2xl font-semibold mb-4">Technology</h2>
              <ul className="flex flex-wrap gap-2" aria-label="Technologies used">
                {study.stack.map((t) => (
                  <li key={t}>
                    <Badge variant="outline" className="border-primary/40 text-foreground font-normal">{t}</Badge>
                  </li>
                ))}
              </ul>
            </section>

            {study.links.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Links</h2>
                <ul className="space-y-2">
                  {study.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary-readable hover:underline underline-offset-4">
                        {l.label}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <nav aria-label="More case studies" className="mt-16 pt-8 border-t border-border/60 grid gap-4 sm:grid-cols-2 text-sm">
            <Link to={caseStudyPath(prev.slug)} className="group glass rounded-xl p-4 hover:border-primary/50 transition-colors">
              <span className="flex items-center gap-1 text-muted-foreground mb-1"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous</span>
              <span className="font-medium group-hover:text-primary">{prev.shortTitle}</span>
            </Link>
            <Link to={caseStudyPath(next.slug)} className="group glass rounded-xl p-4 sm:text-right hover:border-primary/50 transition-colors">
              <span className="flex items-center gap-1 sm:justify-end text-muted-foreground mb-1">Next <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              <span className="font-medium group-hover:text-primary">{next.shortTitle}</span>
            </Link>
          </nav>

          <p className="mt-10 text-muted-foreground">
            Working on something similar? <a href="/#contact" className="text-primary-readable underline underline-offset-4">Get in touch</a>.
          </p>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CaseStudy;
