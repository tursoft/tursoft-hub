interface ExpandHintProps {
  expanded: boolean;
  onOpen: () => void;
}

/** Touch-only footer for expandable cards: a tap hint and, once expanded, a link to the detail dialog. */
export default function ExpandHint({ expanded, onOpen }: ExpandHintProps) {
  return (
    <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-faint">
      <span>{expanded ? "tap to collapse" : "tap to expand"}</span>
      {expanded && (
        <button
          type="button"
          className="-my-2 -mr-2 px-2 py-2 text-accent"
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
