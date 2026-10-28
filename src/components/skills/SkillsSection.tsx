import { useState, useEffect } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { calculateSkillScore } from '@/lib/skillScore';
import { SkillStats } from '@/components/skills/SkillStats';
import { SkillRelatedSummary } from '@/components/skills/SkillRelatedSummary';
import { useSkillRelations } from '@/components/skills/useSkillRelations';
import type { SkillItem } from '@/models/Skills';
import type { Experience } from '@/models/Experience';
import type { ProjectEntry } from '@/models/Project';
import type { Education } from '@/models/Education';
import ListViewer from '@/components/ui/listviewer';
import SkillDetailDialog from './SkillDetailDialog';
import ProjectDetailDialog from '@/components/projects/ProjectDetailDialog';
import ExperienceDetailDialog from '@/components/experiences/ExperienceDetailDialog';
import EducationDetailDialog from '@/components/educations/EducationDetailDialog';

interface SkillWithIcon extends SkillItem {
  icon: string;
  score: number;
}

const SkillsSection = () => {
  const [skills, setSkills] = useSnapshotState<SkillWithIcon[]>('skills.skills', []);
  const { getRelations, getCompany } = useSkillRelations();
  const [isLoading, setIsLoading] = useSnapshotState('skills.isLoading', true);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [isSkillDialogOpen, setIsSkillDialogOpen] = useState(false);
  const [categoryOrder, setCategoryOrder] = useSnapshotState<string[]>('skills.categoryOrder', []);
  
  // Dialog states for nested dialogs
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);

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
            icon: skill.photoUrl,
            score: calculateSkillScore(skill),
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
  }, [setCategoryOrder, setIsLoading, setSkills]);

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
          title='Technical Skills:<span class="text-primary bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">.NET, Node.js, Cloud and AI Agents</span>'
          subtitle="A comprehensive overview of the programming languages, frameworks, databases and tools I've mastered throughout my career, and the AI and agentic engineering stack I build with today"
          defaultViewMode="cloud"
          enabledModes={['cloud', 'small-card', 'card', 'list']}
          enableShowMore={true}
          visibleMajorItemCount={32}
          enableCategoryFilter={true}
          categoryField="group"
          categoryOrder={categoryOrder}
          categoryFilterLayout="side"
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
          smallCardImageClassName="w-3/5 h-3/5"
          cloudWeight={(skill) => skill.score}
          cloudHeight={760}
          cloudHoverContent={(skill) => (
            <div className="h-full rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                {skill.icon && (
                  <img loading="lazy" decoding="async" src={skill.icon} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="font-bold leading-tight truncate">{skill.title}</h3>
                  <p className="text-xs text-primary font-medium">{String(skill.group || '')}</p>
                </div>
              </div>
              <SkillStats skill={skill} />
              <SkillRelatedSummary
                relations={getRelations(skill.code)}
                getCompany={getCompany}
                className="mt-7 pt-7 border-t border-border"
              />
            </div>
          )}
          footer={
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
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
        onOpenProject={(project) => {
          setSelectedProject(project);
          setIsProjectDialogOpen(true);
        }}
        onOpenExperience={(experience) => {
          setSelectedExperience(experience);
          setIsExperienceDialogOpen(true);
        }}
        onOpenEducation={(education) => {
          setSelectedEducation(education);
          setIsEducationDialogOpen(true);
        }}
      />

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={() => {
          setIsProjectDialogOpen(false);
          setSelectedProject(null);
        }}
      />

      {/* Experience Detail Dialog */}
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={isExperienceDialogOpen}
        onClose={() => {
          setIsExperienceDialogOpen(false);
          setSelectedExperience(null);
        }}
      />

      {/* Education Detail Dialog */}
      <EducationDetailDialog
        education={selectedEducation}
        isOpen={isEducationDialogOpen}
        onClose={() => {
          setIsEducationDialogOpen(false);
          setSelectedEducation(null);
        }}
      />
    </section>
  );
};

export default SkillsSection;
