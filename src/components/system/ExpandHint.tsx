interface ExpandHintProps {
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

/** Touch-only footer for expandable cards: a tap-to-expand button and, once expanded, a link to the detail dialog. */
export default function ExpandHint({ expanded, onToggle, onOpen }: ExpandHintProps) {
  return (
    <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-faint">
      <button
        type="button"
        aria-expanded={expanded}
        className="-my-3.5 -ml-2 px-2 py-3.5 text-left"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {expanded ? "tap to collapse" : "tap to expand"}
      </button>
      {expanded && (
        <button
          type="button"
          className="-my-3.5 -mr-2 px-2 py-3.5 text-accent"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          details →
        </button>
      )}
    </div>
  );
}
