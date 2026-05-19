import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web-tools/ui/components/card";
import { Badge } from "@web-tools/ui/components/badge";
import { toolUrl, type ToolManifest } from "@web-tools/tool-kit";
import { resolveIcon } from "@/lib/icons";

export function ToolCard({ tool }: { tool: ToolManifest }) {
  const Icon = resolveIcon(tool.icon);
  const href = toolUrl(tool);
  const isExternal = tool.kind === "external";

  const inner = (
    <Card className="group relative h-full overflow-hidden transition-colors hover:border-(--color-ring)">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="rounded-md bg-(--color-accent) p-2">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant={isExternal ? "outline" : "secondary"}>
            {isExternal ? "External" : "Built-in"}
          </Badge>
        </div>
        <CardTitle className="mt-3 flex items-center gap-2">
          {tool.title}
          {isExternal ? (
            <ArrowUpRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
          ) : null}
        </CardTitle>
        <CardDescription>{tool.description}</CardDescription>
      </CardHeader>
      {tool.tags && tool.tags.length > 0 ? (
        <CardContent className="flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-(--color-muted-foreground)"
            >
              #{tag}
            </span>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );

  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
