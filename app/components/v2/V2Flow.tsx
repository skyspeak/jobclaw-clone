"use client";

import { useCallback, useEffect, useState } from "react";

import { V2ConnectStep } from "@/app/components/v2/steps/V2ConnectStep";
import { V2JourneyStep } from "@/app/components/v2/steps/V2JourneyStep";
import { V2MentorStep } from "@/app/components/v2/steps/V2MentorStep";
import { V2PodMeetingStep } from "@/app/components/v2/steps/V2PodMeetingStep";
import { V2PodMembersStep } from "@/app/components/v2/steps/V2PodMembersStep";
import { V2SkillGapsStep } from "@/app/components/v2/steps/V2SkillGapsStep";
import { personalizeSampleAnalysis } from "@/lib/v2/v2-analyze";
import { getV2NextStep, getV2PrevStep } from "@/lib/v2/v2-flow";
import type { V2StepId } from "@/lib/v2/v2-flow";
import {
  clearV2Session,
  createEmptyV2Session,
  readV2Session,
  writeV2Session,
  type V2Session,
} from "@/lib/v2/v2-session";
import { V2_SAMPLE_ANALYSIS, V2_SAMPLE_INPUTS } from "@/lib/v2/v2-sample";
import type { V2Analysis } from "@/lib/v2/v2-types";

export function V2Flow() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<V2Session>(createEmptyV2Session);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readV2Session();
    if (saved) {
      setSession(saved);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: V2Session) => {
    setSession(next);
    writeV2Session(next);
  }, []);

  const goTo = useCallback(
    (step: V2StepId) => {
      persist({ ...session, step });
    },
    [persist, session],
  );

  const handleBack = useCallback(() => {
    const prev = getV2PrevStep(session.step);
    if (prev) {
      goTo(prev);
    }
  }, [goTo, session.step]);

  const handleNext = useCallback(() => {
    const next = getV2NextStep(session.step);
    if (next) {
      goTo(next);
    }
  }, [goTo, session.step]);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v2/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobUrl: session.inputs.jobUrl,
          linkedInUrl: session.inputs.linkedInUrl,
        }),
      });

      const data = (await response.json()) as { analysis?: V2Analysis; error?: string };

      if (!response.ok || !data.analysis) {
        setError(data.error ?? "Could not build your roadmap.");
        return;
      }

      persist({
        ...session,
        analysis: data.analysis,
        usedSample: false,
        step: "skill-gaps",
      });
    } catch {
      setError("Network error. Try again or use the sample.");
    } finally {
      setIsLoading(false);
    }
  }, [persist, session]);

  const handleUseSample = useCallback(() => {
    persist({
      step: "skill-gaps",
      inputs: { ...V2_SAMPLE_INPUTS },
      analysis: personalizeSampleAnalysis(V2_SAMPLE_ANALYSIS.candidate.name),
      usedSample: true,
    });
    setError(null);
  }, [persist]);

  const handleRestart = useCallback(() => {
    clearV2Session();
    setSession(createEmptyV2Session());
    setError(null);
  }, []);

  useEffect(() => {
    if (hydrated && !session.analysis && session.step !== "connect") {
      setSession((prev) => {
        const next = { ...prev, step: "connect" as const };
        writeV2Session(next);
        return next;
      });
    }
  }, [hydrated, session.analysis, session.step]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--v2-muted)]">
        Loading…
      </div>
    );
  }

  if (!session.analysis && session.step !== "connect") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--v2-muted)]">
        Loading…
      </div>
    );
  }

  switch (session.step) {
    case "connect":
      return (
        <V2ConnectStep
          inputs={session.inputs}
          onInputsChange={(inputs) => persist({ ...session, inputs })}
          onAnalyze={handleAnalyze}
          onUseSample={handleUseSample}
          isLoading={isLoading}
          error={error}
        />
      );
    case "skill-gaps":
      return session.analysis ? (
        <V2SkillGapsStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "journey":
      return session.analysis ? (
        <V2JourneyStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "pod-members":
      return session.analysis ? (
        <V2PodMembersStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "pod-meeting":
      return session.analysis ? (
        <V2PodMeetingStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "mentor":
      return session.analysis ? (
        <V2MentorStep analysis={session.analysis} onBack={handleBack} onRestart={handleRestart} />
      ) : null;
    default:
      return null;
  }
}
