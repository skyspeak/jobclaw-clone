import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { JobFitAnalyzer } from "@/app/components/JobFitAnalyzer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Job fit — JobClaw",
  description: "Compare a job description to your skills and see if you can win the role.",
};

export default function JobFitPage() {
  return (
    <main className="min-h-[100dvh] brand-bg">
      <nav
        aria-label="Main links"
        className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8"
      >
        <Link
          className="text-sm font-bold tracking-tight text-foreground underline-offset-4 hover:underline"
          href="/"
        >
          JobClaw
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild size="sm" className="rounded-xl">
            <Link href="/intake/brief">My brief</Link>
          </Button>
          <Button variant="outline" asChild size="sm" className="rounded-xl">
            <Link href="/">Home</Link>
          </Button>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 sm:px-8">
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading job fit analyzer…</p>
          }
        >
          <JobFitAnalyzer />
        </Suspense>
      </div>
    </main>
  );
}
