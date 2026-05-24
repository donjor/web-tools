import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";
import { Card } from "@web-tools/ui/components/card";
import { AddItemForm } from "./add-item-form";
import { TodoItemList } from "./todo-item-list";

const manifest = getBuiltin("todo");

export default async function ListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;

  const list = await prisma.todoList.findUnique({
    where: { id: listId },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!list) notFound();

  return (
    <ToolFrame title={manifest?.title ?? "Todo"} description={manifest?.description}>
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/todo"
            className="flex items-center gap-1 text-sm text-(--color-muted-foreground) hover:text-(--color-foreground)"
          >
            <ChevronLeft className="h-4 w-4" />
            All lists
          </Link>
          <span className="text-sm text-(--color-muted-foreground)">/</span>
          <span className="text-sm font-medium">{list.name}</span>
        </div>

        <AddItemForm listId={listId} />

        <Card className="p-4">
          <TodoItemList items={list.items} listId={listId} />
        </Card>
      </div>
    </ToolFrame>
  );
}
