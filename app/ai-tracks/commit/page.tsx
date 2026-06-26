import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TrackCommitClient } from "@/app/ai-tracks/commit/TrackCommitClient";
import { ProjectSprintNav } from "@/app/components/ProjectSprintNav";
import { getTrackById } from "@/lib/ai-tracks-commit";
import { PROJECT_SPRINT_SLUGS, type ProjectSprintSlug } from "@/lib/ai-tracks-data";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Commit to your AI track — dear[CC]",
  description: "Confirm your two-week AI track commitment.",
};

type CommitPageProps = {
  searchParams: Promise<{ track?: string }>;
};

function sprintNavForTrack(trackId: string | undefined) {
  const track = trackId ? getTrackById(trackId) : undefined;
  if (!track) {
    return null;
  }
  const slug = track.slug ?? track.id;
  if (!PROJECT_SPRINT_SLUGS.includes(slug as ProjectSprintSlug)) {
    return null;
  }
  return { slug: slug as ProjectSprintSlug, title: track.title };
}

async function CommitContent({ searchParams }: CommitPageProps) {
  const { track: trackId } = await searchParams;
  const track = trackId ? getTrackById(trackId) : undefined;

  if (!track) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground">Pick a track first</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Open the tracks guide and choose which two-week build you want to commit to.
        </p>
        <Button asChild className="mt-6 rounded-2xl cta-glow">
          <Link href="/ai-tracks">Browse AI tracks</Link>
        </Button>
      </div>
    );
  }

  return <TrackCommitClient track={track} />;
}

export default async function AiTrackCommitPage({ searchParams }: CommitPageProps) {
  const params = await searchParams;
  const sprintNav = sprintNavForTrack(params.track);

  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 pb-24">
        {sprintNav ? (
          <ProjectSprintNav sprintSlug={sprintNav.slug} sprintTitle={sprintNav.title} />
        ) : (
          <Button variant="outline" asChild className="w-fit rounded-2xl">
            <Link href="/ai-tracks">← Back to tracks</Link>
          </Button>
        )}

        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            dear[CC] · Track commitment
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {sprintNav ? "Lock in your six weeks" : "Lock in your two weeks"}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Share your name, email, and phone. One click commits you to the sprint and queues you for a cohort of up to
            four on the same track.
          </p>
        </header>

        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Loading your track…
            </p>
          }
        >
          <CommitContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
