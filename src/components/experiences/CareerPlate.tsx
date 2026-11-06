import { cn } from "@/lib/utils";

// Logos drawn in white on a transparent ground (made for the old dark theme). On paper they
// vanish, so they are printed on an ink plate instead. Measured from the logo files.
const WHITE_LOGOS = ["/jengai.logo.png", "/jengai.app.png", "/DarkRoom.png"];

interface CareerPlateProps {
  src: string;
  alt: string;
  /** Size and padding of the plate (Tailwind classes). */
  className?: string;
}

/** A logo on a plain paper plate ruled with a hairline, as the dossier sets logos. */
const CareerPlate = ({ src, alt, className }: CareerPlateProps) => {
  const onInk = WHITE_LOGOS.some((name) => src.endsWith(name));
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
