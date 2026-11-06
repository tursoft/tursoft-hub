import { cn } from "@/lib/utils";
import { isWhiteLogo } from "@/lib/logos";

interface CareerPlateProps {
  src: string;
  alt: string;
  /** Size and padding of the plate (Tailwind classes). */
  className?: string;
}

/** A logo on a plain paper plate ruled with a hairline, as the dossier sets logos. */
const CareerPlate = ({ src, alt, className }: CareerPlateProps) => {
  const onInk = isWhiteLogo(src);
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-md border",
        onInk ? "border-foreground bg-foreground" : "border-border bg-card",
        className,
      )}
    >
      <img
        loading="lazy"
        decoding="async"
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};

export default CareerPlate;
