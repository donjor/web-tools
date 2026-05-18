import type { NextConfig } from "next";
import path from "node:path";

// Hoisted bun install puts node_modules at the monorepo root, so Turbopack's
// root must be the repo root (not apps/host) for it to resolve `next`, `react`, etc.
const hostDir = path.resolve(process.cwd());
const repoRoot = path.resolve(hostDir, "../..");

const config: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  allowedDevOrigins: [
    "*.localhost",
    "*.web-tools.localhost",
    "web-tools.localhost",
  ],
  transpilePackages: ["@web-tools/ui", "@web-tools/tool-kit", "@web-tools/tailwind-preset"],
};

export default config;
