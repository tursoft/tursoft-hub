import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Dossier badges are quiet labels on raised paper, not glowing pills.
const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-foreground",
        secondary: "border-transparent bg-secondary text-muted-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-muted-foreground",
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
