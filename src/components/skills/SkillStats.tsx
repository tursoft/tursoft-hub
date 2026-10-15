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

/** Years of experience, competency bar, project/job counts and the derived score. */
export const SkillStats = ({ skill, compact = false, className }: SkillStatsProps) => {
  const competency = Math.max(0, Math.min(100, skill.competency ?? 0));
  const years = skill.yearsOfExperience ?? 0;
  const projects = skill.projects ?? 0;
  const jobs = skill.jobs ?? 0;
  const score = calculateSkillScore(skill);

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">Competency</span>
        <span className="font-semibold tabular-nums">{competency}%</span>
      </div>
      <Progress value={competency} className="h-2" aria-label={`Competency ${competency}%`} />

      {compact ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {plural(years, 'year')} · {plural(projects, 'project')} · {plural(jobs, 'job')} · score {score}
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Experience</dt>
            <dd className="font-semibold tabular-nums">{plural(years, 'year')}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Projects</dt>
            <dd className="font-semibold tabular-nums">{projects}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Jobs</dt>
            <dd className="font-semibold tabular-nums">{jobs}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Score</dt>
            <dd className="font-semibold tabular-nums">{score}</dd>
          </div>
        </dl>
      )}
    </div>
  );
};

export default SkillStats;
