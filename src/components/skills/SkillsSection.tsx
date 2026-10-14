import { useEffect, useState } from "react";
import { skillsRepo } from "@/repositories/SkillsRepo";
import type { SkillItem } from "@/models/Skills";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import type { Education } from "@/models/Education";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import ProjectDetailDialog from "@/components/projects/ProjectDetailDialog";
import ExperienceDetailDialog from "@/components/experiences/ExperienceDetailDialog";
import EducationDetailDialog from "@/components/educations/EducationDetailDialog";
import SkillDetailDialog from "./SkillDetailDialog";

interface SkillWithIcon extends SkillItem {
  icon: string;
}

const SkillsSection = () => {
  const [skills, setSkills] = useState<SkillWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<Education | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [list, fullData] = await Promise.all([skillsRepo.getList(), skillsRepo.getFullData()]);
        const groups = [...(fullData?.general?.groups ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setCategoryOrder(groups.map((group) => group.title || group.name || ""));
        setSkills(
          list
            .map((skill) => ({ ...skill, icon: skill.photoUrl ?? "" }))
            .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
        );
      } catch (error) {
        console.error("Failed to load skills:", error);
        setSkills([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="skills">
      <SectionHeader
        index="04"
        label="skills"
        title={
          <>
            The toolbox, from <em>.NET to Kubernetes.</em>
          </>
        }
        lede="A comprehensive overview of programming languages, frameworks, databases, and tools I've mastered throughout my career."
      />

      <ListViewer<SkillWithIcon>
        data={skills}
        isLoading={isLoading}
        loadingMessage="Loading skills…"
        emptyMessage="No skills found."
        defaultViewMode="small-card"
        enabledModes={["small-card", "card", "list"]}
        enableShowMore
        visibleMajorItemCount={32}
        enableCategoryFilter
        categoryField="group"
        categoryOrder={categoryOrder}
        enableSearch
        searchFields={["title", "code", "group"]}
        searchPlaceholder="Search skills, technologies, or categories…"
        highlightItem={(skill) => Boolean(skill.isMajor)}
        onItemClick={setSelectedSkill}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (skill) => String(skill.group ?? ""),
          description: (skill) => `${skill.projects ?? 0} projects · ${skill.jobs ?? 0} jobs`,
          image: "icon",
          badge: (skill) => (skill.isMajor ? "major" : ""),
        }}
        gridCols={{ sm: 2, md: 3, lg: 4 }}
        ariaLabel="Skills"
      />

      <SkillDetailDialog
        skill={selectedSkill}
        isOpen={selectedSkill !== null}
        onClose={() => setSelectedSkill(null)}
        onOpenProject={setSelectedProject}
        onOpenExperience={setSelectedExperience}
        onOpenEducation={setSelectedEducation}
      />
      <ProjectDetailDialog project={selectedProject} isOpen={selectedProject !== null} onClose={() => setSelectedProject(null)} />
      <ExperienceDetailDialog
        experience={selectedExperience}
        isOpen={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
      />
      <EducationDetailDialog
        education={selectedEducation}
        isOpen={selectedEducation !== null}
        onClose={() => setSelectedEducation(null)}
      />
    </Section>
  );
};

export default SkillsSection;
