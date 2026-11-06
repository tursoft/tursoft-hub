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

const ORB_SIZE: Record<DomainIconSize, string> = {
  sm: "h-14 w-14",
  md: "h-[4.5rem] w-[4.5rem]",
  lg: "h-24 w-24",
};

const GLYPH_SIZE: Record<DomainIconSize, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-11 w-11",
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
 * Domain glyph inside an aurora orb (indigo→cyan tint with a gradient hairline ring).
 * Decorative: the domain title always sits next to it, so it is hidden from assistive tech.
 * Falls back to the data image, then to the title's initial, for domains without an icon.
 */
export function DomainIcon({ code, title, photoUrl, size = "md", className }: DomainIconProps) {
  const Icon = getDomainIcon(code);
  return (
    <div className={cn("domain-orb", ORB_SIZE[size], className)} aria-hidden="true">
      {Icon ? (
        <Icon className={cn("domain-orb-glyph", GLYPH_SIZE[size])} strokeWidth={1.6} />
      ) : photoUrl ? (
        <img src={photoUrl} alt="" loading="lazy" decoding="async" className={cn("object-contain", GLYPH_SIZE[size])} />
      ) : (
        <span className="domain-orb-glyph text-xl font-bold">{title?.charAt(0) || "?"}</span>
      )}
    </div>
  );
}

export default DomainIcon;
