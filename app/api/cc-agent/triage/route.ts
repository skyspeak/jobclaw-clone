import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildRoleSuggestions,
  inferRoleFromText,
  inferSelectedRoleId,
  runVetting,
  type VettedRoleId,
} from "@/lib/cc-agent-flow";
import { parseProfile } from "@/lib/profile-parse";

const triageRequestSchema = z.object({
  knowsTargetJob: z.boolean(),
  linkedInUrl: z.string().optional(),
  resumeText: z.string().optional(),
  resumeFileName: z.string().optional(),
  targetJobUrl: z.string().optional(),
  selectedRoleId: z.string().optional(),
  answers: z
    .object({
      q1: z.string().optional(),
      q2: z.string().optional(),
      q3: z.string().optional(),
      q4: z.string().optional(),
      q5: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = triageRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid triage payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    knowsTargetJob,
    linkedInUrl = "",
    resumeText = "",
    resumeFileName,
    targetJobUrl = "",
    selectedRoleId = "",
    answers = {},
  } = parsed.data;

  const profileInsight =
    linkedInUrl.trim() || resumeText.trim()
      ? await parseProfile({
          linkedInUrl,
          resumeText,
          resumeFileName,
          answers,
        })
      : null;

  const roleFromTarget = targetJobUrl.trim()
    ? inferRoleFromText(targetJobUrl)
    : null;

  const intakeAnswers = {
    q1: answers.q1 ?? "",
    q2: answers.q2 ?? "",
    q3: answers.q3 ?? "",
    q4: answers.q4 ?? "",
    q5: answers.q5 ?? "",
  };

  const resolvedRoleId =
    selectedRoleId && ["sales", "marketing", "fde", "swe", "long-tail"].includes(selectedRoleId)
      ? selectedRoleId
      : inferSelectedRoleId({
          targetJobUrl,
          linkedInUrl,
          resumeText,
          profileInsight,
          answers: intakeAnswers,
        }) || roleFromTarget?.id || "";

  const vetting = runVetting({
    knowsTargetJob,
    resumeText,
    linkedInUrl,
    targetJobUrl,
    selectedRoleId: resolvedRoleId,
    answers: intakeAnswers,
    profileInsight,
    roleSuggestions: profileInsight?.suggestedRoles ?? [],
  });

  const roleSuggestions = buildRoleSuggestions(profileInsight, vetting);

  let suggestedRoleId: VettedRoleId | "long-tail" = vetting.inferredRoleId;
  if (resolvedRoleId && ["sales", "marketing", "fde", "swe"].includes(resolvedRoleId)) {
    suggestedRoleId = resolvedRoleId as VettedRoleId;
  }

  return NextResponse.json({
    profileInsight,
    vetting,
    roleSuggestions,
    suggestedRoleId,
  });
}
