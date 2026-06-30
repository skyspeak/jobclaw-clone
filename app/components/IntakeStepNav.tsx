"use client";

import {
  canNavigateToIntakeTopLevel,
  getIntakeTopLevelStep,
  INTAKE_STEP_LABELS,
} from "@/lib/cc-agent-flow";
import type { CcAgentFlowState, CcAgentStepId } from "@/lib/cc-agent-flow";
import { cn } from "@/lib/utils";

type IntakeStepNavProps = {
  flowStep: CcAgentStepId;
  ccAgent: CcAgentFlowState;
  onStepClick: (topLevel: 1 | 2 | 3) => void;
};

export function IntakeStepNav({ flowStep, ccAgent, onStepClick }: IntakeStepNavProps) {
  const activeTop = getIntakeTopLevelStep(flowStep);

  return (
    <nav
      aria-label="Intake progress"
      className="flex w-full items-center justify-between gap-0.5 rounded-full border border-border/70 bg-card/60 p-1 sm:w-auto sm:justify-start sm:gap-2 sm:p-1.5"
    >
      {INTAKE_STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const isActive = stepNumber === activeTop;
        const isPast = stepNumber < activeTop;
        const canNavigate = canNavigateToIntakeTopLevel(stepNumber, ccAgent);
        const mobileLabel = ["Connect", "Analysis", "Roadmap"][index] ?? label;

        return (
          <button
            key={label}
            type="button"
            disabled={!canNavigate}
            onClick={() => onStepClick(stepNumber)}
            aria-current={isActive ? "step" : undefined}
            aria-label={label}
            className={cn(
              "flex min-h-11 touch-manipulation items-center gap-1.5 rounded-full px-2.5 py-2 text-xs transition-colors sm:px-3 sm:py-1.5",
              isActive && "bg-card shadow-sm",
              canNavigate && !isActive && "hover:bg-card/80",
              canNavigate ? "cursor-pointer" : "cursor-default opacity-60",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:size-5",
                isActive || isPast
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {stepNumber}
            </span>
            <span
              className={cn(
                "max-w-[4.75rem] truncate text-[10px] leading-tight sm:hidden",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {mobileLabel}
            </span>
            <span
              className={cn(
                "hidden sm:inline",
                isActive ? "font-medium text-foreground" : "text-muted-foreground",
                canNavigate && !isActive && "hover:text-foreground",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
