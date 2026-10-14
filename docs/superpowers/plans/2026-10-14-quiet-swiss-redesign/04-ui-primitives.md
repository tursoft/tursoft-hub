# Task 4: UI primitives restyle + design-system atoms

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Rewrite: `src/components/ui/button.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/table.tsx`, `src/components/ui/tooltip.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx` (two class strings), `src/components/ui/typewriter.tsx` (caret)
- Create in `src/components/system/`: `Surface.tsx`, `LogoTile.tsx`, `Tag.tsx`, `Chip.tsx`, `SegmentedControl.tsx`, `SearchField.tsx`, `StatTile.tsx`, `Section.tsx`, `SectionHeader.tsx`, `TimelineRail.tsx`, `Collapsible.tsx`, `ExpandHint.tsx`, `ContactRow.tsx`

**Interfaces:**
- Consumes: Task 1 CSS classes and Tailwind tokens; Task 3 hooks `useMagnetic`, `useSurfacePointer`, `useDrift` and components `Reveal`, `CountUp`.
- Produces (exact APIs later tasks rely on):
  - `Button` — variants `default | secondary | outline | ghost | destructive | link`; sizes `default | sm | lg | icon | icon-sm`; extra prop `magnetic?: boolean`.
  - `Badge` — same variants as before (`default | secondary | destructive | outline`), restyled as mono tags.
  - `Tabs, TabsList, TabsTrigger, TabsContent` (underline style) + named `TabCount({ children })`.
  - `Surface` (forwardRef, default): `HTMLAttributes<HTMLDivElement> & { interactive?: boolean; tilt?: boolean; onActivate?: () => void }`.
  - `LogoTile` (default): `{ src?: string | null; alt: string; size?: number; variant?: "logo" | "logo-light" | "photo"; className?: string; fallback?: ReactNode }`.
  - `Tag` (default) + `type TagTone = "quiet" | "accent" | "exp" | "proj" | "edu" | "cust" | "part" | "success"`.
  - `Chip` (default): `ButtonHTMLAttributes & { selected?: boolean; count?: number; dotColor?: string; icon?: ReactNode }`; named `ChipRow`.
  - `SegmentedControl<V extends string>` (default): `{ options: SegmentedOption<V>[]; value: V; onChange(v: V): void; ariaLabel: string; className?: string }`; `type SegmentedOption<V> = { value: V; label: string; icon: ReactNode }`.
  - `SearchField` (default): `{ value: string; onChange(v: string): void; placeholder?: string; className?: string; ariaLabel?: string }`.
  - `StatTile` (default): `{ value: number; label: string; suffix?: string }`; named `StatGrid({ children, columns?: 3 | 4 })`.
  - `Section` (default): `{ id: string; children; className? }` — renders `<section class="page-section">` + `.container-page`.
  - `SectionHeader` (default): `{ index: string; label: string; title: ReactNode; lede?: ReactNode }`.
  - `RailItem` (default, file `TimelineRail.tsx`): `{ label: ReactNode; children; index?: number }`.
  - `Collapsible` (default): `{ open: boolean; children }`.
  - `ExpandHint` (default): `{ expanded: boolean; onOpen(): void }`.
  - `ContactRow` (default): `{ icon: LucideIcon; label: string; value: string; href?: string }`.

---

