import { NextResponse } from "next/server";
import { z } from "zod";

import { sendGapAnalysisEmail } from "@/lib/email/send-gap-analysis";
import { GAP_STATUSES } from "@/lib/profile-gaps";

const gapParameterSchema = z.object({
  parameter: z.string().min(1).max(80),
  jobRequires: z.string().min(1).max(280),
  youHave: z.string().min(1).max(280),
  status: z.enum(GAP_STATUSES),
  keywords: z.array(z.string().min(1).max(48)).max(3),
});

const planSchema = z.object({
  markedNodeIds: z.array(z.string().min(1).max(80)).max(30),
  customNotes: z.string().max(2000),
  roadmapSlug: z.string().min(1).max(80),
  markedThemes: z.array(z.string().min(1).max(120)).max(30).optional(),
  roadmapTitle: z.string().max(120).optional(),
});

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional().nullable(),
  gapParameters: z.array(gapParameterSchema).min(1).max(10),
  roleLabel: z.string().trim().max(200).optional().nullable(),
  targetJobUrl: z.string().trim().max(500).optional().nullable(),
  shareUrl: z.string().trim().max(500).optional().nullable(),
  plan: planSchema.optional().nullable(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid gap analysis email payload." }, { status: 400 });
  }

  const result = await sendGapAnalysisEmail(parsed.data);

  if (!result.ok) {
    const status =
      result.reason === "missing_api_key" || result.reason === "missing_from_address" ? 503 : 502;

    return NextResponse.json(
      {
        error:
          result.reason === "missing_api_key" || result.reason === "missing_from_address"
            ? "Email delivery is not configured."
            : "Unable to send your gap analysis email.",
        reason: result.reason,
      },
      { status },
    );
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
