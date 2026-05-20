import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin";
import {
  deleteJobListing,
  getJobListingById,
  jobListingUpdateSchema,
  updateJobListing,
} from "@/lib/job-listings";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const listing = await getJobListingById(id);

  if (!listing) {
    return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
  }

  if (!listing.active && !isAdminRequest(request)) {
    return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = jobListingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job listing update.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const listing = await updateJobListing(id, parsed.data);
  if (!listing) {
    return NextResponse.json({ error: "Job listing not found or could not be saved." }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteJobListing(id);

  if (!deleted) {
    return NextResponse.json({ error: "Job listing not found or could not be deleted." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
