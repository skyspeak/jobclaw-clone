"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SprintTrackSection } from "@/app/components/SprintTrackSection";
import { Button } from "@/components/ui/button";
import {
  buildSprintContext,
  defaultSprintContext,
  readSprintSession,
  type SprintContext,
} from "@/lib/intake-sprints";

type ClientState =
  | { ready: false }
  | {
      ready: true;
      fromIntakeSession: boolean;
      context: SprintContext;
    };

export function ProjectSprintsClient() {
  const [state, setState] = useState<ClientState>({ ready: false });

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readSprintSession();
      if (!stored) {
        setState({ ready: true, fromIntakeSession: false, context: defaultSprintContext() });
        return;
      }

      setState({
        ready: true,
        fromIntakeSession: true,
        context: buildSprintContext(stored.searchRequest, stored.answers, {
          preferVolunteerRoles: stored.preferVolunteerRoles,
        }),
      });
    });
  }, []);

  if (!state.ready) {
    return (
      <div className="rounded-3xl border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground md:text-[0.9375rem]">
        Loading sprint tracks…
      </div>
    );
  }

  const { fromIntakeSession, context } = state;

  return (
    <div className="space-y-8">
      {fromIntakeSession ? (
        <div className="rounded-2xl border border-border/70 bg-primary/10 p-6 text-sm leading-relaxed text-foreground md:p-8 md:text-[0.9375rem]">
          <p className="font-semibold">Personalized from your intake (this browser).</p>
          <p className="mt-2 text-muted-foreground">
            Saved when Serper surfaced no live postings on your brief, or whenever you reopened this page during the same
            session afterward.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground md:p-7 md:text-[0.9375rem]">
          <p className="font-semibold text-foreground">Starter sprint stack</p>
          <p className="mt-2">
            Default sequence until we know your quiz answers. Finish the intake—when zero web listings return, JobClaw
            drops tailored sprint prompts here automatically.
          </p>
          <Button asChild className="mt-6 rounded-2xl cta-glow">
            <Link href="/intake">Start or refresh intake</Link>
          </Button>
        </div>
      )}

      <SprintTrackSection
        context={context}
        intro="One matched two-week cohort sprint, picked from a curated set to fit your inferred space, strengths, motivations, and forward signals. AI-forward rituals stay constant—the copy below is tailored to you."
      />
    </div>
  );
}
