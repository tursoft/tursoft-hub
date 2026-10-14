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
