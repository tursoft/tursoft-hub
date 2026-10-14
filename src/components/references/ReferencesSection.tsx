import { useEffect, useState } from "react";
import {
  ExternalLink,
  Facebook,
  Globe,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { peopleRepo } from "@/repositories/PeopleRepo";
import { referencesRepo } from "@/repositories/ReferencesRepo";
import type { Person } from "@/models/People";
import type { Reference } from "@/models/Reference";
import { Button } from "@/components/ui/button";
import ListViewer, { type ListAction } from "@/components/ui/listviewer";
import PeopleDetailDialog from "@/components/people/PeopleDetailDialog";
import QuoteCard from "@/components/system/QuoteCard";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import { OWNER } from "@/lib/site";

interface ReferenceWithPhoto extends Reference {
  photo: string;
}

const CONTACT_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  phone: Phone,
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  website: Globe,
  skype: MessageSquare,
};

const CONTACT_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Call",
  linkedin: "LinkedIn",
  twitter: "Twitter",
  facebook: "Facebook",
  website: "Website",
  skype: "Skype",
};

/** Contacts shown on a quote, in this order of preference. */
const PREFERRED_CONTACTS = ["email", "linkedin", "website", "phone", "twitter", "facebook", "skype"];

const contactHref = (code: string, value: string) => {
  if (code === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  if (code === "email") return `mailto:${value}`;
  return value.startsWith("http") ? value : `https://${value}`;
};

const contactValue = (reference: Reference, code: string) =>
  reference.contacts?.find((contact) => contact.code === code)?.value;

/** Contact actions for the card and list views; each one only appears for a reference that has that contact. */
const CONTACT_ACTIONS: ListAction<ReferenceWithPhoto>[] = ["email", "linkedin", "phone"].map((code) => ({
  label: CONTACT_LABELS[code],
  icon: CONTACT_ICONS[code],
  variant: "secondary",
  show: (reference) => Boolean(contactValue(reference, code)),
  onClick: (reference) => {
    const value = contactValue(reference, code);
    if (!value) return;
    const href = contactHref(code, value);
    if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
    else window.location.href = href;
  },
}));

function ContactButtons({ reference }: { reference: Reference }) {
  const rank = (code: string) => {
    const index = PREFERRED_CONTACTS.indexOf(code);
    return index === -1 ? PREFERRED_CONTACTS.length : index;
  };
  const contacts = (reference.contacts ?? [])
    .filter((contact) => contact.value)
    .sort((a, b) => rank(a.code) - rank(b.code))
    .slice(0, 3);

  return (
    <>
      {contacts.map((contact) => {
        const Icon = CONTACT_ICONS[contact.code] ?? ExternalLink;
        const href = contactHref(contact.code, contact.value);
        const external = href.startsWith("http");
        return (
          <Button
            key={contact.code}
            asChild
            variant="secondary"
            size="icon-sm"
            aria-label={`${CONTACT_LABELS[contact.code] ?? contact.code}: ${reference.title}`}
          >
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              <Icon />
            </a>
          </Button>
        );
      })}
    </>
  );
}

const ReferencesSection = () => {
  const [references, setReferences] = useState<ReferenceWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await referencesRepo.getList();
        const active = all.filter((reference) => reference.isActive);
        setReferences(
          await Promise.all(
            active.map(async (reference) => ({
              ...reference,
              photo: (await referencesRepo.getPhotoUrlByCode(reference.code)) ?? "",
            })),
          ),
        );
      } catch (error) {
        console.error("Error loading references:", error);
        setReferences([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const openPerson = async (reference: ReferenceWithPhoto) => {
    try {
      const person = await peopleRepo.getByCode(reference.code);
      if (person) setSelectedPerson(person);
    } catch (error) {
      console.error("Failed to load person:", error);
    }
  };

  return (
    <Section id="references">
      <SectionHeader
        index="07"
        label="references"
        title={
          <>
            In <em>colleagues' words.</em>
          </>
        }
        lede="Testimonials from industry leaders and colleagues who have worked closely with me throughout my professional career."
      />

      <ListViewer<ReferenceWithPhoto>
        data={references}
        isLoading={isLoading}
        loadingMessage="Loading references…"
        emptyMessage="No references available."
        defaultViewMode="carousel"
        enabledModes={["carousel", "card", "list"]}
        imageVariant="photo"
        carouselSlideWidth="min(720px, 86vw)"
        onItemClick={openPerson}
        fieldMapping={{
          code: "code",
          title: "title",
          subtitle: (reference) => `${reference.position} at ${reference.company}`,
          description: (reference) => `“${reference.testimonial}”`,
          image: "photo",
          date: "date",
          actions: CONTACT_ACTIONS,
        }}
        renderCarouselContent={(reference) => (
          <QuoteCard
            quote={reference.testimonial}
            name={reference.title}
            role={`${reference.position} at ${reference.company}`}
            date={reference.date}
            photo={reference.photo}
            actions={<ContactButtons reference={reference} />}
          />
        )}
        ariaLabel="References"
      />

      <Reveal className="mt-14 flex flex-col items-center gap-4 text-center">
        <p className="type-lede">Want to add your reference or testimonial?</p>
        <Button variant="secondary" magnetic asChild>
          <a href={`mailto:${OWNER.email}?subject=Reference%20Request`}>
            <Mail aria-hidden="true" />
            Contact for a reference
          </a>
        </Button>
      </Reveal>

      <PeopleDetailDialog person={selectedPerson} isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} />
    </Section>
  );
};

export default ReferencesSection;
