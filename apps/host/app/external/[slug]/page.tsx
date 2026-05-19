import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Button } from "@web-tools/ui/components/button";
import { Card } from "@web-tools/ui/components/card";
import { Badge } from "@web-tools/ui/components/badge";
import { externalDirectUrl } from "@web-tools/tool-kit";
import { externalSlugs, getExternal } from "@/lib/tools";
import { ToolFrame } from "@/components/tool-frame";
import { ExternalAutoRedirect } from "@/components/external-auto-redirect";
import { createExternalMetadata } from "@/lib/metadata";
import { getUrlContext } from "@/lib/url-context";
import { resolveIcon } from "@/lib/icons";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return externalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!getExternal(slug)) return {};
  return createExternalMetadata(slug);
}

export default async function ExternalLandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const tool = getExternal(slug);
  if (!tool) notFound();

  const directUrl = externalDirectUrl(tool, getUrlContext());
  const Icon = resolveIcon(tool.icon);
  const host = new URL(directUrl).host;

  return (
    <ToolFrame title={tool.title} description={tool.description}>
      <Card className="mx-auto w-full max-w-xl p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-lg bg-(--color-accent) p-3">
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="mx-auto">
              External
            </Badge>
            <h2 className="text-2xl font-semibold">{tool.title}</h2>
            <p className="text-sm text-(--color-muted-foreground)">
              {tool.description}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <a href={directUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open {tool.title}
            </a>
          </Button>
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-(--color-muted-foreground)">
              opens at{" "}
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline-offset-2 hover:underline"
              >
                {host}
                <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </a>
            </div>
            <ExternalAutoRedirect href={directUrl} />
          </div>
        </div>
      </Card>
    </ToolFrame>
  );
}
