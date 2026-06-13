import { useEffect, useState } from "react";

interface TypewriterProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  className?: string;
}

/** Cycles through phrases with a typewriter effect and blinking caret. */
const Typewriter = ({
  phrases,
  typingSpeed = 55,
  deletingSpeed = 30,
  pauseMs = 2200,
  className,
}: TypewriterProps) => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(phrases[0] ?? "");
      return;
    }

    const current = phrases[phraseIndex % phrases.length];
    let timeout: ReturnType<typeof setTimeout>;

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
  }, [text, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className}>
      {text}
      <span className="typing-caret" style={{ height: "1em", verticalAlign: "text-bottom" }} aria-hidden />
    </span>
  );
};

export default Typewriter;
