"use client";
import { useRef } from "react";
import { Button } from "@web-tools/ui/components/button";
import { Input } from "@web-tools/ui/components/input";
import { createList } from "./actions";

export function CreateListForm() {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={createList}
      className="flex gap-2"
    >
      <Input name="name" placeholder="New list name" autoFocus />
      <Button type="submit">Create</Button>
    </form>
  );
}
