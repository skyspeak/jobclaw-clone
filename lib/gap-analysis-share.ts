import { BRAND_NAME } from "@/lib/brand";
import {
  splitGapParametersToBars,
  type ProfileGapParameter,
} from "@/lib/profile-gaps";

export function buildGapAnalysisShareText(input: {
  parameters: ProfileGapParameter[];
  targetLabel?: string;
  shareUrl?: string;
}): string {
  const { strengths, gaps } = splitGapParametersToBars(input.parameters);
  const lines: string[] = [`My ${BRAND_NAME} gap analysis`];

  if (input.targetLabel?.trim()) {
    lines.push(`Target: ${input.targetLabel.trim()}`);
  }

  if (strengths.length > 0) {
    lines.push("", "What I already bring:");
    for (const item of strengths) {
      lines.push(`• ${item.label} (${item.tier}) — ${item.keywords.join(", ")}`);
    }
  }

  if (gaps.length > 0) {
    lines.push("", "What the role needed:");
    for (const item of gaps) {
      lines.push(`• ${item.label} (${item.tier}) — ${item.keywords.join(", ")}`);
    }
  }

  const url = input.shareUrl?.trim();
  if (url) {
    lines.push("", `Try yours: ${url}`);
  }

  return lines.join("\n").trim();
}

export function buildIMessageShareUrl(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?${new URLSearchParams({ text }).toString()}`;
}

export function buildDearccSignupShareText(shareUrl: string): string {
  return [
    "I just signed up with DearCC to land my dream job — curated help tuned to your skill gaps.",
    "",
    `Try it: ${shareUrl}`,
  ].join("\n");
}
