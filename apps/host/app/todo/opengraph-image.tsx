import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { getBuiltin } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;

const tool = getBuiltin("todo");
export const alt = tool?.title ?? "Todo";

export default function Image() {
  return renderOgImage({
    title: tool?.title ?? "Todo",
    description: tool?.description,
  });
}
