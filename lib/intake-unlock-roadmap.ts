import { splitGapParametersToBars } from "@/lib/profile-gaps";
import type { IntakeWizardSession } from "@/lib/intake-session";

export function buildGapEmailSummary(session: IntakeWizardSession): string {
  const parameters = session.ccAgent.vettingResult?.gapParameters ?? [];
  const { gaps } = splitGapParametersToBars(parameters);
  if (gaps.length === 0) {
    return session.ccAgent.vettingResult?.inferredRoleLabel ?? "your target role";
  }
  return gaps.map((item) => item.label).join(", ");
}

export function buildGapLabels(session: IntakeWizardSession): string[] {
  const parameters = session.ccAgent.vettingResult?.gapParameters ?? [];
  const { gaps } = splitGapParametersToBars(parameters);
  return gaps.map((item) => item.label).slice(0, 10);
}

export async function submitRoadmapUnlock(session: IntakeWizardSession, email: string): Promise<void> {
  const trimmedEmail = email.trim();
  const gapSummary = buildGapEmailSummary(session);
  const gapLabels = buildGapLabels(session);

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: session.contact.name.trim() || "Roadmap unlock",
      email: trimmedEmail,
      role_type: "both",
      linkedin: session.linkedInUrl.trim() || null,
      industries: gapSummary.slice(0, 500) || null,
      referral: "intake-roadmap-unlock",
      role: session.ccAgent.vettingResult?.inferredRoleLabel ?? null,
      focusAreas: gapLabels,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      newsletterConsent: false,
    }),
  });

  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to save your email.");
  }
}
