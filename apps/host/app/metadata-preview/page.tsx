import type { Metadata } from "next";
import {
  SITE_NAME,
  SITE_URL,
  createHomeMetadata,
  createToolMetadata,
  createExternalMetadata,
} from "@/lib/metadata";
import { tools } from "@/lib/tools";
import { isBuiltin, isExternal } from "@web-tools/tool-kit";
import {
  MetadataPreviewCard,
  type MetadataSummary,
} from "@/components/metadata-preview-card";

export const metadata: Metadata = {
  title: "Metadata preview",
  description: "Local preview of share-card metadata for each web-tools route.",
  robots: { index: false, follow: false },
};

type Group = {
  heading: string;
  blurb: string;
  routes: RouteSpec[];
};

type RouteSpec = {
  label: string;
  path: string;
  meta: Metadata;
};

const groups: Group[] = [
  {
    heading: "Dashboard + built-ins",
    blurb:
      "Host routes — metadata + OG image generated from lib/metadata.ts.",
    routes: [
      { label: "Dashboard", path: "/", meta: createHomeMetadata() },
      ...tools.filter(isBuiltin).map((t) => ({
        label: t.title,
        path: `/${t.slug}`,
        meta: createToolMetadata(t.slug),
      })),
    ],
  },
  {
    heading: "External tools (host-managed landing)",
    blurb:
      "Externals run on their own subdomains, but the dashboard links via /external/<slug> so every share carries host-managed metadata. Click-through opens the real subdomain.",
    routes: tools.filter(isExternal).map((t) => ({
      label: t.title,
      path: `/external/${t.slug}`,
      meta: createExternalMetadata(t.slug),
    })),
  },
];

export default function MetadataPreviewPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Metadata preview
        </h1>
        <p className="mt-2 max-w-prose text-sm text-(--color-muted-foreground)">
          How each route looks when shared (iMessage, Slack, Discord, Twitter,
          etc. — they all render approximately this same card from the OG
          tags). Built from{" "}
          <code className="font-mono text-xs">lib/metadata.ts</code> + the live
          OG image routes — same source of truth the real share preview uses.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {groups.map((g) =>
          g.routes.length === 0 ? null : (
            <section key={g.heading}>
              <h2 className="text-xl font-medium">{g.heading}</h2>
              <p className="mt-1 max-w-prose text-sm text-(--color-muted-foreground)">
                {g.blurb}
              </p>
              <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
                {g.routes.map((r) => (
                  <article key={r.path} className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-base font-medium">{r.label}</h3>
                      <a
                        href={r.path}
                        className="font-mono text-xs text-(--color-muted-foreground) hover:underline"
                      >
                        {r.path}
                      </a>
                    </div>
                    <MetadataPreviewCard meta={summarize(r)} />
                  </article>
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}

type OgFields = {
  title?: Metadata["title"];
  description?: string | null;
  url?: string | URL;
};
type TwitterFields = {
  card?: string;
  title?: Metadata["title"];
  description?: string | null;
};

function summarize({ path, meta }: RouteSpec): MetadataSummary {
  const url = new URL(path, SITE_URL).toString();
  const ogImagePath = path === "/" ? "/opengraph-image" : `${path}/opengraph-image`;
  const title = readTitle(meta.title) ?? SITE_NAME;
  const description = readString(meta.description) ?? "";
  const og = (meta.openGraph ?? {}) as OgFields;
  const tw = (meta.twitter ?? {}) as TwitterFields;
  return {
    path,
    url,
    title,
    description,
    ogImagePath,
    ogTitle: readTitle(og.title) ?? title,
    ogDescription: readString(og.description) ?? description,
    ogUrl: readString(og.url) ?? url,
    twitterCard: readString(tw.card) ?? "summary_large_image",
    twitterTitle: readTitle(tw.title) ?? title,
    twitterDescription: readString(tw.description) ?? description,
  };
}

// Metadata.title can be a string, { absolute }, { default, template }, or { template, default }.
function readTitle(t: Metadata["title"] | undefined): string | undefined {
  if (t == null) return undefined;
  if (typeof t === "string") return t;
  if ("absolute" in t && t.absolute) return t.absolute;
  if ("default" in t && t.default) return t.default;
  return undefined;
}

function readString(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (v instanceof URL) return v.toString();
  return undefined;
}
