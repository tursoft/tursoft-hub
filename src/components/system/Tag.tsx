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
