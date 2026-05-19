import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "@/lib/metadata";

export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png" as const;

type OgProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

const HOST_LABEL = new URL(SITE_URL).host;

export async function renderOgImage({
  title,
  description,
  eyebrow = SITE_NAME,
}: OgProps) {
  // Read the bundled avatar. `next` always runs with cwd = the workspace
  // root (apps/host), so this relative path holds across dev and build.
  // Don't invoke Next from elsewhere — this path is cwd-relative, not
  // module-relative.
  const avatarBuf = await readFile(
    path.join(process.cwd(), "lib", "avatar.png"),
  );
  const avatarSrc = `data:image/png;base64,${avatarBuf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #1a1a2e 100%)",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            width={88}
            height={88}
            alt=""
            style={{
              borderRadius: "9999px",
              border: "2px solid rgba(255,255,255,0.12)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 28,
                letterSpacing: -0.5,
                color: "rgba(245,245,245,0.6)",
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                fontSize: 22,
                color: "rgba(245,245,245,0.4)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {HOST_LABEL}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 36,
                lineHeight: 1.3,
                color: "rgba(245,245,245,0.72)",
                maxWidth: 1000,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
