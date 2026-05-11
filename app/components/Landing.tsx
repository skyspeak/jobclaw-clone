"use client";

import Link from "next/link";
import { Activity, ArrowRight, FileText, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Landing() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background p-5 sm:bg-transparent sm:p-12 brand-bg">
      <nav
        aria-label="Main links"
        className="fixed left-0 right-0 top-4 z-20 flex justify-center px-4 sm:relative sm:top-0 sm:mb-[-2rem]"
      >
        <div className="flex w-full max-w-xl justify-center rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur-md sm:bg-transparent">
          <Link className="text-foreground underline-offset-4 hover:underline" href="/">
            JobClaw
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-4 py-16 text-center sm:space-y-8 sm:px-2 sm:py-16">
        <div className="relative">
          <div className="absolute inset-0 scale-110 rounded-3xl bg-primary/40 blur-2xl" aria-hidden />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg sm:h-24 sm:w-24">
            <Activity className="size-10 text-primary-foreground sm:size-12" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Find work
            <br />
            that fits you.
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Answer five short questions. Get a structured career brief that helps you find work
            you&apos;ll genuinely love.
          </p>
        </div>

        <div className="w-full pt-2">
          <Button
            asChild
            size="lg"
            className="cta-glow group h-14 w-full rounded-2xl border-0 bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 sm:h-16 sm:text-lg [&_svg]:size-5"
          >
            <Link href="/intake">
              Get Started
              <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid w-full grid-cols-3 gap-2 pt-4 sm:gap-3">
          <FeatureCard icon={<Sparkles className="size-5 text-primary" />} label="Reflective" />
          <FeatureCard icon={<Search className="size-5 text-primary" />} label="AI-Powered" />
          <FeatureCard icon={<FileText className="size-5 text-primary" />} label="Shareable" />
        </div>

        <div className="mt-12 w-full border-t border-border/50 pt-8 text-left">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Explore more
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <ExploreLink href="/ai-adoption" label="Ramp AI adoption chart" />
            <ExploreLink href="/matched-internships" label="Agent-matched internships" />
            <ExploreLink href="/project-sprints" label="Project sprints (no fits yet)" />
            <ExploreLink href="/micro-internships" label="Micro-internships" />
            <ExploreLink href="/quiz" label="AI readiness quiz" />
            <ExploreLink href="/crossword" label="AI competence crossword" />
            <ExploreLink href="/tailor-resume" label="Resume tailor" />
          </div>
        </div>
      </div>

      <footer className="absolute bottom-5 px-4 text-center text-xs font-medium text-muted-foreground/80 sm:bottom-8 sm:text-sm">
        Free, forever. Built by New Work Foundation.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-1 border-border/60 py-3 shadow-sm sm:gap-2 sm:py-4">
      {icon}
      <span className="text-[11px] font-medium text-foreground sm:text-xs">{label}</span>
    </Card>
  );
}

function ExploreLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="outline" asChild size="sm" className="h-auto justify-start whitespace-normal rounded-xl py-3">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
