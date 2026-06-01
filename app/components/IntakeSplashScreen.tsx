"use client";

import { useEffect } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type IntakeSplashScreenProps = {
  onStart: () => void;
};

export function IntakeSplashScreen({ onStart }: IntakeSplashScreenProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter") {
        event.preventDefault();
        onStart();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onStart]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center brand-bg px-5 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 rounded-3xl border border-border/70 bg-card p-8 shadow-md duration-700 sm:p-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Before you begin
        </p>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          In less than 2 minutes, JobClaw will find opportunities that are the best fit for you.
          And if there aren&apos;t any yet - JobClaw will help you build your skills so you are
          ready for the next opportunity.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground sm:text-base">
          You&apos;ll answer a short quiz, then we&apos;ll personalize your search and next steps.
        </p>
        <div className="mt-7 flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-muted-foreground sm:mr-auto">Press Enter to start</p>
          <Button
            type="button"
            className="cta-glow h-12 rounded-2xl bg-primary px-7 font-semibold text-primary-foreground hover:bg-primary/90"
            data-testid="button-start-quiz"
            onClick={onStart}
          >
            Start quiz <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
