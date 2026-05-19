import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { externalSlugs, getExternal } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "External tool · web-tools";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return externalSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const tool = getExternal(slug);
  return renderOgImage({
    title: tool?.title ?? slug,
    description: tool?.description,
    eyebrow: "external · web-tools",
  });
}
