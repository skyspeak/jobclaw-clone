import { V2_STORAGE_KEY } from "@/lib/v2/v2-theme";
import type { V2StepId } from "@/lib/v2/v2-flow";
import type { V2Analysis, V2Inputs } from "@/lib/v2/v2-types";

export type V2Session = {
  step: V2StepId;
  inputs: V2Inputs;
  analysis: V2Analysis | null;
  usedSample: boolean;
};

const EMPTY_INPUTS: V2Inputs = { jobUrl: "", linkedInUrl: "" };

export function createEmptyV2Session(): V2Session {
  return {
    step: "connect",
    inputs: { ...EMPTY_INPUTS },
    analysis: null,
    usedSample: false,
  };
}

export function readV2Session(): V2Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(V2_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as V2Session;
    if (!parsed || typeof parsed !== "object" || !parsed.step) {
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

export function writeV2Session(session: V2Session): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(session));
}

export function clearV2Session(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(V2_STORAGE_KEY);
}
