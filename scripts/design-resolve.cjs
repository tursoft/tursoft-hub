/**
 * Which site design a build uses. Shared by vite.config.ts, tailwind.config.ts and the
 * postbuild scripts, so every step of one build agrees on the design.
 *
 * Order: the SITE_DESIGN environment variable (one-off builds, CI variables), then
 * "design" in design.config.json (the committed setting). A design is a folder under
 * src/designs with an App.tsx, an index.css, a tailwind.config.ts, a design.json and a
 * head.html; see docs/design/README.md.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DESIGNS_DIR = path.join(ROOT, "src", "designs");
const CONFIG_FILE = path.join(ROOT, "design.config.json");
const REQUIRED_FILES = ["App.tsx", "index.css", "tailwind.config.ts", "design.json", "head.html"];

function listDesigns() {
  return fs
    .readdirSync(DESIGNS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DESIGNS_DIR, entry.name, "App.tsx")))
    .map((entry) => entry.name)
    .sort();
}

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

function resolveDesign() {
  const fromEnv = (process.env.SITE_DESIGN || "").trim();
  const source = fromEnv ? "SITE_DESIGN" : "design.config.json";
  const name = fromEnv || String(readConfig().design || "").trim();
  const available = listDesigns();

  if (!available.includes(name)) {
    throw new Error(`Unknown site design "${name}" (from ${source}). Available designs: ${available.join(", ")}.`);
  }

  const dir = path.join(DESIGNS_DIR, name);
  const missing = REQUIRED_FILES.filter((file) => !fs.existsSync(path.join(dir, file)));
  if (missing.length) {
    throw new Error(`Site design "${name}" is incomplete: missing ${missing.join(", ")} in src/designs/${name}.`);
  }

  const meta = JSON.parse(fs.readFileSync(path.join(dir, "design.json"), "utf8"));
  return { name, dir, source, meta, available };
}

module.exports = { resolveDesign, listDesigns, readConfig, CONFIG_FILE, DESIGNS_DIR, ROOT };
