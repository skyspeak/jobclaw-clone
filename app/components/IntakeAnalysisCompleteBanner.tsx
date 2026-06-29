"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

export function IntakeAnalysisCompleteBanner({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setVisible(true));
    const copyTimer = window.setTimeout(() => setShowCopy(true), 280);

    return () => {
      cancelAnimationFrame(enterFrame);
      window.clearTimeout(copyTimer);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#2D6A4F]/25 bg-gradient-to-br from-[#2D6A4F]/12 via-[#FDFBF7] to-[#D4A574]/10 px-4 py-4 sm:px-5 sm:py-5",
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-[#2D6A4F]/10 blur-2xl transition-opacity duration-1000",
          visible ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-4 left-8 size-16 rounded-full bg-[#D4A574]/15 blur-xl transition-opacity duration-1000 delay-150",
          visible ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2D6A4F]/35 to-transparent transition-opacity duration-700 delay-100",
          visible ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <div className="relative flex items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25",
            "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            visible ? "scale-100 rotate-0" : "scale-50 rotate-[-8deg]",
          )}
        >
          <Check
            className={cn(
              "size-5 stroke-[2.5] transition-all duration-500 delay-100",
              visible ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "mb-1.5 flex items-center gap-2 transition-all duration-500 ease-out",
              visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0",
            )}
          >
            <span
              className={cn(
                "h-px flex-1 max-w-8 bg-gradient-to-r from-transparent to-[#2D6A4F]/30 transition-all duration-700 delay-150",
                visible ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <Sparkles
              className={cn(
                "size-3.5 text-[#D4A574] transition-opacity duration-700",
                visible ? "animate-pulse opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "h-px flex-1 max-w-8 bg-gradient-to-l from-transparent to-[#2D6A4F]/30 transition-all duration-700 delay-150",
                visible ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
          </div>

          <p
            className={cn(
              "flex flex-wrap items-center gap-1.5 font-serif text-base font-semibold tracking-tight text-foreground transition-all duration-500 ease-out sm:text-xl",
              visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            )}
            style={{ transitionDelay: visible ? "120ms" : "0ms" }}
          >
            Your analysis is complete
            <Sparkles
              className={cn(
                "size-4 text-[#D4A574]",
                visible ? "motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]" : "opacity-0",
              )}
              aria-hidden
            />
          </p>
          <p
            className={cn(
              "mt-1 text-sm leading-relaxed text-muted-foreground transition-all duration-500 ease-out",
              showCopy ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            We matched your LinkedIn and job posting — here&apos;s your gap breakdown.
          </p>
        </div>
      </div>
    </div>
  );
}
