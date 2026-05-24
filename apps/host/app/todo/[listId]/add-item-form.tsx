"use client";
import { useRef } from "react";
import { Button } from "@web-tools/ui/components/button";
import { Input } from "@web-tools/ui/components/input";
import { createItem } from "../actions";

export function AddItemForm({ listId }: { listId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const action = createItem.bind(null, listId);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await action(fd);
        ref.current?.reset();
      }}
      className="flex gap-2"
    >
      <Input name="text" placeholder="Add a task and press Enter" autoFocus />
      <Button type="submit">Add</Button>
    </form>
  );
}
