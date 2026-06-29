"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { IntakeGetHiredConfirmationSplash } from "@/app/components/IntakeGetHiredConfirmationSplash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { splitGapParametersToBars } from "@/lib/profile-gaps";
import {
  readIntakeSession,
  writeIntakeSession,
  type IntakeWizardSession,
} from "@/lib/intake-session";
import { writeStayRelevantContact } from "@/lib/stay-relevant-contact";
import { cn } from "@/lib/utils";

function buildGapEmailSummary(session: IntakeWizardSession): string {
  const parameters = session.ccAgent.vettingResult?.gapParameters ?? [];
  const { gaps } = splitGapParametersToBars(parameters);
  if (gaps.length === 0) {
    return session.ccAgent.vettingResult?.inferredRoleLabel ?? "your target role";
  }
  return gaps.map((item) => item.label).join(", ");
}

export function IntakeGetHiredSignup() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stayRelevantOk, setStayRelevantOk] = useState<boolean | null>(null);

  const gapLabels = useMemo(() => {
    if (!session) return [];
    const parameters = session.ccAgent.vettingResult?.gapParameters ?? [];
    const { gaps } = splitGapParametersToBars(parameters);
    return gaps.map((item) => item.label).slice(0, 10);
  }, [session]);

  useEffect(() => {
    const stored = readIntakeSession();
    setSession(stored);
    setEmail(stored.contact.email.trim());
    setPhone(stored.contact.phone.trim());
    setHasHydrated(true);
  }, []);

  const gapSummary = useMemo(
    () => (session ? buildGapEmailSummary(session) : ""),
    [session],
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!session?.ccAgent.vettingResult) {
      router.replace("/intake");
    }
  }, [hasHydrated, router, session]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!session) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedPhone.replace(/\D/g, "").length < 10) {
      setError("Enter a phone number we can reach you at.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!contactConsent) {
      setError("Please agree to be contacted by phone and email.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.contact.name.trim() || "Stay Relevant signup",
          email: trimmedEmail,
          phone: trimmedPhone,
          role_type: "both",
          linkedin: session.linkedInUrl.trim() || null,
          industries: gapSummary.slice(0, 500) || null,
          referral: "stay-relevant-weekly-gaps",
          role: session.ccAgent.vettingResult?.inferredRoleLabel ?? null,
          focusAreas: gapLabels,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          newsletterConsent: contactConsent,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        stayRelevant?: { ok: boolean };
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save your signup.");
      }

      writeStayRelevantContact({
        email: trimmedEmail,
        phone: trimmedPhone,
        name: session.contact.name.trim() || undefined,
      });

      const updated: IntakeWizardSession = {
        ...session,
        contact: {
          ...session.contact,
          email: trimmedEmail,
          phone: trimmedPhone,
        },
      };
      writeIntakeSession(updated);
      setSession(updated);
      setStayRelevantOk(payload.stayRelevant?.ok ?? null);
      setIsComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your signup.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !session?.ccAgent.vettingResult) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading…
      </p>
    );
  }

  const phoneDigits = phone.trim().replace(/\D/g, "");
  const hasValidPhone = phoneDigits.length >= 10;
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = hasValidPhone && hasValidEmail && contactConsent;

  if (isComplete) {
    return <IntakeGetHiredConfirmationSplash stayRelevantOk={stayRelevantOk} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
      <section className="space-y-3 sm:space-y-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          DearCC helps you get hired
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Curated and tailored help to land your dream job
        </p>
        {gapSummary ? (
          <p className="text-xs leading-relaxed text-muted-foreground/80 sm:text-sm">
            Plus{" "}
            <span className="font-medium text-foreground">StayRelevant</span> — a weekly AI
            newsletter tuned to{" "}
            <span className="font-medium text-foreground">{gapSummary}</span> (~15 min, Sundays).
          </p>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground/80 sm:text-sm">
            Plus{" "}
            <span className="font-medium text-foreground">StayRelevant</span> — a weekly AI
            newsletter personalized to your role (~15 min, Sundays).
          </p>
        )}
      </section>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-6 flex min-h-0 flex-1 flex-col sm:mt-8"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="get-hired-phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="get-hired-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(555) 555-5555"
              disabled={isSubmitting}
              required
              aria-required="true"
              className="h-12 rounded-xl text-base sm:h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="get-hired-email">Email</Label>
            <Input
              id="get-hired-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              disabled={isSubmitting}
              required
              className="h-12 rounded-xl text-base sm:h-11"
            />
          </div>

          <label
            htmlFor="get-hired-contact-consent"
            className="flex min-h-11 touch-manipulation cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card/60 p-3.5"
          >
            <input
              id="get-hired-contact-consent"
              type="checkbox"
              checked={contactConsent}
              onChange={(event) => setContactConsent(event.target.checked)}
              disabled={isSubmitting}
              required
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              I agree DearCC may contact me by phone and email about job search help, and to
              receive <span className="font-medium text-foreground">StayRelevant</span> — a weekly
              AI newsletter personalized to my role (~15 min, Sundays). Unsubscribe anytime. See our{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                privacy &amp; consent policy
              </Link>
              .
            </span>
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className={cn(
            "mt-auto space-y-4 pt-6",
            "sticky bottom-0 -mx-3 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-3 pb-[max(0px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pb-0 sm:backdrop-blur-none",
          )}
        >
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="cta-glow h-12 min-h-12 w-full touch-manipulation rounded-2xl text-base font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                Sign me up <ArrowRight className="ml-1.5 size-4" />
              </>
            )}
          </Button>

          <Button
            asChild
            variant="ghost"
            className="min-h-11 w-full touch-manipulation rounded-xl text-muted-foreground"
          >
            <Link href="/intake">← Back to your analysis</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
