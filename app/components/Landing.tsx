"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, MessageCircle, Target } from "lucide-react";

import { HumanHandoffVisual } from "@/app/components/HumanHandoffVisual";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden brand-bg selection:bg-primary selection:text-primary-foreground">
      <nav
        aria-label="Main links"
        className="fixed left-0 right-0 top-0 z-20 flex justify-center border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur-md sm:static sm:border-b-0 sm:bg-transparent sm:py-8 sm:backdrop-blur-none"
      >
        <div className="flex w-full max-w-3xl items-center justify-between text-xs font-semibold text-muted-foreground sm:text-sm">
          <Link className="tracking-wide text-foreground underline-offset-4 hover:underline" href="/">
            {BRAND_NAME}
          </Link>
          <span className="hidden uppercase tracking-wide sm:inline">For new graduates</span>
        </div>
      </nav>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center pt-20 sm:pt-24" aria-hidden>
        <div className="h-1 w-28 rounded-full bg-primary/25 sm:w-36" />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 sm:px-6 sm:pb-32 sm:pt-10 md:px-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:mb-6 sm:text-sm">
            {BRAND_TAGLINE}
          </p>

          <HumanHandoffVisual className="mb-8 sm:mb-10" />

          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
            Human insight
            <br />
            for your first chapter.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base sm:leading-relaxed">
            The strongest internships, referrals, and offers start with understanding roles and
            people—not blasting the same résumé everywhere.
            <br />
            Take five minutes and shape a brief that actually moves conversations forward.
          </p>

          <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="cta-glow group h-12 rounded-full border-0 px-8 text-base font-semibold sm:h-12 sm:min-w-[200px] [&_svg]:size-4"
            >
              <Link href="/intake">
                Start your brief
                <ArrowRight className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-border/70 bg-card px-8 text-base font-semibold text-foreground hover:bg-primary/5 sm:h-12 sm:min-w-[200px]"
            >
              <Link href="/matched-internships">Matched internships</Link>
            </Button>
          </div>

          <div className="mt-14 grid w-full gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
            <Pillar
              icon={<Target className="size-5 text-primary" strokeWidth={1.75} />}
              title="Signal over volume"
              body="A clear story beats a stack of generic applications."
            />
            <Pillar
              icon={<MessageCircle className="size-5 text-primary" strokeWidth={1.75} />}
              title="People, not templates"
              body="Practice how you introduce yourself and ask for help."
            />
            <Pillar
              icon={<GraduationCap className="size-5 text-primary" strokeWidth={1.75} />}
              title="Proof you can share"
              body="Walk away with something mentors and managers can use."
            />
          </div>
        </div>
      </main>

      <footer className="absolute bottom-5 px-4 text-center text-xs font-medium text-muted-foreground/90 sm:bottom-8 sm:text-sm">
        Free, forever. Built by New Work Foundation.
      </footer>
    </div>
  );
}

function Pillar({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground sm:text-sm">{body}</p>
    </div>
  );
}
