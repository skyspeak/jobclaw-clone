export type WelcomeNewsletterInput = {
  email: string;
  name?: string | null;
  role?: string | null;
  focusAreas?: string[];
  unsubscribeUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildWelcomeNewsletterEmail(input: WelcomeNewsletterInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greetingName = input.name?.trim() || "there";
  const roleLabel = input.role?.trim() || "your target role";
  const focusAreas = input.focusAreas?.filter(Boolean) ?? [];
  const focusLine =
    focusAreas.length > 0
      ? focusAreas.map((item) => escapeHtml(item)).join(", ")
      : "the skills and signals hiring managers look for in your field";

  const subject = `Welcome to StayRelevant — your first issue for ${roleLabel}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6458;">DearCC · StayRelevant</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:600;">You're in, ${escapeHtml(greetingName)}.</h1>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3830;">
                  Each Sunday you'll get a ~15 minute AI briefing tuned to <strong>${escapeHtml(roleLabel)}</strong>,
                  with practical moves for <strong>${focusLine}</strong>.
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3830;">
                  This is your welcome issue — your full personalized digest starts this Sunday.
                  Until then, keep your gap analysis handy and keep applying what you learned in DearCC.
                </p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3d3830;">
                  Questions? Reply to this email — a real person from DearCC reads it.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#6b6458;">
                  <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6b6458;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `You're in, ${greetingName}.`,
    "",
    `Each Sunday you'll get a ~15 minute AI briefing tuned to ${roleLabel}.`,
    focusAreas.length > 0 ? `We'll focus on: ${focusAreas.join(", ")}.` : "",
    "",
    "This is your welcome issue — your full personalized digest starts this Sunday.",
    "",
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}
