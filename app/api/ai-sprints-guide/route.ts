import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const download = request.nextUrl.searchParams.get("download");
  const target = download === "1" ? "/api/ai-tracks-guide?download=1" : "/api/ai-tracks-guide";
  return NextResponse.redirect(new URL(target, request.url));
}
