import { NextResponse } from "next/server";
import { z } from "zod";

import type { VettingResult } from "@/lib/cc-agent-flow";
import { sendRoadmapPlanEmail } from "@/lib/email/send-roadmap-plan";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import { GAP_STATUSES } from "@/lib/profile-gaps";

const gapParameterSchema = z.object({
  parameter: z.string().min(1).max(80),
  jobRequires: z.string().min(1).max(280),
  youHave: z.string().min(1).max(280),
  status: z.enum(GAP_STATUSES),
  keywords: z.array(z.string().min(1).max(48)).max(3),
});

const vettingSchema = z.object({
  vetted: z.boolean(),
  quantitativeSignal: z.boolean(),
  roleVetted: z.boolean(),
  profileStrength: z.enum(["strong", "gap"]),
  inferredRoleId: z.string().min(1).max(80),
  inferredRoleLabel: z.string().min(1).max(200),
  nurtureTrack: z.string().min(1).max(80),
  summary: z.string().max(2000),
  gapParameters: z.array(gapParameterSchema).max(10),
});

const roadmapSchema = z.object({
  roleLabel: z.string().min(1).max(200),
  sprintSlug: z.string().nullable(),
  promise: z.string().max(500),
  weeks: z.array(
    z.object({
      week: z.number().int().min(1).max(6),
      title: z.string().min(1).max(120),
      bullets: z.array(z.string().min(1).max(280)).min(1).max(6),
      focusGap: z.string().max(80).optional(),
    }),
  ),
  generatedAt: z.string().min(1).max(80),
});

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional().nullable(),
  vetting: vettingSchema,
  roadmap: roadmapSchema.optional().nullable(),
  gapSummary: z.string().trim().max(500).optional().nullable(),
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
    return NextResponse.json({ error: "Invalid roadmap email payload." }, { status: 400 });
  }

  const result = await sendRoadmapPlanEmail({
    email: parsed.data.email,
    name: parsed.data.name,
    vetting: parsed.data.vetting as VettingResult,
    roadmap: (parsed.data.roadmap ?? null) as IntakePersonalizedRoadmap | null,
    gapSummary: parsed.data.gapSummary,
  });

  if (!result.ok) {
    const status =
      result.reason === "missing_api_key" || result.reason === "missing_from_address" ? 503 : 502;

    return NextResponse.json(
      {
        error:
          result.reason === "missing_api_key" || result.reason === "missing_from_address"
            ? "Email delivery is not configured."
            : "Unable to send your roadmap email.",
        reason: result.reason,
      },
      { status },
    );
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
