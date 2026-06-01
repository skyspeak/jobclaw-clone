import { NextResponse } from "next/server";
import { z } from "zod";

import { parseProfile } from "@/lib/profile-parse";

const parseProfileRequestSchema = z.object({
  linkedInUrl: z.string().optional(),
  resumeText: z.string().optional(),
  resumeFileName: z.string().optional(),
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
  const parsed = parseProfileRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parse-profile payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { linkedInUrl, resumeText, resumeFileName, answers } = parsed.data;

  if (!linkedInUrl?.trim() && !resumeText?.trim()) {
    return NextResponse.json(
      { error: "Provide a LinkedIn URL or résumé text to parse." },
      { status: 400 },
    );
  }

  const insight = await parseProfile({
    linkedInUrl,
    resumeText,
    resumeFileName,
    answers,
  });

  return NextResponse.json(insight);
}
