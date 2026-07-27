import { useState, useMemo, useRef, useEffect } from "react";
import { marked } from "marked";
import bgImage from "@/assets/bg/bg-islami-assistant.png";

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

const langs = [
  { code: "tr", flag: "tr", name: "Türkçe", appName: "Amel Defteri", rtl: false },
  { code: "en", flag: "gb", name: "English", appName: "AmelBook", rtl: false },
  { code: "ar", flag: "sa", name: "العربية", appName: "AmelBook", rtl: true },
  { code: "bn", flag: "bd", name: "বাংলা", appName: "AmelBook", rtl: false },
  { code: "de", flag: "de", name: "Deutsch", appName: "AmelBook", rtl: false },
  { code: "es", flag: "es", name: "Español", appName: "AmelBook", rtl: false },
  { code: "fr", flag: "fr", name: "Français", appName: "AmelBook", rtl: false },
  { code: "id", flag: "id", name: "Indonesia", appName: "AmelBook", rtl: false },
  { code: "ms", flag: "my", name: "Melayu", appName: "AmelBook", rtl: false },
  { code: "ur", flag: "pk", name: "اردو", appName: "AmelBook", rtl: true },
] as const;

const FlagImg = ({ code }: { code: string }) => (
  <img
    src={`https://flagcdn.com/16x12/${code}.png`}
    width={16}
    height={12}
    alt={code}
    className="rounded-sm object-cover"
  />
);

type LangCode = (typeof langs)[number]["code"];

const content: Record<LangCode, string> = {
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

const AmelBookPrivacy = () => {
  const [lang, setLang] = useState<LangCode>("tr");
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

  const current = langs.find((l) => l.code === lang)!;

  const html = useMemo(
    () => marked(content[lang]) as string,
    [lang]
  );

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
      {/* dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-background/60 pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {/* App logo + name */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/assets/projects/_logos/amelbook.png"
            alt={current.appName}
            className="w-28 h-28 object-contain rounded-2xl"
          />
          <span className="text-2xl font-bold text-foreground">{current.appName}</span>
        </div>

        {/* Language switcher */}
        <div className="flex justify-end mb-10" dir="ltr">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 bg-background/60 border border-border text-foreground text-sm rounded-lg px-3 py-1.5 cursor-pointer hover:border-primary/60 transition-colors"
            >
              <FlagImg code={current.flag} />
              <span>{current.name}</span>
              <span className="text-muted-foreground text-xs ml-1">▾</span>
            </button>
            {open && (
              <ul className="absolute right-0 mt-1 w-44 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {langs.map((l) => (
                  <li key={l.code}>
                    <button
                      onClick={() => { setLang(l.code); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-primary/10 transition-colors ${
                        lang === l.code ? "text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      <FlagImg code={l.flag} />
                      <span>{l.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Markdown content */}
        <article
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
      </div>
    </div>
  );
};

export default AmelBookPrivacy;
