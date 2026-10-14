import { forwardRef, useImperativeHandle, useRef, type HTMLAttributes, type KeyboardEvent } from "react";
import { useSurfacePointer } from "@/lib/motion/hooks";
import { cn } from "@/lib/utils";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Cursor spotlight, glowing border and 3D tilt; pointer cursor and press feedback only come with `onActivate`. */
  interactive?: boolean;
  /** Turn the tilt off (e.g. very wide rows) while keeping the spotlight. */
  tilt?: boolean;
  /** Makes the surface a keyboard-accessible button that calls this on click, Enter or Space. */
  onActivate?: () => void;
}

/** The card base used everywhere: surface colour, hairline border, 10px radius. */
const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  { interactive = false, tilt = true, onActivate, className, onClick, onKeyDown, children, ...props },
  ref,
) {
  const innerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
  useSurfacePointer(innerRef, { enabled: interactive, tilt });
  const activatable = Boolean(onActivate);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (!activatable || event.defaultPrevented || event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate?.();
    }
  };

  return (
    <div
      ref={innerRef}
      role={activatable ? "button" : undefined}
      tabIndex={activatable ? 0 : undefined}
      className={cn("surface", interactive && "surface-interactive", activatable && "cursor-pointer", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onActivate?.();
      }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
});

export default Surface;
