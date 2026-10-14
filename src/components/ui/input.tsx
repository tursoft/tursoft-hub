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
