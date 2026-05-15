import type { SearchRequest } from "@/lib/jobclaw";

export const INTAKE_WIZARD_STORAGE_KEY = "jobclaw.intake-wizard.v2";

export function readIntakeSearchRequest(): SearchRequest | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(INTAKE_WIZARD_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { result?: { searchRequest?: SearchRequest | null } };
    const searchRequest = parsed?.result?.searchRequest;
    if (!searchRequest || typeof searchRequest.jobTitle !== "string") {
      return null;
    }

    return searchRequest;
  } catch {
    return null;
  }
}
