import { useEffect, useMemo, useState, type ComponentType, type CSSProperties, type MouseEvent } from "react";
import { useSnapshotState } from "@/hooks/use-snapshot-state";
import { Button } from "@design/components/ui/button";
import {
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
  Globe,
  MessageSquare,
  ArrowUpRight,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { referencesRepo } from "@/repositories/ReferencesRepo";
import { peopleRepo } from "@/repositories/PeopleRepo";
import type { Reference } from "@/models/Reference";
import type { Person } from "@/models/People";
import ListViewer from "@design/components/ui/listviewer";
import SectionHeader from "@design/components/SectionHeader";
import PeopleDetailDialog, { type PersonTestimonial } from "@design/components/people/PeopleDetailDialog";

// Extended reference with photo field for rendering
interface ReferenceWithPhoto extends Reference {
  photo: string;
}

/**
 * The client line set large in grid mode, with its footnote (the dossier's signature).
 * The excerpt is quoted word for word from the testimonial (it must stay a substring of it,
 * or the letter shows without the pull quote); the note gives the writer's context from the
 * data. Hero notes are 1 to 3, so this is 4.
 */
const PULL_QUOTE = {
  code: "andonisphilippidis",
  excerpt: "Muhammet is a person of trust and a person to count on when things need to be done.",
  note: "As CEO of DataSel, where Muhammet was senior software architect and group leader, 2011\u00a0–\u00a02013",
  noteNumber: 4,
};
const PULL_NOTE_ID = `fn${PULL_QUOTE.noteNumber}`;

/** Letters sit in three columns beside the pull quote on wide screens. */
const LETTER_COLUMNS = 3;

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
  phone: "Call",
  email: "Email",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  facebook: "Facebook",
  website: "Website",
  skype: "Skype",
};

/** Preferred order when only a few contact links fit. */
const CONTACT_ORDER = ["linkedin", "email", "phone", "website", "twitter", "facebook", "skype"];

const getContactIcon = (code: string) => CONTACT_ICONS[code] ?? ExternalLink;
const getContactLabel = (code: string, value: string) => CONTACT_LABELS[code] ?? value;
const getContactHref = (code: string, value: string) => {
  switch (code) {
    case "phone":
      return `tel:${value.replace(/[^\d+]/g, "")}`;
    case "email":
      return `mailto:${value}`;
    default:
      return value.startsWith("http") ? value : `https://${value}`;
  }
};
/** Accessible name that says whom the link reaches; it contains the visible label. */
const getContactName = (code: string, label: string, person: string) => {
  switch (code) {
    case "phone":
    case "email":
      return `${label} ${person}`;
    case "website":
      return `${label} of ${person}`;
    default:
      return `${person} on ${label}`;
  }
};

/** Testimonials carry highlight spans from the old theme; the dossier sets every quote as plain text. */
const quoteHtml = (reference: Reference) => reference.testimonial.replace(/<\/?span\b[^>]*>/gi, "");
const plainText = (html: string) => html.replace(/<[^>]+>/g, "");

/** "CEO, Datasel"; a position that already names the company ("CTO at Gnomon Informatics SA") stands alone. */
const roleLine = (reference: Reference) => {
  const { position, company } = reference;
  if (!company) return position;
  if (!position) return company;
  return position.toLowerCase().endsWith(company.toLowerCase()) ? position : `${position}, ${company}`;
};

const yearOf = (date: string) => {
  const match = /\b(19|20)\d{2}\b/.exec(date ?? "");
  return match ? Number(match[0]) : null;
};

/** Links must not open the person dialog behind them. */
const stop = (event: MouseEvent) => event.stopPropagation();

