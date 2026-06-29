import { Resend } from "resend";

import { buildWelcomeNewsletterEmail } from "@/lib/email/welcome-newsletter";
import {
  markNewsletterWelcomeSent,
  upsertNewsletterSubscriber,
} from "@/lib/newsletter/db";
import type { NewsletterSubscriberInsert } from "@/lib/newsletter/schema";

export type NewsletterEnrollReason =
  | "missing_api_key"
  | "missing_from_address"
  | "send_failed"
  | "network_error";

export type NewsletterEnrollResult =
  | { ok: true; subscriberId: number; firstIssueSent: boolean; skipped?: string }
  | { ok: false; reason: NewsletterEnrollReason; status?: number };

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function getResendFromAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from || null;
}

export async function enrollInNewsletter(
  input: NewsletterSubscriberInsert,
): Promise<NewsletterEnrollResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getResendFromAddress();

  // #region agent log
  fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
    body: JSON.stringify({
      sessionId: "248634",
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "lib/newsletter/enroll.ts:entry",
      message: "enrollInNewsletter env check",
      data: { hasApiKey: Boolean(apiKey), hasFrom: Boolean(from), hasReplyTo: Boolean(process.env.RESEND_REPLY_TO_EMAIL?.trim()) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  if (!from) {
    return { ok: false, reason: "missing_from_address" };
  }

  let subscriber;

  try {
    subscriber = await upsertNewsletterSubscriber(input);
    // #region agent log
    fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
      body: JSON.stringify({
        sessionId: "248634",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "lib/newsletter/enroll.ts:upsert-ok",
        message: "subscriber upsert succeeded",
        data: { subscriberId: subscriber.id, hasToken: Boolean(subscriber.unsubscribe_token) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    console.error("newsletter subscriber upsert failed", error);
    // #region agent log
    fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
      body: JSON.stringify({
        sessionId: "248634",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "lib/newsletter/enroll.ts:upsert-fail",
        message: "subscriber upsert failed",
        data: {
          errorName: error instanceof Error ? error.name : "unknown",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return { ok: false, reason: "network_error" };
  }

  const unsubscribeUrl = `${getSiteUrl()}/api/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
  const { subject, html, text } = buildWelcomeNewsletterEmail({
    email: subscriber.email,
    name: subscriber.name,
    role: subscriber.role,
    focusAreas: subscriber.focus_areas,
    unsubscribeUrl,
  });

  try {
    const resend = new Resend(apiKey);
    const { error, data } = await resend.emails.send({
      from,
      to: subscriber.email,
      subject,
      html,
      text,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL?.trim() || undefined,
    });

    if (error) {
      console.error("newsletter welcome email failed", error);
      // #region agent log
      fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
        body: JSON.stringify({
          sessionId: "248634",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "lib/newsletter/enroll.ts:resend-error",
          message: "Resend API returned error",
          data: {
            statusCode: error.statusCode ?? null,
            errorName: error.name ?? null,
            errorMessage: error.message ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return {
        ok: false,
        reason: "send_failed",
        status: error.statusCode ?? undefined,
      };
    }

    if (!data?.id) {
      // #region agent log
      fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
        body: JSON.stringify({
          sessionId: "248634",
          runId: "pre-fix",
          hypothesisId: "H1",
          location: "lib/newsletter/enroll.ts:resend-no-id",
          message: "Resend returned no message id",
          data: { hasData: Boolean(data) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return { ok: false, reason: "send_failed" };
    }

    await markNewsletterWelcomeSent(subscriber.id);

    // #region agent log
    fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
      body: JSON.stringify({
        sessionId: "248634",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "lib/newsletter/enroll.ts:resend-ok",
        message: "Resend send succeeded",
        data: { messageIdPresent: Boolean(data.id) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return {
      ok: true,
      subscriberId: subscriber.id,
      firstIssueSent: true,
    };
  } catch (error) {
    console.error("newsletter welcome email error", error);
    return { ok: false, reason: "network_error" };
  }
}
