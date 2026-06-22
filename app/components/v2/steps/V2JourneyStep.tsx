"use client";

import { V2NavButtons } from "@/app/components/v2/V2NavButtons";
import { V2Shell } from "@/app/components/v2/V2Shell";
import type { V2Analysis } from "@/lib/v2/v2-types";
import { cn } from "@/lib/utils";

type V2JourneyStepProps = {
  analysis: V2Analysis;
  onBack: () => void;
  onNext: () => void;
};

export function V2JourneyStep({ analysis, onBack, onNext }: V2JourneyStepProps) {
  return (
    <V2Shell
      step="journey"
      stepEyebrow="Step 3 of 5 · The plan"
      title="A six week journey to close it."
      subtitle="Short, concrete, and built around the three gaps. Every step produces proof you can show in your next application, not just a certificate."
    >
      <div className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-6 sm:p-8">
        <ol className="relative space-y-0">
          {analysis.journey.map((phase, index) => (
            <li key={phase.id} className="relative flex gap-4 pb-8 last:pb-0">
              {index < analysis.journey.length - 1 ? (
                <span
                  className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[var(--v2-border)]"
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  phase.isFinal
                    ? "bg-[var(--v2-primary)] text-[var(--v2-primary-fg)]"
                    : "border border-[var(--v2-border)] bg-[var(--v2-card)] text-[var(--v2-muted)]",
                )}
              >
                {phase.isFinal ? "✓" : index + 1}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.12em]",
                    phase.isFinal ? "text-[var(--v2-primary)]" : "text-[var(--v2-accent)]",
                  )}
                >
                  {phase.weeksLabel}
                </p>
                <h3 className="v2-serif mt-1 text-lg font-semibold text-[var(--v2-fg)]">
                  {phase.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {phase.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--v2-muted)]"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--v2-muted)]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <V2NavButtons onBack={onBack} onNext={onNext} />
    </V2Shell>
  );
}
