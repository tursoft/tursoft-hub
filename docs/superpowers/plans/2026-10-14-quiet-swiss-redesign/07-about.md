# Task 7: About section

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Rewrite: `src/components/AboutSection.tsx`

**Interfaces:**
- Consumes: Task 4 `Section`, `SectionHeader`, `Surface`, `ContactRow`, Task 3 `Reveal`; Task 5 `CAREER`, `OWNER`.
- Produces: `AboutSection` (default, `<section id="about">`).

Copy (exact):
- Eyebrow `01 / about`. Title: `Leadership and architecture, <em>in equal measure.</em>`
- Lede: `I lead development of enterprise systems that deliver world-class functionality and performance while prioritizing scalability, maintainability, fault tolerance, and rapid extensibility.`
- "My journey" paragraphs: unchanged text; the old coloured highlights become `<strong>` (medium weight, foreground colour).
- Positions list and highlight cards: unchanged wording, except the first highlight reads `{CAREER.years}+ years experience`.

---

- [ ] **Step 1: Rewrite `src/components/AboutSection.tsx`**

```tsx
import { Award, Briefcase, Code, Globe, Mail, Phone, Users } from "lucide-react";
import ContactRow from "@/components/system/ContactRow";
import Reveal from "@/components/system/Reveal";
import Section from "@/components/system/Section";
import SectionHeader from "@/components/system/SectionHeader";
import Surface from "@/components/system/Surface";
import { CAREER, OWNER } from "@/lib/site";

const HIGHLIGHTS = [
  {
    icon: Briefcase,
    title: `${CAREER.years}+ years experience`,
    description: "Leading enterprise software development projects worldwide",
  },
  {
    icon: Users,
    title: "Team leadership",
    description: "Director of Technology, R&D Director, and Project Manager roles",
  },
  {
    icon: Code,
    title: "Full-stack expertise",
    description: ".NET, Java, Web, and Mobile development technologies",
  },
  {
    icon: Award,
    title: "Enterprise systems",
    description: "World-class systems with exceptional performance and scalability",
  },
];

const POSITIONS = [
  "Software Group Director",
  "Research & Development Director",
  "Software Architect",
  "Software Team Leader",
];

const AboutSection = () => (
  <Section id="about">
    <SectionHeader
      index="01"
      label="about"
      title={
        <>
          Leadership and architecture, <em>in equal measure.</em>
        </>
      }
      lede="I lead development of enterprise systems that deliver world-class functionality and performance while prioritizing scalability, maintainability, fault tolerance, and rapid extensibility."
    />

    <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
      <Reveal>
        <h3 className="mb-5 text-base font-medium">My journey</h3>
        <div className="space-y-5 text-[15px] leading-[1.7] text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
          <p>
            Throughout my professional career, I have taken the <strong>leadership</strong> of various{" "}
            <strong>enterprise projects</strong> within software companies that are significant players in their
            sectors. As part of <strong>international companies</strong>, we have completed{" "}
            <strong>multi-million dollar</strong> software projects all over the world.
          </p>
          <p>
            My mission is to lead both <strong>research and development</strong> teams to produce{" "}
            <strong>world-class innovative systems</strong> in terms of both functional and technical quality. I bring
            a unique combination of <strong>technical expertise</strong> and <strong>leadership experience</strong> to
            every project.
          </p>
          <p>
            Currently serving as <strong>Director of Technology</strong> &amp;{" "}
            <strong>Senior Software Architect</strong> at Jengai, I continue to push the boundaries of what's possible
            in <strong>enterprise software development</strong> and <strong>gaming technology</strong>.
          </p>
        </div>
      </Reveal>

      <Reveal index={1}>
        <h3 className="mb-5 text-base font-medium">Positions</h3>
        <ol className="border-t border-line">
          {POSITIONS.map((role, index) => (
            <li key={role} className="flex items-baseline gap-4 border-b border-line py-3.5">
              <span className="font-mono text-xs text-faint">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-foreground">{role}</span>
            </li>
          ))}
        </ol>

        <h3 className="mb-1 mt-10 text-base font-medium">Get in touch</h3>
        <div>
          <ContactRow icon={Mail} label="email" value={OWNER.email} href={`mailto:${OWNER.email}`} />
          <ContactRow icon={Phone} label="phone" value={OWNER.phone} href={OWNER.phoneHref} />
          <ContactRow icon={Globe} label="website" value={OWNER.website} href={OWNER.websiteHref} />
        </div>
      </Reveal>
    </div>

    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {HIGHLIGHTS.map(({ icon: Icon, title, description }, index) => (
        <Reveal key={title} index={index}>
          <Surface interactive className="h-full p-5">
            <span className="mb-4 grid h-[34px] w-[34px] place-items-center rounded-[8px] border border-line bg-surface-2 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <h4 className="text-[15px] font-medium">{title}</h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
          </Surface>
        </Reveal>
      ))}
    </div>
  </Section>
);

export default AboutSection;
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

With the dev server running, run the screenshot tool and open the tile that shows `#about` (usually `desktop_01.png`).
Expected: numbered eyebrow "01 / about", two-tone title with "in equal measure." in the muted colour, lede on the right; "My journey" column with medium-weight highlights; "Positions" as a hairline list with mono `01`–`04`; three contact rows with square cyan icons; four highlight cards in one row (2×2 on tablet, stacked on phones), the first reading "26+ years experience". Hovering a card tilts it slightly and lights its border near the cursor.

- [ ] **Step 4: Commit**

```bash
git add src/components/AboutSection.tsx
git commit -m "feat(about): rebuild About section on the design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
