"use client";

import { V2NavButtons } from "@/app/components/v2/V2NavButtons";
import { V2Shell } from "@/app/components/v2/V2Shell";
import { V2SkillBarRow } from "@/app/components/v2/V2SkillBarRow";
import type { V2Analysis } from "@/lib/v2/v2-types";

type V2SkillGapsStepProps = {
  analysis: V2Analysis;
  onBack: () => void;
  onNext: () => void;
};

function EntityCard({
  initials,
  title,
  subtitle,
  sourceLabel,
  accent,
}: {
  initials: string;
  title: string;
  subtitle: string;
  sourceLabel: string;
  accent: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--v2-fg)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--v2-muted)]">{subtitle}</p>
        </div>
      </div>
      <span className="mt-4 inline-block rounded-full border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-1 text-xs text-[var(--v2-muted)]">
        {sourceLabel}
      </span>
    </div>
  );
}

export function V2SkillGapsStep({ analysis, onBack, onNext }: V2SkillGapsStepProps) {
  const jobSubtitle = [
    analysis.job.company,
    analysis.job.location,
    analysis.job.appliedDate,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <V2Shell
      step="skill-gaps"
      stepEyebrow="Step 2 of 5 · The honest read"
      title="Here is the gap."
      subtitle="You were closer than the rejection email made it feel. Three strengths landed. Three gaps are what stood between you and the offer."
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <EntityCard
          initials={analysis.job.initials}
          title={analysis.job.title}
          subtitle={jobSubtitle}
          sourceLabel={analysis.job.sourceLabel}
          accent="#7cb89a"
        />
        <EntityCard
          initials={analysis.candidate.initials}
          title={analysis.candidate.name}
          subtitle={analysis.candidate.summary}
          sourceLabel={analysis.candidate.sourceLabel}
          accent="#7cb89a"
        />
      </div>

      <div className="mt-6 space-y-8 rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-6 sm:p-8">
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-[var(--v2-fg)]">What you already bring</h2>
          {analysis.strengths.map((item) => (
            <V2SkillBarRow key={item.label} item={item} variant="strength" />
          ))}
        </div>

        <div className="space-y-5 border-t border-[var(--v2-border)] pt-8">
          <h2 className="text-sm font-semibold text-[var(--v2-fg)]">
            What the role needed that did not show up
          </h2>
          {analysis.gaps.map((item) => (
            <V2SkillBarRow key={item.label} item={item} variant="gap" />
          ))}
        </div>
      </div>

      <V2NavButtons onBack={onBack} onNext={onNext} />
    </V2Shell>
  );
}
