import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/metadata";
import TodoClient from "./todo-client";

export const metadata: Metadata = createToolMetadata("todo");

export default function TodoPage() {
  return <TodoClient />;
}
