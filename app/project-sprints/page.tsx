import Link from "next/link";

import { ProjectSprintsClient } from "@/app/project-sprints/ProjectSprintsClient";
import { Button } from "@/components/ui/button";

export default function ProjectSprintsPage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav aria-label="Main links" className="mx-auto flex w-full max-w-[960px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
        <Link
          className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline sm:text-base"
          href="/"
        >
          JobClaw
        </Link>
        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-sm">
          <Link className="text-foreground underline-offset-4 hover:underline" href="/intake">
            Intake
          </Link>
          <Link className="text-foreground underline-offset-4 hover:underline" href="/matched-internships">
            Internships
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-10 px-4 pb-28 pt-2 sm:px-8 md:gap-14">
        <header className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            When searches feel empty
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.25rem] md:text-[2.65rem]">
            AI-forward project sprints, two weeks at a time
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            Earn proof while recruiters catch up—each fortnight mixes AI leverage with sharp human judgment,
            culminating in synchronous office-hours feedback so you rehearse narration, safeguards, and rewrites—not just
            deliverables.
          </p>
        </header>

        <ProjectSprintsClient />

        <div className="flex flex-col gap-3 border-t border-border/60 pt-10 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="outline" disabled className="rounded-2xl opacity-80">
            Office hours RSVP (ship soon)
          </Button>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/matched-internships">Aligned internships</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
