"use client";

import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { PairingCohortModal } from "@/app/components/PairingCohortModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProjectSprintBySlug } from "@/lib/ai-tracks-data";
import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import { roleIdToSprintSlug } from "@/lib/intake-roadmap";
import { roleIdToPairingTrack } from "@/lib/pairing/constants";
import { writeStayRelevantContact } from "@/lib/stay-relevant-contact";

type IntakeRoadmapActionsProps = {
  email: string;
  name?: string;
  phone?: string;
  vetting: VettingResult;
  roadmap: IntakePersonalizedRoadmap | null;
  gapSummary?: string;
  onContactUpdate?: (patch: { name?: string; phone?: string }) => void;
};

export function IntakeRoadmapActions({
  email,
  name = "",
  phone = "",
  vetting,
  roadmap,
  gapSummary,
  onContactUpdate,
}: IntakeRoadmapActionsProps) {
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [localPhone, setLocalPhone] = useState(phone);
  const [commitError, setCommitError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cohortModalOpen, setCohortModalOpen] = useState(false);
  const [pairingUserId, setPairingUserId] = useState<string | null>(null);

  useEffect(() => {
    setLocalPhone(phone);
  }, [phone]);

  const trimmedEmail = email.trim();
  const sprintSlug = roleIdToSprintSlug(vetting.inferredRoleId);
  const sprintTrack = getProjectSprintBySlug(sprintSlug);
  const pairingTrack = roleIdToPairingTrack(vetting.inferredRoleId);
  const trackTitle = sprintTrack?.title ?? vetting.inferredRoleLabel;
  const phoneDigits = localPhone.trim().replace(/\D/g, "");
  const hasValidPhone = phoneDigits.length >= 10;

  async function handleEmailPlan() {
    if (!trimmedEmail) {
      setEmailError("We need your email to send the plan.");
      return;
    }

    setIsSendingEmail(true);
    setEmailError("");

    try {
      const response = await fetch("/api/cc-agent/roadmap/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          name: name.trim() || null,
          vetting,
          roadmap,
          gapSummary: gapSummary?.trim() || null,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send your plan.");
      }

      setEmailSent(true);
    } catch (caught) {
      setEmailError(caught instanceof Error ? caught.message : "Unable to send your plan.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function handleCommitAndApply() {
    if (!sprintTrack) {
      setCommitError("Unable to match you to a sprint track.");
      return;
    }

    if (!hasValidPhone) {
      setCommitError("Enter a phone number we can reach you at.");
      return;
    }

    if (!trimmedEmail) {
      setCommitError("Email is required to apply for a peer group.");
      return;
    }

    setIsApplying(true);
    setCommitError("");

    const trimmedName = name.trim() || "Sprint participant";
    const trimmedPhone = localPhone.trim();

    try {
      writeStayRelevantContact({
        email: trimmedEmail,
        phone: trimmedPhone,
        name: trimmedName,
      });
      onContactUpdate?.({ phone: trimmedPhone, name: trimmedName });

      const response = await fetch("/api/track-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: sprintTrack.id,
          trackTitle: sprintTrack.title,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        cohort?: { userId: string } | null;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to apply for a peer group.");
      }

      if (payload.cohort?.userId) {
        setPairingUserId(payload.cohort.userId);
      }

      setCohortModalOpen(true);
      setShowCommitForm(false);
    } catch (caught) {
      setCommitError(
        caught instanceof Error ? caught.message : "Unable to apply for a peer group.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <>
      <section className="mt-10 border-t border-border/50 pt-8">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          What&apos;s next?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Go solo with a self-paced plan in your inbox, or commit and join a peer group on the same
          track.
        </p>

        {showCommitForm ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div className="space-y-2">
              <Label htmlFor="roadmap-commit-phone">
                Phone number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="roadmap-commit-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={localPhone}
                onChange={(event) => setLocalPhone(event.target.value)}
                placeholder="(555) 555-5555"
                disabled={isApplying}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll text you when your peer group is matched — up to 4 people on the{" "}
                {trackTitle} track.
              </p>
            </div>

            {commitError ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {commitError}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={() => void handleCommitAndApply()}
                disabled={!hasValidPhone || isApplying}
                className="cta-glow h-11 flex-1 rounded-full font-semibold"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    Confirm & apply for peer group
                    <ArrowRight className="ml-1.5 size-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCommitForm(false);
                  setCommitError("");
                }}
                disabled={isApplying}
                className="h-11 rounded-full"
              >
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => setShowCommitForm(true)}
              className="cta-glow h-12 w-full rounded-full text-base font-semibold"
            >
              Commit to this plan and apply for a peer group
              <ArrowRight className="ml-1.5 size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => void handleEmailPlan()}
              disabled={!trimmedEmail || isSendingEmail || emailSent}
              className="h-12 w-full rounded-full text-base font-semibold"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending…
                </>
              ) : emailSent ? (
                <>
                  <Check className="mr-2 size-4 text-emerald-600" />
                  Plan sent to {trimmedEmail}
                </>
              ) : (
                <>
                  <Mail className="mr-2 size-4" />
                  Email me this self-paced plan
                </>
              )}
            </Button>
          </div>
        )}

        {emailError ? (
          <p className="mt-3 text-sm font-medium text-destructive" role="alert">
            {emailError}
          </p>
        ) : null}
      </section>

      <PairingCohortModal
        open={cohortModalOpen}
        onOpenChange={setCohortModalOpen}
        trackTitle={trackTitle}
        pairingTrack={pairingTrack}
        initialEmail={trimmedEmail}
        initialUserId={pairingUserId ?? undefined}
      />
    </>
  );
}
