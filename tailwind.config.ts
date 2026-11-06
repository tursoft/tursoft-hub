import type { Config } from "tailwindcss";

// The theme lives with each design (src/designs/<name>/tailwind.config.ts). This file picks
// the design being built (design.config.json or SITE_DESIGN) and scans only the shared code
// and that design, so the other design's classes never reach the CSS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveDesign } = require("./scripts/design-resolve.cjs");
const design = resolveDesign();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const designConfig: Config = require(`./src/designs/${design.name}/tailwind.config.ts`).default;

export default {
  ...designConfig,
  content: [
    "./index.html",
    "./src/*.{ts,tsx}",
    "./src/{lib,hooks,shared}/**/*.{ts,tsx}",
    `./src/designs/${design.name}/**/*.{ts,tsx}`,
  ],
} satisfies Config;
