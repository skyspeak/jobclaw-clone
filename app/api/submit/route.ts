import { NextResponse } from "next/server";
import { z } from "zod";

import { getDatabaseErrorMessage } from "@/lib/db";
import { insertLead } from "@/lib/leads/db";
import { ROLE_TYPES } from "@/lib/leads/schema";

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
    const lead = await insertLead({
      ...parsed.data,
      industries: parsed.data.industries?.trim() || null,
      linkedin: parsed.data.linkedin || null,
      phone: parsed.data.phone?.trim() || null,
      school: parsed.data.school || null,
      grad_year: parsed.data.grad_year || null,
      referral: parsed.data.referral?.trim() || null,
    });

    return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("lead submit failed", error);
    const message = getDatabaseErrorMessage(error);
    return NextResponse.json(
      { error: message || "Unable to save your submission." },
      { status: 500 },
    );
  }
}
