import { renderOgImage, ogSize, ogContentType } from "@/lib/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/metadata";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = SITE_NAME;

export default function Image() {
  return renderOgImage({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    eyebrow: "dashboard",
  });
}
