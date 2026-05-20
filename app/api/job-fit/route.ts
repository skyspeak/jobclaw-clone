import { NextResponse } from "next/server";

import { analyzeJobFit, jobFitCandidateContextSchema, jobFitRequestSchema } from "@/lib/job-fit";
import { createJobFitSubmission } from "@/lib/job-fit-submissions";
import { fetchJobPostingFromUrl, resolveJobDescriptionText } from "@/lib/job-post-fetch";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = jobFitRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid job fit request.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { jobDescription, jobUrl, candidate: candidateInput, submissionMeta } = parsed.data;
  const candidate = jobFitCandidateContextSchema.parse(candidateInput ?? {});
  let resolvedText = jobDescription.trim();

  if (resolvedText.length < 80 && jobUrl.trim()) {
    const fetched = await fetchJobPostingFromUrl(jobUrl.trim());
    if (!fetched.ok) {
      return NextResponse.json(
        { error: fetched.error, suggestPaste: fetched.suggestPaste },
        { status: 422 },
      );
    }
    resolvedText = fetched.text;
  }

  const resolved = resolveJobDescriptionText({ jobDescription: resolvedText });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error, suggestPaste: resolved.suggestPaste }, { status: 400 });
  }

  try {
    const result = await analyzeJobFit({
      jobText: resolved.text,
      candidate,
    });

    if (submissionMeta) {
      try {
        await createJobFitSubmission({
          inputType: submissionMeta.inputType,
          listingId: submissionMeta.listingId,
          listingTitle: submissionMeta.listingTitle,
          intakeSubmissionId: submissionMeta.intakeSubmissionId,
          submitterName: submissionMeta.submitterName ?? "",
          submitterEmail: submissionMeta.submitterEmail ?? "",
          submitterPhone: submissionMeta.submitterPhone ?? "",
          jobUrl: jobUrl.trim(),
          jobDescription: resolved.text,
          roleTitle: result.roleTitle,
          verdict: result.verdict,
          resultHeadline: result.headline,
        });
      } catch (saveError) {
        console.error("job-fit submission save failed", saveError);
      }
    }

    return NextResponse.json({
      result,
      analyzedText: resolved.text,
    });
  } catch (err) {
    console.error("job-fit analysis error", err);
    return NextResponse.json({ error: "Could not analyze this job posting. Try again." }, { status: 500 });
  }
}
