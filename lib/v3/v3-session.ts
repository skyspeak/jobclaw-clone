import { V3_STORAGE_KEY } from "@/lib/v3/v3-theme";
import type { V3StepId } from "@/lib/v3/v3-flow";
import type { V3Analysis, V3Inputs } from "@/lib/v3/v3-types";

export type V3Session = {
  step: V3StepId;
  inputs: V3Inputs;
  analysis: V3Analysis | null;
  usedSample: boolean;
};

const EMPTY_INPUTS: V3Inputs = { jobUrl: "", linkedInUrl: "" };

export function createEmptyV3Session(): V3Session {
  return {
    step: "connect",
    inputs: { ...EMPTY_INPUTS },
    analysis: null,
    usedSample: false,
  };
}

export function readV3Session(): V3Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(V3_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as V3Session;
    if (!parsed?.step) {
      return null;
    }
    return {
      step: parsed.step,
      inputs: parsed.inputs ?? { ...EMPTY_INPUTS },
      analysis: parsed.analysis ?? null,
      usedSample: Boolean(parsed.usedSample),
    };
  } catch {
    return null;
  }
}

export function writeV3Session(session: V3Session): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(V3_STORAGE_KEY, JSON.stringify(session));
}

export function clearV3Session(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(V3_STORAGE_KEY);
}
