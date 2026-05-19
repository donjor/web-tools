"use client";
import { useCallback, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@web-tools/ui/components/button";
import { Card } from "@web-tools/ui/components/card";
import { Input } from "@web-tools/ui/components/input";
import { Checkbox } from "@web-tools/ui/components/checkbox";
import { ToolFrame } from "@/components/tool-frame";
import { getBuiltin } from "@/lib/tools";

const STORAGE_KEY = "web-tools.todo.v1";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

const manifest = getBuiltin("todo");

export default function TodoClient() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Todo[];
        if (Array.isArray(parsed)) setTodos(parsed);
      }
    } catch {
      // ignore parse errors — start clean
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  const add = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
    ]);
    setDraft("");
  }, [draft]);

  const toggle = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((t) => !t.done));
  }, []);

  const completedCount = todos.filter((t) => t.done).length;
  const remainingCount = todos.length - completedCount;

  return (
    <ToolFrame title={manifest?.title ?? "Todo"} description={manifest?.description}>
      <div className="mx-auto w-full max-w-xl">
        <Card className="p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a task and press Enter"
              autoFocus
            />
            <Button type="submit" disabled={!draft.trim()}>
              Add
            </Button>
          </form>

          <ul className="mt-4 space-y-1">
            {todos.length === 0 && hydrated ? (
              <li className="py-6 text-center text-sm text-(--color-muted-foreground)">
                No tasks yet.
              </li>
            ) : null}
            {todos.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-(--color-accent)"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() => toggle(t.id)}
                  aria-label={`Mark "${t.text}" as ${t.done ? "incomplete" : "complete"}`}
                />
                <span
                  className={
                    "flex-1 text-sm " +
                    (t.done ? "text-(--color-muted-foreground) line-through" : "")
                  }
                >
                  {t.text}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => remove(t.id)}
                  aria-label="Delete"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          {todos.length > 0 ? (
            <div className="mt-4 flex items-center justify-between border-t border-(--color-border) pt-3 text-xs text-(--color-muted-foreground)">
              <span>
                {remainingCount} remaining · {completedCount} done
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                disabled={completedCount === 0}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear completed
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </ToolFrame>
  );
}
