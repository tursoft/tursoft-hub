import { ChevronDown, Download, FileDown, FileText } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CV_LINKS } from "@/lib/site";

interface CvMenuProps {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  magnetic?: boolean;
}

const openInNewTab = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** "Download CV" button with a menu for the compact and detailed PDFs. */
export default function CvMenu({ variant = "default", size = "default", className, magnetic }: CvMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} magnetic={magnetic}>
          <Download aria-hidden="true" />
          Download CV
          <ChevronDown aria-hidden="true" className="opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => openInNewTab(CV_LINKS.compact)}>
          <FileDown aria-hidden="true" />
          Compact version
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openInNewTab(CV_LINKS.detailed)}>
          <FileText aria-hidden="true" />
          Detailed version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
