// Server-to-server StayRelevant newsletter enrollment.
// Secrets read from process.env only — never expose to the client.

export type StayRelevantEnrollInput = {
  email: string;
  linkedinUrl?: string | null;
  role?: string | null;
  industry?: string | null;
  focusAreas?: string[];
  timezone?: string | null;
  sourceRef?: string | null;
};

export type StayRelevantEnrollResult =
  | { ok: true; userId?: string; firstIssueSent?: boolean; skipped?: string }
  | { ok: false };

export async function enrollInStayRelevant(
  input: StayRelevantEnrollInput,
): Promise<StayRelevantEnrollResult> {
  const secret = process.env.STAYRELEVANT_PARTNER_SECRET;
  const baseUrl = (process.env.STAYRELEVANT_BASE_URL ?? "https://stayrelevant.email").replace(
    /\/+$/,
    "",
  );

  if (!secret) {
    return { ok: false };
  }

  try {
    const response = await fetch(`${baseUrl}/api/partner/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        email: input.email,
        linkedinUrl: input.linkedinUrl ?? null,
        role: input.role ?? null,
        industry: input.industry ?? null,
        focusAreas: input.focusAreas ?? [],
        timezone: input.timezone ?? null,
        source: "jobclaw",
        sourceRef: input.sourceRef ?? "stay-relevant-weekly-gaps",
      }),
      signal: AbortSignal.timeout(280_000),
    });

    if (!response.ok) {
      console.error("stayrelevant enroll failed", { status: response.status });
      return { ok: false };
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      userId?: string;
      firstIssueSent?: boolean;
      skipped?: string;
    };

    if (!payload.ok) {
      return { ok: false };
    }

    return {
      ok: true,
      userId: payload.userId,
      firstIssueSent: payload.firstIssueSent,
      skipped: payload.skipped,
    };
  } catch (error) {
    console.error("stayrelevant enroll error", error instanceof Error ? error.message : error);
    return { ok: false };
  }
}
