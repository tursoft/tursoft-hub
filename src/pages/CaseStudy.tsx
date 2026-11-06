import { Fragment, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Seo from "@/components/Seo";
import PageHeader from "@/components/PageHeader";
import SiteFooter from "@/components/SiteFooter";
import { Badge } from "@/components/ui/badge";
import ProjectLogo from "@/components/projects/ProjectLogo";
import { useSnapshotState } from "@/hooks/use-snapshot-state";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import { projectFilesRepo } from "@/repositories/ProjectFilesRepo";
import { CASE_STUDIES, CASE_STUDIES_PATH, caseStudyPath, getCaseStudy } from "@/lib/case-studies";
import { articleJsonLd, breadcrumbJsonLd, PERSON } from "@/lib/site";
import NotFound from "./NotFound";

/** The project behind a case study: its logo for the facts box and its screenshots as figures. */
interface StudyFigures {
  code: string;
  projectTitle: string;
  logo: string;
  screenshots: { title: string; small: string; big: string; width: number; height: number }[];
}

/** Natural size of an image, so wide figures can take the full measure and tall ones sit in pairs. */
const imageSize = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });

/** The figures follow this many sections, so they sit next to the text that describes the product. */
const FIGURES_AFTER_SECTION = 2;

const CaseStudy = () => {
  const { slug } = useParams();
  const study = getCaseStudy(slug);
  const projectCode = study?.projectCode ?? "";

  // Recorded at prerender, so the figures are in the HTML and hydration starts from them
  const [figures, setFigures] = useSnapshotState<StudyFigures | null>("caseStudy.figures", null);
  const loadedCode = figures?.code;

  useEffect(() => {
    if (!projectCode || loadedCode === projectCode) return;
    let cancelled = false;
    const load = async () => {
      const [project, allFiles] = await Promise.all([projectsRepo.getByCode(projectCode), projectFilesRepo.getAllProjects()]);
      // The files are keyed by project code in its own case; match without case
      const key = Object.keys(allFiles).find((k) => k.toUpperCase() === projectCode.toUpperCase());
      const shots = [...((key && allFiles[key]?.screenshoots) || [])]
        .filter((s) => s.file_small || s.file_big)
        .sort((a, b) => (a.orderindex || 0) - (b.orderindex || 0));
      const sizes = await Promise.all(shots.map((s) => imageSize(s.file_small || s.file_big || "")));
      if (cancelled) return;
      setFigures({
        code: projectCode,
        projectTitle: project?.title ?? "",
        logo: project?.photoUrl ?? "",
        screenshots: shots.map((s, i) => ({
          title: s.title || "",
          small: s.file_small || s.file_big || "",
          big: s.file_big || s.file_small || "",
          ...sizes[i],
        })),
      });
    };
    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectCode, loadedCode, setFigures]);

  if (!study) return <NotFound />;

  const path = caseStudyPath(study.slug);
  const index = CASE_STUDIES.indexOf(study);
  const prev = CASE_STUDIES[(index - 1 + CASE_STUDIES.length) % CASE_STUDIES.length];
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length];
  const project = figures?.code === study.projectCode ? figures : null;
  const shots = project?.screenshots ?? [];
  const figuresAt = Math.min(FIGURES_AFTER_SECTION, study.sections.length) - 1;

  const facts = [
    { term: "Role", detail: study.role },
    { term: "Company", detail: study.company },
    { term: "Period", detail: study.period },
    { term: "Result", detail: study.outcome },
  ];

  const figureGroup = shots.length > 0 && (
    <div className="my-10 grid items-start gap-x-6 gap-y-8 sm:grid-cols-2">
      {shots.map((shot, i) => (
        <figure key={shot.small} className={shot.width > shot.height ? "sm:col-span-2" : undefined}>
          <a
            href={shot.big}
            target="_blank"
            rel="noopener noreferrer"
            className="group block outline-offset-4"
            aria-label={`Figure ${i + 1} full size${shot.title ? `: ${shot.title}` : ""}`}
          >
            <span className="work-plate p-3">
              <img
                loading="lazy"
                decoding="async"
                src={shot.small}
                width={shot.width || undefined}
                height={shot.height || undefined}
                alt={shot.title || `${project?.projectTitle || study.shortTitle}, screenshot ${i + 1}`}
                className="h-auto max-h-[480px] w-auto"
              />
            </span>
          </a>
          <figcaption className="mt-3 text-[13px] leading-5 text-muted-foreground [text-wrap:pretty]">
            <span className="tnum font-medium text-foreground">Fig. {i + 1}</span>
            {shot.title && (
              <>
                <span className="px-1.5 text-faint" aria-hidden="true">·</span>
                {shot.title}
              </>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );

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

      <main className="container pt-8 md:pt-12">
        <article className="mx-auto max-w-[1040px]">
          <nav aria-label="Breadcrumb" className="text-[13px] leading-5 text-faint">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li><Link to="/" className="transition-colors duration-150 hover:text-foreground">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to={CASE_STUDIES_PATH} className="transition-colors duration-150 hover:text-foreground">Case studies</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-muted-foreground">{study.shortTitle}</li>
            </ol>
          </nav>

          {/* Headline and dek, as a feature opens in print */}
          <header className="mt-10 max-w-[52rem] md:mt-14">
            <p className="kicker">
              Case study
              <span className="tnum font-normal text-faint">
                {index + 1} of {CASE_STUDIES.length}
              </span>
            </p>
            <h1 className="feature-title mt-4">{study.title}</h1>
            <p className="feature-dek mt-5 max-w-[40rem]">{study.dek}</p>
          </header>

          <div className="mt-10 grid gap-10 border-t border-border pt-10 md:mt-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
            {/* Facts box: hairline-ruled, beside the text from lg up */}
            <aside className="lg:order-2">
              <div className="lg:sticky lg:top-24">
                {project?.logo && (
                  <div className="mb-6 flex items-center gap-3">
                    <ProjectLogo src={project.logo} alt={`${project.projectTitle} logo`} className="h-14 w-14 flex-none p-1.5" />
                    <span className="text-sm leading-5 text-muted-foreground">{project.projectTitle}</span>
                  </div>
                )}
                <dl className="grid border-t border-foreground sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-1">
                  {facts.map((fact) => (
                    <div key={fact.term} className="border-b border-border py-3">
                      <dt className="text-xs leading-4 text-faint">{fact.term}</dt>
                      <dd className="tnum mt-1 text-[15px] leading-6 text-foreground [text-wrap:pretty]">{fact.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>

            <div className="feature-body min-w-0">
              {study.sections.map((section, i) => (
                <Fragment key={section.heading}>
                  <section>
                    <h2>{section.heading}</h2>
                    {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
                    {section.bullets && (
                      <ul>
                        {section.bullets.map((b) => <li key={b}>{b}</li>)}
                      </ul>
                    )}
                    {section.steps && (
                      <ol>
                        {section.steps.map((s) => <li key={s}>{s}</li>)}
                      </ol>
                    )}
                  </section>
                  {i === figuresAt && figureGroup}
                </Fragment>
              ))}

              <section>
                <h2>Technology</h2>
                <ul className="feature-tags" aria-label="Technologies used">
                  {study.stack.map((t) => (
                    <li key={t}>
                      <Badge className="px-2.5 py-1 text-[13px] font-normal">{t}</Badge>
                    </li>
                  ))}
                </ul>
              </section>

              {study.links.length > 0 && (
                <section>
                  <h2>Links</h2>
                  <ul className="feature-links">
                    {study.links.map((l) => (
                      <li key={l.href}>
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                          {l.label}
                          <ArrowUpRight className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="mt-12 border-t border-border pt-6 text-muted-foreground">
                Working on something similar? <a href="/#contact">Get in touch</a>.
              </p>
            </div>
          </div>

          <nav aria-label="More case studies" className="mt-16 grid border-t border-foreground sm:grid-cols-2">
            <Link
              to={caseStudyPath(prev.slug)}
              className="group border-b border-border py-6 outline-offset-4 sm:border-b-0 sm:pr-8"
            >
              <span className="flex items-center gap-1.5 text-[13px] leading-5 text-faint">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Previous
              </span>
              <span className="mt-2 block font-serif text-[22px] leading-7 text-foreground underline decoration-transparent decoration-1 underline-offset-[5px] transition-colors duration-150 ease-dossier group-hover:decoration-foreground/40">
                {prev.shortTitle}
              </span>
            </Link>
            <Link
              to={caseStudyPath(next.slug)}
              className="group py-6 outline-offset-4 sm:border-l sm:border-border sm:pl-8 sm:text-right"
            >
              <span className="flex items-center gap-1.5 text-[13px] leading-5 text-faint sm:justify-end">
                Next <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="mt-2 block font-serif text-[22px] leading-7 text-foreground underline decoration-transparent decoration-1 underline-offset-[5px] transition-colors duration-150 ease-dossier group-hover:decoration-foreground/40">
                {next.shortTitle}
              </span>
            </Link>
          </nav>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
};

export default CaseStudy;
