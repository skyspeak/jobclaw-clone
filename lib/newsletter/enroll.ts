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

  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  if (!from) {
    return { ok: false, reason: "missing_from_address" };
  }

  let subscriber;

  try {
    subscriber = await upsertNewsletterSubscriber(input);
  } catch (error) {
    console.error("newsletter subscriber upsert failed", error);
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
      return {
        ok: false,
        reason: "send_failed",
        status: error.statusCode ?? undefined,
      };
    }

    if (!data?.id) {
      return { ok: false, reason: "send_failed" };
    }

    await markNewsletterWelcomeSent(subscriber.id);

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
