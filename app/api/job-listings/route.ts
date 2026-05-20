import { NextResponse } from "next/server";

import { isAdminRequest } from "@/lib/admin";
import {
  createJobListing,
  jobListingInputSchema,
  listJobListings,
} from "@/lib/job-listings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const includeInactive = isAdminRequest(request);

  const listings = await listJobListings({ includeInactive });

  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = jobListingInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid job listing.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const listing = await createJobListing(parsed.data);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save job listing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
