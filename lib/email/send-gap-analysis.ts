import { Resend } from "resend";

import { buildGapAnalysisSummaryEmail } from "@/lib/email/gap-analysis-summary";

export type GapAnalysisEmailReason =
  | "missing_api_key"
  | "missing_from_address"
  | "send_failed"
  | "network_error";

export type GapAnalysisEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: GapAnalysisEmailReason; status?: number };

function getResendFromAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
}

export async function sendGapAnalysisEmail(
  input: Parameters<typeof buildGapAnalysisSummaryEmail>[0],
): Promise<GapAnalysisEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getResendFromAddress();

  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  if (!from) {
    return { ok: false, reason: "missing_from_address" };
  }

  const { subject, html, text } = buildGapAnalysisSummaryEmail(input);

  try {
    const resend = new Resend(apiKey);
    const { error, data } = await resend.emails.send({
      from,
      to: input.email,
      subject,
      html,
      text,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL?.trim() || undefined,
    });

    if (error) {
      console.error("gap analysis email failed", error);
      return {
        ok: false,
        reason: "send_failed",
        status: error.statusCode ?? undefined,
      };
    }

    if (!data?.id) {
      return { ok: false, reason: "send_failed" };
    }

    return { ok: true, messageId: data.id };
  } catch (error) {
    console.error("gap analysis email error", error);
    return { ok: false, reason: "network_error" };
  }
}
