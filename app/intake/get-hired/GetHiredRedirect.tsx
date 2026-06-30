"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { IntakeGetHiredSignup } from "@/app/components/IntakeGetHiredSignup";
import { readIntakeSession, writeIntakeSession } from "@/lib/intake-session";

export default function IntakeGetHiredRedirectWrapper() {
  const router = useRouter();

  useEffect(() => {
    const session = readIntakeSession();
    if (!session.ccAgent.vettingResult) {
      return;
    }

    if (!session.ccAgent.roadmapUnlocked) {
      writeIntakeSession({
        ...session,
        ccAgent: { ...session.ccAgent, flowStep: "roadmap" },
      });
      router.replace("/intake");
      return;
    }

    if (session.collaborativePlan?.planCompletedAt) {
      router.replace("/intake/roadmap");
      return;
    }

    router.replace("/intake/plan-together");
  }, [router]);

  return <IntakeGetHiredSignup />;
}
