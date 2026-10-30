import { Check, Crown, Pencil, Sparkles } from "lucide-react";
import type { ChoreLevel } from "../lib/chore-levels";

const LABELS = {
  base: { text: "BASE", icon: Check },
  pro: { text: "PRO", icon: Sparkles },
  super: { text: "SUPER", icon: Crown },
  tua: { text: "TUA", icon: Pencil },
} as const;

export function ChoreLevelTag({ level }: { level: ChoreLevel }) {
  const { text, icon: Icon } = LABELS[level];
  return (
    <span className="task-level-tag" aria-label={"Faccenda " + text.toLowerCase()}>
      <Icon aria-hidden="true" size={12} strokeWidth={2.1} />
      {text}
    </span>
  );
}
