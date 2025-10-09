import { useState, useEffect } from 'react';
import { peopleRepo } from '@/repositories/PeopleRepo';
import type { Person } from '@/models/People';
import ListViewer from '@/components/ui/ListViewer';
import PeopleDetailDialog from './PeopleDetailDialog';

interface PersonWithIcon extends Person {
  icon: string;
}

const PeopleSection = () => {
  const [people, setPeople] = useState<PersonWithIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);

  // Load people data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await peopleRepo.getList();

        // Process people with icons
        const processedPeople = data.map((person) => ({
          ...person,
          icon: person.photoUrl || ''
        }));

        setPeople(processedPeople);
      } catch (error) {
        console.error('Failed to load people:', error);
        setPeople([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <section id="people" className="py-20 bg-background/50">
      <div className="container mx-auto px-4">
        {/* ListViewer with built-in search */}
        <ListViewer<PersonWithIcon>
          data={people}
          isLoading={isLoading}
          loadingMessage="Loading people..."
          emptyMessage="No people found."
          title='Team<span class="text-primary bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4">Members</span>'
          subtitle="Talented professionals I've had the privilege to work with throughout my career"
          defaultViewMode="card"
          enabledModes={['card', 'list']}
          enableShowMore={true}
          visibleMajorItemCount={12}
          enableSearch={true}
          searchFields={['title', 'code', 'company']}
          searchPlaceholder="Search people, companies..."
          onItemClick={(person) => {
            setSelectedPerson(person);
            setIsPeopleDialogOpen(true);
          }}
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (person) => String(person.company || ''),
            description: (person) => {
              const contactInfo = [];
              const emailContact = person.contacts?.find(c => c.code === 'email');
              if (emailContact?.value) contactInfo.push(emailContact.value);
              return contactInfo.join(' • ') || 'Team Member';
            },
            image: 'icon',
            badge: '',
          }}
          gridCols={{ sm: 2, md: 3, lg: 4, xl: 6 }}
          imageRounded={true}
          footer={
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {people.length}+
                </div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  {new Set(people.map(p => p.company).filter(Boolean)).size}
                </div>
                <div className="text-sm text-muted-foreground">Organizations</div>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border/50">
                <div className="text-3xl font-bold text-primary mb-2">
                  15+
                </div>
                <div className="text-sm text-muted-foreground">Years Collaboration</div>
              </div>
            </div>
          }
        />
      </div>

      {/* People Detail Dialog */}
      <PeopleDetailDialog
        person={selectedPerson}
        isOpen={isPeopleDialogOpen}
        onClose={() => {
          setIsPeopleDialogOpen(false);
          setSelectedPerson(null);
        }}
      />
    </section>
  );
};

export default PeopleSection;
