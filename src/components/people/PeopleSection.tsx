import { useState, useEffect } from 'react';
import { peopleRepo } from '@/repositories/PeopleRepo';
import type { Person } from '@/models/People';
import ListViewer from '@/components/ui/listviewer';
import PeopleDetailDialog from './PeopleDetailDialog';

interface PersonWithIcon extends Person {
  icon: string;
}

const emailOf = (person: Person) => person.contacts?.find((c) => c.code === 'email')?.value || '';

/** A printed portrait, or an empty raised square of the same size when there is no photo. */
const PersonPhoto = ({ person, className }: { person: PersonWithIcon; className: string }) =>
  person.icon ? (
    <img
      src={person.icon}
      alt=""
      loading="lazy"
      decoding="async"
      className={`print-photo flex-shrink-0 object-cover ${className}`}
    />
  ) : (
    <span className={`flex-shrink-0 bg-secondary ${className}`} aria-hidden="true" />
  );

/** Grid: portrait, name and company, like a page of contributors. */
const PersonCard = ({ person }: { person: PersonWithIcon }) => (
  <div className="flex h-full flex-col p-4">
    <PersonPhoto person={person} className="aspect-square h-auto w-full" />
    <h3 className="mt-3 text-sm font-medium leading-5 text-foreground">{person.title}</h3>
    {person.company && <p className="text-[13px] leading-5 text-faint">{person.company}</p>}
  </div>
);

/** List: one row per person. */
const PersonRow = ({ person }: { person: PersonWithIcon }) => {
  const email = emailOf(person);
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <PersonPhoto person={person} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium leading-5 text-foreground">{person.title}</h3>
        {person.company && <p className="truncate text-[13px] leading-5 text-faint">{person.company}</p>}
      </div>
      {email && <span className="hidden truncate text-[13px] leading-5 text-muted-foreground sm:block">{email}</span>}
    </div>
  );
};

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

  const organizations = new Set(people.map((p) => p.company).filter(Boolean)).size;
  const figures = [
    { value: `${people.length}+`, label: 'Team members' },
    { value: String(organizations), label: 'Organizations' },
    { value: '15+', label: 'Years collaboration' },
  ];

  return (
    <section id="people" className="py-16 lg:py-24">
      <div className="container">
        {/* Not a numbered homepage section, so the opener is set by hand with the same classes */}
        <header className="section-head">
          <div className="min-w-0">
            <p className="kicker">People</p>
            <h2 className="section-title">Team members</h2>
            <p className="section-desc">Talented professionals I've had the privilege to work with throughout my career</p>
          </div>
          {people.length > 0 && (
            <div className="section-aside">
              <p>
                {people.length} people, {organizations} organizations
              </p>
            </div>
          )}
        </header>

        {/* listviewer with built-in search */}
        <ListViewer<PersonWithIcon>
          data={people}
          isLoading={isLoading}
          loadingMessage="Loading people…"
          emptyMessage="No people found"
          defaultViewMode="card"
          enabledModes={['card', 'list']}
          enableShowMore={true}
          visibleMajorItemCount={12}
          enableSearch={true}
          searchFields={['title', 'code', 'company']}
          searchPlaceholder="Search people and companies"
          onItemClick={(person) => {
            setSelectedPerson(person);
            setIsPeopleDialogOpen(true);
          }}
          renderCardContent={(person) => <PersonCard person={person} />}
          renderListContent={(person) => <PersonRow person={person} />}
          fieldMapping={{
            code: 'code',
            title: 'title',
            subtitle: (person) => String(person.company || ''),
            description: (person) => emailOf(person) || 'Team Member',
            image: 'icon',
            badge: '',
          }}
          gridCols={{ sm: 2, md: 3, lg: 4, xl: 6 }}
          imageRounded={false}
          footer={
            <dl className="grid grid-cols-3 border-t border-border">
              {figures.map((figure, index) => (
                <div key={figure.label} className={index === 0 ? 'pt-6' : 'border-l border-border pl-4 pt-6 sm:pl-6'}>
                  <dt className="text-[13px] leading-5 text-faint">{figure.label}</dt>
                  <dd className="tnum mt-1 font-serif text-[32px] leading-10 text-foreground sm:text-[40px] sm:leading-[48px]">
                    {figure.value}
                  </dd>
                </div>
              ))}
            </dl>
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
