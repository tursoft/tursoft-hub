import { useState, useEffect, type ComponentType } from "react";
import { useSnapshotState } from '@/hooks/use-snapshot-state';
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
  Globe,
  MessageSquare,
  Quote,
  ArrowUpRight,
  type LucideProps,
} from "lucide-react";
import { referencesRepo } from "@/repositories/ReferencesRepo";
import { peopleRepo } from "@/repositories/PeopleRepo";
import type { Reference } from "@/models/Reference";
import type { Person } from "@/models/People";
import ListViewer from "@/components/ui/listviewer";
import PeopleDetailDialog from "@/components/people/PeopleDetailDialog";

// Extended reference with photo field for rendering
interface ReferenceWithPhoto extends Reference {
  photo: string;
}

const CONTACT_ICONS: Record<string, ComponentType<LucideProps>> = {
  phone: Phone,
  email: Mail,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  website: Globe,
  skype: MessageSquare,
};

const CONTACT_LABELS: Record<string, string> = {
  phone: 'Call',
  email: 'Email',
  linkedin: 'LinkedIn',
  twitter: 'Twitter',
  facebook: 'Facebook',
  website: 'Website',
  skype: 'Skype',
};

/** Preferred order when only a few contact links fit. */
const CONTACT_ORDER = ['linkedin', 'email', 'phone', 'website', 'twitter', 'facebook', 'skype'];

const getContactIcon = (code: string) => CONTACT_ICONS[code] ?? ExternalLink;
const getContactLabel = (code: string, value: string) => CONTACT_LABELS[code] ?? value;
const getContactHref = (code: string, value: string) => {
  switch (code) {
    case 'phone': return `tel:${value.replace(/[^\d+]/g, '')}`;
    case 'email': return `mailto:${value}`;
    default: return value.startsWith('http') ? value : `https://${value}`;
  }
};

/** Contact links as small pills; clicks must not open the person dialog behind them. */
const ContactLinks = ({ reference, max = 4 }: { reference: ReferenceWithPhoto; max?: number }) => {
  const rank = (code: string) => {
    const i = CONTACT_ORDER.indexOf(code);
    return i === -1 ? CONTACT_ORDER.length : i;
  };
  const contacts = [...(reference.contacts ?? [])].sort((a, b) => rank(a.code) - rank(b.code)).slice(0, max);
  if (contacts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {contacts.map((contact) => {
        const Icon = getContactIcon(contact.code);
        const label = getContactLabel(contact.code, contact.value);
        const external = contact.code !== 'phone' && contact.code !== 'email';
        return (
          <a
            key={contact.code}
            href={getContactHref(contact.code, contact.value)}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            aria-label={`${label}: ${reference.title}`}
            title={label}
            onClick={(e) => e.stopPropagation()}
            className="contact-pill"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{label}</span>
          </a>
        );
      })}
    </div>
  );
};

const Avatar = ({ reference, className }: { reference: ReferenceWithPhoto; className: string }) =>
  reference.photo ? (
    <div className={`avatar-ring ${className}`}>
      <img src={reference.photo} alt="" loading="lazy" decoding="async" width={80} height={80} />
    </div>
  ) : null;

/** Testimonial card used by the carousel and the card grid. */
const TestimonialCard = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <div className="testimonial-card group relative flex h-full flex-col p-6 sm:p-8">
    <Quote className="testimonial-mark" aria-hidden="true" />
    <header className="flex items-center gap-4 pr-10">
      <Avatar reference={reference} className="h-16 w-16 sm:h-20 sm:w-20" />
      <div className="min-w-0">
        <h3 className="text-lg font-bold leading-tight text-foreground sm:text-xl">{reference.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-[hsl(var(--primary-light))]">{reference.position}</p>
        <p className="text-xs text-muted-foreground">
          {reference.company}
          {reference.date ? ` · ${reference.date}` : ''}
        </p>
      </div>
    </header>
    <blockquote className="mt-6 flex min-h-0 flex-1 flex-col justify-center" lang={reference.lang || undefined}>
      <p
        className="testimonial-text line-clamp-6 sm:line-clamp-[7]"
        dangerouslySetInnerHTML={{ __html: reference.testimonial }}
      />
    </blockquote>
    <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
      <ContactLinks reference={reference} max={3} />
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
        Full testimonial
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </footer>
  </div>
);

/** List view row. */
const TestimonialRow = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <div className="group flex gap-5 p-5 sm:p-6">
    <Avatar reference={reference} className="h-14 w-14 sm:h-16 sm:w-16" />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {reference.title}
          </h3>
          <p className="text-sm font-medium text-[hsl(var(--primary-light))]">
            {reference.position}
            {reference.company ? ` · ${reference.company}` : ''}
          </p>
        </div>
        {reference.date && <span className="text-xs text-muted-foreground">{reference.date}</span>}
      </div>
      <blockquote className="mt-3" lang={reference.lang || undefined}>
        <p className="testimonial-text line-clamp-3" dangerouslySetInnerHTML={{ __html: reference.testimonial }} />
      </blockquote>
      <div className="mt-4">
        <ContactLinks reference={reference} max={4} />
      </div>
    </div>
  </div>
);

