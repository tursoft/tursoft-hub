import type { SkillRelations } from '@design/components/skills/useSkillRelations';
import type { Company } from '@/models/Companies';

interface SkillRelatedSummaryProps {
  relations: SkillRelations;
  getCompany: (companyCode: string | null | undefined) => Company | undefined;
  /** Max entries per group. */
  limit?: number;
  className?: string;
}

interface Row {
  key: string;
  title: string;
  subtitle?: string;
  image?: string | null;
}

const Group = ({ label, rows, total }: { label: string; rows: Row[]; total: number }) => {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="flex items-baseline justify-between gap-3 text-[13px] leading-5 text-muted-foreground">
        {label}
        {total > rows.length && (
          <span className="tnum text-xs text-faint">
            {rows.length} of {total}
          </span>
        )}
      </h4>
      <ul className="mt-2 border-t border-border">
        {rows.map((row) => (
          <li key={row.key} className="flex min-w-0 items-center gap-3 border-b border-border py-2">
            {row.image ? (
              <img
                loading="lazy"
                decoding="async"
                src={row.image}
                alt=""
                className="h-5 w-5 flex-shrink-0 object-contain mix-blend-multiply"
              />
            ) : (
              <span className="h-5 w-5 flex-shrink-0 rounded-sm bg-secondary" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-5 text-foreground">{row.title}</p>
              {row.subtitle && <p className="truncate text-xs leading-4 text-faint">{row.subtitle}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Top projects, companies and education records for a skill. */
export const SkillRelatedSummary = ({ relations, getCompany, limit = 3, className }: SkillRelatedSummaryProps) => {
  const projects: Row[] = relations.projects.slice(0, limit).map((p) => ({
    key: p.code,
    title: p.title,
    subtitle: getCompany(p.companyCode)?.title,
    image: p.photoUrl,
  }));
  const companies: Row[] = relations.companies.slice(0, limit).map((c) => ({
    key: c.code,
    title: c.title,
    subtitle: [c.city, c.country].filter(Boolean).join(', ') || undefined,
    image: c.photoUrl,
  }));
  const educations: Row[] = relations.educations.slice(0, limit).map((e) => {
    const school = getCompany(e.companyCode);
    return {
      key: e.code,
      title: school?.title || e.department,
      subtitle: school ? [e.level, e.department].filter(Boolean).join(' · ') : e.level,
      image: school?.photoUrl,
    };
  });

  if (projects.length + companies.length + educations.length === 0) return null;

  return (
    <div className={className}>
      <div className="space-y-6">
        <Group label="Projects" rows={projects} total={relations.projects.length} />
        <Group label="Companies" rows={companies} total={relations.companies.length} />
        <Group label="Education" rows={educations} total={relations.educations.length} />
      </div>
    </div>
  );
};

export default SkillRelatedSummary;
