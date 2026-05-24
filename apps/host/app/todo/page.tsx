import type { Metadata } from "next";
import Link from "next/link";
import { createToolMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";
import { Card } from "@web-tools/ui/components/card";
import { CreateListForm } from "./create-list-form";
import { DeleteListButton } from "./delete-list-button";

export const metadata: Metadata = createToolMetadata("todo");

const manifest = getBuiltin("todo");

export default async function TodoPage() {
  const lists = await prisma.todoList.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <ToolFrame title={manifest?.title ?? "Todo"} description={manifest?.description}>
      <div className="mx-auto w-full max-w-xl space-y-4">
        <CreateListForm />
        <Card className="divide-y divide-(--color-border)">
          {lists.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-(--color-muted-foreground)">
              No lists yet. Create one above.
            </p>
          ) : (
            lists.map((list) => (
              <div key={list.id} className="flex items-center justify-between px-4 py-3">
                <Link
                  href={`/todo/${list.id}`}
                  className="flex-1 text-sm font-medium hover:underline"
                >
                  {list.name}
                </Link>
                <DeleteListButton listId={list.id} listName={list.name} />
              </div>
            ))
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
