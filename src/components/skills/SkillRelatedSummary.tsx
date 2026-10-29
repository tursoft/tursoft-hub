import type { ReactNode } from 'react';
import { FolderKanban, Building2, GraduationCap } from 'lucide-react';
import type { SkillRelations } from '@/components/skills/useSkillRelations';
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

const Group = ({ icon, label, rows, total }: { icon: ReactNode; label: string; rows: Row[]; total: number }) => {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
        {icon}
        {label}
        {total > rows.length && <span className="font-normal normal-case tracking-normal">· top {rows.length} of {total}</span>}
      </h4>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2 min-w-0">
            {row.image ? (
              <img loading="lazy" decoding="async" src={row.image} alt="" className="w-5 h-5 rounded object-contain bg-background/60 flex-shrink-0" />
            ) : (
              <span className="w-5 h-5 rounded bg-muted flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium leading-tight truncate">{row.title}</p>
              {row.subtitle && <p className="text-[11px] text-muted-foreground truncate">{row.subtitle}</p>}
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
      <div className="space-y-7">
        <Group icon={<FolderKanban className="w-3.5 h-3.5" />} label="Projects" rows={projects} total={relations.projects.length} />
        <Group icon={<Building2 className="w-3.5 h-3.5" />} label="Companies" rows={companies} total={relations.companies.length} />
        <Group icon={<GraduationCap className="w-3.5 h-3.5" />} label="Education" rows={educations} total={relations.educations.length} />
      </div>
    </div>
  );
};

export default SkillRelatedSummary;
