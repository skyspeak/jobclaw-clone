"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IntakeUnlockRoadmapPanelProps = {
  email: string;
  onEmailChange: (value: string) => void;
  contactConsent: boolean;
  onContactConsentChange: (value: boolean) => void;
  roleLabel: string;
  gapSummary?: string;
  error?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  compact?: boolean;
  /** Show unlock button after consent instead of auto-submitting on checkbox. */
  inline?: boolean;
};

export function IntakeUnlockRoadmapPanel({
  email,
  onEmailChange,
  contactConsent,
  onContactConsentChange,
  roleLabel,
  gapSummary,
  error,
  isSubmitting,
  onSubmit,
  compact = false,
  inline = false,
}: IntakeUnlockRoadmapPanelProps) {
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canUnlock = hasValidEmail && contactConsent && !isSubmitting;

  function handleConsentChange(checked: boolean) {
    onContactConsentChange(checked);
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2.5")}>
      {!compact && !inline ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Your roadmap is built for {roleLabel}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Enter your email and we&apos;ll unlock your 6-week plan.
          </p>
          {gapSummary ? (
            <p className="text-xs text-muted-foreground">
              Focus areas: <span className="font-medium text-foreground">{gapSummary}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <Input
        id="unlock-roadmap-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@gmail.com"
        disabled={isSubmitting}
        required
        aria-required="true"
        aria-label="Email address"
        className="h-11 rounded-full border-border/70 bg-muted/30 px-4 text-base sm:text-sm"
        data-testid="input-unlock-roadmap-email"
      />

      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors",
          isSubmitting && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="checkbox"
          checked={contactConsent}
          onChange={(event) => handleConsentChange(event.target.checked)}
          disabled={isSubmitting || !hasValidEmail}
          className="mt-0.5 size-4 shrink-0 rounded border-border"
          data-testid="checkbox-unlock-roadmap-consent"
        />
        <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          I agree to the{" "}
          <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2">
            terms and conditions
          </Link>{" "}
          and to be contacted by dear[CC] about my roadmap.
        </span>
      </label>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canUnlock}
        className={cn(
          "cta-glow h-12 min-h-12 w-full touch-manipulation rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90",
          !canUnlock && "opacity-70",
        )}
        data-testid="button-unlock-roadmap"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Unlocking…
          </>
        ) : (
          <>
            Unlock my 6 week personalized program to get hired
            <ArrowRight className="ml-1.5 size-4 shrink-0" />
          </>
        )}
      </Button>

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
