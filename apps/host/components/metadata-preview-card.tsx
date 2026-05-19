import { Card } from "@web-tools/ui/components/card";

export type MetadataSummary = {
  path: string;
  url: string;
  title: string;
  description: string;
  ogImagePath: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
};

export function MetadataPreviewCard({ meta }: { meta: MetadataSummary }) {
  return (
    <div className="flex flex-col gap-3">
      <SocialUnfurl meta={meta} />
      <RawFields meta={meta} />
    </div>
  );
}

function SocialUnfurl({ meta }: { meta: MetadataSummary }) {
  const host = safeHost(meta.url);
  return (
    <Card className="overflow-hidden p-0">
      {/* OG image: 1.91:1 (1200x630) */}
      <div className="relative aspect-[1200/630] w-full bg-(--color-muted)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meta.ogImagePath}
          alt={meta.ogTitle}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex items-start gap-3 border-t border-(--color-border) p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon.png"
          alt=""
          className="mt-0.5 h-5 w-5 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs uppercase tracking-wide text-(--color-muted-foreground)">
            {host}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold">
            {meta.title}
          </div>
          <div className="mt-0.5 text-sm text-(--color-muted-foreground)">
            {meta.description}
          </div>
        </div>
      </div>
    </Card>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function RawFields({ meta }: { meta: MetadataSummary }) {
  const rows: Array<[string, string]> = [
    ["path", meta.path],
    ["canonical", meta.url],
    ["title", meta.title],
    ["description", meta.description],
    ["og:title", meta.ogTitle],
    ["og:description", meta.ogDescription],
    ["og:url", meta.ogUrl],
    ["og:image", meta.ogImagePath],
    ["twitter:card", meta.twitterCard],
    ["twitter:title", meta.twitterTitle],
    ["twitter:description", meta.twitterDescription],
  ];
  return (
    <details className="rounded-md border border-(--color-border) bg-(--color-card) px-4 py-2 text-xs">
      <summary className="cursor-pointer select-none py-1 font-mono text-(--color-muted-foreground)">
        raw meta
      </summary>
      <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-(--color-muted-foreground)">{k}</dt>
            <dd className="break-all">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
