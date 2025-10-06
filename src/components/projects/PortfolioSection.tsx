import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Filter, Search, ExternalLink } from "lucide-react";
import ProjectDetailDialog from './ProjectDetailDialog';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import type { ProjectEntry } from '@/models/Project';
import DataDisplaySection from '@/components/ui/DataDisplaySection';

interface ProjectWithIcon extends ProjectEntry {
  icon: string;
  formattedYears: string;
}

const PortfolioSectionRefactored = () => {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<ProjectWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [groups, setGroups] = useState<string[]>([]);

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

        // Load groups from JSON
        const fullData = await fetch('/data/projects.json').then(r => r.json());
        const groupsList = fullData.general?.groups || [];
        const uniqueGroups = [...new Set(data.map(p => p.group).filter(Boolean))].sort();
        setGroups(uniqueGroups);

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

  // Filter projects by group and search
  const filteredProjects = projects.filter((project) => {
    const matchesGroup = selectedGroup === "All" || project.group === selectedGroup;
    const matchesSearch = !searchText.trim() ||
      project.title.toLowerCase().includes(searchText.toLowerCase()) ||
      project.summary?.toLowerCase().includes(searchText.toLowerCase()) ||
      project.group?.toLowerCase().includes(searchText.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Get unique groups/categories
  const categories = ['All', ...groups];

  const getGroupCount = (group: string) => {
    if (group === "All") return projects.length;
    return projects.filter(p => p.group === group).length;
  };

  // Handle project click
  const handleProjectClick = (project: ProjectWithIcon) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  return (
    <section id="portfolio" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Featured<span className="bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Projects</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A showcase of innovative solutions and successful implementations across various domains and technologies
          </p>
        </div>

        {/* Filter Controls */}
        <div className="space-y-4 mb-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters ({getGroupCount(selectedGroup)})
            </Button>
          </div>

          {/* Filter Categories */}
          <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="flex flex-wrap gap-2 w-full">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedGroup === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedGroup(category)}
                  className="flex-1 min-w-fit transition-all duration-200 hover:scale-105"
                >
                  {category}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getGroupCount(category)}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects, technologies, or categories..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* DataDisplaySection */}
        <DataDisplaySection<ProjectWithIcon>
          data={filteredProjects}
          isLoading={isLoading}
          loadingMessage="Loading projects..."
          emptyMessage="No projects found."
          defaultViewMode="card"
          enabledModes={['card', 'list', 'carousel']}
          enableShowMore={true}
          visibleMajorItemCount={16}
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (project) => project.companyCode || '',
            description: (project) => project.summary || '',
            image: 'icon',
            badge: 'group',
            date: 'formattedYears',
            actions: [
              {
                label: 'View Details',
                icon: ExternalLink,
                onClick: (project) => handleProjectClick(project),
                variant: 'outline',
              },
            ],
          }}
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          carouselHeight="550px"
          carouselCardWidth="400px"
          carouselCardHeight="480px"
          onItemClick={handleProjectClick}
          footer={
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {projects.length}+
                </div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {groups.length}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  50+
                </div>
                <div className="text-sm text-muted-foreground">Technologies</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  15+
                </div>
                <div className="text-sm text-muted-foreground">Years</div>
              </div>
            </div>
          }
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

export default PortfolioSectionRefactored;
