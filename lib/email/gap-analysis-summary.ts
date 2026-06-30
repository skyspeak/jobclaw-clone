import { buildGapAnalysisShareText } from "@/lib/gap-analysis-share";
import type { ProfileGapParameter } from "@/lib/profile-gaps";
import { splitGapParametersToBars } from "@/lib/profile-gaps";

export type GapAnalysisEmailPlan = {
  markedNodeIds: string[];
  customNotes: string;
  roadmapSlug: string;
  markedThemes?: string[];
  roadmapTitle?: string;
};

export type GapAnalysisEmailInput = {
  email: string;
  name?: string | null;
  gapParameters: ProfileGapParameter[];
  roleLabel?: string | null;
  targetJobUrl?: string | null;
  shareUrl?: string | null;
  plan?: GapAnalysisEmailPlan | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function barWidth(score: number): number {
  return Math.min(Math.max(score, 8), 100);
}

function renderBarRow(
  label: string,
  score: number,
  tier: string,
  keywords: string[],
  variant: "strength" | "gap",
): string {
  const color = variant === "strength" ? "#2D6A4F" : "#C05621";
  const keywordHtml =
    keywords.length > 0
      ? `<p style="margin:6px 0 0;font-size:12px;color:#6b6458;">${keywords.map((k) => escapeHtml(k)).join(" · ")}</p>`
      : "";

  return `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <strong style="font-size:14px;color:#1a1a1a;">${escapeHtml(label)}</strong>
        <span style="font-size:12px;font-weight:600;color:${color};">${escapeHtml(tier)}</span>
      </div>
      <div style="height:6px;border-radius:999px;background:#EFEBE0;overflow:hidden;">
        <div style="height:100%;width:${barWidth(score)}%;background:${color};border-radius:999px;"></div>
      </div>
      ${keywordHtml}
    </div>`;
}

export function buildGapAnalysisSummaryEmail(input: GapAnalysisEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greetingName = input.name?.trim() || "there";
  const roleLabel = input.roleLabel?.trim() || "your target role";
  const { strengths, gaps } = splitGapParametersToBars(input.gapParameters);

  const shareText = buildGapAnalysisShareText({
    parameters: input.gapParameters,
    targetLabel: input.roleLabel ?? undefined,
    shareUrl: input.shareUrl ?? undefined,
  });

  const strengthRows = strengths
    .map((item) => renderBarRow(item.label, item.score, item.tier, item.keywords, "strength"))
    .join("");
  const gapRows = gaps
    .map((item) => renderBarRow(item.label, item.score, item.tier, item.keywords, "gap"))
    .join("");

  const plan = input.plan;
  const hasPlan = Boolean(
    plan && ((plan.markedThemes?.length ?? 0) > 0 || plan.customNotes?.trim()),
  );

  let planHtml = "";
  if (hasPlan && plan) {
    const themes =
      plan.markedThemes && plan.markedThemes.length > 0
        ? `<ul style="margin:8px 0 0;padding-left:18px;color:#3d3830;font-size:15px;line-height:1.6;">
            ${plan.markedThemes.map((theme) => `<li>${escapeHtml(theme)}</li>`).join("")}
          </ul>`
        : "";
    const notes = plan.customNotes?.trim()
      ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#3d3830;"><strong>Your notes:</strong> ${escapeHtml(plan.customNotes.trim())}</p>`
      : "";

    planHtml = `
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e7e2d8;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6458;">Your co-plan with DearCC</p>
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#1a1a1a;">Priority roadmap areas</h2>
        ${plan.roadmapTitle ? `<p style="margin:0 0 8px;font-size:14px;color:#6b6458;">${escapeHtml(plan.roadmapTitle)} sprint</p>` : ""}
        ${themes}
        ${notes}
      </div>`;
  }

  const targetLine = input.targetJobUrl?.trim()
    ? `<p style="margin:0 0 20px;font-size:14px;color:#6b6458;">Target role track: <strong style="color:#1a1a1a;">${escapeHtml(roleLabel)}</strong></p>`
    : `<p style="margin:0 0 20px;font-size:14px;color:#6b6458;">Track: <strong style="color:#1a1a1a;">${escapeHtml(roleLabel)}</strong></p>`;

  const subject = `Your DearCC gap analysis — ${roleLabel}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6458;">DearCC · Gap analysis</p>
                <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:600;">Hi ${escapeHtml(greetingName)}, here's your analysis.</h1>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3d3830;">
                  You asked us to send your personalized gap breakdown. Save this email — we'll co-build your plan from here.
                </p>
                ${targetLine}
                ${
                  strengthRows
                    ? `<p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#2D6A4F;">What you already bring</p>${strengthRows}`
                    : ""
                }
                ${
                  gapRows
                    ? `<p style="margin:16px 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C05621;">What the role needed</p>${gapRows}`
                    : ""
                }
                ${planHtml}
                <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#3d3830;">
                  Questions? Reply to this email — a real person from DearCC reads it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [shareText];
  if (plan?.markedThemes?.length) {
    textParts.push("", "Priority roadmap areas:", ...plan.markedThemes.map((t) => `• ${t}`));
  }
  if (plan?.customNotes?.trim()) {
    textParts.push("", `Your notes: ${plan.customNotes.trim()}`);
  }

  return { subject, html, text: textParts.join("\n") };
}
