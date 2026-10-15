import { useCallback, useEffect, useState } from 'react';
import { projectsRepo } from '@/repositories/ProjectsRepo';
import { experienceRepo } from '@/repositories/ExperienceRepo';
import { educationRepo } from '@/repositories/EducationRepo';
import { companiesRepo } from '@/repositories/CompaniesRepo';
import { parseDate } from '@/lib/datetimeutils';
import type { ProjectEntry } from '@/models/Project';
import type { Company } from '@/models/Companies';
import type { Education } from '@/models/Education';

export interface SkillRelations {
  /** Projects using the skill, most recent first. */
  projects: ProjectEntry[];
  /** Companies where the skill was used in a position, most recent first. */
  companies: Company[];
  /** Education records listing the skill, most recent first. */
  educations: Education[];
}

const EMPTY: SkillRelations = { projects: [], companies: [], educations: [] };

/** Descending by end date; an open-ended (current) range sorts first. */
const compareEndDateDesc = (a?: string | null, b?: string | null): number => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return (parseDate(b)?.getTime() ?? 0) - (parseDate(a)?.getTime() ?? 0);
};

const key = (code: string) => code.toUpperCase();

const push = <T>(map: Map<string, T[]>, code: string, value: T) => {
  const k = key(code);
  const list = map.get(k);
  if (list) list.push(value);
  else map.set(k, [value]);
};

/**
 * Builds, once, an index from skill code to the projects, companies and
 * education records that reference it. Lookups are synchronous afterwards, so
 * hover panels can render without a loading state.
 */
export const useSkillRelations = () => {
  const [index, setIndex] = useState<Map<string, SkillRelations>>(() => new Map());
  const [companyByCode, setCompanyByCode] = useState<Map<string, Company>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projects, experiences, educations, companies] = await Promise.all([
          projectsRepo.getList(),
          experienceRepo.getList(),
          educationRepo.getList(),
          companiesRepo.getList(),
        ]);
        if (cancelled) return;

        const companyMap = new Map(companies.map((c) => [key(c.code), c]));

        const projectsBySkill = new Map<string, ProjectEntry[]>();
        projects.forEach((p) => p.skillCodes?.forEach((c) => push(projectsBySkill, c, p)));

        // skill -> companyCode -> latest position end date (null = current)
        const companyEndBySkill = new Map<string, Map<string, string | null>>();
        experiences.forEach((exp) => {
          if (!exp.companyCode) return;
          exp.positions?.forEach((pos) => {
            pos.skillCodes?.forEach((c) => {
              const k = key(c);
              const perCompany = companyEndBySkill.get(k) ?? new Map<string, string | null>();
              const prev = perCompany.get(exp.companyCode!);
              const next = pos.endDate || null;
              if (prev === undefined || compareEndDateDesc(next, prev) < 0) perCompany.set(exp.companyCode!, next);
              companyEndBySkill.set(k, perCompany);
            });
          });
        });

        const educationsBySkill = new Map<string, Education[]>();
        educations.forEach((e) => e.skillCodes?.forEach((c) => push(educationsBySkill, c, e)));

        const result = new Map<string, SkillRelations>();
        const allKeys = new Set([...projectsBySkill.keys(), ...companyEndBySkill.keys(), ...educationsBySkill.keys()]);
        allKeys.forEach((k) => {
          const companiesSorted = [...(companyEndBySkill.get(k)?.entries() ?? [])]
            .sort((a, b) => compareEndDateDesc(a[1], b[1]))
            .map(([code]) => companyMap.get(key(code)))
            .filter((c): c is Company => !!c);
          result.set(k, {
            projects: [...(projectsBySkill.get(k) ?? [])].sort((a, b) =>
              compareEndDateDesc(a.datePeriod?.endDate, b.datePeriod?.endDate),
            ),
            companies: companiesSorted,
            educations: [...(educationsBySkill.get(k) ?? [])].sort((a, b) =>
              compareEndDateDesc(a.datePeriod?.endDate, b.datePeriod?.endDate),
            ),
          });
        });

        setIndex(result);
        setCompanyByCode(companyMap);
      } catch (error) {
        console.error('Failed to build skill relations index:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRelations = useCallback(
    (skillCode: string | null | undefined): SkillRelations =>
      (skillCode && index.get(key(skillCode))) || EMPTY,
    [index],
  );

  const getCompany = useCallback(
    (companyCode: string | null | undefined): Company | undefined =>
      companyCode ? companyByCode.get(key(companyCode)) : undefined,
    [companyByCode],
  );

  return { getRelations, getCompany };
};

export default useSkillRelations;
