"use client";

import { useCallback, useEffect, useState } from "react";

import { V3ConnectStep } from "@/app/components/v3/steps/V3ConnectStep";
import { V3JourneyStep } from "@/app/components/v3/steps/V3JourneyStep";
import { V3MentorStep } from "@/app/components/v3/steps/V3MentorStep";
import { V3PodStep } from "@/app/components/v3/steps/V3PodStep";
import { V3SkillGapsStep } from "@/app/components/v3/steps/V3SkillGapsStep";
import { personalizeSampleAnalysis } from "@/lib/v3/v3-analyze";
import { getV3NextStep, getV3PrevStep } from "@/lib/v3/v3-flow";
import type { V3StepId } from "@/lib/v3/v3-flow";
import {
  clearV3Session,
  createEmptyV3Session,
  readV3Session,
  writeV3Session,
  type V3Session,
} from "@/lib/v3/v3-session";
import { V3_SAMPLE_ANALYSIS, V3_SAMPLE_INPUTS } from "@/lib/v3/v3-sample";
import type { V3Analysis } from "@/lib/v3/v3-types";

const LOADING_MESSAGES = [
  "Reading the job description and your profile…",
  "Comparing your experience to what the role requires…",
  "Building your six-week roadmap…",
];

export function V3Flow() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<V3Session>(createEmptyV3Session);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readV3Session();
    if (saved) setSession(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !session.analysis && session.step !== "connect") {
      setSession((prev) => {
        const next = { ...prev, step: "connect" as const };
        writeV3Session(next);
        return next;
      });
    }
  }, [hydrated, session.analysis, session.step]);

  const persist = useCallback((next: V3Session) => {
    setSession(next);
    writeV3Session(next);
  }, []);

  const goTo = useCallback(
    (step: V3StepId) => persist({ ...session, step }),
    [persist, session],
  );

  const handleBack = useCallback(() => {
    const prev = getV3PrevStep(session.step);
    if (prev) goTo(prev);
  }, [goTo, session.step]);

  const handleNext = useCallback(() => {
    const next = getV3NextStep(session.step);
    if (next) goTo(next);
  }, [goTo, session.step]);

  const handleAnalyze = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[0] ?? null);

    const interval = window.setInterval(() => {
      setLoadingMessage((current) => {
        const index = LOADING_MESSAGES.indexOf(current ?? "");
        const next = LOADING_MESSAGES[index + 1];
        return next ?? current;
      });
    }, 2800);

    try {
      const response = await fetch("/api/v3/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobUrl: session.inputs.jobUrl,
          linkedInUrl: session.inputs.linkedInUrl,
        }),
      });

      const data = (await response.json()) as { analysis?: V3Analysis; error?: string };

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
      window.clearInterval(interval);
      setIsLoading(false);
      setLoadingMessage(null);
    }
  }, [persist, session]);

  const handleUseSample = useCallback(() => {
    persist({
      step: "skill-gaps",
      inputs: { ...V3_SAMPLE_INPUTS },
      analysis: personalizeSampleAnalysis(V3_SAMPLE_ANALYSIS.candidate.name),
      usedSample: true,
    });
    setError(null);
  }, [persist]);

  const handleRestart = useCallback(() => {
    clearV3Session();
    setSession(createEmptyV3Session());
    setError(null);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--v3-muted)]">
        Loading…
      </div>
    );
  }

  if (!session.analysis && session.step !== "connect") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-[var(--v3-muted)]">
        Loading…
      </div>
    );
  }

  switch (session.step) {
    case "connect":
      return (
        <V3ConnectStep
          inputs={session.inputs}
          onInputsChange={(inputs) => persist({ ...session, inputs })}
          onAnalyze={handleAnalyze}
          onUseSample={handleUseSample}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          error={error}
        />
      );
    case "skill-gaps":
      return session.analysis ? (
        <V3SkillGapsStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "journey":
      return session.analysis ? (
        <V3JourneyStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "pod":
      return session.analysis ? (
        <V3PodStep analysis={session.analysis} onBack={handleBack} onNext={handleNext} />
      ) : null;
    case "mentor":
      return session.analysis ? (
        <V3MentorStep analysis={session.analysis} onBack={handleBack} onRestart={handleRestart} />
      ) : null;
    default:
      return null;
  }
}
