import Link from "next/link";

import { SprintRoadmapCanvas } from "@/app/components/SprintRoadmapCanvas";
import { TrackCommitButton } from "@/app/components/TrackCommitButton";
import { Button } from "@/components/ui/button";
import {
  getSprintTrackForRoadmap,
  projectSprintPath,
  sprintRoadmapPath,
  type SprintRoadmapData,
} from "@/lib/sprint-roadmap-data";
import { BRAND_NAME } from "@/lib/brand";
import { PROJECT_SPRINT_SLUGS } from "@/lib/ai-tracks-data";

type SprintRoadmapViewProps = {
  roadmap: SprintRoadmapData;
};

export function SprintRoadmapView({ roadmap }: SprintRoadmapViewProps) {
  const track = getSprintTrackForRoadmap(roadmap.slug);

  return (
    <main className="relative min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="pointer-events-auto flex w-full max-w-6xl justify-end">
          {track ? <TrackCommitButton trackId={track.id} /> : null}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-24">
        <nav className="flex flex-wrap gap-3" aria-label="Roadmap navigation">
          <Button variant="outline" asChild className="rounded-2xl">
            <Link href="/sprint-roadmaps">All roadmaps</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-2xl">
            <Link href={projectSprintPath(roadmap.slug)}>Written sprint guide</Link>
          </Button>
          <Button variant="ghost" asChild className="rounded-2xl">
            <Link href="/">Home</Link>
          </Button>
        </nav>

        <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {BRAND_NAME} · Sprint roadmap
          </p>
          <p className="mb-2 inline-flex rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
            Sprint {roadmap.number}
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
            {roadmap.title}
          </h1>
          <p className="mt-2 text-lg italic text-muted-foreground">{roadmap.subtitle}</p>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground sm:text-base">
            <span className="font-semibold text-primary">The promise.</span> {roadmap.promise}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            <span className="font-semibold text-foreground">Skin in the game:</span> {roadmap.skinInTheGame}
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            14-day path
          </h2>
          <SprintRoadmapCanvas roadmap={roadmap} />
        </section>

        {track ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI-native tool stack
              </h2>
              <ul className="mt-4 space-y-3">
                {track.tools.map((tool) => (
                  <li key={tool.name} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{tool.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Outcomes you can claim
              </h2>
              <blockquote className="mt-4 border-l-4 border-primary bg-primary/5 px-5 py-4 text-sm font-medium leading-relaxed text-foreground sm:text-base">
                &ldquo;{track.outcomes}&rdquo;
              </blockquote>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Other sprint roadmaps
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {PROJECT_SPRINT_SLUGS.filter((slug) => slug !== roadmap.slug).map((slug) => (
              <Button key={slug} variant="outline" asChild className="rounded-2xl">
                <Link href={sprintRoadmapPath(slug)}>
                  {slug === "forward-deployed-engineer" ? "Forward Deployed Engineer" : slug.charAt(0).toUpperCase() + slug.slice(1)}
                </Link>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
