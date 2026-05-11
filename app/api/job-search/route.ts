import { NextResponse } from "next/server";
import { z } from "zod";

import { buildSearchQueryFromRequest, searchRequestSchema } from "@/lib/jobclaw";
import { isSerperConfigured, searchJobsWithSerper } from "@/lib/serper-job-search";

export const runtime = "nodejs";

const bodySchema = z.object({
  searchRequest: searchRequestSchema,
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!isSerperConfigured()) {
    return NextResponse.json({
      configured: false as const,
      message:
        "Live job search is not turned on. Add SERPER_API_KEY (get a free key at https://serper.dev ) to your server environment.",
      query: `${buildSearchQueryFromRequest(parsed.data.searchRequest)} job posting`,
      results: [],
    });
  }

  const fullQuery = `${buildSearchQueryFromRequest(parsed.data.searchRequest)} job posting`;

  try {
    const results = await searchJobsWithSerper(fullQuery, parsed.data.searchRequest.maxResults);

    return NextResponse.json({
      configured: true as const,
      query: fullQuery,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";

    return NextResponse.json(
      {
        configured: true as const,
        query: fullQuery,
        results: [],
        error: message,
      },
      { status: 502 },
    );
  }
}
