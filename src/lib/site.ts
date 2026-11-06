/**
 * Site-wide identity and SEO constants. Every page, the structured data, llms.txt
 * and the social cards derive from these values so the facts stay consistent.
 */

export const SITE_URL = "https://tursoft.net";
export const SITE_NAME = "Muhammet Turşak";
export const TWITTER_HANDLE = "@muhammettursak";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const OG_IMAGE_ALT = "Muhammet Turşak, AI-Enabled Senior Software Architect";

/** ISO date injected at build time (see vite.config.ts); falls back to today in dev. */
export const BUILD_DATE: string =
  (import.meta.env.VITE_BUILD_DATE as string | undefined) || new Date().toISOString().slice(0, 10);

export const DEFAULT_TITLE = "Muhammet Turşak (Tursak) | AI-Enabled Senior Software Architect";
export const DEFAULT_DESCRIPTION =
  "Muhammet Turşak (Tursak), Senior Software Architect in Ankara, Turkey. 25+ years in .NET, Node.js, Azure and SaaS; now building with AI coding agents.";

export const PERSON = {
  name: "Muhammet Turşak",
  alternateNames: ["Muhammet Tursak", "Muhammet TURŞAK"],
  givenName: "Muhammet",
  familyName: "Turşak",
  jobTitle: "Senior Software Architect",
  headline: "AI-Enabled Senior Software Architect",
  description:
    "Senior Software Architect with 25+ years of experience in .NET, Node.js, Azure and SaaS, building enterprise systems and AI-native products with AI coding agents and agent teams.",
  email: "tursoft@gmail.com",
  location: { city: "Ankara", country: "Turkey", countryCode: "TR" },
  yearsOfExperience: "25+",
  currentRole: "Founder & AI-Enabled Software Architect, Tursoft",
  previousRoles: "Director of Technology at Jengai and Gamyte (New York)",
  availability: "Consulting, architecture reviews and senior engineering leadership roles",
  worksFor: { name: "Tursoft", url: SITE_URL },
  alumniOf: { name: "Middle East Technical University", url: "https://www.metu.edu.tr/" },
  profiles: {
    linkedin: "https://www.linkedin.com/in/tursoft/",
    github: "https://github.com/tursoft",
    stackoverflow: "https://stackoverflow.com/users/1949367/muhammet-tur%C5%9Eak",
    x: "https://x.com/muhammettursak",
  },
  knowsAbout: [
    "AI agentic development",
    "Software architecture",
    ".NET",
    "Node.js",
    "Microsoft Azure",
    "React",
    "SaaS platforms",
    "AI coding agents",
    "Prompt engineering",
    "Context engineering",
    "Multi-agent systems",
    "Healthcare IT",
    "HL7 FHIR",
    "Construction IT",
    "E-learning",
  ],
};

export const SAME_AS = Object.values(PERSON.profiles);

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: PERSON.name,
    alternateName: PERSON.alternateNames,
    givenName: PERSON.givenName,
    familyName: PERSON.familyName,
    jobTitle: PERSON.jobTitle,
    description: PERSON.description,
    url: `${SITE_URL}/`,
    image: OG_IMAGE,
    email: `mailto:${PERSON.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: PERSON.location.city,
      addressCountry: PERSON.location.countryCode,
    },
    nationality: { "@type": "Country", name: PERSON.location.country },
    worksFor: { "@type": "Organization", name: PERSON.worksFor.name, url: PERSON.worksFor.url },
    alumniOf: { "@type": "CollegeOrUniversity", name: PERSON.alumniOf.name, sameAs: PERSON.alumniOf.url },
    knowsAbout: PERSON.knowsAbout,
    sameAs: SAME_AS,
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
  };
}

export function profilePageJsonLd() {
  return {
    "@type": "ProfilePage",
    "@id": `${SITE_URL}/#profilepage`,
    url: `${SITE_URL}/`,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
    dateModified: BUILD_DATE,
  };
}

/** The homepage graph: Person + WebSite + ProfilePage. */
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [personJsonLd(), websiteJsonLd(), profilePageJsonLd()],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Route path starting with "/". */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export interface ArticleInput {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  /** Name of the product or system the article is about. */
  about?: string;
  keywords?: string[];
}

/** Article written by the site's Person, used for the case studies. */
export function articleJsonLd(a: ArticleInput) {
  const url = `${SITE_URL}${a.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title,
    description: a.description,
    url,
    mainEntityOfPage: url,
    image: OG_IMAGE,
    inLanguage: "en",
    datePublished: a.datePublished,
    dateModified: BUILD_DATE,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    ...(a.about ? { about: { "@type": "SoftwareApplication", name: a.about } } : {}),
    ...(a.keywords?.length ? { keywords: a.keywords.join(", ") } : {}),
  };
}
