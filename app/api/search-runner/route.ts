import { NextResponse } from "next/server";

import { searchRunnerOptions } from "@/lib/saas";

export async function GET() {
  return NextResponse.json({
    status: "planned",
    recommendation:
      "Keep live job-search execution out of DearCC presents JobClaw's first version. Ship chat-to-search-request first, then add an async runner after provider and compliance review.",
    options: searchRunnerOptions,
  });
}
