import { Helmet } from "react-helmet-async";
import { OG_IMAGE, OG_IMAGE_ALT, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/site";

export interface SeoAlternate {
  /** BCP 47 language code, or "x-default". */
  hrefLang: string;
  /** Absolute URL of that language version. */
  href: string;
}

interface SeoProps {
  /** Full document title. */
  title: string;
  /** Meta description, ideally 120 to 155 characters. */
  description: string;
  /** Route path starting with "/", used for the canonical and og:url. */
  path: string;
  type?: "website" | "article";
  image?: string;
  imageAlt?: string;
  /** Open Graph locale, e.g. "en_US". */
  locale?: string;
  /** Language versions of this page (rendered as hreflang links). */
  alternates?: SeoAlternate[];
  /** Marks the page noindex and omits the canonical (404 pages). */
  noindex?: boolean;
  /** One or more JSON-LD objects to embed. */
  jsonLd?: object | object[];
}

/**
 * Per-route head tags. Rendered through react-helmet-async so the prerender step
 * captures them into static HTML and crawlers see the right title, description,
 * canonical, language alternates, social card and structured data for each URL.
 */
const Seo = ({
  title,
  description,
  path,
  type = "website",
  image,
  imageAlt,
  locale = "en_US",
  alternates = [],
  noindex = false,
  jsonLd,
}: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const img = image || OG_IMAGE;
  const alt = imageAlt || OG_IMAGE_ALT;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <link rel="canonical" href={url} />}
      {alternates.map((a) => (
        <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={a.href} />
      ))}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={alt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:image:alt" content={alt} />

      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
