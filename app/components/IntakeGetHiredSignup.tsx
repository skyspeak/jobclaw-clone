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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

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
        }),
      });

      const payload = (await response.json()) as { error?: string };

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

  if (isComplete) {
    return <IntakeGetHiredConfirmationSplash />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="space-y-3 sm:space-y-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          DearCC helps you get hired
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Curated and tailored help to land your dream job
        </p>
      </section>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-6 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="get-hired-email">Email</Label>
            <Input
              id="get-hired-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.edu"
              disabled={isSubmitting}
              required
              className="h-12 rounded-xl text-base sm:h-11"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || !hasValidPhone || !hasValidEmail}
          className={cn(
            "cta-glow h-12 min-h-12 w-full touch-manipulation rounded-2xl text-base font-semibold sm:w-auto sm:px-8",
          )}
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
      </form>

      <Button
        asChild
        variant="ghost"
        className="min-h-11 touch-manipulation rounded-xl px-0 text-muted-foreground"
      >
        <Link href="/intake">← Back to your analysis</Link>
      </Button>
    </div>
  );
}
