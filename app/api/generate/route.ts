import { NextResponse } from "next/server";

import { createJobClawResponse, generateRequestSchema } from "@/lib/jobclaw";

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

  return NextResponse.json(createJobClawResponse(parsed.data));
}
