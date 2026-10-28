import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";
import bgImage from "@/assets/bg/bg-islami-assistant.png";
import Seo from "@/components/Seo";
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

// Decorative: the language name is always shown next to the flag.
const FlagImg = ({ code }: { code: string; label?: string }) => (
  <img
    loading="lazy"
    decoding="async"
    src={`https://flagcdn.com/16x12/${code}.png`}
    width={16}
    height={12}
    alt=""
    className="rounded-sm object-cover"
  />
);

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
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const html = useMemo(() => (current ? (marked(content[current.code]) as string) : ""), [current]);

  if (!current) return <NotFound />;

  const { h1, description } = summarize(content[current.code]);
  const alternates = [
    ...LANGS.map((l) => ({ hrefLang: l.code, href: `${SITE_URL}${privacyPath(l.code)}` })),
    { hrefLang: "x-default", href: `${SITE_URL}${privacyPath("en")}` },
  ];

  return (
    <div
      className="dark min-h-screen text-foreground relative"
      dir={current.rtl ? "rtl" : "ltr"}
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      <Seo
        title={`${h1} | ${current.appName}`}
        description={description}
        path={privacyPath(current.code)}
        type="article"
        locale={current.locale}
        alternates={alternates}
      />
      <Helmet htmlAttributes={{ lang: current.code, dir: current.rtl ? "rtl" : "ltr" }} />

      {/* dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-background/60 pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* App logo + name */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/assets/projects/_logos/amelbook.png"
            alt={current.appName}
            width={112}
            height={112}
            className="w-28 h-28 object-contain rounded-2xl"
          />
          <span className="text-2xl font-bold text-foreground">{current.appName}</span>
        </div>

        {/* Language switcher */}
        <div className="flex justify-end mb-10" dir="ltr">
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="true"
              className="flex items-center gap-2 bg-background/60 border border-border text-foreground text-sm rounded-lg px-3 py-1.5 cursor-pointer hover:border-primary/60 transition-colors"
            >
              <FlagImg code={current.flag} label={current.name} />
              <span>{current.name}</span>
              <span className="text-muted-foreground text-xs ml-1" aria-hidden="true">▾</span>
            </button>
            {open && (
              <ul className="absolute right-0 mt-1 w-44 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {LANGS.map((l) => (
                  <li key={l.code}>
                    <Link
                      to={privacyPath(l.code)}
                      hrefLang={l.code}
                      lang={l.code}
                      onClick={() => setOpen(false)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-primary/10 transition-colors ${
                        current.code === l.code ? "text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      <FlagImg code={l.flag} label={l.name} />
                      <span>{l.name}</span>
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
          className="prose prose-invert prose-primary max-w-none
            prose-headings:text-primary
            prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-2
            prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3
            prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-li:text-foreground/85
            prose-strong:text-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-hr:border-border prose-hr:my-8"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Plain links to every language version (crawlable, also useful without the menu) */}
        <nav aria-label="Other languages" className="mt-12 pt-6 border-t border-border/60 text-sm" dir="ltr">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {LANGS.filter((l) => l.code !== current.code).map((l) => (
              <li key={l.code}>
                <Link to={privacyPath(l.code)} hrefLang={l.code} lang={l.code} className="text-muted-foreground hover:text-primary">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AmelBookPrivacy;
