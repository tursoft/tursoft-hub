import { cn } from "@/lib/utils";

interface LogoPlateProps {
  src?: string;
  alt: string;
  /** Size, aspect and padding of the plate (Tailwind classes). */
  className?: string;
  imgClassName?: string;
  /** Text shown when there is no image; defaults to the first letter of `alt`. */
  fallback?: string;
}

/**
 * A light "plate" that company logos sit on. Most logos are drawn for white paper,
 * so putting them straight on the dark card leaves ragged white boxes of different
 * sizes; the plate gives every logo the same frame, tone and padding.
 */
export function LogoPlate({ src, alt, className, imgClassName, fallback }: LogoPlateProps) {
  return (
    <div className={cn("logo-plate", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("logo-plate-img", imgClassName)}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span className="logo-plate-fallback">{fallback ?? alt.charAt(0)}</span>
      )}
    </div>
  );
}

export default LogoPlate;
