"use client";

import { V3NavButtons } from "@/app/components/v3/V3NavButtons";
import { V3Shell } from "@/app/components/v3/V3Shell";
import type { V3Analysis } from "@/lib/v3/v3-types";
import { cn } from "@/lib/utils";

type V3PodStepProps = {
  analysis: V3Analysis;
  onBack: () => void;
  onNext: () => void;
};

export function V3PodStep({ analysis, onBack, onNext }: V3PodStepProps) {
  const { pod } = analysis;

  return (
    <V3Shell
      step="pod"
      stepEyebrow="Step 4 of 5 · You are not doing this alone"
      title="Meet your pod."
      subtitle="Five other people across the country, same stage, same fight. You meet once a week to share wins, unstick each other, and hold the line on the plan. Accountability beats willpower."
    >
      <ul className="space-y-3">
        {pod.members.map((member) => (
          <li
            key={member.id}
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-[var(--v3-card)] p-4",
              member.isUser ? "border-[var(--v3-primary)]" : "border-[var(--v3-border)]",
            )}
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--v3-fg)]">{member.name}</p>
              <p className="text-sm text-[var(--v3-muted)]">{member.detail}</p>
            </div>
            {member.isUser ? (
              <span className="rounded-full bg-[var(--v3-teal-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--v3-primary)]">
                You
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 sm:p-8">
        <div className="relative mx-auto aspect-[16/10] max-w-lg overflow-hidden rounded-2xl bg-[var(--v3-pod-map)]">
          {pod.mapPositions.map((pos) => {
            const member = pod.members.find((m) => m.id === pos.memberId);
            if (!member) return null;
            return (
              <div
                key={pos.memberId}
                className="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold text-white shadow-md"
                style={{ top: pos.top, left: pos.left, backgroundColor: member.color }}
              >
                {member.initials}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl bg-[var(--v3-teal-light)] p-5">
          <p className="font-semibold text-[var(--v3-fg)]">
            Your pod meets {pod.meetingDay}, {pod.meetingTime}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--v3-muted)]">
            30 minutes on video. Rotating facilitator. dear [CC] sends an agenda: one win, one
            block, one commitment for the week.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {pod.stats.map((stat) => (
            <div key={stat.label}>
              <p className="v3-serif text-2xl font-semibold text-[var(--v3-fg)]">{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--v3-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[var(--v3-muted)]">
          Pods are matched by target role and stage, spread across regions so it never feels like
          local competition for the same job.
        </p>
      </div>

      <V3NavButtons onBack={onBack} onNext={onNext} />
    </V3Shell>
  );
}
