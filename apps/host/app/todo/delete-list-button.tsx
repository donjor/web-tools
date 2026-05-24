"use client";
import { Trash2 } from "lucide-react";
import { Button } from "@web-tools/ui/components/button";
import { deleteList } from "./actions";

export function DeleteListButton({ listId, listName }: { listId: string; listName: string }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => {
        if (confirm(`Delete "${listName}" and all its items?`)) {
          deleteList(listId);
        }
      }}
      aria-label={`Delete list "${listName}"`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
