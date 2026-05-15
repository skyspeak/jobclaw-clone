import type { SearchRequest } from "@/lib/jobclaw";
import type { JobWebSearchResult } from "@/lib/serper-job-search";

export type MatchedInternshipListing = {
  id: string;
  title: string;
  sourceHost: string;
  summary: string;
  applyUrl: string;
};

export type MatchedInternshipsSessionV1 = {
  version: 1;
  searchRequest: SearchRequest;
  query: string;
  results: JobWebSearchResult[];
};

const MATCHED_INTERNSHIPS_SESSION_KEY = "jobclaw.matched-internships.v1";

export function hostLabelFromUrl(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "Employer site";
  }
}

export function jobHitToListing(hit: JobWebSearchResult, index: number): MatchedInternshipListing {
  return {
    id: `live-${index}-${encodeURIComponent(hit.link).slice(0, 48)}`,
    title: hit.title,
    sourceHost: hostLabelFromUrl(hit.link),
    summary: hit.snippet,
    applyUrl: hit.link,
  };
}

export function writeMatchedInternshipsSession(payload: Omit<MatchedInternshipsSessionV1, "version">): void {
  if (typeof window === "undefined") {
    return;
  }

  const body: MatchedInternshipsSessionV1 = {
    version: 1,
    ...payload,
  };

  sessionStorage.setItem(MATCHED_INTERNSHIPS_SESSION_KEY, JSON.stringify(body));
}

export function readMatchedInternshipsSession(): MatchedInternshipsSessionV1 | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(MATCHED_INTERNSHIPS_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MatchedInternshipsSessionV1;
    if (parsed?.version !== 1 || !parsed.searchRequest || !Array.isArray(parsed.results)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
