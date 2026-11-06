import type { ComponentType } from "react";
import {
  HardHat,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  LayoutTemplate,
  Gamepad2,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** One line icon per domain code, all drawn in the same stroke style. */
const DOMAIN_ICONS: Record<string, ComponentType<LucideProps>> = {
  constructionit: HardHat,
  healthcareit: HeartPulse,
  elearning: GraduationCap,
  ecommerce: ShoppingBag,
  cms: LayoutTemplate,
  gaming: Gamepad2,
};

const getDomainIcon = (code?: string) => (code ? DOMAIN_ICONS[code.toLowerCase()] : undefined);

type DomainIconSize = "sm" | "md" | "lg";

const GLYPH_SIZE: Record<DomainIconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

interface DomainIconProps {
  code?: string;
  title?: string;
  /** Legacy raster image; used only when the code has no line icon. */
  photoUrl?: string;
  size?: DomainIconSize;
  className?: string;
}

/**
 * The domain's line icon in faint ink, the way a printed index marks its entries.
 * Decorative: the domain title always sits next to it, so it is hidden from assistive tech.
 * Falls back to the data image, then to the title's initial, for domains without an icon.
 */
export function DomainIcon({ code, title, photoUrl, size = "sm", className }: DomainIconProps) {
  const Icon = getDomainIcon(code);
  const glyph = GLYPH_SIZE[size];

  if (Icon) {
    return <Icon className={cn("flex-shrink-0 text-faint", glyph, className)} strokeWidth={1.5} aria-hidden="true" />;
  }
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        loading="lazy"
        decoding="async"
        aria-hidden="true"
        className={cn("print-photo flex-shrink-0 object-contain", glyph, className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex flex-shrink-0 items-center justify-center font-serif text-faint", glyph, className)}
    >
      {title?.charAt(0) || "?"}
    </span>
  );
}

export default DomainIcon;
