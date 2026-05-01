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
  const body = await request.json().catch((error) => {
    console.warn("Submission save failed: request body was not valid JSON.", {
      error: serializeError(error),
    });
    return null;
  });
  const parsed = submissionRequestSchema.safeParse(body);

  if (!parsed.success) {
    console.warn("Submission save failed: invalid submission payload.", {
      issues: parsed.error.flatten(),
    });

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

    console.error("Submission save failed while writing to storage.", {
      error: serializeError(error),
    });

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

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}
