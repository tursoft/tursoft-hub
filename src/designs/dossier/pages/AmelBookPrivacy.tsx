import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";
import { Check, ChevronDown, Languages } from "lucide-react";
import Seo from "@/shared/Seo";
import PageHeader from "@design/components/PageHeader";
import SiteFooter from "@design/components/SiteFooter";
import { LogoPlate } from "@design/components/ui/logo-plate";
import { SITE_URL } from "@/lib/site";
import languages from "@/content/privacy/amelbook/languages.json";
import NotFound from "./NotFound";

import trMd from "@/content/privacy/amelbook/tr.md?raw";
import enMd from "@/content/privacy/amelbook/en.md?raw";
import arMd from "@/content/privacy/amelbook/ar.md?raw";
import bnMd from "@/content/privacy/amelbook/bn.md?raw";
import deMd from "@/content/privacy/amelbook/de.md?raw";
import esMd from "@/content/privacy/amelbook/es.md?raw";
import frMd from "@/content/privacy/amelbook/fr.md?raw";
import idMd from "@/content/privacy/amelbook/id.md?raw";
import msMd from "@/content/privacy/amelbook/ms.md?raw";
import urMd from "@/content/privacy/amelbook/ur.md?raw";

interface Lang {
  code: string;
  flag: string;
  name: string;
  appName: string;
  rtl: boolean;
  locale: string;
}

const LANGS = languages as Lang[];
const DEFAULT_LANG = "tr";

const content: Record<string, string> = {
  tr: trMd,
  en: enMd,
  ar: arMd,
  bn: bnMd,
  de: deMd,
  es: esMd,
  fr: frMd,
  id: idMd,
  ms: msMd,
  ur: urMd,
};

/** Turkish is the default at /privacy/amelbook/; every other language has its own URL. */
const privacyPath = (code: string) =>
  code === DEFAULT_LANG ? "/privacy/amelbook/" : `/privacy/amelbook/${code}/`;

/** Title from the first heading, description from the first paragraph of the Markdown. */
function summarize(md: string) {
  const lines = md.split(/\r?\n/).map((l) => l.trim());
  const h1 = lines.find((l) => l.startsWith("# "))?.slice(2).trim() || "Privacy Policy";
  const para = lines.find((l) => l && !/^[#*\->|]/.test(l)) || "";
  const plain = para.replace(/\*\*|__|`/g, "").trim();
  const description = plain.length > 155 ? `${plain.slice(0, 152).replace(/\s+\S*$/, "")}…` : plain;
  return { h1, description };
}

const AmelBookPrivacy = () => {
  const { lang } = useParams();
  const current = LANGS.find((l) => l.code === (lang ?? DEFAULT_LANG));
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const html = useMemo(() => (current ? (marked(content[current.code]) as string) : ""), [current]);

  if (!current) return <NotFound />;

  const { h1, description } = summarize(content[current.code]);
  const alternates = [
    ...LANGS.map((l) => ({ hrefLang: l.code, href: `${SITE_URL}${privacyPath(l.code)}` })),
    { hrefLang: "x-default", href: `${SITE_URL}${privacyPath("en")}` },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Seo
        title={`${h1} | ${current.appName}`}
        description={description}
        path={privacyPath(current.code)}
        type="article"
        locale={current.locale}
        alternates={alternates}
      />
      <Helmet htmlAttributes={{ lang: current.code, dir: current.rtl ? "rtl" : "ltr" }} />

      {/* The site's masthead and colophon stay left to right on the right-to-left versions */}
      <div dir="ltr">
        <PageHeader />
      </div>

      <main className="container pt-10 md:pt-16">
        <div className="mx-auto max-w-[68ch]">
          {/* The app, and the language of this version */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-6" dir="ltr">
            <div className="flex min-w-0 items-center gap-3">
              <LogoPlate
                src="/assets/projects/_logos/amelbook.png"
                alt={current.appName}
                className="h-12 w-12 flex-none p-1"
              />
              <span className="truncate text-[17px] font-medium leading-6 text-foreground">{current.appName}</span>
            </div>

            <div ref={dropdownRef} className="relative flex-none">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={`Language: ${current.name}`}
                className="flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors duration-150 ease-dossier hover:bg-secondary"
              >
                <Languages className="h-4 w-4 text-faint" strokeWidth={1.5} aria-hidden="true" />
                <span lang={current.code}>{current.name}</span>
                <ChevronDown
                  className={`h-4 w-4 text-faint transition-transform duration-150 ease-dossier ${open ? "rotate-180" : ""}`}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </button>
              {open && (
                <ul className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-card py-1 shadow-[var(--shadow-elegant)] animate-fade-in">
                  {LANGS.map((l) => (
                    <li key={l.code}>
                      <Link
                        to={privacyPath(l.code)}
                        hrefLang={l.code}
                        lang={l.code}
                        onClick={() => setOpen(false)}
                        aria-current={current.code === l.code ? "page" : undefined}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 ease-dossier hover:bg-secondary ${
                          current.code === l.code ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{l.name}</span>
                        {current.code === l.code && <Check className="h-4 w-4 text-foreground" strokeWidth={1.5} aria-hidden="true" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Markdown content */}
          <article
            lang={current.code}
            dir={current.rtl ? "rtl" : "ltr"}
            className="doc mt-10"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Plain links to every language version (crawlable, also useful without the menu) */}
          <nav aria-label="Other languages" className="mt-12 border-t border-border pt-6 text-sm" dir="ltr">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {LANGS.filter((l) => l.code !== current.code).map((l) => (
                <li key={l.code}>
                  <Link
                    to={privacyPath(l.code)}
                    hrefLang={l.code}
                    lang={l.code}
                    className="text-muted-foreground transition-colors duration-150 ease-dossier hover:text-foreground"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>

      <div dir="ltr">
        <SiteFooter />
      </div>
    </div>
  );
};

export default AmelBookPrivacy;
