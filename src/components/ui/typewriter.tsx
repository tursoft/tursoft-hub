import { useEffect, useState } from "react";
import { isPrerender } from "@/lib/prerender";

interface TypewriterProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  className?: string;
  /** Stops the cycle (for example while the text is off screen). */
  paused?: boolean;
}

/**
 * Cycles through phrases with a typewriter effect and blinking caret.
 *
 * It starts with the first phrase fully written, so the prerendered HTML, the first
 * client render and the reduced-motion view all show a complete phrase. The cycle
 * begins after the first pause.
 */
const Typewriter = ({
  phrases,
  typingSpeed = 55,
  deletingSpeed = 30,
  pauseMs = 2200,
  className,
  paused = false,
}: TypewriterProps) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState(phrases[0] ?? "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isPrerender || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const current = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(() => {
        setText(current.slice(0, text.length + (deleting ? -1 : 1)));
      }, deleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseMs, paused]);

  return (
    <span className={className}>
      {text}
      <span className="typing-caret" style={{ height: "1em", verticalAlign: "text-bottom" }} aria-hidden />
    </span>
  );
};

export default Typewriter;
