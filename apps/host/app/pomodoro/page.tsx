import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/metadata";
import PomodoroClient from "./pomodoro-client";

export const metadata: Metadata = createToolMetadata("pomodoro");

export default function PomodoroPage() {
  return <PomodoroClient />;
}
