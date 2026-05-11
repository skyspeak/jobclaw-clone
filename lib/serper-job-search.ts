/**
 * Live Google web results via Serper (https://serper.dev).
 * Set SERPER_API_KEY in the environment; used by POST /api/job-search.
 */

export type JobWebSearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export function isSerperConfigured(): boolean {
  return Boolean(process.env.SERPER_API_KEY?.trim());
}

type SerperOrganic = {
  title?: string;
  link?: string;
  snippet?: string;
};

type SerperSearchResponse = {
  organic?: SerperOrganic[];
  error?: string;
};

export async function searchJobsWithSerper(
  query: string,
  maxResults: number,
): Promise<JobWebSearchResult[]> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) {
    throw new Error("SERPER_API_KEY is not set");
  }

  const num = Math.min(Math.max(maxResults, 1), 10);

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num,
      gl: "us",
      hl: "en",
    }),
  });

  const raw = (await response.json()) as SerperSearchResponse;

  if (!response.ok) {
    const message =
      typeof raw?.error === "string" && raw.error
        ? raw.error
        : `Serper HTTP ${response.status}`;
    throw new Error(message);
  }

  const organic = Array.isArray(raw.organic) ? raw.organic : [];

  return organic
    .map((item) => ({
      title: (item.title ?? "").trim(),
      link: (item.link ?? "").trim(),
      snippet: (item.snippet ?? "").trim(),
    }))
    .filter((item) => item.title && item.link);
}