- [ ] **Step 1: Rewrite `src/components/ui/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useMagnetic } from "@/lib/motion/hooks";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-[13.5px] font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[15px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-white hover:shadow-[0_10px_30px_-10px_hsl(var(--accent))]",
        secondary:
          "border border-line-strong bg-surface text-foreground hover:border-[hsl(var(--line-hover))] hover:bg-surface-2",
        outline:
          "border border-line-strong bg-transparent text-foreground hover:border-[hsl(var(--line-hover))] hover:bg-surface",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[38px] px-4 max-sm:h-11",
        sm: "h-8 px-3 text-[12.5px] max-sm:h-10",
        lg: "h-11 px-5",
        icon: "h-[38px] w-[38px] max-sm:h-11 max-sm:w-11",
        "icon-sm": "h-[30px] w-[30px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Pull slightly towards the cursor on hover (fine pointers only). */
  magnetic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, magnetic = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const innerRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLButtonElement);
    useMagnetic(innerRef, magnetic);
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={innerRef} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: Rewrite `src/components/ui/badge.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[22px] items-center gap-1 rounded-[5px] border px-2 font-mono text-[11px] font-normal lowercase leading-none transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-accent/25 bg-accent/10 text-accent",
        secondary: "border-line-strong bg-surface-2 text-muted-foreground",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-line-strong text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 3: Rewrite `src/components/ui/input.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[38px] w-full rounded-[6px] border border-line bg-surface px-3 text-[13.5px] text-foreground transition-colors placeholder:text-faint focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-sm:h-11 max-sm:text-base",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 4: Rewrite `src/components/ui/tabs.tsx` (underline tabs + `TabCount`)**

```tsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex w-full items-center gap-6 overflow-x-auto shadow-[inset_0_-1px_0_hsl(var(--line))] [scrollbar-width:none] max-sm:gap-4 [&::-webkit-scrollbar]:hidden",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap pb-3 pt-1 text-[13.5px] font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-accent after:opacity-0 after:transition-opacity hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:after:opacity-100 [&_svg]:size-[14px] [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("mt-5 focus-visible:outline-none", className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Muted mono count shown after a tab label. */
function TabCount({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11.5px] font-normal text-faint">{children}</span>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabCount };
```

- [ ] **Step 5: Rewrite `src/components/ui/dialog.tsx`**

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[100] bg-background/70 backdrop-blur-[6px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-line-strong bg-surface p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-[14px]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 inline-flex h-[30px] w-[30px] items-center justify-center rounded-[6px] border border-line-strong bg-surface text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-medium leading-none tracking-[-0.02em]", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

- [ ] **Step 6: Rewrite `src/components/ui/table.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-[13.5px]", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("sticky top-0 z-[1] bg-surface [&_tr]:border-b [&_tr]:border-line", className)} {...props} />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t border-line bg-surface-2 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-line transition-colors hover:bg-surface-2 data-[state=selected]:bg-surface-2",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-left align-middle font-mono text-[11.5px] font-normal lowercase text-faint [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

- [ ] **Step 7: Rewrite `src/components/ui/tooltip.tsx`**

```tsx
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-[200] overflow-hidden rounded-[6px] border border-line-strong bg-surface-2 px-2.5 py-1.5 font-mono text-[11.5px] text-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

- [ ] **Step 8: Restyle the dropdown menu in `src/components/ui/dropdown-menu.tsx`**

Inside `DropdownMenuContent`, replace the class string

```
"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
```

with

```
"z-[200] min-w-[8rem] overflow-hidden rounded-[10px] border border-line-strong bg-surface p-1 text-foreground shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
```

Inside `DropdownMenuItem`, replace

```
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
```

with

```
"relative flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-2.5 py-2 text-[13px] text-muted-foreground outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-surface-2 focus:text-foreground [&_svg]:size-4 [&_svg]:shrink-0"
```

- [ ] **Step 9: Use the block caret in `src/components/ui/typewriter.tsx`**

Replace

```tsx
      <span className="typing-caret" style={{ height: "1em", verticalAlign: "text-bottom" }} aria-hidden />
```

with

```tsx
      <span className="type-caret" aria-hidden="true" />
```

- [ ] **Step 10: Create `src/components/system/Surface.tsx`**

```tsx
import { forwardRef, useImperativeHandle, useRef, type HTMLAttributes, type KeyboardEvent } from "react";
import { useSurfacePointer } from "@/lib/motion/hooks";
import { cn } from "@/lib/utils";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** Cursor spotlight, glowing border, 3D tilt and press feedback. */
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
      className={cn("surface", interactive && "surface-interactive", className)}
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
```

- [ ] **Step 11: Create `src/components/system/LogoTile.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from "react";
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

const initials = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

export default function LogoTile({ src, alt, size, variant = "logo", className, fallback }: LogoTileProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={cn(
        "logo-tile",
        variant === "logo-light" && "logo-tile-light",
        variant === "photo" && "logo-tile-photo",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="logo-tile-fallback" aria-hidden="true">
          {fallback ?? initials(alt)}
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 12: Create `src/components/system/Tag.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TagTone = "quiet" | "accent" | "exp" | "proj" | "edu" | "cust" | "part" | "success";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
}

// Literal class names: Tailwind keeps `@layer components` rules only for class names it can find in the source.
const TONE_CLASS: Record<TagTone, string | undefined> = {
  quiet: undefined,
  accent: "tag-accent",
  exp: "tag-exp",
  proj: "tag-proj",
  edu: "tag-edu",
  cust: "tag-cust",
  part: "tag-part",
  success: "tag-success",
};

/** Small mono label (categories, skills, entity types). */
export default function Tag({ tone = "quiet", className, ...props }: TagProps) {
  return <span className={cn("tag", TONE_CLASS[tone], className)} {...props} />;
}
```

- [ ] **Step 13: Create `src/components/system/Chip.tsx`**

```tsx
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
  /** Small square colour swatch before the label (entity filters). */
  dotColor?: string;
  icon?: ReactNode;
}

/** Toggleable filter button with an optional count. */
export default function Chip({ selected = false, count, dotColor, icon, className, children, ...props }: ChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={cn("chip", className)} {...props}>
      {dotColor && <span className="chip-dot" style={{ background: dotColor }} aria-hidden="true" />}
      {icon}
      <span>{children}</span>
      {count !== undefined && <span className="chip-count">{count}</span>}
    </button>
  );
}

/** Wrapping row of chips; scrolls horizontally on phones. */
export function ChipRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="group" className={cn("chip-row", className)} {...props} />;
}
```

- [ ] **Step 14: Create `src/components/system/SegmentedControl.tsx`**

```tsx
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
  icon: ReactNode;
}

interface SegmentedControlProps<V extends string> {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
  className?: string;
}

/** Icon-only radio group (view modes). Arrow keys move the selection. */
export default function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<V>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = options.findIndex((option) => option.value === value);
    const next = (current + (event.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("segmented", className)} onKeyDown={handleKeyDown}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <button
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={option.label}
                tabIndex={checked ? 0 : -1}
                className="segmented-item"
                onClick={() => onChange(option.value)}
              >
                {option.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent>{option.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 15: Create `src/components/system/SearchField.tsx`**

```tsx
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export default function SearchField({ value, onChange, placeholder = "Search…", className, ariaLabel }: SearchFieldProps) {
  return (
    <label className={cn("search-field", className)}>
      <Search className="h-[15px] w-[15px] shrink-0" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </label>
  );
}
```

- [ ] **Step 16: Create `src/components/system/StatTile.tsx`**

```tsx
import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import Reveal from "./Reveal";

interface StatTileProps {
  value: number;
  label: string;
  suffix?: string;
}

/** Large counting number with a mono label; grows an accent line on hover. */
export default function StatTile({ value, label, suffix }: StatTileProps) {
  return (
    <div className="stat-tile">
      <CountUp end={value} suffix={suffix} className="stat-value" />
      <span className="stat-label">{label}</span>
    </div>
  );
}

/** Grid of stat tiles that reveal one after another. */
export function StatGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 }) {
  return (
    <div className={cn("stat-grid", columns === 3 && "stat-grid-3")}>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={index} index={index}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
```

- [ ] **Step 17: Create `src/components/system/Section.tsx`**

```tsx
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

/** Offsets each section's rule sweep so they never move in unison. */
const sweepDelay = (id: string): string =>
  `${-(Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 11)}s`;

/** A page section: hairline top rule with a travelling light, section padding and the page container. */
export default function Section({ id, children, className }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("page-section", className)}
      style={{ "--sweep-delay": sweepDelay(id) } as CSSProperties}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}
```

- [ ] **Step 18: Create `src/components/system/SectionHeader.tsx`**

```tsx
import { useRef, type ReactNode } from "react";
import { useDrift } from "@/lib/motion/hooks";
import Reveal from "./Reveal";

interface SectionHeaderProps {
  /** Two-digit section number, e.g. "02". */
  index: string;
  /** Lowercase label after the number, e.g. "experience". */
  label: string;
  /** Title; wrap the quieter half in <em> for the two-tone look. */
  title: ReactNode;
  lede?: ReactNode;
}

export default function SectionHeader({ index, label, title, lede }: SectionHeaderProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  useDrift(titleRef, 56);
  useDrift(ledeRef, -36);

  return (
    <Reveal className="section-head">
      <div>
        <p className="type-eyebrow">
          <span className="type-eyebrow-index">{index}</span>
          {label}
        </p>
        <h2 ref={titleRef} className="type-title">
          {title}
        </h2>
      </div>
      {lede && (
        <p ref={ledeRef} className="type-lede">
          {lede}
        </p>
      )}
    </Reveal>
  );
}
```

- [ ] **Step 19: Create `src/components/system/TimelineRail.tsx`**

```tsx
import type { CSSProperties, ReactNode } from "react";
import Reveal from "./Reveal";

interface RailItemProps {
  /** Mono date label shown in the left column (above the card on phones). */
  label: ReactNode;
  children: ReactNode;
  /** Position in the list; staggers the dot's pulse. */
  index?: number;
}

/** One row of the vertical timeline used by Experience and Education. */
export default function RailItem({ label, children, index = 0 }: RailItemProps) {
  return (
    <Reveal className="rail">
      <div className="rail-label" style={{ "--ping-delay": `${(index % 6) * 0.4}s` } as CSSProperties}>
        {label}
      </div>
      <div className="rail-body">{children}</div>
    </Reveal>
  );
}
```

- [ ] **Step 20: Create `src/components/system/Collapsible.tsx`**

```tsx
import type { ReactNode } from "react";

/** Animates its content's height open and closed (CSS grid-rows transition). */
export default function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="collapsible" data-open={open} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  );
}
```

- [ ] **Step 21: Create `src/components/system/ExpandHint.tsx`**

```tsx
interface ExpandHintProps {
  expanded: boolean;
  onOpen: () => void;
}

/** Touch-only footer for expandable cards: a tap hint and, once expanded, a link to the detail dialog. */
export default function ExpandHint({ expanded, onOpen }: ExpandHintProps) {
  return (
    <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-faint">
      <span>{expanded ? "tap to collapse" : "tap to expand"}</span>
      {expanded && (
        <button
          type="button"
          className="-my-2 -mr-2 px-2 py-2 text-accent"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          details →
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 22: Create `src/components/system/ContactRow.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";

interface ContactRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

/** Icon square + mono label + value, separated by hairlines. Rendered as a link when `href` is set. */
export default function ContactRow({ icon: Icon, label, value, href }: ContactRowProps) {
  const content = (
    <>
      <span className="contact-row-icon">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="type-meta block lowercase">{label}</span>
        <span className="block truncate font-medium text-foreground">{value}</span>
      </span>
    </>
  );

  if (!href) return <div className="contact-row">{content}</div>;

  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="contact-row"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}
```

- [ ] **Step 23: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass. (The new atoms are not used yet; they are exercised from Task 5 on.)

- [ ] **Step 24: Commit**

```bash
git add -A
git commit -m "feat(ui): restyle shadcn primitives and add design-system atoms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
