/**
 * Removes files from dist/assets that are not part of the public site:
 * old CV sources and raw video captures under src/assets/downloads, per-project
 * download bundles and video folders, and every .doc file. vite-plugin-static-copy
 * has no ignore option, so the pruning happens after the copy (vite closeBundle and
 * scripts/postbuild.mjs both call this; it is idempotent).
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const RULES = [
  { test: (rel) => rel === "downloads" || rel.startsWith(`downloads${sep}`), what: "legacy downloads" },
  { test: (rel) => /(^|[\\/])videos([\\/]|$)/.test(rel), what: "video folders" },
  { test: (rel) => /^projects[\\/][^\\/]+[\\/]downloads([\\/]|$)/.test(rel), what: "project downloads" },
  { test: (rel) => /\.doc$/i.test(rel), what: ".doc files" },
];

export function pruneAssets(dist = "dist") {
  const base = join(dist, "assets");
  if (!existsSync(base)) return { removed: 0 };
  const entries = readdirSync(base, { recursive: true }).map(String);
  // Delete directories first (longest paths last so parents go after children is not needed with rmSync recursive).
  const removed = [];
  for (const rel of entries) {
    if (!RULES.some((r) => r.test(rel))) continue;
    const full = join(base, rel);
    if (!existsSync(full)) continue; // already removed with its parent
    try {
      const isDir = statSync(full).isDirectory();
      rmSync(full, { recursive: true, force: true });
      removed.push(rel + (isDir ? sep : ""));
    } catch (err) {
      console.warn(`prune: could not remove ${full}: ${err.message}`);
    }
  }
  console.log(`prune: removed ${removed.length} entries from ${base}`);
  return { removed: removed.length };
}

if (process.argv[1]?.endsWith("prune-assets.mjs")) {
  pruneAssets(process.argv[2] || "dist");
}
