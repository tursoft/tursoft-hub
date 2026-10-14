import { useEffect, useState } from "react";
import { peopleRepo } from "@/repositories/PeopleRepo";
import type { Person } from "@/models/People";
import ListViewer from "@/components/ui/listviewer";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import PeopleDetailDialog from "./PeopleDetailDialog";

interface PersonWithIcon extends Person {
  icon: string;
}

const PeopleSection = () => {
  const [people, setPeople] = useState<PersonWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await peopleRepo.getList();
        setPeople(list.map((person) => ({ ...person, icon: person.photoUrl ?? "" })));
      } catch (error) {
        console.error("Failed to load people:", error);
        setPeople([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Section id="people">
      <SectionHeader
        index="—"
        label="people"
        title={
          <>
            Team <em>members.</em>
          </>
        }
        lede="Talented professionals I've had the privilege to work with throughout my career."
      />
      <ListViewer<PersonWithIcon>
        data={people}
        isLoading={isLoading}
        loadingMessage="Loading people…"
        emptyMessage="No people found."
        defaultViewMode="card"
        enabledModes={["card", "list"]}
        enableShowMore
        visibleMajorItemCount={12}
        enableSearch
        searchFields={["title", "code", "company"]}
        searchPlaceholder="Search people, companies…"
        imageVariant="photo"
        gridCols={{ sm: 2, md: 3, lg: 4 }}
        onItemClick={setSelectedPerson}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (person) => String(person.company ?? ""),
          description: (person) => person.contacts?.find((contact) => contact.code === "email")?.value || "Team member",
          image: "icon",
        }}
        ariaLabel="People"
      />
      <PeopleDetailDialog person={selectedPerson} isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} />
    </Section>
  );
};

export default PeopleSection;
