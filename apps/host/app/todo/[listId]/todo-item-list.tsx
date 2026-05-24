"use client";
import { X, Trash2 } from "lucide-react";
import { Button } from "@web-tools/ui/components/button";
import { Checkbox } from "@web-tools/ui/components/checkbox";
import { toggleItem, deleteItem, clearCompleted } from "../actions";

type Item = { id: string; text: string; done: boolean };

export function TodoItemList({ items, listId }: { items: Item[]; listId: string }) {
  const completedCount = items.filter((t) => t.done).length;
  const remainingCount = items.length - completedCount;

  return (
    <>
      <ul className="space-y-1">
        {items.length === 0 ? (
          <li className="py-6 text-center text-sm text-(--color-muted-foreground)">
            No tasks yet.
          </li>
        ) : null}
        {items.map((item) => (
          <li
            key={item.id}
            className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-(--color-accent)"
          >
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) => toggleItem(item.id, listId, !!checked)}
              aria-label={`Mark "${item.text}" as ${item.done ? "incomplete" : "complete"}`}
            />
            <span
              className={
                "flex-1 text-sm " +
                (item.done ? "text-(--color-muted-foreground) line-through" : "")
              }
            >
              {item.text}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => deleteItem(item.id, listId)}
              aria-label="Delete"
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>

      {items.length > 0 ? (
        <div className="mt-4 flex items-center justify-between border-t border-(--color-border) pt-3 text-xs text-(--color-muted-foreground)">
          <span>
            {remainingCount} remaining · {completedCount} done
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearCompleted(listId)}
            disabled={completedCount === 0}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear completed
          </Button>
        </div>
      ) : null}
    </>
  );
}
