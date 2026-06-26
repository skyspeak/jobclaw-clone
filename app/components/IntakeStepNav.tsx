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
      className="flex flex-wrap items-center gap-1 rounded-full border border-border/70 bg-card/60 p-1.5 sm:gap-2"
    >
      {INTAKE_STEP_LABELS.map((label, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const isActive = stepNumber === activeTop;
        const isPast = stepNumber < activeTop;
        const canNavigate = canNavigateToIntakeTopLevel(stepNumber, ccAgent);

        return (
          <button
            key={label}
            type="button"
            disabled={!canNavigate}
            onClick={() => onStepClick(stepNumber)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition-colors sm:px-3",
              isActive && "bg-card shadow-sm",
              canNavigate && !isActive && "hover:bg-card/80",
              canNavigate ? "cursor-pointer" : "cursor-default opacity-60",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                isActive || isPast
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {stepNumber}
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
