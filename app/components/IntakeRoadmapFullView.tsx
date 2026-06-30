"use client";

import { Check, Loader2 } from "lucide-react";
import { useMemo } from "react";

import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import { IntakeRoadmapActions } from "@/app/components/IntakeRoadmapActions";
import { buildRoadmapPhases } from "@/lib/intake-roadmap-phases";
import { cn } from "@/lib/utils";

function RoadmapLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24" aria-busy="true">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Building your 6-week plan…</p>
    </div>
  );
}

function PhaseMarker({ marker }: { marker: number | "done" }) {
  if (marker === "done") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-sm">
        <Check className="size-4" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-foreground shadow-sm">
      {marker}
    </div>
  );
}

type IntakeRoadmapFullViewProps = {
  roadmap: IntakePersonalizedRoadmap | null;
  vetting?: VettingResult | null;
  roleLabel: string;
  gapSummary?: string;
  email?: string;
  contactName?: string;
  contactPhone?: string;
  onContactUpdate?: (patch: { name?: string; phone?: string }) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
};

export function IntakeRoadmapFullView({
  roadmap,
  vetting,
  roleLabel,
  gapSummary,
  email,
  contactName,
  contactPhone,
  onContactUpdate,
  isLoading = false,
  error,
  className,
}: IntakeRoadmapFullViewProps) {
  const phases = useMemo(() => {
    if (!vetting) {
      return [];
    }
    return buildRoadmapPhases(vetting, roadmap);
  }, [vetting, roadmap]);

  if (isLoading) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col brand-bg", className)}>
        <RoadmapLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-1 items-center justify-center p-8 brand-bg", className)}>
        <p className="text-center text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!vetting || phases.length === 0) {
    return null;
  }

  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain brand-bg", className)}>
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <article className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70 bg-card px-5 py-8 shadow-sm sm:px-10 sm:py-12">
          <header className="border-b border-border/50 pb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Your 6-week roadmap · {roleLabel}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              A six week journey to close it.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Every step produces proof you can show in your next application — tools you&apos;ve
              used, outcomes you&apos;ve measured, and claims you can defend in an interview.
            </p>
            {gapSummary ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Built to close:{" "}
                <span className="font-medium text-foreground">{gapSummary}</span>
              </p>
            ) : null}
            {roadmap?.promise ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{roadmap.promise}</p>
            ) : null}
          </header>

          <ol className="mt-10 space-y-0">
            {phases.map((phase, index) => (
              <li
                key={phase.id}
                id={`roadmap-phase-${phase.id}`}
                className={cn("relative flex gap-5 sm:gap-6", index < phases.length - 1 ? "pb-12" : "")}
              >
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <PhaseMarker marker={phase.stepMarker} />
                  {index < phases.length - 1 ? (
                    <span
                      className="mt-2 w-px flex-1 bg-border"
                      style={{ minHeight: "4rem" }}
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 pb-2">
                  <p className="text-sm font-medium text-primary">{phase.phaseLabel}</p>
                  <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {phase.title}
                  </h2>

                  <ul className="mt-5 space-y-3">
                    {phase.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/50" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 rounded-2xl border border-border/60 bg-muted/25 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Tools you&apos;ll learn
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {phase.tools.join(" · ")}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      What you can claim
                    </p>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
                      {phase.claim}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {email?.trim() && roadmap ? (
            <IntakeRoadmapActions
              email={email}
              name={contactName}
              phone={contactPhone}
              vetting={vetting}
              roadmap={roadmap}
              gapSummary={gapSummary}
              onContactUpdate={onContactUpdate}
            />
          ) : null}
        </article>
      </div>
    </div>
  );
}
