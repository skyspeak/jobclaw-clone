"use client";

import type { ReactNode } from "react";

import { getV3TopLevelStep } from "@/lib/v3/v3-flow";
import type { V3StepId } from "@/lib/v3/v3-flow";
import { V3_STEP_LABELS } from "@/lib/v3/v3-theme";
import { cn } from "@/lib/utils";

type V3ShellProps = {
  step: V3StepId;
  stepEyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
};

export function V3Shell({ step, stepEyebrow, title, subtitle, children }: V3ShellProps) {
  const activeTop = getV3TopLevelStep(step);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="v3-serif text-xl font-semibold tracking-tight text-[var(--v3-fg)]">
            dear <span className="text-[var(--v3-primary)]">[CC]</span>
          </span>
          <span className="rounded-full border border-[var(--v3-border)] bg-[var(--v3-card)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--v3-muted)]">
            Career Coach
          </span>
        </div>
        <p className="text-xs text-[var(--v3-muted)]">
          A New Work Foundation tool · free &amp; open source
        </p>
      </header>

      <nav
        aria-label="Roadmap progress"
        className="mt-6 flex flex-wrap items-center gap-1 rounded-full border border-[var(--v3-border)] bg-[var(--v3-card)]/60 p-1.5 sm:gap-2"
      >
        {V3_STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === activeTop;
          const isPast = stepNumber < activeTop;

          return (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs sm:px-3",
                isActive && "bg-[var(--v3-card)] shadow-sm",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive || isPast
                    ? "bg-[var(--v3-primary)] text-[var(--v3-primary-fg)]"
                    : "border border-[var(--v3-border)] text-[var(--v3-muted)]",
                )}
              >
                {stepNumber}
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  isActive ? "font-medium text-[var(--v3-fg)]" : "text-[var(--v3-muted)]",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </nav>

      <div className="mt-10 sm:mt-12">
        {stepEyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v3-accent)]">
            {stepEyebrow}
          </p>
        ) : null}
        <h1 className="v3-serif mt-2 text-balance text-3xl font-semibold leading-tight tracking-tight text-[var(--v3-fg)] sm:text-4xl md:text-[2.5rem]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--v3-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
