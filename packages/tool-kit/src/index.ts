export type ToolKindBuiltin = "builtin";
export type ToolKindExternal = "external";

export interface ToolManifestBase {
  slug: string;
  title: string;
  description: string;
  icon?: string;
  tags?: string[];
}

export interface BuiltinToolManifest extends ToolManifestBase {
  kind: ToolKindBuiltin;
}

export interface ExternalToolManifest extends ToolManifestBase {
  kind: ToolKindExternal;
  /** Subdomain identity. URL becomes `<subdomain>.<envBase>` per environment. */
  subdomain: string;
  /** Documentary only — git repo URL, used by README/docs, not by code. */
  repo?: string;
}

export type ToolManifest = BuiltinToolManifest | ExternalToolManifest;

export function isBuiltin(t: ToolManifest): t is BuiltinToolManifest {
  return t.kind === "builtin";
}

export function isExternal(t: ToolManifest): t is ExternalToolManifest {
  return t.kind === "external";
}

export type UrlContext = {
  env: "dev" | "prod";
  /** Dev host suffix, e.g. "web-tools.localhost". External URL: `<subdomain>.<devBase>`. */
  devBase: string;
  /** Prod host suffix, e.g. "example.com". External URL: `<subdomain>.<prodHost>`. */
  prodHost: string;
};

export function toolUrl(t: ToolManifest, ctx: UrlContext): string {
  if (isBuiltin(t)) return `/${t.slug}`;
  const base = ctx.env === "dev" ? ctx.devBase : ctx.prodHost;
  return `https://${t.subdomain}.${base}/`;
}
