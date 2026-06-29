export type NewsletterSubmitResult = {
  ok: boolean;
  firstIssueSent?: boolean;
  skipped?: string;
  reason?: string;
  status?: number;
};

export function newsletterSignupMessage(result: NewsletterSubmitResult | null): string | null {
  if (!result) {
    return null;
  }

  if (result.ok) {
    if (result.firstIssueSent) {
      return "Check your inbox — your first StayRelevant issue is on the way (Sundays, ~15 min read).";
    }
    return "You're signed up for StayRelevant — watch your inbox on Sundays (~15 min read).";
  }

  if (result.skipped === "consent_declined") {
    return null;
  }

  switch (result.reason) {
    case "missing_api_key":
    case "missing_from_address":
      return "We saved your contact info. Newsletter email isn't configured on this server yet — we'll still follow up from DearCC.";
    case "send_failed":
      return `We saved your signup, but we couldn't send the welcome email${result.status ? ` (${result.status})` : ""}. We'll follow up by email.`;
    case "network_error":
      return "We saved your signup, but the welcome email timed out. We'll follow up by email.";
    default:
      return "We saved your signup. Newsletter enrollment didn't complete — we'll follow up by email.";
  }
}

export function newsletterSignupIsWarning(result: NewsletterSubmitResult | null): boolean {
  return Boolean(result && !result.ok && result.skipped !== "consent_declined");
}

/** @deprecated Use NewsletterSubmitResult */
export type StayRelevantSubmitResult = NewsletterSubmitResult;

/** @deprecated Use newsletterSignupMessage */
export const stayRelevantSignupMessage = newsletterSignupMessage;

/** @deprecated Use newsletterSignupIsWarning */
export const stayRelevantSignupIsWarning = newsletterSignupIsWarning;
