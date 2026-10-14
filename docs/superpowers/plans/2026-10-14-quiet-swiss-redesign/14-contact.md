# Task 14: Contact section

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Rewrite: `src/components/contact/ContactSection.tsx`

**Interfaces:**
- Consumes: Task 3 `Reveal`; Task 4 `Button` (`asChild`, `magnetic`), `ContactRow`, `Surface`, `Section`, `SectionHeader`; Task 5 `CV_LINKS`, `OWNER`, `SOCIAL_LINKS`.
- Produces: `ContactSection` (default, `<section id="contact">`).

Copy (exact): `11 / contact` — title `Let's build something <em>that lasts.</em>`; lede `I'm always interested in discussing new opportunities, innovative projects, and collaborations in enterprise software development.` Panel: "Ready to start a project?", the existing availability sentence and four offers, buttons "Start a conversation", "CV · Compact", "CV · Detailed". The separate "Available" card is removed (the hero byline, footer and nav already say it).

---

- [ ] **Step 1: Rewrite `src/components/contact/ContactSection.tsx`**

```tsx
import { FileDown, FileText, Github, Globe, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactRow from "@/components/system/ContactRow";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import Surface from "@/components/system/Surface";
import { CV_LINKS, OWNER, SOCIAL_LINKS } from "@/lib/site";

const SOCIAL_ICONS = { github: Github, linkedin: Linkedin, twitter: Twitter } as const;

const OFFERS = [
  "Architect enterprise-grade software solutions",
  "Lead development teams and establish best practices",
  "Modernize legacy systems and improve performance",
  "Implement scalable cloud-native architectures",
];

const ContactSection = () => (
  <Section id="contact">
    <SectionHeader
      index="11"
      label="contact"
      title={
        <>
          Let's build something <em>that lasts.</em>
        </>
      }
      lede="I'm always interested in discussing new opportunities, innovative projects, and collaborations in enterprise software development."
    />

    <div className="grid gap-10 lg:grid-cols-2">
      <Reveal>
        <ContactRow icon={Mail} label="email" value={OWNER.email} href={`mailto:${OWNER.email}`} />
        <ContactRow icon={Phone} label="phone" value={OWNER.phone} href={OWNER.phoneHref} />
        <ContactRow icon={Globe} label="website" value={OWNER.website} href={OWNER.websiteHref} />
        <ContactRow icon={MapPin} label="location" value={OWNER.location} />
        <div className="mt-6 flex flex-wrap gap-2">
          {SOCIAL_LINKS.map((link) => {
            const Icon = SOCIAL_ICONS[link.id];
            return (
              <Button key={link.id} asChild variant="secondary" size="sm" magnetic>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <Icon aria-hidden="true" />
                  {link.label}
                </a>
              </Button>
            );
          })}
        </div>
      </Reveal>

      <Reveal index={1}>
        <Surface className="h-full p-6 sm:p-8">
          <h3 className="text-[22px] font-medium tracking-[-0.03em]">Ready to start a project?</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            I'm currently available for consulting, architectural reviews, and senior development roles. Whether you're
            looking to:
          </p>
          <ul className="mb-6 mt-3.5 text-sm text-muted-foreground">
            {OFFERS.map((offer) => (
              <li key={offer} className="flex gap-2.5 border-b border-line py-2.5">
                <span className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-[1px] bg-accent" aria-hidden="true" />
                {offer}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild magnetic>
              <a href={`mailto:${OWNER.email}?subject=Project%20Inquiry`}>
                <Mail aria-hidden="true" />
                Start a conversation
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href={CV_LINKS.compact} target="_blank" rel="noopener noreferrer">
                <FileDown aria-hidden="true" />
                CV · Compact
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href={CV_LINKS.detailed} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden="true" />
                CV · Detailed
              </a>
            </Button>
          </div>
        </Surface>
      </Reveal>
    </div>
  </Section>
);

export default ContactSection;
```

- [ ] **Step 2: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 3: Visual check**

Screenshot the page and find `#contact`: header "11 / contact"; left column of four contact rows (square cyan icons, mono labels, values) and three small social buttons; right a surface panel with the 22px title, the availability sentence, four hairline-separated offers with square cyan bullets, a white "Start a conversation" button and two quiet CV buttons; then the footer. Hovering a contact row tilts its icon square.

- [ ] **Step 4: Commit**

```bash
git add src/components/contact/ContactSection.tsx
git commit -m "feat(contact): rebuild contact section on the design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
