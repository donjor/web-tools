import {
  Boxes,
  Calculator,
  CheckSquare,
  Timer,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Boxes,
  Calculator,
  CheckSquare,
  Timer,
  Wrench,
};

export function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Wrench;
  return map[name] ?? Wrench;
}
