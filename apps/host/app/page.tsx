import type { Metadata } from "next";
import { tools } from "@/lib/tools";
import { ToolCard } from "@/components/tool-card";
import { BackgroundBeams } from "@web-tools/ui/components/background-beams";
import { createHomeMetadata } from "@/lib/metadata";

export const metadata: Metadata = createHomeMetadata();

export default function DashboardPage() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <BackgroundBeams className="opacity-60" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">web-tools</h1>
          <p className="mt-2 text-(--color-muted-foreground)">
            A suite of browser-based tools. Pick one to get started.
          </p>
        </header>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </section>
      </div>
    </div>
  );
}
