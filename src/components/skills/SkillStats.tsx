import { Progress } from '@/components/ui/progress';
import { calculateSkillScore } from '@/lib/skillScore';
import type { SkillItem } from '@/models/Skills';

interface SkillStatsProps {
  skill: SkillItem;
  /** Compact: competency bar plus a single summary line. */
  compact?: boolean;
  className?: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One figure set large in the serif, its label underneath. */
const Figure = ({ label, value, unit }: { label: string; value: number; unit?: string }) => (
  <div>
    <dt className="text-xs leading-4 text-faint">{label}</dt>
    <dd className="mt-1 font-serif text-[28px] leading-8 text-foreground tnum">
      {value}
      {unit && <span className="ml-1.5 font-sans text-[13px] text-muted-foreground">{unit}</span>}
    </dd>
  </div>
);

/** Years of experience, competency as a thin ink bar, project/job counts and the derived score. */
export const SkillStats = ({ skill, compact = false, className }: SkillStatsProps) => {
  const competency = Math.max(0, Math.min(100, skill.competency ?? 0));
  const years = skill.yearsOfExperience ?? 0;
  const projects = skill.projects ?? 0;
  const jobs = skill.jobs ?? 0;
  const score = calculateSkillScore(skill);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between text-[13px] leading-5">
        <span className="text-muted-foreground">Competency</span>
        <span className="tnum text-foreground">{competency}%</span>
      </div>
      <Progress
        value={competency}
        className="mt-1.5 h-0.5 rounded-none bg-secondary-hover [&>div]:bg-foreground"
        aria-label={`Competency ${competency}%`}
      />

      {compact ? (
        <p className="mt-3 text-[13px] leading-5 text-muted-foreground tnum">
          {plural(years, 'year')} · {plural(projects, 'project')} · {plural(jobs, 'job')} · score {score}
        </p>
      ) : (
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <Figure label="Experience" value={years} unit={years === 1 ? 'year' : 'years'} />
          <Figure label="Projects" value={projects} />
          <Figure label="Jobs" value={jobs} />
          <Figure label="Score" value={score} />
        </dl>
      )}
    </div>
  );
};

export default SkillStats;
