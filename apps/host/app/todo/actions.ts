"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createList(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return;
  const list = await prisma.todoList.create({ data: { name } });
  redirect(`/todo/${list.id}`);
}

export async function deleteList(listId: string) {
  await prisma.todoList.delete({ where: { id: listId } });
  redirect("/todo");
}

export async function createItem(listId: string, formData: FormData) {
  const text = (formData.get("text") as string | null)?.trim();
  if (!text) return;
  await prisma.todoItem.create({ data: { text, listId } });
  revalidatePath(`/todo/${listId}`);
}

export async function toggleItem(itemId: string, listId: string, done: boolean) {
  await prisma.todoItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath(`/todo/${listId}`);
}

export async function deleteItem(itemId: string, listId: string) {
  await prisma.todoItem.delete({ where: { id: itemId } });
  revalidatePath(`/todo/${listId}`);
}

export async function clearCompleted(listId: string) {
  await prisma.todoItem.deleteMany({ where: { listId, done: true } });
  revalidatePath(`/todo/${listId}`);
}
