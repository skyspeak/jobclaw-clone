import { NextResponse } from "next/server";
import { z } from "zod";

import type { VettingResult } from "@/lib/cc-agent-flow";
import { buildPersonalizedIntakeRoadmap } from "@/lib/intake-roadmap";
import { gapParameterSchema } from "@/lib/profile-gaps";

const vettingResultSchema = z.object({
  vetted: z.boolean(),
  quantitativeSignal: z.boolean(),
  roleVetted: z.boolean(),
  profileStrength: z.enum(["strong", "gap"]),
  inferredRoleId: z.enum(["sales", "marketing", "fde", "swe", "long-tail"]),
  inferredRoleLabel: z.string(),
  nurtureTrack: z.string(),
  summary: z.string(),
  gapParameters: z.array(gapParameterSchema),
});

const roadmapRequestSchema = z.object({
  vettingResult: vettingResultSchema,
  targetJobUrl: z.string().optional(),
  linkedInUrl: z.string().optional(),
  resumeText: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = roadmapRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid roadmap payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { vettingResult, targetJobUrl, linkedInUrl, resumeText } = parsed.data;

  const roadmap = await buildPersonalizedIntakeRoadmap({
    vetting: vettingResult as VettingResult,
    targetJobUrl,
    linkedInUrl,
    resumeText,
  });

  return NextResponse.json({ roadmap });
}
