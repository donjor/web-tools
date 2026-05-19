import { tools } from "../../../tools.config";
import {
  isBuiltin,
  isExternal,
  type BuiltinToolManifest,
  type ExternalToolManifest,
  type ToolManifest,
} from "@web-tools/tool-kit";

export { tools, isBuiltin, isExternal };
export type { ToolManifest };

export function getBuiltin(slug: string): BuiltinToolManifest | undefined {
  return tools.find((t) => t.slug === slug && isBuiltin(t)) as
    | BuiltinToolManifest
    | undefined;
}

export function getExternal(slug: string): ExternalToolManifest | undefined {
  return tools.find((t) => t.slug === slug && isExternal(t)) as
    | ExternalToolManifest
    | undefined;
}

export function builtinSlugs(): string[] {
  return tools.filter(isBuiltin).map((t) => t.slug);
}

export function externalSlugs(): string[] {
  return tools.filter(isExternal).map((t) => t.slug);
}
