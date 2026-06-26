"use client";

import { useState } from "react";

import { V3Shell } from "@/app/components/v3/V3Shell";
import { isValidUrl } from "@/lib/v3/v3-flow";
import type { V3Inputs } from "@/lib/v3/v3-types";

type V3ConnectStepProps = {
  inputs: V3Inputs;
  onInputsChange: (inputs: V3Inputs) => void;
  onAnalyze: () => Promise<void>;
  onUseSample: () => void;
  isLoading: boolean;
  loadingMessage: string | null;
  error: string | null;
};

export function V3ConnectStep({
  inputs,
  onInputsChange,
  onAnalyze,
  onUseSample,
  isLoading,
  loadingMessage,
  error,
}: V3ConnectStepProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    setLocalError(null);
    if (!isValidUrl(inputs.jobUrl)) {
      setLocalError("Enter a valid job listing URL.");
      return;
    }
    if (!isValidUrl(inputs.linkedInUrl)) {
      setLocalError("Enter a valid LinkedIn profile URL.");
      return;
    }
    await onAnalyze();
  }

  return (
    <V3Shell
      step="connect"
      title={
        <>
          You did not get the job.
          <br />
          Let&apos;s figure out why, and what to do next.
        </>
      }
      subtitle="Paste the job you applied to and your LinkedIn profile. dear [CC] reads both, finds the gap between where you are and where that role needs you to be, then builds you a plan and a crew to get there."
    >
      <div className="rounded-2xl border border-[var(--v3-border)] bg-[var(--v3-card)] p-6 shadow-sm sm:p-8">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v3-accent)]">
          Turn a rejection into a roadmap
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="v3-job-url" className="text-sm font-medium text-[var(--v3-fg)]">
              Link to the job you applied to but did not get
            </label>
            <p className="text-xs text-[var(--v3-muted)]">
              LinkedIn, Indeed, Greenhouse, Lever, or a company careers page all work.
            </p>
            <input
              id="v3-job-url"
              type="url"
              value={inputs.jobUrl}
              disabled={isLoading}
              onChange={(e) => onInputsChange({ ...inputs, jobUrl: e.target.value })}
              placeholder="https://jobs.lever.co/..."
              className="h-11 w-full rounded-xl border border-[var(--v3-border)] bg-[var(--v3-bg)] px-4 text-sm text-[var(--v3-fg)] placeholder:text-[var(--v3-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--v3-primary)]/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="v3-linkedin-url" className="text-sm font-medium text-[var(--v3-fg)]">
              Your LinkedIn profile
            </label>
            <p className="text-xs text-[var(--v3-muted)]">
              We use it to read your real experience, not just a resume keyword match.
            </p>
            <input
              id="v3-linkedin-url"
              type="url"
              value={inputs.linkedInUrl}
              disabled={isLoading}
              onChange={(e) => onInputsChange({ ...inputs, linkedInUrl: e.target.value })}
              placeholder="https://www.linkedin.com/in/..."
              className="h-11 w-full rounded-xl border border-[var(--v3-border)] bg-[var(--v3-bg)] px-4 text-sm text-[var(--v3-fg)] placeholder:text-[var(--v3-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--v3-primary)]/30"
            />
          </div>
        </div>

        {isLoading && loadingMessage ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-[var(--v3-primary)]" aria-live="polite">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--v3-primary)] border-t-transparent" />
            {loadingMessage}
          </p>
        ) : null}

        {(localError || error) && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {localError || error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isLoading}
            className="rounded-full bg-[var(--v3-primary)] px-6 py-3 text-sm font-medium text-[var(--v3-primary-fg)] transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? "Building your roadmap…" : "Build my roadmap"}
          </button>
          <button
            type="button"
            onClick={onUseSample}
            disabled={isLoading}
            className="text-sm font-medium text-[var(--v3-primary)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            Use a sample →
          </button>
        </div>

        <p className="mt-8 border-t border-[var(--v3-border)] pt-6 text-xs leading-relaxed text-[var(--v3-muted)]">
          Free, open source, and never sold. dear [CC] is a tool of the New Work Foundation, a
          501(c)(3) nonprofit.
        </p>
      </div>
    </V3Shell>
  );
}
