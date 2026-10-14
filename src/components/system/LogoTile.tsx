import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LogoTileVariant = "logo" | "logo-light" | "photo";

interface LogoTileProps {
  src?: string | null;
  alt: string;
  /** Square size in px; omit to fill the parent. */
  size?: number;
  /** "logo": dark tile; "logo-light": light well for dark logos; "photo": cover-fit portrait. */
  variant?: LogoTileVariant;
  className?: string;
  /** Shown when there is no image or it fails to load; defaults to the initials of `alt`. */
  fallback?: ReactNode;
}

// Tolerates a missing alt at runtime (the project is not strict-null checked).
const initials = (text: string | null | undefined) =>
  (text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

export default function LogoTile({ src, alt, size, variant = "logo", className, fallback }: LogoTileProps) {
  // Remember which src failed, so a new src never renders the fallback for a frame.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "logo-tile",
        variant === "logo-light" && "logo-tile-light",
        variant === "photo" && "logo-tile-photo",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
      // The fallback span is aria-hidden, so the tile itself carries the name.
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : alt}
    >
      {showImage ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailedSrc(src)} />
      ) : (
        <span className="logo-tile-fallback" aria-hidden="true">
          {fallback ?? initials(alt)}
        </span>
      )}
    </div>
  );
}
