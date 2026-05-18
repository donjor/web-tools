import { tools } from "../../../tools.config";
import { isBuiltin, isExternal, type ToolManifest } from "@web-tools/tool-kit";

export { tools, isBuiltin, isExternal };
export type { ToolManifest };

export function getBuiltin(slug: string): ToolManifest | undefined {
  return tools.find((t) => t.slug === slug && t.kind === "builtin");
}

export function builtinSlugs(): string[] {
  return tools.filter(isBuiltin).map((t) => t.slug);
}
