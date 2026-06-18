import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  SPRINT_ROADMAPS,
  SPRINT_ROADMAPS_INTRO,
  sprintRoadmapPath,
} from "@/lib/sprint-roadmap-data";
import type { ProjectSprintSlug } from "@/lib/ai-tracks-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${SPRINT_ROADMAPS_INTRO.title} — ${BRAND_NAME}`,
  description:
    "Visual day-by-day roadmaps for Sales, Marketing, and Forward Deployed Engineer two-week project sprints.",
};

export default function SprintRoadmapsHubPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-24">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/project-sprints">Written sprint guides</Link>
        </Button>

        <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {BRAND_NAME} · Sprint roadmaps
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
            {SPRINT_ROADMAPS_INTRO.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
            {SPRINT_ROADMAPS_INTRO.lead}
          </p>
          <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
            {SPRINT_ROADMAPS_INTRO.throughline}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {SPRINT_ROADMAPS_INTRO.hint}
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Role-based roadmaps
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SPRINT_ROADMAPS.map((roadmap) => {
              const slug = roadmap.slug as ProjectSprintSlug;
              return (
                <Link
                  key={roadmap.slug}
                  href={sprintRoadmapPath(slug)}
                  className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-8"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sprint {roadmap.number}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground group-hover:text-primary">
                    {roadmap.title}
                  </h3>
                  <p className="mt-2 text-sm italic text-muted-foreground">{roadmap.subtitle}</p>
                  <p className="mt-4 text-sm font-medium text-primary">View roadmap →</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-border/70 bg-muted/30 p-6 text-center sm:p-8">
          <p className="text-sm text-muted-foreground">
            Prefer the full written guide with deliverable tables and tool stack details?
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-2xl">
            <Link href="/project-sprints">Open project sprints</Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
