import { NextResponse } from "next/server";

import {
  createSubmission,
  listSubmissions,
  submissionRequestSchema,
} from "@/lib/submissions";

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

  const submission = await createSubmission(parsed.data);

  return NextResponse.json({ submission }, { status: 201 });
}

function isAuthorized(request: Request) {
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;

  if (!adminToken) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer (.+)$/i)?.[1];
  const queryToken = new URL(request.url).searchParams.get("token");

  return bearerToken === adminToken || queryToken === adminToken;
}
