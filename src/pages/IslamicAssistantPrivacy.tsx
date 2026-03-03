import { useState, useMemo } from "react";
import { marked } from "marked";
import bgImage from "@/assets/bg/bg-islami-assistant.png";

import trMd from "@/content/privacy/islamic-assistant/tr.md?raw";
import enMd from "@/content/privacy/islamic-assistant/en.md?raw";
import arMd from "@/content/privacy/islamic-assistant/ar.md?raw";
import bnMd from "@/content/privacy/islamic-assistant/bn.md?raw";
import deMd from "@/content/privacy/islamic-assistant/de.md?raw";
import esMd from "@/content/privacy/islamic-assistant/es.md?raw";
import frMd from "@/content/privacy/islamic-assistant/fr.md?raw";
import idMd from "@/content/privacy/islamic-assistant/id.md?raw";
import msMd from "@/content/privacy/islamic-assistant/ms.md?raw";
import urMd from "@/content/privacy/islamic-assistant/ur.md?raw";

const langs = [
  { code: "tr", name: "Türkçe", appName: "İslami Asistan", rtl: false },
  { code: "en", name: "English", appName: "Islamic Assistant", rtl: false },
  { code: "ar", name: "العربية", appName: "المساعد الإسلامي", rtl: true },
  { code: "bn", name: "বাংলা", appName: "ইসলামিক অ্যাসিস্ট্যান্ট", rtl: false },
  { code: "de", name: "Deutsch", appName: "Islamic Assistant", rtl: false },
  { code: "es", name: "Español", appName: "Islamic Assistant", rtl: false },
  { code: "fr", name: "Français", appName: "Islamic Assistant", rtl: false },
  { code: "id", name: "Indonesia", appName: "Islamic Assistant", rtl: false },
  { code: "ms", name: "Melayu", appName: "Islamic Assistant", rtl: false },
  { code: "ur", name: "اردو", appName: "اسلامک اسسٹنٹ", rtl: true },
] as const;

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

const IslamicAssistantPrivacy = () => {
  const [lang, setLang] = useState<LangCode>("tr");

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
            src="/assets/projects/_logos/islamic_assistant.png"
            alt={current.appName}
            className="w-28 h-28 object-contain rounded-2xl"
          />
          <span className="text-2xl font-bold text-foreground">{current.appName}</span>
        </div>

        {/* Language switcher */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                lang === l.code
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {l.name}
            </button>
          ))}
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

export default IslamicAssistantPrivacy;
