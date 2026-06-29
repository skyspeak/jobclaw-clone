import { NextResponse } from "next/server";
import { z } from "zod";

import { getDatabaseErrorMessage } from "@/lib/db";
import { insertLead } from "@/lib/leads/db";
import { ROLE_TYPES } from "@/lib/leads/schema";
import { enrollInNewsletter } from "@/lib/newsletter/enroll";

const submitSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  school: z.string().trim().max(200).optional().nullable(),
  grad_year: z.string().trim().max(40).optional().nullable(),
  role_type: z.enum(ROLE_TYPES),
  industries: z.string().trim().max(500).optional().nullable(),
  linkedin: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  referral: z.string().trim().max(300).optional().nullable(),
  role: z.string().trim().max(200).optional().nullable(),
  focusAreas: z.array(z.string().trim().max(100)).max(20).optional().nullable(),
  timezone: z.string().trim().max(80).optional().nullable(),
  newsletterConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload." }, { status: 400 });
  }

  try {
    const {
      role,
      focusAreas,
      timezone,
      newsletterConsent,
      ...leadFields
    } = parsed.data;

    const lead = await insertLead({
      ...leadFields,
      industries: leadFields.industries?.trim() || null,
      linkedin: leadFields.linkedin || null,
      phone: leadFields.phone?.trim() || null,
      school: leadFields.school || null,
      grad_year: leadFields.grad_year || null,
      referral: leadFields.referral?.trim() || null,
    });

    let newsletter: {
      ok: boolean;
      firstIssueSent?: boolean;
      skipped?: string;
      reason?: string;
      status?: number;
    } = {
      ok: false,
    };

    if (newsletterConsent !== false) {
      const enroll = await enrollInNewsletter({
        email: leadFields.email,
        name: leadFields.name,
        linkedinUrl: leadFields.linkedin,
        role,
        industry: leadFields.industries,
        focusAreas: focusAreas ?? undefined,
        timezone,
        source: leadFields.referral,
      });
      newsletter = enroll.ok
        ? {
            ok: true,
            firstIssueSent: enroll.firstIssueSent,
            skipped: enroll.skipped,
          }
        : {
            ok: false,
            reason: enroll.reason,
            status: enroll.status,
          };
      // #region agent log
      fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
        body: JSON.stringify({
          sessionId: "248634",
          runId: "pre-fix",
          hypothesisId: "H4",
          location: "app/api/submit/route.ts:newsletter-result",
          message: "submit newsletter enroll result",
          data: { ok: newsletter.ok, reason: newsletter.reason ?? null, status: newsletter.status ?? null },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } else {
      newsletter = { ok: false, skipped: "consent_declined" };
    }

    return NextResponse.json(
      { ok: true, id: lead.id, newsletter, stayRelevant: newsletter },
      { status: 201 },
    );
  } catch (error) {
    console.error("lead submit failed", error);
    // #region agent log
    fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
      body: JSON.stringify({
        sessionId: "248634",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "app/api/submit/route.ts:catch",
        message: "submit route threw",
        data: {
          errorName: error instanceof Error ? error.name : "unknown",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const message = getDatabaseErrorMessage(error);
    return NextResponse.json(
      { error: message || "Unable to save your submission." },
      { status: 500 },
    );
  }
}
