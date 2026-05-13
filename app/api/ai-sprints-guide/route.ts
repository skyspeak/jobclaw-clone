import { NextResponse } from "next/server";

import { buildAiSprintsGuideHtml } from "@/lib/ai-sprints-html";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const canonicalUrl = `${url.origin}/ai-sprints`;
  const html = buildAiSprintsGuideHtml({ canonicalUrl });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...(download
        ? {
            "Content-Disposition":
              'attachment; filename="jobclaw-six-two-week-ai-sprints.html"',
          }
        : {}),
    },
  });
}
