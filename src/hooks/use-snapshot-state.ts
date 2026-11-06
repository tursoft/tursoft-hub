import { useState, type Dispatch, type SetStateAction } from "react";
import { isPrerender, readSnapshot, recordSnapshot } from "@/lib/prerender";

export interface SnapshotCodec<T> {
  /** Turns the state into JSON-safe data (drop functions, convert dates to strings). */
  encode: (value: T) => unknown;
  /** Rebuilds the state from the encoded data. */
  decode: (data: unknown) => T;
}

/**
 * `useState` that survives prerendering.
 *
 * During prerender it records the latest value under `key`. When the page later
 * hydrates, the first render starts from that recorded value instead of `initial`,
 * so the markup matches the prerendered HTML. Effects still run afterwards and
 * refresh the state with live data (for example durations relative to today).
 *
 * Keys must be unique on the page.
 */
export function useSnapshotState<T>(
  key: string,
  initial: T | (() => T),
  codec?: SnapshotCodec<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const snap = readSnapshot<unknown>(key);
    if (snap !== undefined) return codec ? codec.decode(snap) : (snap as T);
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });
  if (isPrerender) recordSnapshot(key, codec ? codec.encode(state) : state);
  return [state, setState];
}
