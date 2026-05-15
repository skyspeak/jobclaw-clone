import { NextResponse } from "next/server";

import { buildAiTracksGuideHtml } from "@/lib/ai-tracks-html";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const canonicalUrl = `${url.origin}/ai-tracks`;
  const html = buildAiTracksGuideHtml({ canonicalUrl });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...(download
        ? {
            "Content-Disposition":
              'attachment; filename="jobclaw-six-two-week-ai-tracks.html"',
          }
        : {}),
    },
  });
}
