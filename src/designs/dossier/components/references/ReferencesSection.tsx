import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
} from "react";
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
  ChevronLeft,
  ChevronRight,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPrerender } from "@/lib/prerender";
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
 * The lines set large beside the letters in grid mode (the dossier's signature), one per
 * testimonial, shown in list order. Each excerpt is quoted word for word from its testimonial;
 * a line that is no longer a substring of the letter drops out of the rotation. The note gives
 * the writer's context, from the letter itself or the data, and an English reading of a Turkish
 * line. Hero notes are 1 to 3, so this is 4.
 */
const PULL_QUOTES: Record<string, { excerpt: string; note?: string }> = {
  andonisphilippidis: {
    excerpt: "Muhammet is a person of trust and a person to count on when things need to be done.",
    note: "As CEO of DataSel, where Muhammet was senior software architect and group leader, 2011 – 2013",
  },
  aslakfelin: {
    excerpt: "He consistently demonstrated an ability to deliver high-quality results with impressive speed",
    note: "As CEO of Infrion, a health tech start-up, where Muhammet was lead programmer",
  },
  johansellstrom: {
    excerpt: "Muhammet is one of the best and most efficient developer I worked with.",
  },
  mehmetalpkarabas: {
    excerpt: "Muhammet is one of the most intelligent, hardworking and disciplined person I have ever met",
  },
  kostaskarkaletsis: {
    excerpt: "Muhammet is a very efficient, collaborative and experienced Senior Software Architect.",
    note: "Together on integrating the DM4All solution in Turkey, Italy, Portugal and Spain",
  },
  alexanderberler: {
    excerpt: "Muhammet is an important cornerstone of our project.",
    note: "Fellow members of the DM4ALL consortium on the ProEmpower PCP project",
  },
  uweweimer: {
    excerpt: "Muhammet is one of the best Senior Software Architect and Team Leader I ever met.",
  },
  velibicer: {
    excerpt: "He shows all the skills that a complete engineer should have",
  },
  davutgurbuz: {
    excerpt: "He shares his know-how & knowledge generously.",
  },
  myasarozden: {
    excerpt: "Çalışkan, bilgili, işten kaçmayan, disiplinli",
    note: "Taught Muhammet as an undergraduate. In English: “Hardworking, knowledgeable, never shies away from work, disciplined”",
  },
  cetinbalanuye: {
    excerpt: "I have no reservation in recommending Muhammet for high quality IT projects",
    note: "Led the instructional software development team where Muhammet was chief developer",
  },
  kursatcagiltay: {
    excerpt: "It was always a pleasure to work with Muhammet.",
    note: "Taught Muhammet as an undergraduate at METU",
  },
  eleftheriapolychronidou: {
    excerpt: "Software Architecture expert is the phrase that comes to mind when I think about Muhammet.",
    note: "Together on the ProEmpower EU project for two years",
  },
  mesutdemirer: {
    excerpt: "I recommend him to every employee who wants to work with a friendly and skilled employer.",
  },
  umuthuseyinoglu: {
    excerpt: "He was always punctual, businesslike and very disciplined.",
    note: "Muhammet's direct supervisor on the e-Ders project at the METU Informatics Institute",
  },
  erolozcelik: {
    excerpt: "Muhammet Turşak has demonstrated excellent programming and analytical skills.",
  },
  firatozerden: {
    excerpt: "I have rarely come across such a focused and competent Software-Architect leading a project.",
    note: "Together on a major project in Turkey, 2015 – 2017",
  },
  gulpembeergin: {
    excerpt: "Sen hayal et Muhammet yazsın. Sonunda çıkan ürün senin hayalinin ötesindedir.",
    note: "Together on the Vaka Karması software project. In English: “You imagine it, Muhammet writes it. The product goes beyond what you imagined”",
  },
};
const PULL_NOTE_NUMBER = 4;
const PULL_NOTE_ID = `fn${PULL_NOTE_NUMBER}`;
/** How long each line stays before the next one comes in. */
const PULL_INTERVAL_MS = 30_000;

interface PullQuoteItem {
  reference: ReferenceWithPhoto;
  excerpt: string;
  note?: string;
}

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
 * handler in ListViewer (or the pull quote's); as a button it also gives keyboard users a way in.
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

/** One pull quote: the line set large, signed, with its footnote under it. */
const PullSlide = ({ quote, active, label }: { quote: PullQuoteItem; active: boolean; label: string }) => {
  const { reference, excerpt, note } = quote;
  return (
    <figure
      className={cn("ref-pull-slide", active && "is-active")}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
    >
      <blockquote lang={reference.lang || undefined}>
        <p className="ref-pull-text">
          <span className="ref-pull-hang">“</span>
          {excerpt}”
          {note && (
            <sup className="fn-ref">
              <a href={`#${PULL_NOTE_ID}`} aria-label={`Note ${PULL_NOTE_NUMBER}`} onClick={stop}>
                {PULL_NOTE_NUMBER}
              </a>
            </sup>
          )}
        </p>
      </blockquote>
      <figcaption className="mt-8">
        <Signature reference={reference} size={48} />
        <div className="mt-2 flex flex-wrap items-center gap-x-4 pl-16">
          <ContactLinks reference={reference} max={3} />
          <FullLink className="ml-auto" />
        </div>
      </figcaption>
      {note && (
        <div className="footnote-rule mt-8">
          {/* Only the line on show carries the note's id, so the numeral always lands on it */}
          <p id={active ? PULL_NOTE_ID : undefined} className="footnote">
            <span className="footnote-num">{PULL_NOTE_NUMBER}</span>
            <span>{note}</span>
          </p>
        </div>
      )}
    </figure>
  );
};

/**
 * Grid mode: one line from every testimonial in turn, in list order. The next comes in after
 * 30 seconds while the quote is on screen and not hovered, focused from the keyboard or behind
 * the person dialog, the tab is visible and the visitor has not asked for reduced motion; the
 * hairline in the pager fills as the time runs and its animation's end turns the page, so a
 * pause holds the time left. All lines share one grid cell, so the tallest sets the height and
 * the letters never move when the line changes.
 */
const PullQuotes = ({
  quotes,
  held,
  onOpen,
}: {
  quotes: PullQuoteItem[];
  held: boolean;
  onOpen: (reference: ReferenceWithPhoto) => void;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const count = quotes.length;
  const active = Math.min(index, count - 1);

  // Autoplay starts after hydration (the prerendered page shows the first line), never under
  // reduced motion, and follows the setting if it changes.
  useEffect(() => {
    if (isPrerender || count < 2 || typeof matchMedia !== "function") return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAutoplay(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [count]);

  useEffect(() => {
    const root = rootRef.current;
    if (!autoplay || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [autoplay]);

  useEffect(() => {
    if (!autoplay) return;
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [autoplay]);

  const running = autoplay && inView && pageVisible && !hovered && !focused && !held;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);

  // A mouse click leaves focus on the button without :focus-visible, so only keyboard focus holds the line
  const onFocus = (event: FocusEvent<HTMLDivElement>) => setFocused(event.target.matches(":focus-visible"));
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <div
      ref={rootRef}
      className="ref-pull"
      role="region"
      aria-roledescription="carousel"
      aria-label="Lines from the testimonials"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div
        className="ref-pull-stage"
        aria-live={running ? "off" : "polite"}
        onClick={() => onOpen(quotes[active].reference)}
      >
        {quotes.map((quote, i) => (
          <PullSlide key={quote.reference.code} quote={quote} active={i === active} label={`${i + 1} of ${count}`} />
        ))}
      </div>

      {/* Pager: the count, the hairline that fills over the 30 seconds, back and next */}
      {count > 1 && (
        <div className="ref-pull-pager">
          <span className="tnum min-w-[52px] text-[13px] leading-5 text-faint">
            {active + 1} / {count}
          </span>
          <span className="ref-pull-timer" aria-hidden="true">
            {autoplay && (
              <span
                key={active}
                className="ref-pull-timer-fill"
                style={{ animationDuration: `${PULL_INTERVAL_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                onAnimationEnd={() => go(1)}
              />
            )}
          </span>
          <button type="button" onClick={() => go(-1)} aria-label="Previous line" className="carousel-nav">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next line" className="carousel-nav">
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};

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

  // The pull quote's lines, in list order; a line no longer found in its letter is left out
  const pullQuotes = useMemo(
    () =>
      references.flatMap((reference): PullQuoteItem[] => {
        const quote = PULL_QUOTES[reference.code];
        return quote && plainText(quoteHtml(reference)).includes(quote.excerpt) ? [{ reference, ...quote }] : [];
      }),
    [references],
  );

  // "18 testimonials, 2013 – 2024", from the data
  const meta = useMemo(() => {
    if (references.length === 0) return null;
    const years = references.map((ref) => yearOf(ref.date)).filter((year): year is number => year !== null);
    const noun = references.length === 1 ? "testimonial" : "testimonials";
    if (years.length === 0) return `${references.length} ${noun}`;
    const first = Math.min(...years);
    const last = Math.max(...years);
    return `${references.length} ${noun}, ${first === last ? first : `${first} – ${last}`}`;
  }, [references]);

  // Rows the pull quote spans beside the letters (grid mode, wide screens)
  const letterRows = Math.max(1, Math.ceil(references.length / LETTER_COLUMNS));

  const openPerson = async (ref: ReferenceWithPhoto) => {
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
  };

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
          data={references}
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
          cardLead={
            pullQuotes.length > 0 ? (
              <div>
                <PullQuotes quotes={pullQuotes} held={isPeopleDialogOpen} onOpen={openPerson} />
              </div>
            ) : undefined
          }
          renderCardContent={(ref) => <Letter reference={ref} />}
          renderListContent={(ref) => <TestimonialRow reference={ref} />}
          renderSplitItem={(ref) => <ReferenceEntry reference={ref} />}
          renderSplitDetail={(ref) => <TestimonialDetail reference={ref} />}
          splitHeight="34rem"
          gridCols={{ sm: 1, md: 2, lg: 3, xl: 3 }}
          onItemClick={openPerson}
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
