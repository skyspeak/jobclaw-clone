import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PairingFlow } from "@/app/components/PairingFlow";
import { ProjectSprintNav } from "@/app/components/ProjectSprintNav";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { PROJECT_SPRINT_SLUGS, getProjectSprintBySlug, type ProjectSprintSlug } from "@/lib/ai-tracks-data";

export const metadata: Metadata = {
  title: `Sprint cohort matching — ${BRAND_NAME}`,
  description:
    "Get matched with 2–4 job seekers on your Marketing, Sales, or FDE project sprint track.",
};

type PairingPageProps = {
  searchParams: Promise<{ track?: string }>;
};

function PairingContent({ track }: { track?: string }) {
  return <PairingFlow initialTrack={track ?? null} />;
}

export default async function PairingPage({ searchParams }: PairingPageProps) {
  const { track: trackSlug } = await searchParams;
  const sprint =
    trackSlug && PROJECT_SPRINT_SLUGS.includes(trackSlug as ProjectSprintSlug)
      ? getProjectSprintBySlug(trackSlug)
      : undefined;

  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {sprint && trackSlug ? (
          <ProjectSprintNav
            sprintSlug={trackSlug as ProjectSprintSlug}
            sprintTitle={sprint.title}
          />
        ) : (
          <Button variant="ghost" asChild className="w-fit rounded-2xl">
            <Link href="/">Home</Link>
          </Button>
        )}
      </div>

      <Suspense
        fallback={
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground" aria-live="polite">
            Loading cohort matcher…
          </p>
        }
      >
        <PairingContent track={trackSlug} />
      </Suspense>
    </main>
  );
}
