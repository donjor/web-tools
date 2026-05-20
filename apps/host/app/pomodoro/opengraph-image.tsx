import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { getBuiltin } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;

const tool = getBuiltin("pomodoro");
export const alt = tool?.title ?? "Pomodoro";

export default function Image() {
  return renderOgImage({
    title: tool?.title ?? "Pomodoro",
    description: tool?.description,
  });
}
