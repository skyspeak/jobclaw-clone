import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakePersonalizedRoadmap } from "@/lib/intake-roadmap";
import { buildRoadmapPhases } from "@/lib/intake-roadmap-phases";

export type RoadmapPlanEmailInput = {
  email: string;
  name?: string | null;
  vetting: VettingResult;
  roadmap?: IntakePersonalizedRoadmap | null;
  gapSummary?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildRoadmapPlanEmail(input: RoadmapPlanEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greetingName = input.name?.trim() || "there";
  const roleLabel = input.vetting.inferredRoleLabel || "your target role";
  const phases = buildRoadmapPhases(input.vetting, input.roadmap);

  const phaseHtml = phases
    .map(
      (phase) => `
      <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #e7e2d8;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#C05621;">${escapeHtml(phase.phaseLabel)}</p>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#1a1a1a;">${escapeHtml(phase.title)}</h2>
        <ul style="margin:0 0 16px;padding-left:18px;color:#3d3830;font-size:15px;line-height:1.6;">
          ${phase.bullets.map((bullet) => `<li style="margin-bottom:8px;">${escapeHtml(bullet)}</li>`).join("")}
        </ul>
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6458;">Tools you'll learn</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#1a1a1a;">${escapeHtml(phase.tools.join(" · "))}</p>
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#C05621;">What you can claim</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#1a1a1a;font-weight:600;">${escapeHtml(phase.claim)}</p>
      </div>`,
    )
    .join("");

  const gapLine = input.gapSummary?.trim()
    ? `<p style="margin:0 0 20px;font-size:14px;color:#6b6458;">Built to close: <strong style="color:#1a1a1a;">${escapeHtml(input.gapSummary.trim())}</strong></p>`
    : "";

  const promiseLine = input.roadmap?.promise?.trim()
    ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3d3830;">${escapeHtml(input.roadmap.promise.trim())}</p>`
    : "";

  const subject = `Your 6-week DearCC plan — ${roleLabel}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6458;">DearCC · Self-paced plan</p>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:600;">Hi ${escapeHtml(greetingName)}, here's your 6-week journey.</h1>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3d3830;">
                  Every step produces proof you can show in your next application — tools you've used, outcomes you've measured, and claims you can defend in an interview.
                </p>
                <p style="margin:0 0 8px;font-size:14px;color:#6b6458;">Track: <strong style="color:#1a1a1a;">${escapeHtml(roleLabel)}</strong></p>
                ${gapLine}
                ${promiseLine}
                ${phaseHtml}
                <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#3d3830;">
                  Ready for accountability? Reply to this email or apply for a peer group at dearcc.org.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [
    `Hi ${greetingName}, here's your 6-week DearCC plan for ${roleLabel}.`,
    "",
    ...(input.gapSummary?.trim() ? [`Built to close: ${input.gapSummary.trim()}`, ""] : []),
    ...(input.roadmap?.promise?.trim() ? [input.roadmap.promise.trim(), ""] : []),
  ];

  for (const phase of phases) {
    textParts.push(`${phase.phaseLabel} — ${phase.title}`, "");
    for (const bullet of phase.bullets) {
      textParts.push(`• ${bullet}`);
    }
    textParts.push("", `Tools: ${phase.tools.join(" · ")}`, `Claim: ${phase.claim}`, "");
  }

  return { subject, html, text: textParts.join("\n") };
}
