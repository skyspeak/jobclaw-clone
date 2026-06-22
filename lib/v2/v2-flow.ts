export const V2_STEP_IDS = [
  "connect",
  "skill-gaps",
  "journey",
  "pod-members",
  "pod-meeting",
  "mentor",
] as const;

export type V2StepId = (typeof V2_STEP_IDS)[number];

export function getV2StepIndex(step: V2StepId): number {
  return V2_STEP_IDS.indexOf(step);
}

export function getV2TopLevelStep(step: V2StepId): number {
  switch (step) {
    case "connect":
      return 1;
    case "skill-gaps":
      return 2;
    case "journey":
      return 3;
    case "pod-members":
    case "pod-meeting":
      return 4;
    case "mentor":
      return 5;
  }
}

export function getV2NextStep(step: V2StepId): V2StepId | null {
  const index = getV2StepIndex(step);
  if (index < 0 || index >= V2_STEP_IDS.length - 1) {
    return null;
  }
  return V2_STEP_IDS[index + 1] ?? null;
}

export function getV2PrevStep(step: V2StepId): V2StepId | null {
  const index = getV2StepIndex(step);
  if (index <= 0) {
    return null;
  }
  return V2_STEP_IDS[index - 1] ?? null;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
