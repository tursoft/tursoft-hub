import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { pruneAssets } from "./scripts/prune-assets.mjs";

// Injected into the app (footer "last updated", ProfilePage.dateModified) and reused by
// scripts/postbuild.mjs for sitemap lastmod. CI may pin it with the BUILD_DATE env var.
const buildDate = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

// Old CV sources, raw video captures and project download bundles are copied by the
// static-copy plugin (it has no ignore option) and removed again right after the build.
const pruneCopiedAssets = (): Plugin => ({
  name: "prune-copied-assets",
  apply: "build",
  enforce: "post",
  closeBundle() {
    pruneAssets("dist");
  },
});

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "/",
  define: {
    "import.meta.env.VITE_BUILD_DATE": JSON.stringify(buildDate),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Copy data and media for both dev and production. Top-level entries only: a
    // recursive glob here would also copy every nested folder to the root of
    // dist/assets, duplicating the whole tree.
    viteStaticCopy({
      targets: [
        {
          src: "src/assets/*",
          dest: "assets",
        },
        {
          src: "src/data/*.json",
          dest: "data",
        },
      ],
      watch: {
        reloadPageOnChange: true,
      },
    }),
    pruneCopiedAssets(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  publicDir: "public",
}));
