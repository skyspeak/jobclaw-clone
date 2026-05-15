import Link from "next/link";

import { MatchedInternshipsClient } from "@/app/matched-internships/MatchedInternshipsClient";
import { Button } from "@/components/ui/button";

export default function MatchedInternshipsPage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav aria-label="Main links" className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link
          className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline sm:text-base"
          href="/"
        >
          JobClaw
        </Link>
        <Button asChild variant="outline" size="sm" className="rounded-2xl">
          <Link href="/project-sprints">Project sprints</Link>
        </Button>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-2 sm:px-8">
        <header className="mb-10 max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Matching agent
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Internships we surfaced for you
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Roles pulled from live web postings that match your career brief. Each card links straight to the indexed
            application or job page. When feeds are quiet, use{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/project-sprints">
              project sprints
            </Link>{" "}
            to keep momentum.
          </p>
        </header>

        <MatchedInternshipsClient />

        <footer className="mt-14 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Listings refresh when your brief updates.{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/intake">
              Re-run intake
            </Link>{" "}
            or explore{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/micro-internships">
              structured micro-internship sprints
            </Link>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}
