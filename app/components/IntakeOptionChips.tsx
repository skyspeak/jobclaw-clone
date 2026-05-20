"use client";

import { Check, Plus } from "lucide-react";

import { Label } from "@/components/ui/label";
import { appendChip } from "@/lib/intake-questions";
import { cn } from "@/lib/utils";

type IntakeOptionChipsProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  stepIndex: number;
  label?: string;
  className?: string;
};

export function IntakeOptionChips({
  options,
  value,
  onChange,
  stepIndex,
  label = "Or pick a starting point",
  className,
}: IntakeOptionChipsProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:text-sm">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = value.toLowerCase().includes(opt.toLowerCase());
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(appendChip(value, opt))}
              data-testid={`chip-q${stepIndex + 1}-${opt.replace(/\s+/g, "-").toLowerCase()}`}
              className={[
                "inline-flex touch-manipulation items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                "active:scale-[0.97]",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/70 bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
              ].join(" ")}
            >
              {isSelected ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
