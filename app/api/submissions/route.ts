import { NextResponse } from "next/server";

import {
  createSubmission,
  listSubmissions,
  submissionRequestSchema,
} from "@/lib/submissions";
import { ADMIN_COOKIE_NAME, isValidAdminPassword, readCookieValue } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const submissions = await listSubmissions();

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = submissionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid submission payload.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const submission = await createSubmission(parsed.data);

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save the completed intake.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

function isAuthorized(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer (.+)$/i)?.[1];
  const queryToken = new URL(request.url).searchParams.get("token");
  const cookieToken = readCookieValue(request.headers.get("cookie"), ADMIN_COOKIE_NAME);

  return (
    isValidAdminPassword(bearerToken) ||
    isValidAdminPassword(queryToken) ||
    isValidAdminPassword(cookieToken)
  );
}
