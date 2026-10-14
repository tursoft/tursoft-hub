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
  /** NoInfer: a state setter passed here must not widen V to `string`. */
  onChange: (value: NoInfer<V>) => void;
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
