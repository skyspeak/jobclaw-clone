import type { SearchRequest } from "@/lib/jobclaw";
import { INTAKE_WIZARD_STORAGE_KEY, readIntakeSession } from "@/lib/intake-session";

export { INTAKE_WIZARD_STORAGE_KEY };

export function readIntakeSearchRequest(): SearchRequest | null {
  const session = readIntakeSession();
  const searchRequest = session.result?.searchRequest;

  if (!searchRequest || typeof searchRequest.jobTitle !== "string") {
    return null;
  }

  return searchRequest;
}
