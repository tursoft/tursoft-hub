import { Helmet } from "react-helmet-async";
import { OG_IMAGE, OG_IMAGE_ALT, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/site";

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
  /** Marks the page noindex and omits the canonical (404 pages). */
  noindex?: boolean;
  /** One or more JSON-LD objects to embed. */
  jsonLd?: object | object[];
}

/**
 * Per-route head tags. Rendered through react-helmet-async so the prerender step
 * captures them into static HTML and crawlers see the right title, description,
 * canonical, social card and structured data for each URL.
 */
const Seo = ({ title, description, path, type = "website", image, imageAlt, noindex = false, jsonLd }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  const img = image || OG_IMAGE;
  const alt = imageAlt || OG_IMAGE_ALT;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <link rel="canonical" href={url} />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={alt} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

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
