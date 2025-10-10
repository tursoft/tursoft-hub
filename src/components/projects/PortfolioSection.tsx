import { useState, useEffect } from 'react';
import ProjectDetailDialog from './ProjectDetailDialog';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import type { ProjectEntry } from '@/models/Project';
import ListViewer from '@/components/ui/listviewer';
import AnimatedCounter from '@/components/ui/animated-counter';

interface ProjectWithIcon extends ProjectEntry {
  icon: string;
  formattedYears: string;
}

const PortfolioSection = () => {
  const [projects, setProjects] = useState<ProjectWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Helper function to format date period to years only
  const formatDateToYears = (datePeriod: { startDate?: string; endDate?: string } | undefined) => {
    if (!datePeriod?.startDate) return '';
    
    const startYear = datePeriod.startDate.split('.')[2];
    
    if (!datePeriod.endDate) {
      return startYear;
    }
    
    const endYear = datePeriod.endDate.split('.')[2];
    
    if (startYear === endYear) {
      return startYear;
    }
    
    return `${startYear} - ${endYear}`;
  };

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await projectsRepo.getList();

        // Process projects with icons and formatted years
        const processedProjects = data.map((project) => ({
          ...project,
          icon: project.photoUrl || '',
          formattedYears: formatDateToYears(project.datePeriod),
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
  }, []);

  // Get unique groups for statistics
  const groups = [...new Set(projects.map(p => p.group).filter(Boolean))];

  // Handle project click
  const handleProjectClick = (project: ProjectWithIcon) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* listviewer with built-in filters */}
        <ListViewer<ProjectWithIcon>
          data={projects}
          isLoading={isLoading}
          loadingMessage="Loading projects..."
          emptyMessage="No projects found."
          title='Featured<span class="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Projects</span>'
          subtitle="A showcase of innovative solutions and successful implementations across various domains and technologies"
          summary={
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={projects.length} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={groups.length} />
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="text-3xl font-bold text-primary mb-2">
                  <AnimatedCounter end={50} suffix="+" />
                </div>
                <div className="text-sm text-muted-foreground">Technologies</div>
              </div>
            </div>
          }
          defaultViewMode="card"
          enabledModes={['card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={21}
          enableCategoryFilter={true}
          categoryField="group"
          enableSearch={true}
          searchFields={['title', 'summary', 'group']}
          searchPlaceholder="Search projects, technologies, or categories..."
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (project) => project.companyCode || '',
            description: (project) => project.summary || '',
            image: 'icon',
            badge: 'group',
            date: 'formattedYears',
            actions: [
            ],
          }}
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
