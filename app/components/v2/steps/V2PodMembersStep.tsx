"use client";

import { V2NavButtons } from "@/app/components/v2/V2NavButtons";
import { V2Shell } from "@/app/components/v2/V2Shell";
import type { V2Analysis } from "@/lib/v2/v2-types";
import { cn } from "@/lib/utils";

type V2PodMembersStepProps = {
  analysis: V2Analysis;
  onBack: () => void;
  onNext: () => void;
};

export function V2PodMembersStep({ analysis, onBack, onNext }: V2PodMembersStepProps) {
  return (
    <V2Shell
      step="pod-members"
      stepEyebrow="Step 4 of 5 · You are not doing this alone"
      title="Meet your pod."
      subtitle="Five other people across the country, same stage, same fight. You meet once a week to share wins, unstick each other, and hold the line on the plan. Accountability beats willpower."
    >
      <ul className="space-y-3">
        {analysis.pod.members.map((member) => (
          <li
            key={member.id}
            className={cn(
              "flex items-center gap-4 rounded-2xl border bg-[var(--v2-card)] p-4",
              member.isUser
                ? "border-[var(--v2-primary)]"
                : "border-[var(--v2-border)]",
            )}
          >
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--v2-fg)]">{member.name}</p>
              <p className="text-sm text-[var(--v2-muted)]">{member.detail}</p>
            </div>
            {member.isUser ? (
              <span className="rounded-full bg-[var(--v2-teal-light)] px-2.5 py-0.5 text-xs font-medium text-[var(--v2-primary)]">
                You
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <V2NavButtons onBack={onBack} onNext={onNext} />
    </V2Shell>
  );
}
