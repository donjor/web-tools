import type { ToolManifest } from "./packages/tool-kit/src";

export const tools: ToolManifest[] = [
  {
    slug: "calculator",
    title: "Calculator",
    description: "A simple keyboard-friendly web calculator.",
    icon: "Calculator",
    kind: "builtin",
    tags: ["math"],
  },
  {
    slug: "todo",
    title: "Todo",
    description: "A persistent todo list with multiple named lists.",
    icon: "CheckSquare",
    kind: "builtin",
    tags: ["productivity"],
  },
  {
    slug: "r3f-examples",
    title: "R3F Examples",
    description: "A gallery of React Three Fiber scenes (Vite).",
    icon: "Boxes",
    kind: "external",
    subdomain: "r3f-examples",
    repo: "https://github.com/donjor/r3f-examples.git",
    tags: ["3d", "r3f"],
  },
];