/** Split view entry: photo, name and title. */
const ReferenceEntry = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <>
    <Avatar reference={reference} className="h-11 w-11" />
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold">{reference.title}</span>
      <span className="block truncate text-xs text-[hsl(var(--primary-light))]">{reference.position}</span>
    </span>
  </>
);

/** Split view detail: the whole testimonial, with no card frame around it. */
const TestimonialDetail = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <div className="group flex h-full items-center py-2 md:py-6">
    <article className="relative w-full">
      <Quote className="testimonial-mark right-0 top-0 hidden sm:block" aria-hidden="true" />
      <header className="flex items-center gap-5 sm:pr-16">
        <Avatar reference={reference} className="h-20 w-20 sm:h-24 sm:w-24" />
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">{reference.title}</h3>
          <p className="mt-1 font-medium text-[hsl(var(--primary-light))]">{reference.position}</p>
          <p className="text-sm text-muted-foreground">
            {reference.company}
            {reference.date ? ` · ${reference.date}` : ''}
          </p>
        </div>
      </header>
      <blockquote className="mt-8" lang={reference.lang || undefined}>
        <p className="testimonial-text sm:text-[1.05rem]" dangerouslySetInnerHTML={{ __html: reference.testimonial }} />
      </blockquote>
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <ContactLinks reference={reference} max={4} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-primary">
          Full profile
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </footer>
    </article>
  </div>
);

const ReferencesSection = () => {
  const [references, setReferences] = useSnapshotState<ReferenceWithPhoto[]>('references.references', []);
  const [isLoading, setIsLoading] = useSnapshotState('references.isLoading', true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPeopleDialogOpen, setIsPeopleDialogOpen] = useState(false);

  useEffect(() => {
    // Load references from repository with photos
    const loadReferences = async () => {
      try {
        const allReferences = await referencesRepo.getList();

        // Filter active references and load photos
        const activeReferences = allReferences.filter((ref) => ref.isActive);
        const referencesWithPhotos = await Promise.all(
          activeReferences.map(async (ref) => ({
            ...ref,
            photo: (await referencesRepo.getPhotoUrlByCode(ref.code)) || '',
          }))
        );

        setReferences(referencesWithPhotos);
      } catch (error) {
        console.error('Error loading references:', error);
        setReferences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferences();
  }, [setIsLoading, setReferences]);

  return (
    <section id="references">
      <ListViewer<ReferenceWithPhoto>
        data={references}
        isLoading={isLoading}
        loadingMessage="Loading references..."
        emptyMessage="No references available"
        defaultViewMode="carousel"
        enabledModes={['card', 'list', 'split', 'carousel']}
        title="References:<span class='bg-gradient-to-r from-[hsl(var(--navy-deep))] via-[hsl(var(--primary))] to-[hsl(var(--primary-light))] bg-clip-text text-transparent block lg:inline lg:ml-4'>What Colleagues Say</span>"
        subtitle="Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career."
        badge="Professional References"
        imageRounded={true}
        carouselLabel="Testimonials"
        carouselHeight="34rem"
        carouselCardWidth="38rem"
        carouselCardHeight="30rem"
        carouselCardClassName="testimonial-shell overflow-hidden rounded-2xl border-border/70 bg-card/90 backdrop-blur-sm"
        carouselAutoplayMs={9000}
        renderCarouselContent={(ref) => <TestimonialCard reference={ref} />}
        renderCardContent={(ref) => <TestimonialCard reference={ref} />}
        renderListContent={(ref) => <TestimonialRow reference={ref} />}
        renderSplitItem={(ref) => <ReferenceEntry reference={ref} />}
        renderSplitDetail={(ref) => <TestimonialDetail reference={ref} />}
        splitHeight="34rem"
        gridCols={{ sm: 1, md: 2, lg: 2, xl: 3 }}
        onItemClick={async (ref) => {
          try {
            const person = await peopleRepo.getByCode(ref.code);
            if (person) {
              setSelectedPerson(person);
              setIsPeopleDialogOpen(true);
            }
          } catch (error) {
            console.error('Failed to load person:', error);
          }
        }}
        fieldMapping={{
          code: 'code',
          title: 'title',
          subtitle: (ref) => `${ref.position} at ${ref.company}`,
          description: 'testimonial',
          image: 'photo',
          date: 'date',
        }}
        footer={
          <div className="text-center">
            <p className="text-muted-foreground mb-6 text-lg">
              Want to add your reference or testimonial?
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3 transition-all duration-300"
            >
              <a href="mailto:tursoft@gmail.com?subject=Reference%20Request">
                <ExternalLink className="mr-2 h-5 w-5" aria-hidden="true" />
                Contact for Reference
              </a>
            </Button>
          </div>
        }
      />

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

export default ReferencesSection;
