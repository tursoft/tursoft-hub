import { useEffect, useState } from "react";
import { companiesRepo } from "@/repositories/CompaniesRepo";
import { projectsRepo } from "@/repositories/ProjectsRepo";
import type { ProjectEntry } from "@/models/Project";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import StatTile, { StatGrid } from "@/components/system/StatTile";
import { formatYearRange } from "@/lib/format";
import ProjectDetailDialog from "./ProjectDetailDialog";

interface ProjectWithMeta extends ProjectEntry {
  icon: string;
  formattedYears: string;
  companyTitle: string;
}

const PortfolioSection = () => {
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fullData, list, companies] = await Promise.all([
          projectsRepo.getFullData(),
          projectsRepo.getList(),
          companiesRepo.getList(),
        ]);
        const companyTitles = new Map(companies.map((company) => [company.code.toUpperCase(), company.title]));
        const groups = [...(fullData?.general?.groups ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategoryOrder(groups.map((group) => group.code));
        setProjects(
          list.map((project) => ({
            ...project,
            icon: project.photoUrl ?? "",
            formattedYears: formatYearRange(project.datePeriod?.startDate, project.datePeriod?.endDate, ""),
            companyTitle:
              (project.companyCode && companyTitles.get(project.companyCode.toUpperCase())) || project.companyCode || "",
          })),
        );
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const categoryCount = new Set(projects.map((project) => project.group).filter(Boolean)).size;
  const technologyCount = new Set(projects.flatMap((project) => project.skillCodes ?? [])).size;

  return (
    <Section id="portfolio">
      <SectionHeader
        index="05"
        label="projects"
        title={
          <>
            Selected work across <em>healthcare, construction and AI.</em>
          </>
        }
        lede="A showcase of innovative solutions and successful implementations across various domains and technologies."
      />

      <StatGrid columns={3}>
        <StatTile value={projects.length} label="projects" />
        <StatTile value={categoryCount} label="categories" />
        <StatTile value={technologyCount} label="technologies" />
      </StatGrid>

      <ListViewer<ProjectWithMeta>
        data={projects}
        isLoading={isLoading}
        loadingMessage="Loading projects…"
        emptyMessage="No projects found."
        defaultViewMode="card"
        enabledModes={["card", "list", "carousel"]}
        enableShowMore
        visibleMajorItemCount={21}
        enableCategoryFilter
        categoryField="group"
        categoryOrder={categoryOrder}
        enableSearch
        searchFields={["title", "summary", "group", "companyTitle"]}
        searchPlaceholder="Search projects, technologies, or categories…"
        onItemClick={setSelectedProject}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: "companyTitle",
          description: (project) => project.summary ?? "",
          image: "icon",
          badge: "group",
          date: "formattedYears",
          tags: (project) => project.skillCodes ?? [],
        }}
        gridCols={{ sm: 1, md: 2, lg: 3 }}
        ariaLabel="Projects"
      />

      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
    </Section>
  );
};

export default PortfolioSection;
