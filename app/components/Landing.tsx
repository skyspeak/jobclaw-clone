"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BRAND_NAME } from "@/lib/brand";
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
        </div>
      </nav>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-24 sm:px-6 sm:pb-32 sm:pt-10 md:px-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
            Human advice
            <br />
            for the AI age.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:mt-8 sm:text-base sm:leading-relaxed">
            You aren&apos;t alone. AI is reshaping the job market and decimating entry-level jobs. dear [CC] is
            an insider&apos;s take from Clara Shih — aka CC — and other AI leaders on how to adapt, stand out,
            and make AI work for you — no matter what role you&apos;re in.
          </p>

          <div className="mt-9 sm:mt-10">
            <Button
              asChild
              size="lg"
              className="cta-glow group h-12 rounded-full border-0 px-8 text-base font-semibold sm:h-12 sm:min-w-[220px] [&_svg]:size-4"
            >
              <Link href="/intake">
                Start the survey
                <ArrowRight className="ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-5 px-4 text-center text-xs font-medium text-muted-foreground/90 sm:bottom-8 sm:text-sm">
        Free, forever. Built by New Work Foundation.
      </footer>
    </div>
  );
}
