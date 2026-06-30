"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { IntakeUnlockRoadmapPanel } from "@/app/components/IntakeUnlockRoadmapPanel";
import {
  buildGapEmailSummary,
  submitRoadmapUnlock,
} from "@/lib/intake-unlock-roadmap";
import {
  readIntakeSession,
  writeIntakeSession,
  type IntakeWizardSession,
} from "@/lib/intake-session";
import { writeStayRelevantContact } from "@/lib/stay-relevant-contact";

/** @deprecated Unlock roadmap is inline in /intake — this component redirects there. */
export function IntakeUnlockRoadmap() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gapSummary = useMemo(
    () => (session ? buildGapEmailSummary(session) : ""),
    [session],
  );

  const roleLabel = session?.ccAgent.vettingResult?.inferredRoleLabel ?? "your target role";

  useEffect(() => {
    const stored = readIntakeSession();
    setSession(stored);
    setEmail(stored.contact.email.trim());
    setHasHydrated(true);

    if (!stored.ccAgent.vettingResult) {
      router.replace("/intake");
      return;
    }

    if (stored.ccAgent.roadmapUnlocked && stored.contact.email.trim()) {
      if (stored.collaborativePlan?.planCompletedAt) {
        router.replace("/intake/roadmap");
      } else {
        router.replace("/intake/plan-together");
      }
      return;
    }

    router.replace("/intake");
  }, [router]);

  async function handleSubmit() {
    if (!session) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!contactConsent) {
      setError("Please agree to be contacted about your roadmap and cohort.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await submitRoadmapUnlock(
        { ...session, contact: { ...session.contact, email: trimmedEmail } },
        trimmedEmail,
      );

      writeStayRelevantContact({
        email: trimmedEmail,
        name: session.contact.name.trim() || undefined,
      });

      const updated: IntakeWizardSession = {
        ...session,
        contact: { ...session.contact, email: trimmedEmail },
        ccAgent: { ...session.ccAgent, roadmapUnlocked: true },
      };
      writeIntakeSession(updated);
      router.push("/intake/plan-together");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your email.");
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

  return (
    <IntakeUnlockRoadmapPanel
      email={email}
      onEmailChange={setEmail}
      contactConsent={contactConsent}
      onContactConsentChange={setContactConsent}
      roleLabel={roleLabel}
      gapSummary={gapSummary}
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={() => void handleSubmit()}
    />
  );
}
