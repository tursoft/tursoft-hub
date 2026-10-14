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
