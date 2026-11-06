import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/SectionHeader";
import { Mail, Phone, Globe, MapPin, Github, Linkedin, Twitter, FileText, FileDown, type LucideProps } from "lucide-react";
import { PERSON, TWITTER_HANDLE } from "@/lib/site";
import cvData from "@/data/cv.json";

interface ContactRow {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
  href: string | null;
}

const contactInfo: ContactRow[] = [
  { icon: Mail, label: "Email", value: "tursoft@gmail.com", href: "mailto:tursoft@gmail.com" },
  { icon: Phone, label: "Phone", value: "+90 554 200 78 29", href: "tel:+905542007829" },
  { icon: Globe, label: "Website", value: "tursoft.net", href: "https://tursoft.net" },
  { icon: MapPin, label: "Location", value: `${PERSON.location.city}, ${PERSON.location.country}`, href: null },
];

const socialLinks: ContactRow[] = [
  { icon: Linkedin, label: "LinkedIn", value: "in/tursoft", href: "https://www.linkedin.com/in/tursoft/" },
  { icon: Github, label: "GitHub", value: "github.com/tursoft", href: "https://github.com/tursoft" },
  { icon: Twitter, label: "Twitter", value: TWITTER_HANDLE, href: "https://x.com/muhammettursak" },
];

const projectKinds = [
  "Architect enterprise-grade software solutions",
  "Lead development teams and establish best practices",
  "Modernize legacy systems and improve performance",
  "Implement scalable cloud-native architectures",
];

/** One labelled row: faint icon and label, the value in ink. Links step to a raised surface. */
const Row = ({ row }: { row: ContactRow }) => {
  const external = row.href?.startsWith("http");
  const content = (
    <>
      <row.icon className="h-4 w-4 text-faint transition-colors duration-150 group-hover:text-foreground" strokeWidth={1.5} aria-hidden="true" />
      <span className="text-[13px] leading-5 text-faint">{row.label}</span>
      <span className="tnum truncate text-[15px] leading-6 text-foreground">{row.value}</span>
    </>
  );
  const grid = "grid min-h-12 grid-cols-[16px_88px_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[16px_112px_minmax(0,1fr)]";
  return (
    <li className="border-b border-border">
      {row.href ? (
        <a
          href={row.href}
          target={external ? "_blank" : undefined}
          rel={external ? "me noopener noreferrer" : undefined}
          className={`group -mx-3 rounded-md px-3 transition-colors duration-150 ease-dossier hover:bg-secondary ${grid}`}
        >
          {content}
        </a>
      ) : (
        <div className={grid}>{content}</div>
      )}
    </li>
  );
};

const ContactSection = () => (
  <section id="contact" className="py-16 lg:py-24">
    <div className="container">
      <SectionHeader
        id="contact"
        title="Contact Muhammet Turşak"
        description="Let’s work together. I’m always interested in discussing new opportunities, innovative projects, and collaborations in enterprise software development."
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-0">
        {/* Ways to reach him */}
        <div className="grid content-start gap-10 lg:col-span-7 lg:pr-12">
          <div>
            <h3 className="border-b border-foreground pb-3 text-[15px] font-medium leading-6 text-foreground">Contact information</h3>
            <ul>
              {contactInfo.map((row) => (
                <Row key={row.label} row={row} />
              ))}
            </ul>
          </div>
          <div>
            <h4 className="border-b border-foreground pb-3 text-[15px] font-medium leading-6 text-foreground">Follow me</h4>
            <ul>
              {socialLinks.map((row) => (
                <Row key={row.label} row={row} />
              ))}
            </ul>
          </div>
        </div>

        {/* Availability and the one call to action */}
        <div className="lg:col-span-5 lg:border-l lg:border-border lg:pl-12">
          <p className="flex items-center gap-2 text-[15px] font-medium leading-6 text-foreground">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            Available
          </p>
          <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
            Currently accepting new projects and consulting opportunities
          </p>

          <h3 className="mt-10 text-xl font-medium leading-7 text-foreground">Ready to start a project?</h3>
          <p className="mt-3 max-w-[34rem] text-base leading-[26px] text-muted-foreground [text-wrap:pretty]">
            I’m currently available for consulting, architectural reviews, and senior development roles. Whether you’re
            looking to:
          </p>
          <ul className="mt-4 max-w-[34rem]">
            {projectKinds.map((item) => (
              <li
                key={item}
                className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 border-t border-border py-3 text-[15px] leading-6 text-foreground last:border-b"
              >
                <span className="text-faint" aria-hidden="true">
                  –
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* The one primary action, then the two CVs side by side */}
          <div className="mt-8">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="mailto:tursoft@gmail.com?subject=Project%20Inquiry">
                <Mail strokeWidth={1.5} aria-hidden="true" />
                Start a conversation
              </a>
            </Button>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:flex">
              <Button asChild variant="outline">
                <a href={cvData.general.compactDownloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileDown className="text-faint" strokeWidth={1.5} aria-hidden="true" />
                  Compact CV
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={cvData.general.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="text-faint" strokeWidth={1.5} aria-hidden="true" />
                  Detailed CV
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ContactSection;
