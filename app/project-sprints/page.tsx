import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectSprintsPage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav aria-label="Main links" className="mx-auto flex w-full max-w-3xl px-6 py-6">
        <Link
          className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline sm:text-base"
          href="/"
        >
          JobClaw
        </Link>
      </nav>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-24 pt-4 sm:px-8">
        <header className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            When search results are thin
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.65rem]">
            We can help you with project sprints—there aren&apos;t any fits right now.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Sometimes the open web doesn&apos;t surface the right role on day one. Instead of stalling, run a focused
            two-week sprint with a clear problem, real deliverables, and sponsors who care about evidence—not vibes. You
            still build proof for your resume while the job market catches up.
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-3 p-8 sm:p-10">
            <CardTitle className="text-xl tracking-tight sm:text-2xl">What a sprint gives you</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              A time-boxed mission (often two weeks), three sponsor roles for guidance—domain, operator, and AI
              practice—and a stakeholder playback at the end so you leave with artifacts, not just tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8 pt-0 sm:px-10 sm:pb-10">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <li>Pick a sprint family that matches how you like to work—research memos, community insight, enablement, and more.</li>
              <li>Document what you automated versus what a human reviewed—recruiters notice judgment.</li>
              <li>Pair the sprint with the internship-style roles our matching agent is already surfacing for you.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild className="h-12 rounded-2xl cta-glow sm:min-w-[240px]">
            <Link href="/matched-internships">See internships from the match agent</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-2xl sm:min-w-[240px]">
            <Link href="/micro-internships">Browse micro-internship sprint guides</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/intake">
            Run the intake
          </Link>{" "}
          again anytime to refresh your brief—saved answers stay in this browser until you reset.
        </p>
      </div>
    </main>
  );
}
