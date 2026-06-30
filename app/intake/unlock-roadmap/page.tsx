"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { readIntakeSession, writeIntakeSession } from "@/lib/intake-session";

export default function IntakeUnlockRoadmapRedirect() {
  const router = useRouter();

  useEffect(() => {
    const session = readIntakeSession();
    if (session.ccAgent.vettingResult) {
      const flowStep = session.ccAgent.roadmapUnlocked ? "roadmap" : "vetting-result";
      writeIntakeSession({
        ...session,
        ccAgent: { ...session.ccAgent, flowStep },
      });
    }
    router.replace("/intake");
  }, [router]);

  return (
    <p className="px-6 py-8 text-sm text-muted-foreground" aria-live="polite">
      Loading…
    </p>
  );
}
