"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function IntakeAnalysisCompleteBanner({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#2D6A4F]/25 bg-gradient-to-br from-[#2D6A4F]/12 via-[#FDFBF7] to-[#D4A574]/10 px-4 py-4 sm:px-5 sm:py-5",
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[#2D6A4F]/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-4 left-8 size-16 rounded-full bg-[#D4A574]/15 blur-xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25",
            "transition-transform duration-700 ease-out",
            visible ? "scale-100" : "scale-75",
          )}
        >
          <Check className="size-5 stroke-[2.5]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-serif text-base font-semibold tracking-tight text-foreground sm:text-xl">
            Your analysis is complete
            <Sparkles
              className={cn(
                "size-4 text-[#D4A574] transition-opacity duration-1000",
                visible ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We matched your LinkedIn and job posting — here&apos;s your gap breakdown.
          </p>
        </div>
      </div>
    </div>
  );
}
