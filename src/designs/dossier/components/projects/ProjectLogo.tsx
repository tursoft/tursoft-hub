import { cn } from '@/lib/utils';
import { isWhiteLogo } from '@design/lib/logos';

interface ProjectLogoProps {
  src?: string | null;
  alt: string;
  /** Size, aspect and padding of the plate (Tailwind classes). */
  className?: string;
}

/**
 * A project's logo printed on the paper inside a hairline frame: the plate of the portfolio.
 * Logos drawn in white for the old dark theme print on an ink plate, as LogoPlate does.
 */
const ProjectLogo = ({ src, alt, className }: ProjectLogoProps) => (
  <div className={cn('work-plate', isWhiteLogo(src || undefined) && 'is-ink', className)}>
    {src ? (
      <img
        loading="lazy"
        decoding="async"
        src={src}
        alt={alt}
        className="work-plate-logo"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    ) : (
      <span className="font-serif text-3xl text-faint" aria-hidden="true">
        {alt.charAt(0)}
      </span>
    )}
  </div>
);

export default ProjectLogo;
