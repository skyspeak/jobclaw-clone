import { NextResponse } from "next/server";

import {
  createJobClawResponse,
  generateRequestSchema,
  intakeQuestions,
} from "@/lib/jobclaw";
import { generateJobClawWithGemini } from "@/lib/gemini-intake";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        summary: "Invalid intake payload.",
        searchRequest: null,
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  const missingAnswers = intakeQuestions.filter(({ id }) => !(payload.answers[id] ?? "").trim());

  if (missingAnswers.length > 0) {
    return NextResponse.json(createJobClawResponse(payload));
  }

  const geminiResponse = await generateJobClawWithGemini(payload);
  const responsePayload = geminiResponse ?? createJobClawResponse(payload);

  return NextResponse.json(responsePayload);
}
