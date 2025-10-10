import { useState, useEffect } from 'react';
import { skillsRepo } from '@/repositories/SkillsRepo';
import type { SkillItem } from '@/models/Skills';
import ListViewer from '@/components/ui/listviewer';
import SkillDetailDialog from './SkillDetailDialog';

interface SkillWithIcon extends SkillItem {
  icon: string;
}

const SkillsSection = () => {
  const [skills, setSkills] = useState<SkillWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  // Load skills data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await skillsRepo.getList();
        const fullData = await skillsRepo.getFullData();

        // Extract and sort groups by orderIndex
        if (fullData?.general?.groups) {
          const sortedGroups = [...fullData.general.groups]
            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
            .map(g => g.title || g.name || '');
          setCategoryOrder(sortedGroups);
        }

        // Process skills with icons and sort by orderIndex
        const processedSkills = data
          .map((skill) => ({
            ...skill,
            icon: skill.photoUrl
          }))
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

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

  // Get unique groups for statistics
  const groups = [...new Set(skills.map(s => String(s.group)).filter(Boolean))];

  return (
    <section id="skills" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* listviewer with built-in filters */}
        <ListViewer<SkillWithIcon>
          data={skills}
          isLoading={isLoading}
          loadingMessage="Loading skills..."
          emptyMessage="No skills found."
          title='Technical<span class="text-primary bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Skills</span>'
          subtitle="A comprehensive overview of programming languages, frameworks, databases, and tools I've mastered throughout my career"
          defaultViewMode="small-card"
          enabledModes={['small-card', 'card', 'list']}
          enableShowMore={true}
          visibleMajorItemCount={32}
          enableCategoryFilter={true}
          categoryField="group"
          categoryOrder={categoryOrder}
          enableSearch={true}
          searchFields={['title', 'code', 'group']}
          searchPlaceholder="Search skills, technologies, or categories..."
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
              {/* <div className="p-6 rounded-lg bg-card border border-border/50">
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
              </div> */}
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

export default SkillsSection;
