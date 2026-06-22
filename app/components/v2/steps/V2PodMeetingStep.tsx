"use client";

import { V2NavButtons } from "@/app/components/v2/V2NavButtons";
import { V2Shell } from "@/app/components/v2/V2Shell";
import type { V2Analysis } from "@/lib/v2/v2-types";

type V2PodMeetingStepProps = {
  analysis: V2Analysis;
  onBack: () => void;
  onNext: () => void;
};

export function V2PodMeetingStep({ analysis, onBack, onNext }: V2PodMeetingStepProps) {
  const { pod } = analysis;

  return (
    <V2Shell
      step="pod-meeting"
      stepEyebrow="Step 4 of 5 · You are not doing this alone"
      title="Meet your pod."
    >
      <div className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-6 sm:p-8">
        <div className="relative mx-auto aspect-[16/10] max-w-lg overflow-hidden rounded-2xl bg-[var(--v2-pod-map)]">
          {pod.mapPositions.map((pos) => {
            const member = pod.members.find((m) => m.id === pos.memberId);
            if (!member) {
              return null;
            }
            return (
              <div
                key={pos.memberId}
                className="absolute flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold text-white shadow-md"
                style={{
                  top: pos.top,
                  left: pos.left,
                  backgroundColor: member.color,
                }}
              >
                {member.initials}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl bg-[var(--v2-teal-light)] p-5">
          <p className="font-semibold text-[var(--v2-fg)]">
            Your pod meets {pod.meetingDay}, {pod.meetingTime}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--v2-muted)]">
            30 minutes on video. Rotating facilitator. dear [CC] sends an agenda: one win, one
            block, one commitment for the week.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-card)] px-5 py-2 text-sm font-medium text-[var(--v2-fg)]"
          >
            Add to calendar
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-card)] px-5 py-2 text-sm font-medium text-[var(--v2-fg)]"
          >
            Pod chat
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {pod.stats.map((stat) => (
            <div key={stat.label}>
              <p className="v2-serif text-2xl font-semibold text-[var(--v2-fg)]">{stat.value}</p>
              <p className="mt-1 text-xs text-[var(--v2-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[var(--v2-muted)]">
          Pods are matched by target role and stage, spread across regions so it never feels like
          local competition for the same job.
        </p>
      </div>

      <V2NavButtons onBack={onBack} onNext={onNext} />
    </V2Shell>
  );
}
