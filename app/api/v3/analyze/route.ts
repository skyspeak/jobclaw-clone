import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeJobFit } from "@/lib/job-fit";
import { fetchJobPostingFromUrl, resolveJobDescriptionText } from "@/lib/job-post-fetch";
import { parseProfile } from "@/lib/profile-parse";
import { mapJobFitToV3Analysis } from "@/lib/v3/v3-analyze";

const analyzeRequestSchema = z.object({
  jobUrl: z.string().min(1),
  linkedInUrl: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Job URL and LinkedIn URL are required.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { jobUrl, linkedInUrl } = parsed.data;

  const fetched = await fetchJobPostingFromUrl(jobUrl.trim());
  if (!fetched.ok) {
    return NextResponse.json(
      { error: fetched.error, suggestPaste: fetched.suggestPaste },
      { status: 422 },
    );
  }

  const resolved = resolveJobDescriptionText({ jobDescription: fetched.text });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    const profileInsight = await parseProfile({ linkedInUrl: linkedInUrl.trim() });

    const result = await analyzeJobFit({
      jobText: resolved.text,
      candidate: {
        resumeText: "",
        surveySummary: profileInsight.filtersIntro,
        profileDraft: {
          idealJob: profileInsight.suggestedRoles[0]
            ? { title: profileInsight.suggestedRoles[0], why: profileInsight.filtersIntro }
            : undefined,
          linkedInProfile: {
            headline: profileInsight.suggestedRoles.join(", "),
            about: profileInsight.filtersIntro,
            skills: profileInsight.suggestedRoles,
          },
        },
      },
    });

    const analysis = mapJobFitToV3Analysis({
      result,
      jobText: resolved.text,
      linkedInUrl,
      profileInsight,
    });

    return NextResponse.json({ analysis, analyzedText: resolved.text });
  } catch (err) {
    console.error("v3 analyze error", err);
    return NextResponse.json(
      { error: "Could not build your roadmap. Try again or use the sample." },
      { status: 500 },
    );
  }
}