/** Contact links as quiet icons in faint ink, with their labels where there is room. */
const ContactLinks = ({
  reference,
  max = 4,
  labelled = false,
  className,
}: {
  reference: ReferenceWithPhoto;
  max?: number;
  labelled?: boolean;
  className?: string;
}) => {
  const rank = (code: string) => {
    const i = CONTACT_ORDER.indexOf(code);
    return i === -1 ? CONTACT_ORDER.length : i;
  };
  const contacts = [...(reference.contacts ?? [])].sort((a, b) => rank(a.code) - rank(b.code)).slice(0, max);
  if (contacts.length === 0) return null;
  return (
    <ul className={cn("flex flex-none items-center", labelled ? "-ml-2 flex-wrap gap-x-1" : "-ml-1.5", className)}>
      {contacts.map((contact) => {
        const Icon = getContactIcon(contact.code);
        const label = getContactLabel(contact.code, contact.value);
        const external = contact.code !== "phone" && contact.code !== "email";
        return (
          <li key={contact.code}>
            <a
              href={getContactHref(contact.code, contact.value)}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={getContactName(contact.code, label, reference.title)}
              title={labelled ? undefined : label}
              onClick={stop}
              className={cn("ref-contact", labelled ? "h-8 gap-2 px-2" : "h-8 w-7 justify-center")}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {labelled && <span>{label}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Opens the person dialog with the whole testimonial. The click reaches the item's own
 * handler in ListViewer; as a button it also gives keyboard users a way in.
 */
const FullLink = ({ label = "Full testimonial", className }: { label?: string; className?: string }) => (
  <button type="button" className={cn("ref-full", className)}>
    {label}
    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
  </button>
);

/** A small portrait printed on the paper; an empty raised square keeps the column when there is none. */
const Portrait = ({ reference, size }: { reference: ReferenceWithPhoto; size: 40 | 48 }) => {
  const box = size === 40 ? "h-10 w-10" : "h-12 w-12";
  return reference.photo ? (
    <img
      src={reference.photo}
      alt=""
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      className={cn("print-photo flex-shrink-0 object-cover", box)}
    />
  ) : (
    <span className={cn("flex-shrink-0 bg-secondary", box)} aria-hidden="true" />
  );
};

/** Name, role and date under a quote, set like the signature of a letter. */
const Signature = ({ reference, size = 40 }: { reference: ReferenceWithPhoto; size?: 40 | 48 }) => (
  <div className={cn("grid items-start", size === 40 ? "grid-cols-[40px_minmax(0,1fr)] gap-x-3" : "grid-cols-[48px_minmax(0,1fr)] gap-x-4")}>
    <Portrait reference={reference} size={size} />
    <div className="min-w-0">
      <h3 className="text-sm font-medium leading-5 text-foreground">{reference.title}</h3>
      <p className="text-[13px] leading-5 text-muted-foreground">{roleLine(reference)}</p>
      {reference.date && <p className="tnum text-[13px] leading-5 text-faint">{reference.date}</p>}
    </div>
  </div>
);

/** Grid mode: the client line set large, signed, with its footnote under it. */
const PullQuote = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <figure className="ref-pull">
    <blockquote lang={reference.lang || undefined}>
      <p className="ref-pull-text">
        <span className="ref-pull-hang">“</span>
        {PULL_QUOTE.excerpt}”
        <sup className="fn-ref">
          <a href={`#${PULL_NOTE_ID}`} aria-label={`Note ${PULL_QUOTE.noteNumber}`} onClick={stop}>
            {PULL_QUOTE.noteNumber}
          </a>
        </sup>
      </p>
    </blockquote>
    <figcaption className="mt-8">
      <Signature reference={reference} size={48} />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 pl-16">
        <ContactLinks reference={reference} max={3} />
        <FullLink className="ml-auto" />
      </div>
    </figcaption>
    <div className="footnote-rule mt-8">
      <p id={PULL_NOTE_ID} className="footnote">
        <span className="footnote-num">{PULL_QUOTE.noteNumber}</span>
        <span>{PULL_QUOTE.note}</span>
      </p>
    </div>
  </figure>
);

/** Grid mode: one letter in a narrow column. */
const Letter = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <article className="ref-letter">
    <blockquote lang={reference.lang || undefined}>
      <p className="ref-letter-text" dangerouslySetInnerHTML={{ __html: quoteHtml(reference) }} />
    </blockquote>
    <div className="mt-4">
      <Signature reference={reference} />
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-x-4 pl-[52px]">
      <ContactLinks reference={reference} max={3} />
      <FullLink className="ml-auto" />
    </div>
  </article>
);

/** A quote set in Newsreader, the opening mark hung into the margin. */
const SerifQuote = ({ reference, className }: { reference: ReferenceWithPhoto; className: string }) => (
  <blockquote lang={reference.lang || undefined}>
    <p className={cn("ref-serif-quote", className)}>
      <span className="ref-pull-hang">“</span>
      <span dangerouslySetInnerHTML={{ __html: quoteHtml(reference) }} />”
    </p>
  </blockquote>
);

/** Carousel slide: the quote leads, the signature closes the sheet. */
const TestimonialSlide = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <article className="ref-slide">
    <SerifQuote reference={reference} className="ref-slide-quote" />
    <div className="mt-auto pt-6">
      <Signature reference={reference} />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 pl-[52px]">
        <ContactLinks reference={reference} max={3} />
        <FullLink className="ml-auto" />
      </div>
    </div>
  </article>
);

/** List mode: one row of an index, who on the left, the quote beside it. */
const TestimonialRow = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <article className="ref-row">
    <Signature reference={reference} size={48} />
    <SerifQuote reference={reference} className="ref-row-quote" />
    <div className="flex items-center gap-4 pl-16 lg:flex-col lg:items-end lg:gap-1 lg:pl-0">
      <ContactLinks reference={reference} max={4} className="lg:-mr-1.5 lg:ml-0" />
      <FullLink className="ml-auto lg:ml-0" />
    </div>
  </article>
);

/** Split view entry: photo, name and role. */
const ReferenceEntry = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <>
    <Portrait reference={reference} size={40} />
    <span className="min-w-0">
      <span className="block truncate text-sm font-medium leading-5">{reference.title}</span>
      <span className="block truncate text-[13px] leading-5 text-faint">{roleLine(reference)}</span>
    </span>
  </>
);

/** Split view detail: the whole testimonial as a letter, with no card frame around it. */
const TestimonialDetail = ({ reference }: { reference: ReferenceWithPhoto }) => (
  <article className="ref-detail">
    <SerifQuote reference={reference} className="ref-detail-quote" />
    <footer className="mt-8 border-t border-border pt-6">
      <Signature reference={reference} size={48} />
      <div className="mt-3 flex flex-wrap items-center gap-4 pl-16">
        <ContactLinks reference={reference} max={4} labelled />
        <FullLink label="Full profile" className="ml-auto" />
      </div>
    </footer>
  </article>
);

const ReferencesSection = () => {
  const [references, setReferences] = useSnapshotState<ReferenceWithPhoto[]>("references.references", []);
  const [isLoading, setIsLoading] = useSnapshotState("references.isLoading", true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState<PersonTestimonial | null>(null);
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
            photo: (await referencesRepo.getPhotoUrlByCode(ref.code)) || "",
          })),
        );

        setReferences(referencesWithPhotos);
      } catch (error) {
        console.error("Error loading references:", error);
        setReferences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReferences();
  }, [setIsLoading, setReferences]);

  // The pull quote's author leads every view, so the letters page reads in DOM order.
  const { items, hasPullQuote } = useMemo(() => {
    const featured = references.find(
      (ref) => ref.code === PULL_QUOTE.code && plainText(quoteHtml(ref)).includes(PULL_QUOTE.excerpt),
    );
    return featured
      ? { items: [featured, ...references.filter((ref) => ref !== featured)], hasPullQuote: true }
      : { items: references, hasPullQuote: false };
  }, [references]);

  // "18 testimonials, 2013 – 2024", from the data
  const meta = useMemo(() => {
    if (references.length === 0) return null;
    const years = references.map((ref) => yearOf(ref.date)).filter((year): year is number => year !== null);
    const noun = references.length === 1 ? "testimonial" : "testimonials";
    if (years.length === 0) return `${references.length} ${noun}`;
    const first = Math.min(...years);
    const last = Math.max(...years);
    return `${references.length} ${noun}, ${first === last ? first : `${first}\u00a0–\u00a0${last}`}`;
  }, [references]);

  // Rows the pull quote spans beside the letters (grid mode, wide screens)
  const letterRows = Math.max(1, Math.ceil((items.length - (hasPullQuote ? 1 : 0)) / LETTER_COLUMNS));

  return (
    <section
      id="references"
      className="py-16 lg:py-24"
      style={{ "--ref-rows": letterRows } as CSSProperties}
    >
      <div className="container">
        <SectionHeader
          id="references"
          title="What colleagues say"
          description="Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career."
          aside={meta ? <p>{meta}</p> : undefined}
        />

        <ListViewer<ReferenceWithPhoto>
          data={items}
          isLoading={isLoading}
          loadingMessage="Loading references…"
          emptyMessage="No references available"
          defaultViewMode="card"
          enabledModes={["card", "list", "split", "carousel"]}
          imageRounded={false}
          carouselLabel="Testimonials"
          carouselHeight="34rem"
          carouselCardWidth="38rem"
          carouselCardHeight="30rem"
          carouselCardClassName="rounded-lg border-border bg-card shadow-[var(--shadow-card)]"
          carouselAutoplayMs={9000}
          renderCarouselContent={(ref) => <TestimonialSlide reference={ref} />}
          renderCardContent={(ref) =>
            hasPullQuote && ref.code === PULL_QUOTE.code ? <PullQuote reference={ref} /> : <Letter reference={ref} />
          }
          renderListContent={(ref) => <TestimonialRow reference={ref} />}
          renderSplitItem={(ref) => <ReferenceEntry reference={ref} />}
          renderSplitDetail={(ref) => <TestimonialDetail reference={ref} />}
          splitHeight="34rem"
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 3 }}
          onItemClick={async (ref) => {
            try {
              const person = await peopleRepo.getByCode(ref.code);
              if (person) {
                setSelectedPerson(person);
                setSelectedTestimonial({
                  html: quoteHtml(ref),
                  role: roleLine(ref),
                  date: ref.date,
                  lang: ref.lang,
                });
                setIsPeopleDialogOpen(true);
              }
            } catch (error) {
              console.error("Failed to load person:", error);
            }
          }}
          fieldMapping={{
            code: "code",
            title: "title",
            subtitle: (ref) => `${ref.position} at ${ref.company}`,
            description: "testimonial",
            image: "photo",
            date: "date",
          }}
          footer={
            <div className="flex flex-col items-start gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-muted-foreground">Want to add your reference or testimonial?</p>
              <Button asChild variant="outline">
                <a href="mailto:tursoft@gmail.com?subject=Reference%20Request">
                  <Mail className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                  Contact for reference
                </a>
              </Button>
            </div>
          }
        />
      </div>

      {/* People Detail Dialog */}
      <PeopleDetailDialog
        person={selectedPerson}
        testimonial={selectedTestimonial}
        isOpen={isPeopleDialogOpen}
        onClose={() => {
          setIsPeopleDialogOpen(false);
          setSelectedPerson(null);
          setSelectedTestimonial(null);
        }}
      />
    </section>
  );
};

export default ReferencesSection;
