"use client";

import { Moon, Sun } from "lucide-react";

import { useLeadGenTheme } from "@/app/components/lead-gen/LeadGenThemeProvider";
import type { LeadGenTheme } from "@/lib/lead-gen-theme";

export function LeadGenThemeToggle() {
  const { theme, setTheme } = useLeadGenTheme();

  return (
    <div
      className="inline-flex rounded-xl border border-[var(--lg-border)] p-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
      role="group"
      aria-label="Color theme"
    >
      {(["dark", "light"] as LeadGenTheme[]).map((option) => {
        const active = theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            className={[
              "inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 transition",
              active
                ? "bg-[var(--lg-accent)] text-[var(--lg-accent-fg)]"
                : "text-[var(--lg-muted)] hover:text-[var(--lg-fg)]",
            ].join(" ")}
            aria-pressed={active}
          >
            {option === "dark" ? (
              <Moon className="size-3" aria-hidden />
            ) : (
              <Sun className="size-3" aria-hidden />
            )}
            {option}
          </button>
        );
      })}
    </div>
  );
}
