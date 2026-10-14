import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** Usually a 52px LogoTile. */
  icon?: ReactNode;
  /** Mono meta items under the title (icon + text); empty items are skipped. */
  meta?: ReactNode[];
  /** Tags under the meta row. */
  tags?: ReactNode;
  /** Extra header content, e.g. contact links. */
  headerExtra?: ReactNode;
  children: ReactNode;
}

/** Shared shell for all detail dialogs: logo, title, meta, tags, maximise and close; a scrollable body. */
export default function DetailDialog({
  open,
  onOpenChange,
  title,
  icon,
  meta = [],
  tags,
  headerExtra,
  children,
}: DetailDialogProps) {
  const [maximized, setMaximized] = useState(false);
  // The element that had focus when the dialog opened (a card or row), so focus can go back to it.
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) setMaximized(false);
  }, [open]);

  const metaItems = meta.filter(Boolean);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="detail-dialog-overlay" />
        <DialogPrimitive.Content
          className={cn("detail-dialog", maximized && "is-maximized")}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
          }}
          // Radix only restores focus to a DialogTrigger, and these dialogs are opened from cards and rows,
          // so without this the focus would be dropped on <body> when the dialog closes.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const opener = openerRef.current;
            openerRef.current = null;
            if (opener?.isConnected) opener.focus();
          }}
        >
          <header className="detail-dialog-head">
            {icon ?? <span />}
            <div className="min-w-0">
              <DialogPrimitive.Title className="detail-dialog-title">{title}</DialogPrimitive.Title>
              {metaItems.length > 0 && (
                <div className="detail-dialog-meta">
                  {metaItems.map((item, index) => (
                    <span key={index}>{item}</span>
                  ))}
                </div>
              )}
              {tags && <div className="mt-3 flex flex-wrap gap-1.5">{tags}</div>}
              {headerExtra}
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="secondary"
                size="icon-sm"
                className="max-sm:hidden"
                aria-label={maximized ? "Restore size" : "Maximize"}
                onClick={() => setMaximized((value) => !value)}
              >
                {maximized ? <Minimize2 /> : <Maximize2 />}
              </Button>
              <DialogPrimitive.Close asChild>
                <Button variant="secondary" size="icon-sm" aria-label="Close">
                  <X />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </header>
          <div className="detail-dialog-body">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Mono lowercase label for a block inside a dialog tab. */
export function DetailHeading({ children }: { children: ReactNode }) {
  return <h4 className="detail-heading">{children}</h4>;
}

/** Centred mono message for empty or loading tabs. */
export function DetailEmpty({ children }: { children: ReactNode }) {
  return <p className="detail-empty">{children}</p>;
}

/** Mono meta line inside a DetailRow (dates, durations, counts). Renders nothing when empty. */
export function DetailMeta({ children }: { children?: ReactNode }) {
  if (children === null || children === undefined || children === false || children === "") return null;
  return <p className="type-meta mt-1">{children}</p>;
}

interface DetailRowProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Clamp the subtitle to two lines (default true). */
  clampSubtitle?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
}

/** One row in a dialog list. With onClick it is a keyboard-accessible button-like row. */
export function DetailRow({ icon, title, subtitle, clampSubtitle = true, trailing, onClick, children }: DetailRowProps) {
  const interactive = Boolean(onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className="detail-row"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className={cn("mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground", clampSubtitle && "line-clamp-2")}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
      {trailing}
    </div>
  );
}

/** Hairline-separated list of rows, or a two-column grid of rows. */
export function DetailRows({ columns = 1, children }: { columns?: 1 | 2; children: ReactNode }) {
  return <div className={columns === 2 ? "detail-grid-2" : "detail-list"}>{children}</div>;
}
