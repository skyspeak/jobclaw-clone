import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AI_PROJECT_SPRINTS,
  AI_PROJECT_SPRINTS_INTRO,
  AI_SPRINTS_GUIDE_TITLE,
  projectSprintPath,
  type ProjectSprintSlug,
} from "@/lib/ai-tracks-data";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${AI_SPRINTS_GUIDE_TITLE} — ${BRAND_NAME}`,
  description:
    "Three two-week project sprints for Sales, Marketing, and Forward Deployed Engineer roles.",
};

export default function ProjectSprintsHubPage() {
  return (
    <main className="min-h-[100dvh] brand-bg px-4 py-6 selection:bg-primary selection:text-primary-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-24">
        <Button variant="outline" asChild className="w-fit rounded-2xl">
          <Link href="/">Back to home</Link>
        </Button>

        <header className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {BRAND_NAME} · Project sprints
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-[clamp(2.1rem,4.5vw,2.75rem)]">
            {AI_SPRINTS_GUIDE_TITLE}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
            {AI_PROJECT_SPRINTS_INTRO.lead}
          </p>
          <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground">
            {AI_PROJECT_SPRINTS_INTRO.throughline}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {AI_PROJECT_SPRINTS.map((sprint) => {
            const slug = sprint.slug as ProjectSprintSlug;
            return (
              <div
                key={sprint.id}
                className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-8"
              >
                <Link href={projectSprintPath(slug)} className="block">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sprint {sprint.number}
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground group-hover:text-primary">
                    {sprint.title}
                  </h2>
                  <p className="mt-2 text-sm italic text-muted-foreground">{sprint.subtitle}</p>
                  <p className="mt-4 text-sm font-medium text-primary">View sprint →</p>
                </Link>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
