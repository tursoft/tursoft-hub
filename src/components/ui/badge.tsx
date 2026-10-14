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
