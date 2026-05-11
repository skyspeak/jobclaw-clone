import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AGENT_INTERNSHIP_LISTINGS } from "@/lib/agent-internships";

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
            These internship-style roles are produced by the JobClaw matching agent from the same signals as your career
            brief—skills, strengths, and constraints—not generic keyword spam. When live job feeds are quiet, use this
            list alongside{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/project-sprints">
              project sprints
            </Link>{" "}
            to keep momentum.
          </p>
        </header>

        <ul className="grid list-none gap-5 p-0 md:grid-cols-2">
          {AGENT_INTERNSHIP_LISTINGS.map((listing) => (
            <li key={listing.id}>
              <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-2 p-7 pb-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>{listing.format}</span>
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span>{listing.location}</span>
                    <span aria-hidden className="text-border">
                      ·
                    </span>
                    <span>{listing.durationWeeks} wk</span>
                  </div>
                  <CardTitle className="text-xl leading-snug tracking-tight">{listing.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-foreground/90">{listing.organization}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-7 pb-7 pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">{listing.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

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
