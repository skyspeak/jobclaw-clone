"use client";

import { cn } from "@/lib/utils";
import type { V2SkillBar } from "@/lib/v2/v2-types";

type V2SkillBarRowProps = {
  item: V2SkillBar;
  variant: "strength" | "gap";
};

export function V2SkillBarRow({ item, variant }: V2SkillBarRowProps) {
  const barColor = variant === "strength" ? "bg-[var(--v2-primary)]" : "bg-[var(--v2-accent)]";
  const tierColor =
    variant === "strength" ? "text-[var(--v2-primary)]" : "text-[var(--v2-accent)]";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--v2-fg)]">{item.label}</p>
        <span className={cn("shrink-0 text-xs font-semibold", tierColor)}>{item.tier}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--v2-border)]">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${item.score}%` }}
        />
      </div>
    </div>
  );
}
