#!/usr/bin/env node
/**
 * Switch and inspect site designs.
 *
 *   npm run design                      list the designs and show which one builds
 *   npm run design -- use dossier       make "dossier" the design that builds and deploys
 *   node scripts/design.mjs run aurora -- npm run build
 *                                       run one command with another design (SITE_DESIGN)
 *   npm run typecheck                   type-check every design (or: typecheck <design>)
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const { listDesigns, readConfig, CONFIG_FILE, DESIGNS_DIR } = createRequire(import.meta.url)("./design-resolve.cjs");

const [command = "list", name, ...rest] = process.argv.slice(2);
const designs = listDesigns();

const label = (design) => {
  try {
    const meta = JSON.parse(readFileSync(path.join(DESIGNS_DIR, design, "design.json"), "utf8"));
    return meta.description ? `${meta.label} — ${meta.description}` : meta.label;
  } catch {
    return "";
  }
};

const requireKnown = (design) => {
  if (!designs.includes(design)) {
    console.error(`Unknown design "${design ?? ""}". Available: ${designs.join(", ")}.`);
    process.exit(1);
  }
};

if (command === "list") {
  const configured = readConfig().design;
  const override = (process.env.SITE_DESIGN || "").trim();
  for (const design of designs) {
    const mark = design === (override || configured) ? "*" : " ";
    console.log(`${mark} ${design.padEnd(12)} ${label(design)}`);
  }
  console.log(`\nBuilds use "${override || configured}"${override ? " (SITE_DESIGN override)" : " (design.config.json)"}.`);
  console.log('Switch with: npm run design -- use <name>');
} else if (command === "use") {
  requireKnown(name);
  const config = readConfig();
  config.design = name;
  writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`design.config.json now builds "${name}". Commit it, then deploy as usual.`);
} else if (command === "typecheck") {
  // Each design has its own tsconfig (its @design path), so check them one by one.
  const targets = name ? [name] : designs;
  targets.forEach(requireKnown);
  let failed = 0;
  const next = (i) => {
    if (i >= targets.length) process.exit(failed ? 1 : 0);
    console.log(`\n> typecheck ${targets[i]}`);
    const child = spawn(`npx tsc --noEmit -p src/designs/${targets[i]}/tsconfig.json`, { stdio: "inherit", shell: true });
    child.on("exit", (code) => {
      if (code) failed++;
      next(i + 1);
    });
  };
  next(0);
} else if (command === "run") {
  requireKnown(name);
  const args = rest[0] === "--" ? rest.slice(1) : rest;
  if (!args.length) {
    console.error("Usage: node scripts/design.mjs run <design> -- <command...>");
    process.exit(1);
  }
  const child = spawn(args.join(" "), { stdio: "inherit", shell: true, env: { ...process.env, SITE_DESIGN: name } });
  child.on("exit", (code) => process.exit(code ?? 1));
} else {
  console.error(`Unknown command "${command}". Use: list, use <design>, run <design> -- <command>.`);
  process.exit(1);
}
