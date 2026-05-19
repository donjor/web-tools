import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { getBuiltin } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;

const tool = getBuiltin("calculator");
export const alt = tool?.title ?? "Calculator";

export default function Image() {
  return renderOgImage({
    title: tool?.title ?? "Calculator",
    description: tool?.description,
  });
}
