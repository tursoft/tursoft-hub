import { useState, useEffect } from 'react';
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { skillsRepo } from '@/repositories/SkillsRepo';
import { calculateSkillScore } from '@/lib/skillScore';
import SectionHeader from '@/components/SectionHeader';
import { Badge } from '@/components/ui/badge';
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

const unit = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;

const clampPercent = (value?: number) => Math.max(0, Math.min(100, value ?? 0));

/** Competency as a thin ink bar with its figure; the bar is decoration for the figure. */
const CompetencyBar = ({ value, className }: { value: number; className?: string }) => (
  <span className={`flex items-center gap-2 ${className ?? ''}`}>
    <span className="ink-bar flex-1" aria-hidden="true">
      <span style={{ width: `${value}%` }} />
    </span>
    <span className="w-9 text-right text-[13px] leading-5 text-muted-foreground tnum">
      {value}%<span className="sr-only"> competency</span>
    </span>
  </span>
);

/** A figure with its unit: the number right-aligned in tabular figures, the unit in faint ink. */
const Count = ({ value, word, className }: { value: number; word: string; className?: string }) => (
  <span className={`text-[13px] leading-5 ${className ?? ''}`}>
    <span className="tnum text-foreground">{value}</span> <span className="text-faint">{unit(value, word)}</span>
  </span>
);

/**
 * List view: one ruled row of the skills reference.
 * Phones: logo, name over group, years over the competency bar.
 * sm and up: logo | name | group | years | projects | competency.
 */
const SkillRow = ({ skill }: { skill: SkillWithIcon }) => {
  const years = skill.yearsOfExperience ?? 0;
  const projects = skill.projects ?? 0;
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_6rem] items-center gap-x-3 gap-y-0.5 px-4 py-3 sm:grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,9rem)_5.5rem_7rem] sm:gap-x-4 lg:grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,11rem)_5.5rem_6.5rem_8rem]">
      {skill.icon ? (
        <img loading="lazy" decoding="async" src={skill.icon} alt="" className="row-span-2 h-5 w-5 object-contain sm:row-span-1" />
      ) : (
        <span className="row-span-2 h-5 w-5 rounded-sm bg-secondary sm:row-span-1" aria-hidden="true" />
      )}
      <h3 className="col-start-2 row-start-1 truncate text-sm font-medium leading-5 text-foreground sm:col-start-auto sm:row-start-auto">
        {skill.title}
      </h3>
      <p className="col-start-2 row-start-2 truncate text-[13px] leading-5 text-muted-foreground sm:col-start-auto sm:row-start-auto">
        {String(skill.group || '')}
      </p>
      <Count
        value={years}
        word="year"
        className="col-start-3 row-start-1 text-right sm:col-start-auto sm:row-start-auto"
      />
      <Count value={projects} word="project" className="hidden text-right lg:block" />
      <CompetencyBar
        value={clampPercent(skill.competency)}
        className="col-start-3 row-start-2 sm:col-start-auto sm:row-start-auto"
      />
    </div>
  );
};

/** Card view: logo, name and group, then the competency bar and the counts. */
const SkillCard = ({ skill }: { skill: SkillWithIcon }) => {
  const years = skill.yearsOfExperience ?? 0;
  const projects = skill.projects ?? 0;
  return (
    <div className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        {skill.icon ? (
          <img loading="lazy" decoding="async" src={skill.icon} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <span className="h-8 w-8 rounded-sm bg-secondary" aria-hidden="true" />
        )}
        {skill.isMajor && <Badge variant="secondary">Major</Badge>}
      </div>
      <h3 className="mt-4 text-[15px] font-medium leading-5 text-foreground">{skill.title}</h3>
      <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{String(skill.group || '')}</p>
      <div className="mt-auto pt-5">
        <CompetencyBar value={clampPercent(skill.competency)} />
        <p className="mt-1 flex flex-wrap gap-x-3">
          <Count value={years} word="year" />
          <Count value={projects} word="project" />
        </p>
      </div>
    </div>
  );
};

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

  // Unique groups, for the count beside the headline
  const groups = [...new Set(skills.map(s => String(s.group)).filter(Boolean))];

  return (
    <section id="skills" className="py-16 lg:py-24">
      <div className="container">
        <SectionHeader
          id="skills"
          title="Technical skills in .NET, Node.js, cloud and AI agents"
          description="The programming languages, frameworks, databases and tools I have worked with throughout my career, and the AI and agentic engineering stack I build with today"
          aside={
            skills.length > 0 ? (
              <p>
                <span className="tnum">{skills.length}</span> skills in <span className="tnum">{groups.length}</span> groups
              </p>
            ) : undefined
          }
        />

        {/* listviewer with built-in filters */}
        <ListViewer<SkillWithIcon>
          data={skills}
          isLoading={isLoading}
          loadingMessage="Loading skills"
          emptyMessage="No skills found"
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
          searchPlaceholder="Search skills, technologies or categories"
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
          renderListContent={(skill) => <SkillRow skill={skill} />}
          renderCardContent={(skill) => <SkillCard skill={skill} />}
          // ListViewer builds its grid classes from gridCols at run time, so they are spelled out
          // here for Tailwind to generate: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6
          gridCols={{ sm: 2, md: 3, lg: 4, xl: 6 }}
          smallCardImageClassName="w-3/5 h-3/5"
          cloudWeight={(skill) => skill.score}
          cloudHeight={760}
          cloudHoverContent={(skill) => (
            <div className="h-full rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                {skill.icon && (
                  <img loading="lazy" decoding="async" src={skill.icon} alt="" className="h-10 w-10 flex-shrink-0 object-contain" />
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-medium leading-6 text-foreground">{skill.title}</h3>
                  <p className="text-[13px] leading-5 text-muted-foreground">{String(skill.group || '')}</p>
                </div>
              </div>
              <SkillStats skill={skill} className="mt-6 border-t border-border pt-5" />
              <SkillRelatedSummary
                relations={getRelations(skill.code)}
                getCompany={getCompany}
                className="mt-8"
              />
            </div>
          )}
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
