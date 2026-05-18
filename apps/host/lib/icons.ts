import {
  Boxes,
  Calculator,
  CheckSquare,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Boxes,
  Calculator,
  CheckSquare,
  Wrench,
};

export function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Wrench;
  return map[name] ?? Wrench;
}
