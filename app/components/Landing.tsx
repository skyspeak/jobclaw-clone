"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LeadGenThemeToggle } from "@/app/components/lead-gen/LeadGenThemeToggle";
import { BRAND_NAME } from "@/lib/brand";

export function Landing() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--lg-bg)] text-[var(--lg-fg)]">
      <header className="flex items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--lg-fg)] underline-offset-4 hover:underline sm:text-sm"
        >
          {BRAND_NAME}
        </Link>
        <LeadGenThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-24 sm:px-6">
        <div className="mx-auto flex w-full max-w-[480px] flex-col items-center text-center">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            Human advice
            <br />
            for the AI age.
          </h1>

          <p className="mx-auto mt-6 max-w-[36rem] text-base leading-relaxed text-[var(--lg-muted)] sm:mt-8 sm:text-lg sm:leading-relaxed md:text-xl">
            You aren&apos;t alone. AI is reshaping the job market and decimating entry-level jobs. dear [CC] is
            an insider&apos;s take from Clara Shih — aka CC — and other AI leaders on how to adapt, stand out,
            and make AI work for you — no matter what role you&apos;re in.
          </p>

          <Link
            href="/intake"
            className="group mt-9 inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--lg-border)] bg-[var(--lg-accent)] px-6 py-3.5 text-sm font-medium text-[var(--lg-accent-fg)] transition hover:opacity-90 sm:mt-10"
          >
            Start the survey
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-[var(--lg-muted)] sm:pb-8 sm:text-sm">
        Free, forever. Built by New Work Foundation.
      </footer>
    </div>
  );
}
