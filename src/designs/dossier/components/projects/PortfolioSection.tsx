import { useState, useEffect } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import ProjectDetailDialog from './ProjectDetailDialog';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import ListViewer from '@design/components/ui/listviewer';
import AnimatedCounter from '@design/components/ui/animated-counter';
import SectionHeader from '@design/components/SectionHeader';
import ProjectLogo from './ProjectLogo';

interface ProjectWithIcon extends ProjectEntry {
  icon: string;
  formattedYears: string;
  companyName: string;
}

/** Years only, "2015 – 2019", or one year when the project starts and ends in it (or has no end). */
const formatDateToYears = (datePeriod: { startDate?: string; endDate?: string | null } | undefined) => {
  if (!datePeriod?.startDate) return '';
  const startYear = datePeriod.startDate.split('.')[2];
  if (!datePeriod.endDate) return startYear;
  const endYear = datePeriod.endDate.split('.')[2];
  return startYear === endYear ? startYear : `${startYear} – ${endYear}`;
};

/** Summaries come from the data files with <br/> tags; a card shows them as one paragraph. */
const inlineSummary = (html = '') => html.replace(/<br\s*\/?>/gi, ' ');

/** Data-driven summaries may carry target=_blank links; make sure they carry rel=noopener. */
const withSafeLinks = (html: string) =>
  html.replace(/<a\s(?![^>]*\brel=)([^>]*target=['"]_blank['"][^>]*)>/gi, '<a rel="noopener noreferrer" $1>');

const PortfolioSection = () => {
  const [projects, setProjects] = useSnapshotState<ProjectWithIcon[]>('portfolio.projects', []);
  const [isLoading, setIsLoading] = useSnapshotState('portfolio.isLoading', true);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useSnapshotState<string[]>('portfolio.categoryOrder', []);
  const [categoryLabels, setCategoryLabels] = useSnapshotState<Record<string, string>>('portfolio.categoryLabels', {});

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Full data for the groups (order and names), companies for the caption lines
        const [fullData, data, companies] = await Promise.all([
          projectsRepo.getFullData(),
          projectsRepo.getList(),
          companiesRepo.getList().catch((): Company[] => []),
        ]);

        if (fullData?.general?.groups) {
          const sortedGroups = [...fullData.general.groups].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
          setCategoryOrder(sortedGroups.map((group) => group.code));
          setCategoryLabels(Object.fromEntries(sortedGroups.map((group) => [group.code, group.title || group.code])));
        }

        const companyNames = new Map<string, string>(
          companies.map((company): [string, string] => [(company.code || '').toLowerCase(), company.title]),
        );
        const processedProjects = data.map((project) => ({
          ...project,
          icon: project.photoUrl || '',
          formattedYears: formatDateToYears(project.datePeriod),
          companyName: companyNames.get((project.companyCode || '').toLowerCase()) || project.companyCode || '',
        }));

        setProjects(processedProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setCategoryLabels, setCategoryOrder, setIsLoading, setProjects]);

  // Get unique groups for statistics
  const groups = [...new Set(projects.map((p) => p.group).filter(Boolean))];

  const handleProjectClick = (project: ProjectWithIcon) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const groupLabel = (project: ProjectWithIcon) => (project.group ? categoryLabels[project.group] || project.group : '');

  /**
   * Company, years and category on one quiet line, like the caption under a printed plate.
   * Each separator travels with the part after it, so a wrapped line never ends on a dot.
   */
  const captionLine = (project: ProjectWithIcon) =>
    [project.companyName, project.formattedYears, groupLabel(project)].filter(Boolean).map((part, i) =>
      i === 0 ? (
        <span key={i}>{part}</span>
      ) : (
        <span key={i} className="whitespace-nowrap">
          <span className="px-1.5" aria-hidden="true">·</span>
          <span className="sr-only">, </span>
          {part}
        </span>
      ),
    );

  /** The project's logo, mounted on the paper inside a hairline frame. */
  const renderPlate = (project: ProjectWithIcon, className: string) => (
    <ProjectLogo src={project.icon} alt={`${project.title} logo`} className={className} />
  );

  const renderSummary = (project: ProjectWithIcon, className: string) =>
    project.summary ? (
      <p className={className} dangerouslySetInnerHTML={{ __html: withSafeLinks(inlineSummary(project.summary)) }} />
    ) : null;

  const renderCard = (project: ProjectWithIcon) => (
    <figure className="group flex h-full flex-col p-4">
      {renderPlate(project, 'aspect-[2/1] w-full p-6 sm:aspect-[3/2] sm:p-8')}
      <figcaption className="mt-4 flex flex-1 flex-col">
        <h3 className="text-[17px] font-medium leading-6 text-foreground [text-wrap:balance]">{project.title}</h3>
        <p className="work-caption mt-1">{captionLine(project)}</p>
        {renderSummary(project, 'mt-3 line-clamp-3 text-sm leading-[22px] text-muted-foreground')}
      </figcaption>
    </figure>
  );

  const renderListRow = (project: ProjectWithIcon) => (
    <figure className="group flex gap-4 p-4 sm:gap-6">
      {renderPlate(project, 'aspect-[4/3] w-24 flex-none p-3 sm:w-32 sm:p-4')}
      <figcaption className="min-w-0 flex-1">
        <h3 className="text-[17px] font-medium leading-6 text-foreground">{project.title}</h3>
        <p className="work-caption mt-1">{captionLine(project)}</p>
        {renderSummary(project, 'mt-2 line-clamp-3 max-w-[68ch] text-sm leading-[22px] text-muted-foreground')}
      </figcaption>
    </figure>
  );

  const renderCarouselCard = (project: ProjectWithIcon) => (
    <figure className="group flex h-full flex-col p-5">
      {renderPlate(project, 'aspect-[3/2] w-full p-10')}
      <figcaption className="mt-4 flex min-h-0 flex-1 flex-col">
        <h3 className="text-lg font-medium leading-7 text-foreground [text-wrap:balance]">{project.title}</h3>
        <p className="work-caption mt-1">{captionLine(project)}</p>
        {renderSummary(project, 'mt-3 line-clamp-4 text-sm leading-[22px] text-muted-foreground')}
      </figcaption>
    </figure>
  );

  return (
    <section id="portfolio" className="py-16 lg:py-24">
      <div className="container">
        <SectionHeader
          id="portfolio"
          title="Software projects, from enterprise systems to AI-native products"
          description="Delivered and managed over 25 years, from national-scale healthcare systems to AI-native SaaS products. Open a project for its screenshots, team, customers and technology."
          aside={
            !isLoading && (
            <dl className="flex gap-8 text-left md:gap-10">
              <div className="flex flex-col-reverse">
                <dt className="text-[13px] leading-5 text-faint">Projects</dt>
                <dd className="tnum font-serif text-[32px] leading-10 text-foreground">
                  <AnimatedCounter end={projects.length} suffix="+" />
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="text-[13px] leading-5 text-faint">Categories</dt>
                <dd className="tnum font-serif text-[32px] leading-10 text-foreground">
                  <AnimatedCounter end={groups.length} />
                </dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="text-[13px] leading-5 text-faint">Technologies</dt>
                <dd className="tnum font-serif text-[32px] leading-10 text-foreground">
                  <AnimatedCounter end={50} suffix="+" />
                </dd>
              </div>
            </dl>
            )
          }
        />

        {/* listviewer with built-in filters */}
        <ListViewer<ProjectWithIcon>
          data={projects}
          isLoading={isLoading}
          loadingMessage="Loading projects…"
          emptyMessage="No projects found"
          defaultViewMode="card"
          enabledModes={['card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={21}
          enableCategoryFilter={true}
          categoryField="group"
          categoryOrder={categoryOrder}
          categoryLabels={categoryLabels}
          enableSearch={true}
          searchFields={['title', 'summary', 'group', 'companyName']}
          searchPlaceholder="Search projects"
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (project) => project.companyName || project.companyCode || '',
            description: (project) => project.summary || '',
            image: 'icon',
            badge: (project) => groupLabel(project),
            date: 'formattedYears',
            actions: [],
          }}
          renderCardContent={renderCard}
          renderListContent={renderListRow}
          renderCarouselContent={renderCarouselCard}
          carouselLabel="Projects"
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          carouselHeight="550px"
          carouselCardWidth="400px"
          carouselCardHeight="480px"
          onItemClick={handleProjectClick}
        />
      </div>

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </section>
  );
};

export default PortfolioSection;
