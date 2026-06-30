"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { IntakeRoadmapFullView } from "@/app/components/IntakeRoadmapFullView";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import {
  readIntakeSession,
  writeIntakeSession,
  type IntakeWizardSession,
} from "@/lib/intake-session";
import { splitGapParametersToBars } from "@/lib/profile-gaps";

export function IntakePersonalizedRoadmapView() {
  const router = useRouter();
  const [session, setSession] = useState<IntakeWizardSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [roadmap, setRoadmap] = useState<IntakePersonalizedRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const roadmapRequestedRef = useRef(false);

  const vetting = session?.ccAgent.vettingResult ?? null;
  const roleLabel = vetting?.inferredRoleLabel ?? "your target role";
  const email = session?.contact.email.trim() ?? "";
  const name = session?.contact.name.trim() ?? "";
  const phone = session?.contact.phone.trim() ?? "";

  const gapSummary = useMemo(() => {
    if (!vetting) return "";
    const { gaps } = splitGapParametersToBars(vetting.gapParameters ?? []);
    if (gaps.length === 0) return "";
    return gaps.map((item) => item.label).join(", ");
  }, [vetting]);

  useEffect(() => {
    const stored = readIntakeSession();
    setSession(stored);
    setRoadmap(stored.ccAgent.personalizedRoadmap);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    if (!session?.ccAgent.vettingResult) {
      router.replace("/intake");
      return;
    }
    if (!session.ccAgent.roadmapUnlocked || !session.contact.email.trim()) {
      writeIntakeSession({
        ...session,
        ccAgent: { ...session.ccAgent, flowStep: "vetting-result" },
      });
      router.replace("/intake");
    }
  }, [hasHydrated, router, session]);

  useEffect(() => {
    if (
      !hasHydrated ||
      !session?.ccAgent.vettingResult ||
      roadmap ||
      isLoadingRoadmap ||
      roadmapRequestedRef.current
    ) {
      return;
    }

    roadmapRequestedRef.current = true;

    void (async () => {
      setIsLoadingRoadmap(true);
      setRoadmapError("");

      try {
        const response = await fetch("/api/cc-agent/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vettingResult: session.ccAgent.vettingResult,
            targetJobUrl: session.targetJobUrl,
            linkedInUrl: session.linkedInUrl,
            resumeText: session.resumeText,
          }),
        });

        const payload = (await response.json()) as {
          roadmap?: IntakePersonalizedRoadmap;
          error?: string;
        };

        if (!response.ok || !payload.roadmap) {
          throw new Error(payload.error || "Unable to build your roadmap.");
        }

        const updated: IntakeWizardSession = {
          ...session,
          ccAgent: {
            ...session.ccAgent,
            personalizedRoadmap: payload.roadmap,
          },
        };
        writeIntakeSession(updated);
        setSession(updated);
        setRoadmap(payload.roadmap);
      } catch (caught) {
        roadmapRequestedRef.current = false;
        setRoadmapError(
          caught instanceof Error ? caught.message : "Unable to build your roadmap.",
        );
      } finally {
        setIsLoadingRoadmap(false);
      }
    })();
  }, [hasHydrated, isLoadingRoadmap, roadmap, session]);

  function handleContactUpdate(patch: { name?: string; phone?: string }) {
    if (!session) {
      return;
    }

    const updated: IntakeWizardSession = {
      ...session,
      contact: {
        ...session.contact,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      },
    };
    writeIntakeSession(updated);
    setSession(updated);
  }

  if (!hasHydrated || !session?.ccAgent.vettingResult) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Loading…
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <IntakeRoadmapFullView
        roadmap={roadmap}
        vetting={session.ccAgent.vettingResult}
        roleLabel={roleLabel}
        gapSummary={gapSummary}
        email={email}
        contactName={name}
        contactPhone={phone}
        onContactUpdate={handleContactUpdate}
        isLoading={isLoadingRoadmap}
        error={roadmapError}
        className="flex-1"
      />
    </div>
  );
}
