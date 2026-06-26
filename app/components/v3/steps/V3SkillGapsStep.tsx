"use client";

import { V3NavButtons } from "@/app/components/v3/V3NavButtons";
import { V3Shell } from "@/app/components/v3/V3Shell";
import { V3SkillBarRow } from "@/app/components/v3/V3SkillBarRow";
import type { V3Analysis } from "@/lib/v3/v3-types";

type V3SkillGapsStepProps = {
  analysis: V3Analysis;
  onBack: () => void;
  onNext: () => void;
};

function EntityCard({
  initials,
  title,
  subtitle,
  sourceLabel,
}: {
  initials: string;
  title: string;
  subtitle: string;
  sourceLabel: string;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#7cb89a] text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[var(--v3-fg)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--v3-muted)]">{subtitle}</p>
        </div>
      </div>
      <span className="mt-4 inline-block rounded-full border border-[var(--v3-border)] bg-[var(--v3-bg)] px-3 py-1 text-xs text-[var(--v3-muted)]">
        {sourceLabel}
      </span>
    </div>
  );
}

export function V3SkillGapsStep({ analysis, onBack, onNext }: V3SkillGapsStepProps) {
  const jobSubtitle = [analysis.job.company, analysis.job.location, analysis.job.appliedDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <V3Shell
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
        />
        <EntityCard
          initials={analysis.candidate.initials}
          title={analysis.candidate.name}
          subtitle={analysis.candidate.summary}
          sourceLabel={analysis.candidate.sourceLabel}
        />
      </div>

      <div className="mt-6 space-y-8 rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 sm:p-8">
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-[var(--v3-fg)]">What you already bring</h2>
          {analysis.strengths.map((item) => (
            <V3SkillBarRow key={item.label} item={item} variant="strength" />
          ))}
        </div>

        <div className="space-y-5 border-t border-[var(--v3-border)] pt-8">
          <h2 className="text-sm font-semibold text-[var(--v3-fg)]">
            What the role needed that did not show up
          </h2>
          {analysis.gaps.map((item) => (
            <V3SkillBarRow key={item.label} item={item} variant="gap" />
          ))}
        </div>

        <div className="grid gap-3 border-t border-[var(--v3-border)] pt-6 sm:grid-cols-2">
          <p className="text-xs text-[var(--v3-muted)]">
            <span className="font-semibold text-[var(--v3-primary)]">Strengths</span> the job
            rewarded
          </p>
          <p className="text-xs text-[var(--v3-muted)]">
            <span className="font-semibold text-[var(--v3-accent)]">Gaps</span> that likely cost you
            the round
          </p>
        </div>
      </div>

      <V3NavButtons onBack={onBack} onNext={onNext} />
    </V3Shell>
  );
}
