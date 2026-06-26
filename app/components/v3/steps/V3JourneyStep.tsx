"use client";

import { V3NavButtons } from "@/app/components/v3/V3NavButtons";
import { V3Shell } from "@/app/components/v3/V3Shell";
import type { V3Analysis } from "@/lib/v3/v3-types";
import { cn } from "@/lib/utils";

type V3JourneyStepProps = {
  analysis: V3Analysis;
  onBack: () => void;
  onNext: () => void;
};

export function V3JourneyStep({ analysis, onBack, onNext }: V3JourneyStepProps) {
  return (
    <V3Shell
      step="journey"
      stepEyebrow="Step 3 of 5 · The plan"
      title="A six week journey to close it."
      subtitle="Short, concrete, and built around the three gaps. Every step produces proof you can show in your next application, not just a certificate."
    >
      <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 sm:p-8">
        <ol className="relative space-y-0">
          {analysis.journey.map((phase, index) => (
            <li key={phase.id} className="relative flex gap-4 pb-8 last:pb-0">
              {index < analysis.journey.length - 1 ? (
                <span
                  className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[var(--v3-border)]"
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  phase.isFinal
                    ? "bg-[var(--v3-primary)] text-[var(--v3-primary-fg)]"
                    : "border border-[var(--v3-border)] bg-[var(--v3-card)] text-[var(--v3-muted)]",
                )}
              >
                {phase.isFinal ? "✓" : index + 1}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.12em]",
                    phase.isFinal ? "text-[var(--v3-primary)]" : "text-[var(--v3-accent)]",
                  )}
                >
                  {phase.weeksLabel}
                </p>
                <h3 className="v3-serif mt-1 text-lg font-semibold text-[var(--v3-fg)]">
                  {phase.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {phase.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2 text-sm leading-relaxed text-[var(--v3-muted)]"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--v3-muted)]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {analysis.journeyStats.map((stat) => (
          <div
            key={stat.value}
            className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-5"
          >
            <p className="v3-serif text-xl font-semibold text-[var(--v3-fg)]">{stat.value}</p>
            <p className="mt-1 text-sm text-[var(--v3-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <V3NavButtons onBack={onBack} onNext={onNext} />
    </V3Shell>
  );
}
