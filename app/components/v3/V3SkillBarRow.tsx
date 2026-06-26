"use client";

import { cn } from "@/lib/utils";
import type { V3SkillBar } from "@/lib/v3/v3-types";

type V3SkillBarRowProps = {
  item: V3SkillBar;
  variant: "strength" | "gap";
};

export function V3SkillBarRow({ item, variant }: V3SkillBarRowProps) {
  const barColor = variant === "strength" ? "bg-[var(--v3-primary)]" : "bg-[var(--v3-accent)]";
  const tierColor =
    variant === "strength" ? "text-[var(--v3-primary)]" : "text-[var(--v3-accent)]";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--v3-fg)]">{item.label}</p>
        <span className={cn("shrink-0 text-xs font-semibold", tierColor)}>{item.tier}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--v3-border)]">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${item.score}%` }}
        />
      </div>
    </div>
  );
}
