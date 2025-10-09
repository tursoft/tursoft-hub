import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Filter, Search } from "lucide-react";
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { SkillItem } from '@/models/Skills';
import ListViewer from '@/components/ui/ListViewer';
import SkillDetailDialog from './SkillDetailDialog';

interface SkillWithIcon extends SkillItem {
  icon: string;
}

const SkillsSectionRefactored = () => {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [skills, setSkills] = useState<SkillWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);

  // Load skills data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await skillsRepo.getList();

        // Get unique groups
        const uniqueGroups = [...new Set(data.map(s => String(s.group)).filter(Boolean))].sort();
        setGroups(uniqueGroups);

        // Process skills with icons
        const processedSkills = data.map((skill) => ({
          ...skill,
          icon: skill.photoUrl
        }));

        setSkills(processedSkills);
      } catch (error) {
        console.error('Failed to load skills:', error);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter skills by group and search
  const filteredSkills = skills.filter((skill) => {
    const matchesGroup = selectedGroup === "All" || String(skill.group) === selectedGroup;
    const matchesSearch = !searchText.trim() ||
      skill.title.toLowerCase().includes(searchText.toLowerCase()) ||
      skill.code.toLowerCase().includes(searchText.toLowerCase()) ||
      String(skill.group || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // Get unique groups/categories
  const categories = ['All', ...groups];

  const getGroupCount = (group: string) => {
    if (group === "All") return skills.length;
    return skills.filter(s => String(s.group) === group).length;
  };

  return (
    <section id="skills" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Technical<span className="text-primary bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Skills</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive overview of programming languages, frameworks, databases, and tools I've mastered throughout my career
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
              placeholder="Search skills, technologies, or categories..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* ListViewer */}
        <ListViewer<SkillWithIcon>
          data={filteredSkills}
          isLoading={isLoading}
          loadingMessage="Loading skills..."
          emptyMessage="No skills found."
          defaultViewMode="card"
          enabledModes={['card', 'list']}
          enableShowMore={true}
          visibleMajorItemCount={16}
          onItemClick={(skill) => {
            setSelectedSkill(skill);
            setIsSkillDialogOpen(true);
          }}
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (skill) => String(skill.group || ''),
            description: (skill) => `${skill.projects} projects • ${skill.jobs} jobs`,
            image: 'icon',
            badge: (skill) => skill.isMajor ? 'Major' : '',
          }}
          gridCols={{ sm: 2, md: 3, lg: 4, xl: 6 }}
          footer={
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {skills.length}+
                </div>
                <div className="text-sm text-muted-foreground">Technologies</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {groups.length}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {skills.filter(s => s.isMajor).length}
                </div>
                <div className="text-sm text-muted-foreground">Major Skills</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  15+
                </div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>
          }
        />
      </div>

      {/* Skill Detail Dialog */}
      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={isSkillDialogOpen}
        onClose={() => {
          setIsSkillDialogOpen(false);
          setSelectedSkill(null);
        }}
      />
    </section>
  );
};

export default SkillsSectionRefactored;
