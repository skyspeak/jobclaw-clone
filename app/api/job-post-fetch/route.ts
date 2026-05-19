import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchJobPostingFromUrl, isLikelyJobUrl } from "@/lib/job-post-fetch";

const requestSchema = z.object({
  jobUrl: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid job posting URL." }, { status: 400 });
  }

  const { jobUrl } = parsed.data;

  if (!isLikelyJobUrl(jobUrl)) {
    return NextResponse.json({ error: "Enter a valid http or https URL." }, { status: 400 });
  }

  const result = await fetchJobPostingFromUrl(jobUrl);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, suggestPaste: result.suggestPaste },
      { status: 422 },
    );
  }

  return NextResponse.json({ text: result.text, source: result.source });
}
