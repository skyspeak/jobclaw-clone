export const V3_STEP_IDS = [
  "connect",
  "skill-gaps",
  "journey",
  "pod",
  "mentor",
] as const;

export type V3StepId = (typeof V3_STEP_IDS)[number];

export function getV3StepIndex(step: V3StepId): number {
  return V3_STEP_IDS.indexOf(step);
}

export function getV3TopLevelStep(step: V3StepId): number {
  return getV3StepIndex(step) + 1;
}

export function getV3NextStep(step: V3StepId): V3StepId | null {
  const index = getV3StepIndex(step);
  if (index < 0 || index >= V3_STEP_IDS.length - 1) {
    return null;
  }
  return V3_STEP_IDS[index + 1] ?? null;
}

export function getV3PrevStep(step: V3StepId): V3StepId | null {
  const index = getV3StepIndex(step);
  if (index <= 0) {
    return null;
  }
  return V3_STEP_IDS[index - 1] ?? null;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
