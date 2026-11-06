import { cn } from "@/lib/utils";
import { isWhiteLogo } from "@design/lib/logos";

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
 * A plain sheet that company logos sit on: card paper with a hairline. The logo is
 * multiplied into the sheet (see .logo-plate in styles/expertise.css), so logos drawn on
 * white boxes of different sizes all read as printed on the same paper.
 */
export function LogoPlate({ src, alt, className, imgClassName, fallback }: LogoPlateProps) {
  return (
    <div className={cn("logo-plate", isWhiteLogo(src) && "is-ink", className)}>
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
        <span className="logo-plate-fallback" aria-hidden="true">
          {fallback ?? alt.charAt(0)}
        </span>
      )}
    </div>
  );
}

export default LogoPlate;
